# ⚡ Algorithm Complexity Visualizer

> *"See the difference — measure it, visualize it, understand it."*

---

## 📌 Overview

**Algorithm Complexity Visualizer** is an interactive web application that lets you compare how different algorithms and data structures perform on real input data — **measured live using Python's `time` module**. No theory alone: actual elapsed time is computed and displayed on the frontend.

Two core comparisons are supported:

| Module | What it compares |
|--------|-----------------|
| 🔀 **Sorting Algorithms** | Bubble Sort `O(n²)` vs Merge Sort `O(n log n)` |
| 🗂️ **Data Structures** | List membership `O(n)` vs Set membership `O(1)` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | Python + Flask |
| **Visualization** | Chart.js |
| **Timing** | Python `time.perf_counter()` |

---

## 📁 Project Structure

```
CFAI/
├── README.md
├── requirements.txt
├── .gitignore
├── app.py                    # Flask backend (API endpoints)
├── static/
│   ├── css/
│   │   └── style.css         # Styling
│   └── js/
│       └── main.js           # Frontend logic
└── templates/
    └── index.html            # Main UI page
```

---


## 📅 Project Progress

| Day | Task | Status |
|-----|------|--------|
| Day 1 | Project setup, README, folder structure | ✅ Done |
| Day 2 | Flask backend – Sorting algorithms | ✅ Done |
| Day 3 | Frontend base – HTML + CSS | ✅ Done |
| Day 4 | Sorting comparison UI + JS | ✅ Done |
| Day 5 | Flask backend – List vs Set | ✅ Done |
| Day 6 | Data structure comparison UI | ✅ Done |
| Day 7 | Chart.js visualizations | ✅ Done |
| Day 8 | UI polish, animations, responsive | ✅ Done |
| Day 9 | Testing & bug fixes | ✅ Done |
| Day 10 | Final cleanup & v1.0 release | ✅ Done |

---

## 🔮 Future Work

- Add more sorting algorithms (Quick Sort, Heap Sort, Insertion Sort)
- Support custom algorithm input by the user
- Add space complexity comparison
- Export results as PDF/CSV
- Deploy to cloud (Render / Railway)

---

## 🧪 Testing

The backend is fully covered by a Python unit testing suite. To execute the tests, run:

```bash
python run_tests.py
```

This will automatically discover and run all test cases inside the `tests/` directory:
- **Sorting Algorithm Core Logic** (`tests/test_sorting.py`)
- **List vs Set Membership Search Logic** (`tests/test_membership.py`)
- **Flask REST API Request Validation & Response Payloads** (`tests/test_api.py`)

---

## 👥 Team


| **Sejal** | 
| **Bhavya** |


