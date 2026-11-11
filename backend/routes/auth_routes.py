from flask import Blueprint, request, jsonify
from backend.services.auth_service import register_user, login_user, require_auth, get_current_user_from_request

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "")
    email = data.get("email", "")
    password = data.get("password", "")
    monthly_income = data.get("monthly_income", 3200.0)
    currency = data.get("currency", "USD")

    result = register_user(username, email, password, monthly_income, currency)
    if not result.get("success"):
        return jsonify(result), 400
    return jsonify(result), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username_or_email = data.get("username_or_email", "")
    password = data.get("password", "")

    result = login_user(username_or_email, password)
    if not result.get("success"):
        return jsonify(result), 401
    return jsonify(result), 200

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user(user):
    return jsonify({"success": True, "user": user}), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"success": True, "message": "Logged out successfully"}), 200
