from flask import Blueprint, request, jsonify
from backend.services.auth_service import require_auth
from backend.services.analytics_service import (
    get_financial_summary,
    get_category_breakdown,
    get_monthly_trends,
    get_spending_insights
)

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/summary", methods=["GET"])
@require_auth
def summary(user):
    month = request.args.get("month")
    res = get_financial_summary(user["id"], month)
    return jsonify({"success": True, "data": res}), 200

@analytics_bp.route("/categories", methods=["GET"])
@require_auth
def categories(user):
    month = request.args.get("month")
    res = get_category_breakdown(user["id"], month)
    return jsonify({"success": True, "data": res}), 200

@analytics_bp.route("/trends", methods=["GET"])
@require_auth
def trends(user):
    months_count = int(request.args.get("months", 6))
    res = get_monthly_trends(user["id"], months_count)
    return jsonify({"success": True, "data": res}), 200

@analytics_bp.route("/insights", methods=["GET"])
@require_auth
def insights(user):
    month = request.args.get("month")
    res = get_spending_insights(user["id"], month)
    return jsonify({"success": True, "data": res}), 200
