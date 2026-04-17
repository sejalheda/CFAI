from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

# ──────────────────────────────────────────────
#  Sorting Algorithms
# ──────────────────────────────────────────────

def bubble_sort(arr):
    """Bubble Sort  –  O(n²) time complexity"""
    a = arr.copy()
    comparisons = 0
    swaps = 0
    n = len(a)
    for i in range(n):
        for j in range(n - i - 1):
            comparisons += 1
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swaps += 1
    return comparisons, swaps


def merge_sort(arr):
    """Merge Sort  –  O(n log n) time complexity"""
    comparisons = [0]

    def _sort(a):
        if len(a) <= 1:
            return a
        mid = len(a) // 2
        return _merge(_sort(a[:mid]), _sort(a[mid:]))

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

    _sort(arr.copy())
    return comparisons[0]


# ──────────────────────────────────────────────
#  API Routes
# ──────────────────────────────────────────────

@app.route('/sort', methods=['POST'])
def sort():
    data = request.json
    arr  = data.get('array', [])

    if not arr:
        return jsonify({"error": "Array is empty"}), 400

    # Bubble Sort timing
    start = time.perf_counter()
    b_comp, b_swaps = bubble_sort(arr)
    bubble_ms = (time.perf_counter() - start) * 1000

    # Merge Sort timing
    start = time.perf_counter()
    m_comp = merge_sort(arr)
    merge_ms = (time.perf_counter() - start) * 1000

    return jsonify({
        "n": len(arr),
        "bubble": {
            "time_ms":     round(bubble_ms, 6),
            "comparisons": b_comp,
            "swaps":       b_swaps,
            "complexity":  "O(n\u00b2)"
        },
        "merge": {
            "time_ms":     round(merge_ms, 6),
            "comparisons": m_comp,
            "complexity":  "O(n log n)"
        }
    })


@app.route('/set', methods=['POST'])
def set_check():
    data   = request.json
    arr    = data.get('array', [])
    target = data.get('target')

    if not arr or target is None:
        return jsonify({"error": "Missing array or target"}), 400

    # List linear search  –  O(n)
    steps = 0
    start = time.perf_counter()
    found = False
    for x in arr:
        steps += 1
        if x == target:
            found = True
            break
    list_ms = (time.perf_counter() - start) * 1000

    # Set hash lookup  –  O(1)
    s = set(arr)
    start = time.perf_counter()
    found_set = target in s
    set_ms = (time.perf_counter() - start) * 1000

    return jsonify({
        "n":      len(arr),
        "target": target,
        "found":  found or found_set,
        "list": {
            "time_ms":    round(list_ms, 6),
            "steps":      steps,
            "complexity": "O(n)"
        },
        "set": {
            "time_ms":    round(set_ms, 6),
            "steps":      1,
            "complexity": "O(1)"
        }
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)