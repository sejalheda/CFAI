import time
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


# ─────────────────────────────────────────────────────────
# Sorting Algorithms
# ─────────────────────────────────────────────────────────

def bubble_sort(arr):
    """Bubble Sort — O(n^2) time complexity.
    Compares adjacent elements and swaps them if out of order.
    Repeats until the array is fully sorted.
    """
    a = arr.copy()
    n = len(a)
    comparisons = 0
    swaps = 0
    for i in range(n):
        for j in range(0, n - i - 1):
            comparisons += 1
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swaps += 1
    return a, comparisons, swaps


def merge_sort(arr):
    """Merge Sort — O(n log n) time complexity.
    Divides array into halves, sorts each, then merges them.
    """
    comparisons = [0]

    def _merge_sort(a):
        if len(a) <= 1:
            return a
        mid = len(a) // 2
        left = _merge_sort(a[:mid])
        right = _merge_sort(a[mid:])
        return _merge(left, right)

    def _merge(left, right):
        result = []
        i = j = 0
        while i < len(left) and j < len(right):
            comparisons[0] += 1
            if left[i] <= right[j]:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        result.extend(left[i:])
        result.extend(right[j:])
        return result

    sorted_arr = _merge_sort(arr.copy())
    return sorted_arr, comparisons[0]


def measure_sorting_performance(sort_fn, arr, is_bubble=False):
    """Measures execution time and formats results for a sorting function."""
    t_start = time.perf_counter()
    if is_bubble:
        sorted_arr, comparisons, swaps = sort_fn(arr)
    else:
        sorted_arr, comparisons = sort_fn(arr)
        swaps = "N/A (Merge Sort uses auxiliary space, not in-place swaps)"
    t_end = time.perf_counter()
    
    elapsed_seconds = t_end - t_start
    elapsed_ms = elapsed_seconds * 1000
    
    return {
        "elapsed_seconds": elapsed_seconds,
        "elapsed_ms": round(elapsed_ms, 6),
        "comparisons": comparisons,
        "swaps": swaps,
        "best_case": "O(n) - sorted array" if is_bubble else "O(n log n)",
        "worst_case": "O(n^2) - reverse sorted" if is_bubble else "O(n log n)"
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/sort", methods=["POST"])
def api_sort():
    # Skeleton implementation
    return jsonify({"message": "Sorting API skeleton"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
