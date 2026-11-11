import json
import logging
import secrets
import time
import requests
from requests.auth import HTTPBasicAuth
from backend.config import config
from backend.database import get_db

logger = logging.getLogger(__name__)

class PayPalService:
    def __init__(self):
        self.base_url = config.PAYPAL_BASE_URL
        self.client_id = config.PAYPAL_CLIENT_ID
        self.client_secret = config.PAYPAL_CLIENT_SECRET
        self._cached_token = None
        self._token_expires_at = 0

    def is_configured(self):
        """Checks if real PayPal Sandbox API keys have been provided."""
        return bool(self.client_id and self.client_secret and "your_paypal" not in self.client_id)

    def get_access_token(self):
        """Retrieves or refreshes OAuth 2.0 access token from PayPal REST API."""
        if not self.is_configured():
            return None

        # Return cached token if still valid
        if self._cached_token and time.time() < (self._token_expires_at - 60):
            return self._cached_token

        url = f"{self.base_url}/v1/oauth2/token"
        headers = {
            "Accept": "application/json",
            "Accept-Language": "en_US",
        }
        data = {"grant_type": "client_credentials"}

        try:
            response = requests.post(
                url,
                auth=HTTPBasicAuth(self.client_id, self.client_secret),
                headers=headers,
                data=data,
                timeout=10
            )
            response.raise_for_status()
            token_data = response.json()
            self._cached_token = token_data.get("access_token")
            expires_in = int(token_data.get("expires_in", 3600))
            self._token_expires_at = time.time() + expires_in
            return self._cached_token
        except Exception as e:
            logger.error(f"Failed to obtain PayPal access token: {e}")
            raise Exception(f"PayPal authentication failed: {str(e)}")

    def create_order(self, user_id, amount, currency="USD", item_name="FinWise Planned Purchase", category_id=None):
        """Creates a PayPal order on PayPal REST API or in Sandbox Simulator mode."""
        amount_str = f"{float(amount):.2f}"

        if self.is_configured():
            token = self.get_access_token()
            url = f"{self.base_url}/v2/checkout/orders"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
                "Prefer": "return=representation"
            }
            payload = {
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "description": item_name[:127],
                        "amount": {
                            "currency_code": currency.upper(),
                            "value": amount_str
                        }
                    }
                ],
                "application_context": {
                    "brand_name": "FinWise AI Financial Assistant",
                    "landing_page": "NO_PREFERENCE",
                    "user_action": "PAY_NOW",
                    "return_url": "https://example.com/checkout/success",
                    "cancel_url": "https://example.com/checkout/cancel"
                }
            }

            res = requests.post(url, json=payload, headers=headers, timeout=12)
            if res.status_code not in (200, 201):
                logger.error(f"PayPal create order failed: {res.text}")
                return {"success": False, "error": f"PayPal error: {res.json().get('message', res.text)}"}
            
            order_data = res.json()
            order_id = order_data["id"]
        else:
            # Standalone Sandbox Simulator Mode (for immediate testing without requiring API keys)
            order_id = f"SANDBOX-ORD-{int(time.time())}-{secrets.token_hex(4).upper()}"
            order_data = {
                "id": order_id,
                "status": "CREATED",
                "simulated": True,
                "note": "FinWise Sandbox Simulation Mode active. Provide PAYPAL_CLIENT_ID and SECRET in .env for live PayPal REST calls."
            }

        # Store pending order record in SQLite
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO paypal_transactions 
            (user_id, order_id, amount, currency, status, purchase_item, category_id, payload_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            order_id,
            float(amount),
            currency.upper(),
            "CREATED",
            item_name,
            category_id,
            json.dumps(order_data)
        ))
        conn.commit()
        conn.close()

        return {
            "success": True,
            "order_id": order_id,
            "amount": float(amount),
            "currency": currency.upper(),
            "item_name": item_name,
            "simulated": not self.is_configured(),
            "paypal_client_id": self.client_id if self.is_configured() else "sb"
        }

    def capture_order(self, user_id, order_id):
        """Captures payment, verifies status == 'COMPLETED', and records expense in transactions."""
        conn = get_db()
        cursor = conn.cursor()

        # Check existing transaction
        cursor.execute("""
            SELECT id, status, amount, currency, purchase_item, category_id, transaction_id 
            FROM paypal_transactions 
            WHERE order_id = ? AND user_id = ?
        """, (order_id, user_id))
        record = cursor.fetchone()

        if not record:
            conn.close()
            return {"success": False, "error": "Order not found or unauthorized."}

        # Prevent duplicate capture
        if record["status"] == "COMPLETED":
            conn.close()
            return {
                "success": True,
                "already_captured": True,
                "message": "Payment has already been captured and recorded.",
                "order_id": order_id
            }

        capture_id = None
        capture_data = {}

        if self.is_configured():
            token = self.get_access_token()
            url = f"{self.base_url}/v2/checkout/orders/{order_id}/capture"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
                "Prefer": "return=representation"
            }

            res = requests.post(url, headers=headers, timeout=15)
            if res.status_code not in (200, 201):
                error_msg = res.json().get("message", res.text)
                cursor.execute("UPDATE paypal_transactions SET status = 'FAILED' WHERE order_id = ?", (order_id,))
                conn.commit()
                conn.close()
                return {"success": False, "error": f"PayPal capture failed: {error_msg}"}

            capture_data = res.json()
            status = capture_data.get("status")

            # Extract capture id from purchase_units
            try:
                captures = capture_data["purchase_units"][0]["payments"]["captures"]
                capture_id = captures[0]["id"]
            except (KeyError, IndexError):
                capture_id = f"CAP-{secrets.token_hex(6).upper()}"

            if status != "COMPLETED":
                cursor.execute("UPDATE paypal_transactions SET status = ? WHERE order_id = ?", (status, order_id))
                conn.commit()
                conn.close()
                return {"success": False, "error": f"Payment not completed. Status: {status}"}
        else:
            # Standalone Sandbox Simulator Mode verification
            status = "COMPLETED"
            capture_id = f"SANDBOX-CAP-{int(time.time())}-{secrets.token_hex(4).upper()}"
            capture_data = {
                "id": capture_id,
                "status": "COMPLETED",
                "simulated": True,
                "payer": {"name": {"given_name": "Sandbox", "surname": "Tester"}, "email_address": "sandbox-buyer@finwise.ai"}
            }

        # If category_id was not set, fallback to 'Shopping & Tech' or 'Miscellaneous'
        cat_id = record["category_id"]
        if not cat_id:
            cursor.execute("SELECT id FROM categories WHERE name = 'Shopping & Tech'")
            cat_row = cursor.fetchone()
            cat_id = cat_row["id"] if cat_row else 1

        # Automatically record transaction into the main expenses table
        today_str = time.strftime("%Y-%m-%d")
        cursor.execute("""
            INSERT INTO transactions (user_id, category_id, amount, date, description, payment_method, type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            cat_id,
            record["amount"],
            today_str,
            f"PayPal: {record['purchase_item']}",
            "paypal",
            "expense",
            f"PayPal Order ID: {order_id} | Capture ID: {capture_id}"
        ))
        new_tx_id = cursor.lastrowid

        # Update paypal_transactions table
        cursor.execute("""
            UPDATE paypal_transactions
            SET status = 'COMPLETED',
                capture_id = ?,
                transaction_id = ?,
                payload_json = ?
            WHERE order_id = ?
        """, (capture_id, new_tx_id, json.dumps(capture_data), order_id))

        conn.commit()
        conn.close()

        return {
            "success": True,
            "order_id": order_id,
            "capture_id": capture_id,
            "status": "COMPLETED",
            "amount": record["amount"],
            "currency": record["currency"],
            "purchase_item": record["purchase_item"],
            "transaction_id": new_tx_id,
            "simulated": not self.is_configured(),
            "message": "Payment verified and recorded in your expenses!"
        }

    def get_user_paypal_transactions(self, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.order_id, p.capture_id, p.amount, p.currency, p.status, 
                   p.purchase_item, p.created_at, c.name as category_name
            FROM paypal_transactions p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        """, (user_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

paypal_service = PayPalService()
