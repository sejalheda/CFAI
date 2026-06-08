import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
from app import measure_list_membership, measure_set_membership

class TestMembershipAlgorithms(unittest.TestCase):
    def test_list_membership_correctness(self):
        numbers = [10, 20, 30, 40, 50]
        targets = [20, 60, 40]
        
        res = measure_list_membership(numbers, targets)
        self.assertIn("elapsed_seconds", res)
        self.assertIn("elapsed_ms", res)
        # 20 and 40 are found, 60 is not
        self.assertEqual(res["found"], 2)
        self.assertEqual(res["description"], "Linear Search - O(n)")

    def test_set_membership_correctness(self):
        numbers = [10, 20, 30, 40, 50, 10, 20] # with duplicates
        targets = [20, 60, 10, 99]
        
        res = measure_set_membership(numbers, targets)
        self.assertIn("elapsed_seconds", res)
        self.assertIn("elapsed_ms", res)
        # 20 and 10 are found
        self.assertEqual(res["found"], 2)
        self.assertEqual(res["description"], "Hash Table - O(1)")

    def test_empty_lists(self):
        # Empty inputs
        res_list = measure_list_membership([], [1, 2])
        self.assertEqual(res_list["found"], 0)
        
        res_set = measure_set_membership([], [1, 2])
        self.assertEqual(res_set["found"], 0)

if __name__ == '__main__':
    unittest.main()
