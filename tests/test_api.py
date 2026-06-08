import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
import json
from app import app

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_index_route(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)

    def test_api_sort_success(self):
        payload = {"numbers": [5, 3, 8, 2, 1, 4]}
        response = self.app.post('/api/sort',
                                 data=json.dumps(payload),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertIn("bubble_sort", data)
        self.assertIn("merge_sort", data)
        self.assertEqual(data["input_size"], 6)
        self.assertIn("winner", data)
        self.assertIn("speedup", data)
        
        bubble = data["bubble_sort"]
        self.assertIn("elapsed_ms", bubble)
        self.assertTrue(isinstance(bubble["comparisons"], int))

    def test_api_sort_validation_errors(self):
        # Missing payload
        response = self.app.post('/api/sort', data=json.dumps({}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Missing numbers
        response = self.app.post('/api/sort', data=json.dumps({"some_key": 1}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Numbers not list
        response = self.app.post('/api/sort', data=json.dumps({"numbers": "invalid"}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Numbers too short
        response = self.app.post('/api/sort', data=json.dumps({"numbers": [1]}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Numbers too long
        response = self.app.post('/api/sort', data=json.dumps({"numbers": list(range(10001))}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Non-numeric item
        response = self.app.post('/api/sort', data=json.dumps({"numbers": [1, 2, "three"]}), content_type='application/json')
        self.assertEqual(response.status_code, 400)

        # Infinite/NaN items
        response = self.app.post('/api/sort', data=json.dumps({"numbers": [1, float('inf')]}), content_type='application/json')
        self.assertEqual(response.status_code, 400)

    def test_api_membership_success(self):
        payload = {
            "numbers": [10, 20, 30, 40, 50, 10, 20],
            "search_targets": [20, 99]
        }
        response = self.app.post('/api/membership',
                                 data=json.dumps(payload),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertIn("list_membership", data)
        self.assertIn("set_membership", data)
        self.assertEqual(data["input_size"], 7)
        self.assertEqual(data["unique_elements"], 5)
        self.assertEqual(data["duplicate_elements"], 2)
        self.assertEqual(data["targets_searched"], 2)
        self.assertIn("winner", data)
        self.assertIn("speedup", data)
        
        # Test default targets generation when search_targets is omitted
        payload_no_targets = {"numbers": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        response_no_targets = self.app.post('/api/membership',
                                            data=json.dumps(payload_no_targets),
                                            content_type='application/json')
        self.assertEqual(response_no_targets.status_code, 200)
        data_no_targets = json.loads(response_no_targets.data)
        self.assertTrue(data_no_targets["targets_searched"] >= 100)

    def test_api_membership_validation_errors(self):
        # Missing payload
        response = self.app.post('/api/membership', data=json.dumps({}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Numbers not list
        response = self.app.post('/api/membership', data=json.dumps({"numbers": 123}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Numbers too short
        response = self.app.post('/api/membership', data=json.dumps({"numbers": [1]}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Non-numeric item
        response = self.app.post('/api/membership', data=json.dumps({"numbers": [1, "two"]}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Non-finite item
        response = self.app.post('/api/membership', data=json.dumps({"numbers": [1, float('nan')]}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Search targets not list
        response = self.app.post('/api/membership', data=json.dumps({"numbers": [1, 2], "search_targets": 123}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # Search targets non-finite item
        response = self.app.post('/api/membership', data=json.dumps({"numbers": [1, 2], "search_targets": [1, float('inf')]}), content_type='application/json')
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()
