import unittest
from backend.main import health
from backend.forecast_model import analyze_sales_dataset, detect_columns

class BackendSmokeTests(unittest.TestCase):
    def test_health(self):
        self.assertEqual(health(), {"status": "ok"})
    def test_empty_dataset(self):
        result = analyze_sales_dataset({"rows": []})
        self.assertIn("7d", result["ranges"])
        self.assertIn("30d", result["ranges"])
    def test_column_detection(self):
        result = detect_columns(["date", "product", "quantity", "sales"])
        self.assertEqual(result.date, "date")
        self.assertEqual(result.quantity, "quantity")

if __name__ == "__main__":
    unittest.main()
