import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
from app import bubble_sort, merge_sort, measure_sorting_performance

class TestSortingAlgorithms(unittest.TestCase):
    def test_bubble_sort_correctness(self):
        # Already sorted
        self.assertEqual(bubble_sort([1, 2, 3, 4, 5])[0], [1, 2, 3, 4, 5])
        # Reversed
        self.assertEqual(bubble_sort([5, 4, 3, 2, 1])[0], [1, 2, 3, 4, 5])
        # Random with duplicates
        self.assertEqual(bubble_sort([3, 1, 4, 1, 5, 9, 2, 6, 5])[0], [1, 1, 2, 3, 4, 5, 5, 6, 9])
        # Negative numbers and floats
        self.assertEqual(bubble_sort([-1.5, 3.2, 0.0, -5.1])[0], [-5.1, -1.5, 0.0, 3.2])

    def test_bubble_sort_early_exit(self):
        # A sorted array should stop early.
        # For array size 5, O(n^2) comparisons would be 10.
        # With early exit, it should make exactly 4 comparisons (n-1 comparisons in first pass).
        _, comparisons, swaps = bubble_sort([1, 2, 3, 4, 5])
        self.assertEqual(comparisons, 4)
        self.assertEqual(swaps, 0)

    def test_merge_sort_correctness(self):
        # Sorted
        self.assertEqual(merge_sort([1, 2, 3, 4, 5])[0], [1, 2, 3, 4, 5])
        # Reversed
        self.assertEqual(merge_sort([5, 4, 3, 2, 1])[0], [1, 2, 3, 4, 5])
        # Duplicates
        self.assertEqual(merge_sort([3, 1, 4, 1, 5])[0], [1, 1, 3, 4, 5])
        # Floats
        self.assertEqual(merge_sort([-2.5, 1.1, 0.0])[0], [-2.5, 0.0, 1.1])

    def test_measure_sorting_performance(self):
        arr = [5, 2, 9, 1]
        # Test bubble
        res_bubble = measure_sorting_performance(bubble_sort, arr, is_bubble=True)
        self.assertIn("elapsed_seconds", res_bubble)
        self.assertEqual(res_bubble["comparisons"], 6)
        # Test merge
        res_merge = measure_sorting_performance(merge_sort, arr, is_bubble=False)
        self.assertIn("elapsed_seconds", res_merge)

if __name__ == '__main__':
    unittest.main()
