import unittest
import json
from backend.app import create_app

class EndToEndIntegrationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_health_and_frontend(self):
        # Health check
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")

        # Frontend single-page app root
        res_fe = self.client.get("/")
        self.assertEqual(res_fe.status_code, 200)
        self.assertIn(b"FinWise AI", res_fe.data)

    def test_02_analytics_data_integrity(self):
        res = self.client.get("/api/analytics/summary")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertGreater(data["total_income"], 0)
        self.assertGreaterEqual(data["total_expenses"], 0)
        self.assertIn("savings_rate", data)
        self.assertIn("daily_avg_spend", data)
        self.assertIn("projected_spend", data)

    def test_03_ai_ground_truth_advising(self):
        # Ask question about current spending
        res = self.client.post("/api/ai/chat", json={
            "message": "What is my current savings rate and biggest expense?"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("reply", data)
        self.assertIn("Disclaimer", data["reply"])

    def test_04_smart_purchase_advisor_and_paypal_loop(self):
        # 1. User wants to buy an iPad / Tablet
        advisor_res = self.client.post("/api/ai/evaluate-purchase", json={
            "item_name": "Apple iPad Air",
            "price": 499.00,
            "category_name": "Shopping & Tech",
            "urgency": "want"
        })
        self.assertEqual(advisor_res.status_code, 200)
        adv_data = advisor_res.get_json()
        self.assertTrue(adv_data["success"])
        self.assertIn("affordability_score", adv_data)
        self.assertIn("verdict", adv_data)
        self.assertTrue(adv_data["paypal_eligible"])

        # 2. User proceeds to PayPal checkout
        order_res = self.client.post("/api/paypal/create-order", json={
            "amount": adv_data["price"],
            "item_name": adv_data["item_name"],
            "currency": "USD"
        })
        self.assertEqual(order_res.status_code, 201)
        order_info = order_res.get_json()
        self.assertTrue(order_info["success"])
        order_id = order_info["order_id"]

        # 3. Server captures and verifies payment
        capture_res = self.client.post("/api/paypal/capture-order", json={
            "order_id": order_id
        })
        self.assertEqual(capture_res.status_code, 200)
        cap_info = capture_res.get_json()
        self.assertTrue(cap_info["success"])
        self.assertEqual(cap_info["status"], "COMPLETED")

        # 4. Verify transaction auto-recorded in expenses
        tx_res = self.client.get("/api/expenses?search=Apple+iPad+Air")
        self.assertEqual(tx_res.status_code, 200)
        expenses_list = tx_res.get_json()["expenses"]
        self.assertTrue(any("Apple iPad Air" in e["description"] for e in expenses_list))
        matched = next(e for e in expenses_list if "Apple iPad Air" in e["description"])
        self.assertEqual(matched["payment_method"], "paypal")

if __name__ == "__main__":
    unittest.main()
