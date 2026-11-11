import time
from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.services.auth_service import require_auth
from backend.database import get_db

expense_bp = Blueprint("expenses", __name__, url_prefix="/api")

@expense_bp.route("/expenses", methods=["GET"])
@require_auth
def list_expenses(user):
    month = request.args.get("month", "") # e.g. 2026-11
    category_id = request.args.get("category_id")
    search = request.args.get("search", "").strip()
    payment_method = request.args.get("payment_method")
    tx_type = request.args.get("type") # 'expense' or 'income'

    query = """
        SELECT t.id, t.amount, t.date, t.description, t.payment_method, t.type, t.notes, t.created_at,
               c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
    """
    params = [user["id"]]

    if month:
        query += " AND t.date LIKE ?"
        params.append(f"{month}%")
    if category_id:
        query += " AND t.category_id = ?"
        params.append(category_id)
    if payment_method:
        query += " AND t.payment_method = ?"
        params.append(payment_method)
    if tx_type:
        query += " AND t.type = ?"
        params.append(tx_type)
    if search:
        query += " AND (t.description LIKE ? OR t.notes LIKE ?)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")

    query += " ORDER BY t.date DESC, t.id DESC"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({"success": True, "count": len(rows), "expenses": rows}), 200

@expense_bp.route("/expenses", methods=["POST"])
@require_auth
def create_expense(user):
    data = request.get_json() or {}
    try:
        amount = float(data.get("amount", 0))
        if amount <= 0:
            return jsonify({"success": False, "error": "Amount must be greater than zero."}), 400
    except ValueError:
        return jsonify({"success": False, "error": "Invalid amount value."}), 400

    description = data.get("description", "").strip()
    if not description:
        return jsonify({"success": False, "error": "Description is required."}), 400

    category_id = data.get("category_id")
    date_val = data.get("date") or time.strftime("%Y-%m-%d")
    payment_method = data.get("payment_method", "card")
    tx_type = data.get("type", "expense")
    notes = data.get("notes", "").strip()

    conn = get_db()
    cursor = conn.cursor()

    # Verify category exists
    if category_id:
        cursor.execute("SELECT id FROM categories WHERE id = ?", (category_id,))
        if not cursor.fetchone():
            category_id = None

    if not category_id:
        cursor.execute("SELECT id FROM categories WHERE name = 'Miscellaneous'")
        cat = cursor.fetchone()
        category_id = cat["id"] if cat else 1

    cursor.execute("""
        INSERT INTO transactions (user_id, category_id, amount, date, description, payment_method, type, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user["id"], category_id, amount, date_val, description, payment_method, tx_type, notes))
    
    new_id = cursor.lastrowid
    conn.commit()

    # Fetch inserted row with category details
    cursor.execute("""
        SELECT t.id, t.amount, t.date, t.description, t.payment_method, t.type, t.notes, t.created_at,
               c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
    """, (new_id,))
    created_tx = dict(cursor.fetchone())
    conn.close()

    return jsonify({"success": True, "expense": created_tx, "message": "Transaction added successfully."}), 201

@expense_bp.route("/expenses/<int:expense_id>", methods=["PUT"])
@require_auth
def update_expense(user, expense_id):
    data = request.get_json() or {}
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM transactions WHERE id = ? AND user_id = ?", (expense_id, user["id"]))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"success": False, "error": "Transaction not found."}), 404

    amount = float(data.get("amount")) if "amount" in data else None
    description = data.get("description", "").strip() if "description" in data else None
    category_id = data.get("category_id")
    date_val = data.get("date")
    payment_method = data.get("payment_method")
    tx_type = data.get("type")
    notes = data.get("notes")

    updates = []
    params = []
    if amount is not None:
        updates.append("amount = ?")
        params.append(amount)
    if description:
        updates.append("description = ?")
        params.append(description)
    if category_id:
        updates.append("category_id = ?")
        params.append(category_id)
    if date_val:
        updates.append("date = ?")
        params.append(date_val)
    if payment_method:
        updates.append("payment_method = ?")
        params.append(payment_method)
    if tx_type:
        updates.append("type = ?")
        params.append(tx_type)
    if notes is not None:
        updates.append("notes = ?")
        params.append(notes)

    if not updates:
        conn.close()
        return jsonify({"success": False, "error": "No update fields provided."}), 400

    params.extend([expense_id, user["id"]])
    sql = f"UPDATE transactions SET {', '.join(updates)} WHERE id = ? AND user_id = ?"
    cursor.execute(sql, params)
    conn.commit()

    cursor.execute("""
        SELECT t.id, t.amount, t.date, t.description, t.payment_method, t.type, t.notes, t.created_at,
               c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
    """, (expense_id,))
    updated = dict(cursor.fetchone())
    conn.close()

    return jsonify({"success": True, "expense": updated, "message": "Transaction updated successfully."}), 200

@expense_bp.route("/expenses/<int:expense_id>", methods=["DELETE"])
@require_auth
def delete_expense(user, expense_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM transactions WHERE id = ? AND user_id = ?", (expense_id, user["id"]))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"success": False, "error": "Transaction not found."}), 404

    cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (expense_id, user["id"]))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Transaction deleted successfully."}), 200

@expense_bp.route("/categories", methods=["GET"])
def get_categories():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, icon, color, type FROM categories ORDER BY type DESC, name ASC")
    cats = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "categories": cats}), 200

@expense_bp.route("/budgets", methods=["GET"])
@require_auth
def get_budgets(user):
    month = request.args.get("month") or datetime.now().strftime("%Y-%m")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.id, b.category_id, b.monthly_limit, b.month_year,
               c.name as category_name, c.icon, c.color
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month_year = ?
        ORDER BY b.monthly_limit DESC
    """, (user["id"], month))
    budgets = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "month": month, "budgets": budgets}), 200

@expense_bp.route("/budgets", methods=["POST"])
@require_auth
def upsert_budget(user):
    data = request.get_json() or {}
    category_id = data.get("category_id")
    monthly_limit = float(data.get("monthly_limit", 0))
    month = data.get("month") or datetime.now().strftime("%Y-%m")

    if not category_id or monthly_limit < 0:
        return jsonify({"success": False, "error": "Valid category_id and positive monthly_limit required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO budgets (user_id, category_id, monthly_limit, month_year)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, category_id, month_year) 
        DO UPDATE SET monthly_limit = excluded.monthly_limit
    """, (user["id"], category_id, monthly_limit, month))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Budget limit updated successfully."}), 200
