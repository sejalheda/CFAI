import time
import math
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


def validate_numbers_list(numbers, min_len=2, max_len=100000, name="numbers"):
    """Validates that a given variable is a list of finite numbers within size bounds."""
    if not isinstance(numbers, list):
        return f"'{name}' must be a list of numbers."
    if len(numbers) < min_len:
        return f"Please provide at least {min_len} numbers."
    if len(numbers) > max_len:
        return f"Maximum {max_len:,} numbers allowed."
    for idx, x in enumerate(numbers):
        if not isinstance(x, (int, float)) or not math.isfinite(x):
            return f"Item at index {idx} in '{name}' is not a valid finite number."
    return None



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
        swapped = False
        for j in range(0, n - i - 1):
            comparisons += 1
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swaps += 1
                swapped = True
        if not swapped:
            break
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
    """API Endpoint to compare Bubble Sort and Merge Sort performance.
    
    Accepts POST request with a JSON body:
    {
        "numbers": [list of numbers to be sorted]
    }
    
    Returns JSON response containing timing, comparison count, swap count,
    and complexity metadata for both algorithms, along with the performance winner.
    """
    # 1. Parse JSON payload safely
    data = request.get_json(silent=True)
    if not data or "numbers" not in data:
        return jsonify({"error": "Invalid request. 'numbers' is required."}), 400
    
    # 2. Validate input list presence and structure
    numbers = data["numbers"]
    err = validate_numbers_list(numbers, min_len=2, max_len=10000)
    if err:
        return jsonify({"error": err}), 400

            
    # 5. Measure and capture Bubble Sort performance
    bubble_res = measure_sorting_performance(bubble_sort, numbers, is_bubble=True)
    
    # 6. Measure and capture Merge Sort performance
    merge_res = measure_sorting_performance(merge_sort, numbers, is_bubble=False)
    
    # 7. Calculate performance speedup and identify the winner
    t_bubble = bubble_res["elapsed_seconds"]
    t_merge = merge_res["elapsed_seconds"]
    if t_bubble < t_merge:
        winner = "Bubble Sort"
        speedup = round(t_merge / t_bubble, 2) if t_bubble > 0 else 1.0
    else:
        winner = "Merge Sort"
        speedup = round(t_bubble / t_merge, 2) if t_merge > 0 else 1.0

    # 8. Return formatted comparison metrics
    return jsonify({
        "bubble_sort": bubble_res,
        "merge_sort": merge_res,
        "winner": winner,
        "speedup": speedup,
        "input_size": len(numbers)
    })
def measure_list_membership(numbers_list, targets):
    """Measures performance of checking membership in a Python list."""
    t_start = time.perf_counter()
    found = 0
    for target in targets:
        if target in numbers_list:
            found += 1
    t_end = time.perf_counter()
    elapsed_seconds = t_end - t_start
    elapsed_ms = elapsed_seconds * 1000
    return {
        "elapsed_seconds": elapsed_seconds,
        "elapsed_ms": round(elapsed_ms, 6),
        "found": found,
        "description": "Linear Search - O(n)"
    }

def measure_set_membership(numbers_list, targets):
    """Measures performance of checking membership in a Python set."""
    t_start = time.perf_counter()
    numbers_set = set(numbers_list)
    found = 0
    for target in targets:
        if target in numbers_set:
            found += 1
    t_end = time.perf_counter()
    elapsed_seconds = t_end - t_start
    elapsed_ms = elapsed_seconds * 1000
    return {
        "elapsed_seconds": elapsed_seconds,
        "elapsed_ms": round(elapsed_ms, 6),
        "found": found,
        "description": "Hash Table - O(1)"
    }


@app.route("/api/membership", methods=["POST"])
def api_membership():
    """API Endpoint to compare Python List (O(n)) and Set (O(1)) membership search performance.

    Accepts POST request with JSON payload:
    {
        "numbers": [list of base elements],
        "search_targets": [optional list of values to search for]
    }

    If search_targets is omitted, they are automatically generated from a blend of
    present elements and out-of-bounds random values.

    Returns JSON response containing timing and success metrics for both List and Set lookups,
    metadata regarding input size/uniqueness, and speedup winner metrics.
    """
    data = request.get_json(silent=True)
    if not data or "numbers" not in data:
        return jsonify({"error": "Invalid request. 'numbers' is required."}), 400
    numbers = data["numbers"]
    err = validate_numbers_list(numbers, min_len=2, max_len=100000)
    if err:
        return jsonify({"error": err}), 400
    
    search_targets = []
    if "search_targets" in data:
        targets_input = data["search_targets"]
        err_targets = validate_numbers_list(targets_input, min_len=0, max_len=100000, name="search_targets")
        if err_targets:
            return jsonify({"error": err_targets}), 400
        search_targets = targets_input
    import random
    if not search_targets:
        num_targets = min(1000, max(100, len(numbers)))
        half = num_targets // 2
        choices = [random.choice(numbers) for _ in range(half)]
        min_val = min(numbers)
        max_val = max(numbers)
        others = [random.randint(int(min_val) - 10, int(max_val) + 10) for _ in range(num_targets - half)]
        search_targets = choices + others
    unique_elements = len(set(numbers))
    duplicate_elements = len(numbers) - unique_elements
    list_membership = measure_list_membership(numbers, search_targets)
    set_membership = measure_set_membership(numbers, search_targets)
    t_list = list_membership["elapsed_seconds"]
    t_set = set_membership["elapsed_seconds"]
    if t_list < t_set:
        winner = "List Membership"
        speedup = round(t_set / t_list, 2) if t_list > 0 else 1.0
    else:
        winner = "Set Membership"
        speedup = round(t_list / t_set, 2) if t_set > 0 else 1.0
    return jsonify({
        "list_membership": list_membership,
        "set_membership": set_membership,
        "winner": winner,
        "speedup": speedup,
        "input_size": len(numbers),
        "unique_elements": unique_elements,
        "duplicate_elements": duplicate_elements,
        "targets_searched": len(search_targets)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
