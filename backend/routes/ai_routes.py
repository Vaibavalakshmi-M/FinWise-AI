from flask import Blueprint, request, jsonify
from backend.services.auth_service import require_auth
from backend.services.ai_service import ai_service
from backend.database import get_db

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")

@ai_bp.route("/chat", methods=["POST"])
@require_auth
def chat(user):
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"success": False, "error": "Message is required."}), 400

    res = ai_service.chat(user["id"], message)

    # Record in ai_conversations table
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO ai_conversations (user_id, role, message, intent)
            VALUES (?, ?, ?, ?)
        """, (user["id"], "user", message, "chat"))
        cursor.execute("""
            INSERT INTO ai_conversations (user_id, role, message, intent)
            VALUES (?, ?, ?, ?)
        """, (user["id"], "assistant", res["reply"], "chat_response"))
        conn.commit()
        conn.close()
    except Exception:
        pass

    return jsonify(res), 200

@ai_bp.route("/evaluate-purchase", methods=["POST"])
@require_auth
def evaluate_purchase(user):
    data = request.get_json() or {}
    item_name = data.get("item_name", "").strip()
    price = data.get("price")
    category_name = data.get("category_name", "Shopping & Tech")
    urgency = data.get("urgency", "want")

    if not item_name:
        return jsonify({"success": False, "error": "Item name is required."}), 400
    if price is None:
        return jsonify({"success": False, "error": "Price is required."}), 400

    res = ai_service.evaluate_purchase(user["id"], item_name, price, category_name, urgency)
    if not res.get("success"):
        return jsonify(res), 400
    return jsonify(res), 200

@ai_bp.route("/history", methods=["GET"])
@require_auth
def history(user):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT role, message, intent, created_at
        FROM ai_conversations
        WHERE user_id = ?
        ORDER BY id ASC LIMIT 50
    """, (user["id"],))
    conversations = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "history": conversations}), 200
