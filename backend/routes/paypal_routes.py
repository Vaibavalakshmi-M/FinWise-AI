from flask import Blueprint, request, jsonify
from backend.services.auth_service import require_auth
from backend.services.paypal_service import paypal_service

paypal_bp = Blueprint("paypal", __name__, url_prefix="/api/paypal")

@paypal_bp.route("/config", methods=["GET"])
def get_paypal_config():
    """Returns safe PayPal Sandbox configuration without exposing client secrets."""
    is_live_configured = paypal_service.is_configured()
    return jsonify({
        "success": True,
        "is_configured": is_live_configured,
        "mode": "sandbox",
        "client_id": paypal_service.client_id if is_live_configured else "sb",
        "currency": "USD"
    }), 200

@paypal_bp.route("/create-order", methods=["POST"])
@require_auth
def create_order(user):
    data = request.get_json() or {}
    amount = data.get("amount")
    currency = data.get("currency", "USD")
    item_name = data.get("item_name", "FinWise Purchase")
    category_id = data.get("category_id")

    if amount is None or float(amount) <= 0:
        return jsonify({"success": False, "error": "Valid positive amount required."}), 400

    try:
        res = paypal_service.create_order(
            user_id=user["id"],
            amount=amount,
            currency=currency,
            item_name=item_name,
            category_id=category_id
        )
        if not res.get("success"):
            return jsonify(res), 400
        return jsonify(res), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@paypal_bp.route("/capture-order", methods=["POST"])
@require_auth
def capture_order(user):
    data = request.get_json() or {}
    order_id = data.get("order_id", "").strip()

    if not order_id:
        return jsonify({"success": False, "error": "order_id is required."}), 400

    try:
        res = paypal_service.capture_order(user_id=user["id"], order_id=order_id)
        if not res.get("success"):
            return jsonify(res), 400
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@paypal_bp.route("/transactions", methods=["GET"])
@require_auth
def get_transactions(user):
    records = paypal_service.get_user_paypal_transactions(user["id"])
    return jsonify({"success": True, "transactions": records}), 200
