import unittest
import json
from backend.app import create_app
from backend.database import init_db, seed_demo_data

class BackendTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_demo_data()
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("FinWise AI", data["app"])

    def test_auth_login_demo_user(self):
        res = self.client.post("/api/auth/login", json={
            "username_or_email": "alex_student",
            "password": "Password123!"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data)
        self.assertEqual(data["user"]["username"], "alex_student")

    def test_categories_endpoint(self):
        res = self.client.get("/api/categories")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreater(len(data["categories"]), 5)

    def test_analytics_summary(self):
        res = self.client.get("/api/analytics/summary")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("total_income", data["data"])
        self.assertIn("total_expenses", data["data"])
        self.assertIn("remaining_budget", data["data"])
        self.assertIn("savings_rate", data["data"])

    def test_analytics_categories(self):
        res = self.client.get("/api/analytics/categories")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)

    def test_analytics_trends(self):
        res = self.client.get("/api/analytics/trends?months=6")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]), 6)

    def test_expenses_crud(self):
        # 1. Create
        create_res = self.client.post("/api/expenses", json={
            "amount": 42.50,
            "description": "Test Campus Bookstore Notebooks",
            "payment_method": "card",
            "type": "expense",
            "notes": "Unit test automated transaction"
        })
        self.assertEqual(create_res.status_code, 201)
        created = create_res.get_json()
        self.assertTrue(created["success"])
        tx_id = created["expense"]["id"]

        # 2. Read list
        list_res = self.client.get("/api/expenses?search=Bookstore")
        self.assertEqual(list_res.status_code, 200)
        list_data = list_res.get_json()
        self.assertTrue(any(e["id"] == tx_id for e in list_data["expenses"]))

        # 3. Update
        update_res = self.client.put(f"/api/expenses/{tx_id}", json={
            "amount": 45.00,
            "description": "Updated Campus Bookstore Notebooks & Pens"
        })
        self.assertEqual(update_res.status_code, 200)
        updated = update_res.get_json()
        self.assertEqual(updated["expense"]["amount"], 45.00)

        # 4. Delete
        del_res = self.client.delete(f"/api/expenses/{tx_id}")
        self.assertEqual(del_res.status_code, 200)

    def test_ai_chat(self):
        res = self.client.post("/api/ai/chat", json={
            "message": "How much have I spent on food this month?"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("reply", data)
        self.assertIn("Disclaimer", data["reply"])

    def test_ai_evaluate_purchase(self):
        res = self.client.post("/api/ai/evaluate-purchase", json={
            "item_name": "Mechanical Keyboard",
            "price": 89.99,
            "category_name": "Shopping & Tech",
            "urgency": "want"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("affordability_score", data)
        self.assertIn("verdict", data)
        self.assertTrue(data["paypal_eligible"])

    def test_paypal_create_and_capture_workflow(self):
        # 1. Create order
        create_res = self.client.post("/api/paypal/create-order", json={
            "amount": 35.00,
            "currency": "USD",
            "item_name": "Student Tech Adapter"
        })
        self.assertEqual(create_res.status_code, 201)
        order_data = create_res.get_json()
        self.assertTrue(order_data["success"])
        order_id = order_data["order_id"]

        # 2. Capture order
        capture_res = self.client.post("/api/paypal/capture-order", json={
            "order_id": order_id
        })
        self.assertEqual(capture_res.status_code, 200)
        cap_data = capture_res.get_json()
        self.assertTrue(cap_data["success"])
        self.assertEqual(cap_data["status"], "COMPLETED")
        self.assertIsNotNone(cap_data.get("transaction_id"))

        # 3. Prevent duplicate capture
        dup_res = self.client.post("/api/paypal/capture-order", json={
            "order_id": order_id
        })
        self.assertEqual(dup_res.status_code, 200)
        dup_data = dup_res.get_json()
        self.assertTrue(dup_data.get("already_captured"))

        # 4. Check PayPal transaction list
        list_res = self.client.get("/api/paypal/transactions")
        self.assertEqual(list_res.status_code, 200)
        tx_list = list_res.get_json()["transactions"]
        self.assertTrue(any(t["order_id"] == order_id for t in tx_list))

if __name__ == "__main__":
    unittest.main()
