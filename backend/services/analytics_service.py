import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from calendar import monthrange
from backend.database import get_db

def get_current_month_str():
    return datetime.now().strftime("%Y-%m")

def get_financial_summary(user_id, month=None):
    """Calculates income, expenses, remaining budget, and savings rate using Pandas."""
    if not month:
        month = get_current_month_str()

    conn = get_db()

    # User profile for base income
    user_row = conn.execute("SELECT monthly_income, currency FROM users WHERE id = ?", (user_id,)).fetchone()
    base_income = float(user_row["monthly_income"]) if user_row else 3200.0
    currency = user_row["currency"] if user_row else "USD"

    # Fetch all transactions for this month
    query = """
        SELECT t.id, t.amount, t.date, t.type, c.name as category_name
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.date LIKE ?
    """
    df_tx = pd.read_sql_query(query, conn, params=(user_id, f"{month}%"))

    # Fetch budgets for this month
    b_query = """
        SELECT b.monthly_limit, c.name as category_name
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month_year = ?
    """
    df_budgets = pd.read_sql_query(b_query, conn, params=(user_id, month))
    conn.close()

    total_budgeted = float(df_budgets["monthly_limit"].sum()) if not df_budgets.empty else 0.0

    if df_tx.empty:
        total_income = base_income
        total_expenses = 0.0
        remaining_budget = total_income
        savings_rate = 100.0
        daily_avg = 0.0
        projected_spend = 0.0
    else:
        # Extra income logged in transactions
        extra_income = float(df_tx[df_tx["type"] == "income"]["amount"].sum())
        total_income = base_income + extra_income

        expenses_df = df_tx[df_tx["type"] == "expense"]
        total_expenses = float(expenses_df["amount"].sum())
        remaining_budget = total_income - total_expenses
        savings_rate = round((remaining_budget / total_income) * 100, 1) if total_income > 0 else 0.0

        # Day calculations for burn rate
        year, m = map(int, month.split("-"))
        days_in_month = monthrange(year, m)[1]
        now = datetime.now()
        current_day = now.day if now.strftime("%Y-%m") == month else days_in_month

        daily_avg = round(total_expenses / max(current_day, 1), 2)
        projected_spend = round(daily_avg * days_in_month, 2)

    return {
        "month": month,
        "currency": currency,
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "remaining_budget": round(remaining_budget, 2),
        "total_budgeted": round(total_budgeted, 2),
        "savings_rate": savings_rate,
        "daily_avg_spend": daily_avg,
        "projected_spend": projected_spend,
        "budget_status": "Under Budget" if total_expenses <= total_budgeted else "Over Budget"
    }

def get_category_breakdown(user_id, month=None):
    """Returns category-wise spending and budget adherence."""
    if not month:
        month = get_current_month_str()

    conn = get_db()
    # Query categories, budget, and actual expenses
    sql = """
        SELECT 
            c.id as category_id,
            c.name as category_name,
            c.icon,
            c.color,
            COALESCE(b.monthly_limit, 0) as budget_limit,
            COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_spent,
            COUNT(t.id) as transaction_count
        FROM categories c
        LEFT JOIN budgets b ON c.id = b.category_id AND b.user_id = ? AND b.month_year = ?
        LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = ? AND t.date LIKE ?
        WHERE c.type = 'expense'
        GROUP BY c.id, c.name, c.icon, c.color, b.monthly_limit
        ORDER BY total_spent DESC
    """
    df = pd.read_sql_query(sql, conn, params=(user_id, month, user_id, f"{month}%"))
    conn.close()

    if df.empty:
        return []

    total_expense = df["total_spent"].sum()

    results = []
    for _, row in df.iterrows():
        spent = float(row["total_spent"])
        limit = float(row["budget_limit"])
        pct_of_total = round((spent / total_expense) * 100, 1) if total_expense > 0 else 0.0
        pct_of_budget = round((spent / limit) * 100, 1) if limit > 0 else 0.0

        if limit > 0:
            if pct_of_budget >= 100:
                status = "exceeded"
            elif pct_of_budget >= 80:
                status = "warning"
            else:
                status = "safe"
        else:
            status = "unbudgeted" if spent > 0 else "safe"

        results.append({
            "category_id": int(row["category_id"]),
            "category_name": row["category_name"],
            "icon": row["icon"],
            "color": row["color"],
            "total_spent": round(spent, 2),
            "budget_limit": round(limit, 2),
            "remaining": round(limit - spent, 2) if limit > 0 else 0.0,
            "percentage_of_total": pct_of_total,
            "percentage_of_budget": pct_of_budget,
            "status": status,
            "transaction_count": int(row["transaction_count"])
        })

    return results

def get_monthly_trends(user_id, months_count=6):
    """Calculates monthly income and expense history for bar/line charts."""
    conn = get_db()
    sql = """
        SELECT 
            SUBSTR(date, 1, 7) as month,
            type,
            amount
        FROM transactions
        WHERE user_id = ?
        ORDER BY date ASC
    """
    df = pd.read_sql_query(sql, conn, params=(user_id,))
    
    # Get user base income
    user_row = conn.execute("SELECT monthly_income FROM users WHERE id = ?", (user_id,)).fetchone()
    base_income = float(user_row["monthly_income"]) if user_row else 3200.0
    conn.close()

    # Generate list of recent N months
    now = datetime.now()
    month_list = []
    for i in range(months_count - 1, -1, -1):
        d = now - timedelta(days=i * 30)
        m_str = d.strftime("%Y-%m")
        if m_str not in month_list:
            month_list.append(m_str)

    trends = []
    for m in month_list:
        m_label = datetime.strptime(m, "%Y-%m").strftime("%b %Y")
        if not df.empty:
            m_df = df[df["month"] == m]
            expenses = float(m_df[m_df["type"] == "expense"]["amount"].sum())
            extra_income = float(m_df[m_df["type"] == "income"]["amount"].sum())
        else:
            expenses = 0.0
            extra_income = 0.0
        
        income = base_income + extra_income
        net_savings = income - expenses

        trends.append({
            "month": m,
            "label": m_label,
            "income": round(income, 2),
            "expenses": round(expenses, 2),
            "savings": round(net_savings, 2)
        })

    return trends

def get_spending_insights(user_id, month=None):
    """Detects spending anomalies and budget alerts for the AI and dashboard."""
    if not month:
        month = get_current_month_str()

    summary = get_financial_summary(user_id, month)
    categories = get_category_breakdown(user_id, month)

    insights = []
    
    # 1. Budget overrun alerts
    over_budget_cats = [c for c in categories if c["status"] == "exceeded"]
    if over_budget_cats:
        cat_names = ", ".join([c["category_name"] for c in over_budget_cats])
        insights.append({
            "type": "warning",
            "title": "Budget Alert",
            "message": f"You have exceeded your monthly limit in: {cat_names}."
        })

    # 2. High warning alerts
    warning_cats = [c for c in categories if c["status"] == "warning"]
    if warning_cats:
        for c in warning_cats:
            insights.append({
                "type": "caution",
                "title": f"{c['category_name']} near limit",
                "message": f"You have used {c['percentage_of_budget']}% of your ${c['budget_limit']} limit."
            })

    # 3. Savings health
    if summary["savings_rate"] >= 20.0:
        insights.append({
            "type": "positive",
            "title": "Healthy Savings Rate",
            "message": f"Your current savings rate is {summary['savings_rate']}%, well above the 20% student financial benchmark!"
        })
    elif summary["savings_rate"] < 10.0:
        insights.append({
            "type": "danger",
            "title": "Tight Budget Window",
            "message": f"Savings rate is {summary['savings_rate']}%. Consider trimming non-essential dining and leisure expenses."
        })

    # 4. Top spending driver
    if categories:
        top_cat = categories[0]
        if top_cat["total_spent"] > 0:
            insights.append({
                "type": "info",
                "title": "Top Spending Category",
                "message": f"{top_cat['category_name']} accounts for ${top_cat['total_spent']} ({top_cat['percentage_of_total']}% of all expenses)."
            })

    return insights
