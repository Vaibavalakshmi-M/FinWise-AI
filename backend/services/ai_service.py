import json
import logging
import requests
from backend.config import config
from backend.database import get_db
from backend.services.analytics_service import get_financial_summary, get_category_breakdown

logger = logging.getLogger(__name__)

DISCLAIMER = "\n\n*Disclaimer: FinWise AI provides educational financial analysis and budgeting assistance. It does not constitute certified financial or investment advice.*"

class AIService:
    def __init__(self):
        self.provider = config.AI_PROVIDER
        self.gemini_key = config.GEMINI_API_KEY
        self.gemini_model = config.GEMINI_MODEL
        self.openai_key = config.OPENAI_API_KEY
        self.openai_model = config.OPENAI_MODEL

    def _build_financial_context(self, user_id):
        """Constructs rich ground-truth financial data context from actual SQLite / Pandas state."""
        summary = get_financial_summary(user_id)
        categories = get_category_breakdown(user_id)

        cat_lines = []
        for c in categories:
            cat_lines.append(
                f"- {c['category_name']}: Spent ${c['total_spent']} of ${c['budget_limit']} limit ({c['percentage_of_budget']}% used, status: {c['status']})"
            )
        categories_text = "\n".join(cat_lines) if cat_lines else "No category budgets found."

        # Fetch recent 5 transactions
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT date, description, amount, type, payment_method
            FROM transactions
            WHERE user_id = ?
            ORDER BY date DESC LIMIT 5
        """, (user_id,))
        recent = cursor.fetchall()
        conn.close()

        recent_lines = [f"- {r['date']}: {r['description']} (${r['amount']}) via {r['payment_method']} [{r['type']}]" for r in recent]
        recent_text = "\n".join(recent_lines) if recent_lines else "No recent transactions."

        context = f"""
USER FINANCIAL DATA:
- Current Month: {summary['month']}
- Monthly Income: ${summary['total_income']}
- Total Expenses: ${summary['total_expenses']}
- Available Balance / Remaining: ${summary['remaining_budget']}
- Total Budgeted Limit: ${summary['total_budgeted']}
- Savings Rate: {summary['savings_rate']}%
- Daily Average Spend: ${summary['daily_avg_spend']} / day
- Projected Month-End Spend: ${summary['projected_spend']}
- Current Budget Status: {summary['budget_status']}

CATEGORY BUDGETS & ACTUAL SPEND:
{categories_text}

RECENT TRANSACTIONS:
{recent_text}
"""
        return context.strip()

    def chat(self, user_id, user_message):
        """Processes user financial query using real LLM API with intelligent ground-truth engine fallback."""
        financial_context = self._build_financial_context(user_id)

        system_instruction = f"""
You are FinWise AI, an expert, friendly personal finance assistant tailored for university students and young professionals.
You provide clear, encouraging, actionable financial insights grounded in the user's real numbers.

GUIDELINES:
1. Always reference the actual numbers from the USER FINANCIAL DATA provided.
2. Be concise, empathetic, and structured with bullet points or short paragraphs.
3. Suggest realistic optimizations (e.g. meal prepping, reviewing recurring subscriptions, timing purchases).
4. Never invent numbers that conflict with the provided financial data.
5. Emphasize mindful spending and building emergency savings.

{financial_context}
"""

        # 1. Try Gemini API if key is available
        if self.gemini_key and "your_gemini" not in self.gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
                headers = {"Content-Type": "application/json"}
                body = {
                    "contents": [
                        {
                            "parts": [
                                {"text": f"{system_instruction}\n\nUser Question: {user_message}"}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.4,
                        "maxOutputTokens": 600
                    }
                }
                res = requests.post(url, json=body, headers=headers, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        if content_parts:
                            ai_text = content_parts[0].get("text", "")
                            return {"success": True, "provider": "gemini", "reply": ai_text + DISCLAIMER}
            except Exception as e:
                logger.warning(f"Gemini API request failed, falling back: {e}")

        # 2. Try OpenAI API if key is available
        if self.openai_key and "your_openai" not in self.openai_key:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openai_key}"
                }
                body = {
                    "model": self.openai_model,
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": 0.4,
                    "max_tokens": 500
                }
                res = requests.post(url, json=body, headers=headers, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    ai_text = data["choices"][0]["message"]["content"]
                    return {"success": True, "provider": "openai", "reply": ai_text + DISCLAIMER}
            except Exception as e:
                logger.warning(f"OpenAI API request failed, falling back: {e}")

        # 3. Ground-Truth Financial Heuristic Engine (Guaranteed zero-failure intelligent responses)
        return {
            "success": True,
            "provider": "finwise-engine",
            "reply": self._generate_heuristic_response(user_id, user_message) + DISCLAIMER
        }

    def _generate_heuristic_response(self, user_id, message):
        """Generates accurate, data-backed responses based on actual user financial data when offline or without external key."""
        msg = message.lower()
        summary = get_financial_summary(user_id)
        categories = get_category_breakdown(user_id)

        # Spending queries
        if any(w in msg for w in ["how much", "spending", "spent", "expenses"]):
            top_cat = categories[0] if categories else None
            top_info = f" Your biggest expense area is **{top_cat['category_name']}** at ${top_cat['total_spent']} ({top_cat['percentage_of_total']}% of spending)." if top_cat else ""
            return (
                f"📊 **Monthly Spending Overview:**\n"
                f"- **Total Spent This Month:** ${summary['total_expenses']}\n"
                f"- **Monthly Income:** ${summary['total_income']}\n"
                f"- **Remaining Disposable Budget:** ${summary['remaining_budget']}\n"
                f"- **Daily Spend Pace:** ${summary['daily_avg_spend']} per day\n"
                f"{top_info}\n\n"
                f"You are currently **{summary['budget_status']}** with a savings rate of **{summary['savings_rate']}%**."
            )

        # Budget & savings opportunities
        if any(w in msg for w in ["budget", "save", "saving", "opportunity", "cut"]):
            over = [c for c in categories if c["status"] in ("exceeded", "warning")]
            over_text = ""
            if over:
                over_items = [f"• **{c['category_name']}**: ${c['total_spent']} spent of ${c['budget_limit']} limit ({c['percentage_of_budget']}%)" for c in over]
                over_text = "\n\n**Categories requiring attention:**\n" + "\n".join(over_items)

            return (
                f"💡 **Personalized Budget & Savings Recommendations:**\n\n"
                f"1. **Maintain your 20% Target:** Your current savings rate is **{summary['savings_rate']}%**. Young professionals and students benefit most from establishing an emergency buffer of 3 months expenses.\n"
                f"2. **Category Trimming:** Focus on dining and recurring tech subscriptions where micro-expenses accumulate unnoticed.{over_text}\n"
                f"3. **PayPal Smart Purchasing:** Utilize the Smart Purchase Advisor before non-essential purchases over $30 to check available category limits."
            )

        # Unusual spending or anomalies
        if any(w in msg for w in ["unusual", "anomaly", "weird", "alert"]):
            over = [c for c in categories if c["status"] == "exceeded"]
            if over:
                names = ", ".join([c["category_name"] for c in over])
                return f"⚠️ **Unusual Activity Alert:** You have overspent your monthly target in **{names}**. Review recent transactions in this category to avoid compounding deficits."
            return "✅ **All Clear:** Your spending across all categories is currently within safe projected limits this month!"

        # Default smart response
        return (
            f"👋 Hello! Based on your live financial records for **{summary['month']}**:\n\n"
            f"- **Net Balance:** ${summary['remaining_budget']} remaining\n"
            f"- **Savings Rate:** {summary['savings_rate']}%\n"
            f"- **Burn Rate:** ${summary['daily_avg_spend']} per day (projected ${summary['projected_spend']} by month-end)\n\n"
            f"Feel free to ask me questions like:\n"
            f"• *'Can I afford a $150 jacket right now?'*\n"
            f"• *'Where am I spending the most money?'*\n"
            f"• *'How can I boost my savings rate to 25%?'*"
        )

    def evaluate_purchase(self, user_id, item_name, price, category_name="Shopping & Tech", urgency="want"):
        """Evaluates purchase affordability using real budget, income, and burn rate."""
        try:
            price = float(price)
        except ValueError:
            return {"success": False, "error": "Invalid purchase price."}

        if price <= 0:
            return {"success": False, "error": "Price must be greater than zero."}

        summary = get_financial_summary(user_id)
        categories = get_category_breakdown(user_id)

        # Find target category
        target_cat = next((c for c in categories if c["category_name"].lower() == category_name.lower()), None)
        if not target_cat and categories:
            target_cat = categories[0]

        cat_budget = target_cat["budget_limit"] if target_cat else 200.0
        cat_spent = target_cat["total_spent"] if target_cat else 0.0
        cat_remaining = max(0.0, cat_budget - cat_spent)

        remaining_income = summary["remaining_budget"]
        post_purchase_balance = remaining_income - price

        # Calculate affordability score (0 to 100)
        # Factors:
        # 1. Remaining disposable cash after purchase (40%)
        # 2. Category budget headroom (35%)
        # 3. Urgency factor (15%)
        # 4. Daily burn rate impact (10%)
        score = 100.0

        # Cash factor
        if post_purchase_balance < 0:
            score -= 50
        elif post_purchase_balance < (summary["total_income"] * 0.1):
            score -= 25
        elif post_purchase_balance < (summary["total_income"] * 0.2):
            score -= 10

        # Category factor
        if (cat_spent + price) > cat_budget:
            overage = (cat_spent + price) - cat_budget
            score -= min(35, (overage / max(cat_budget, 1.0)) * 30)

        # Urgency factor
        if urgency.lower() == "want":
            if price > 100:
                score -= 10
        elif urgency.lower() == "need":
            score += 5

        # Burn rate factor: how many days of spending does this represent?
        daily_spend = max(summary["daily_avg_spend"], 10.0)
        days_equivalent = round(price / daily_spend, 1)
        if days_equivalent > 5:
            score -= 10

        score = max(5, min(100, round(score)))

        # Determine Verdict
        if score >= 75:
            verdict = "Recommended"
            verdict_badge = "emerald"
            summary_text = f"You can comfortably afford this {urgency}. Your budget has ample headroom."
        elif score >= 50:
            verdict = "Affordable with Caution"
            verdict_badge = "amber"
            summary_text = f"Affordable, but it consumes a notable portion of your remaining {category_name} budget."
        else:
            verdict = "Not Recommended"
            verdict_badge = "rose"
            summary_text = f"This purchase will push you over budget or compromise your monthly savings target."

        rationale = [
            f"**Price Impact:** ${price:.2f} equals approximately **{days_equivalent} days** of your average daily spending.",
            f"**Category Budget:** {category_name} currently has **${cat_remaining:.2f}** remaining. After purchase, balance will be **${cat_remaining - price:.2f}**.",
            f"**Monthly Cushion:** Leaves you with **${post_purchase_balance:.2f}** in total savings and disposable income for the remainder of {summary['month']}."
        ]

        if post_purchase_balance < 0:
            rationale.append("⚠️ **Deficit Warning:** This item exceeds your current remaining monthly balance.")
        elif score < 75 and urgency.lower() == "want":
            rationale.append("💡 **Smart Tip:** Consider applying the 48-hour rule for non-essential purchases to prevent impulse spending.")

        return {
            "success": True,
            "item_name": item_name,
            "price": price,
            "category_name": category_name,
            "urgency": urgency,
            "affordability_score": score,
            "verdict": verdict,
            "verdict_badge": verdict_badge,
            "summary": summary_text,
            "rationale": rationale,
            "metrics": {
                "remaining_before": remaining_income,
                "remaining_after": round(post_purchase_balance, 2),
                "category_remaining_before": cat_remaining,
                "category_remaining_after": round(cat_remaining - price, 2),
                "days_equivalent": days_equivalent,
                "savings_rate_impact": round(((post_purchase_balance) / max(summary['total_income'], 1.0)) * 100, 1)
            },
            "paypal_eligible": True
        }

ai_service = AIService()
