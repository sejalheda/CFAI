from flask import Flask, render_template

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


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
