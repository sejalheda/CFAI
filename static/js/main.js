/*
 * Algorithm Complexity Visualizer — main.js
 * Calls Flask backend at http://127.0.0.1:5000
 * Modules: Sorting (Bubble vs Merge) | Membership (List vs Set)
 */

const API_BASE = "";   // Empty = same origin (Flask serves the page too)

/* ─────────────────────────────────────────────────────────
   Utilities
───────────────────────────────────────────────────────── */

/** Parse comma-separated string → array of numbers */
function parseNumbers(raw) {
  return raw
    .split(",")
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s !== ""; })
    .map(function(s) { return parseFloat(s); })
    .filter(function(n) { return !isNaN(n); });
}

/** Format seconds → human-readable string */
function formatTime(seconds) {
  var ms = seconds * 1000;
  if (ms < 0.001)      return (ms * 1000).toFixed(3) + " µs";
  if (ms < 1)          return ms.toFixed(4) + " ms";
  if (ms < 1000)       return ms.toFixed(3) + " ms";
  return (ms / 1000).toFixed(3) + " s";
}

/** Generate random integers in range [min, max] */
function randomArray(size, max) {
  max = max || size * 3;
  var arr = [];
  for (var i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * max) + 1);
  }
  return arr;
}

/** Show / hide loading state on a button */
function setLoading(btnTextId, btnLoaderId, btnId, loading) {
  var btnText   = document.getElementById(btnTextId);
  var btnLoader = document.getElementById(btnLoaderId);
  var btn       = document.getElementById(btnId);
  if (loading) {
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");
    btn.disabled = true;
    btn.style.opacity = "0.7";
  } else {
    btnText.classList.remove("hidden");
    btnLoader.classList.add("hidden");
    btn.disabled = false;
    btn.style.opacity = "1";
  }
}

/** Build a metric row HTML string */
function metricRow(key, value) {
  return '<div class="metric-row">' +
    '<span class="metric-key">' + key + '</span>' +
    '<span class="metric-value">' + value + '</span>' +
    '</div>';
}

/** Show error message */
function showError(boxId, msg) {
  var box = document.getElementById(boxId);
  box.textContent = "⚠ " + msg;
  box.classList.remove("hidden");
}

/** Hide error message */
function hideError(boxId) {
  document.getElementById(boxId).classList.add("hidden");
}


/* ─────────────────────────────────────────────────────────
   Live Visualizer State & Dom Initialization
───────────────────────────────────────────────────────── */
var visPlaying = false;
var visStopRequested = false;
var visDelayMs = 150; // Delay between steps in ms

/** Draws the initial vertical bars for visualization */
function drawVisualizerBars(numbers) {
  var bubbleContainer = document.getElementById("bubble-bars-container");
  var mergeContainer = document.getElementById("merge-bars-container");
  if (!bubbleContainer || !mergeContainer) return;
  
  bubbleContainer.innerHTML = "";
  mergeContainer.innerHTML = "";
  
  if (numbers.length === 0) return;
  
  var max = Math.max.apply(null, numbers);
  var min = Math.min.apply(null, numbers);
  var range = (max - min) || 1;

  numbers.forEach(function(val, idx) {
    var heightPercent = 10 + ((val - min) / range) * 85;
    
    // Bubble bar
    var bBar = document.createElement("div");
    bBar.className = "bar";
    bBar.style.height = heightPercent + "%";
    bBar.id = "bubble-bar-" + idx;
    bBar.setAttribute("title", val);
    bubbleContainer.appendChild(bBar);
    
    // Merge bar
    var mBar = document.createElement("div");
    mBar.className = "bar";
    mBar.style.height = heightPercent + "%";
    mBar.id = "merge-bar-" + idx;
    mBar.setAttribute("title", val);
    mergeContainer.appendChild(mBar);
  });
}

/** Toggles the visibility of the visualizer based on array length */
function checkAndToggleVisualizer(numbers) {
  var panel = document.getElementById("live-visualizer");
  if (!panel) return false;
  
  if (numbers.length >= 2 && numbers.length <= 50) {
    panel.classList.add("active");
    drawVisualizerBars(numbers);
    return true;
  } else {
    panel.classList.remove("active");
    return false;
  }
}

/** A helper promise delay function */
function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}


/* ─────────────────────────────────────────────────────────
   Quick Fill helpers
───────────────────────────────────────────────────────── */

var currentSortDistribution = 'random';

/** Select the active array distribution preset */
function selectDistribution(dist) {
  currentSortDistribution = dist;
  var buttons = ['random', 'sorted', 'reversed', 'almost'];
  buttons.forEach(function(b) {
    var btn = document.getElementById('preset-' + b);
    if (btn) {
      if (b === dist) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

/** Update the text showing the size selected by the slider */
function updateSortSizeDisplay(val) {
  document.getElementById('sort-size-val').textContent = val;
}

/** Generate an array of size specified by the range slider */
function generateFromSlider() {
  var size = parseInt(document.getElementById('sort-size-slider').value) || 100;
  fillSort(size);
}

/** Generate array numbers based on distribution type */
function generateArrayWithDistribution(size, dist) {
  var arr = [];
  if (dist === 'sorted') {
    for (var i = 1; i <= size; i++) {
      arr.push(i);
    }
  } else if (dist === 'reversed') {
    for (var i = size; i >= 1; i--) {
      arr.push(i);
    }
  } else if (dist === 'almost') {
    for (var i = 1; i <= size; i++) {
      arr.push(i);
    }
    // Perform swaps in about 10% of elements to make it "almost sorted"
    var swapsCount = Math.max(1, Math.floor(size * 0.05));
    for (var s = 0; s < swapsCount; s++) {
      var i1 = Math.floor(Math.random() * size);
      var i2 = Math.floor(Math.random() * size);
      var temp = arr[i1];
      arr[i1] = arr[i2];
      arr[i2] = temp;
    }
  } else {
    // Default is random
    arr = randomArray(size);
  }
  return arr;
}

/** Fill the sort input with n numbers generated according to current distribution */
function fillSort(n) {
  var arr = generateArrayWithDistribution(n, currentSortDistribution);
  document.getElementById("sort-input").value = arr.join(", ");
}

/** Fill the set input with n numbers (with intentional duplicates) */
function fillSet(n) {
  var half = Math.ceil(n / 2);
  var base = randomArray(half, Math.ceil(half / 2));
  var arr = [];
  var i = 0;
  while (arr.length < n) {
    arr.push(base[i % base.length]);
    i++;
  }
  // Shuffle
  for (var j = arr.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var temp = arr[j];
    arr[j] = arr[k];
    arr[k] = temp;
  }
  document.getElementById("set-input").value = arr.join(", ");
}


/* ─────────────────────────────────────────────────────────
   Chart instances (kept to destroy & recreate on each run)
───────────────────────────────────────────────────────── */
var sortChartInstance = null;
var setChartInstance  = null;

function renderSortChart(bubbleMs, mergeMs) {
  var container = document.getElementById("sort-chart-container");
  container.classList.remove("hidden");

  if (sortChartInstance) {
    sortChartInstance.destroy();
    sortChartInstance = null;
  }

  var ctx = document.getElementById("sort-chart").getContext("2d");
  sortChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Bubble Sort (O(n²))", "Merge Sort (O(n log n))"],
      datasets: [{
        label: "Time (ms)",
        data: [bubbleMs, mergeMs],
        backgroundColor: ["rgba(248,113,113,0.65)", "rgba(52,211,153,0.65)"],
        borderColor:     ["rgba(248,113,113,1)",    "rgba(52,211,153,1)"],
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) { return " " + ctx.parsed.y.toFixed(4) + " ms"; }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#8b93a9" },
          grid:  { color: "rgba(255,255,255,0.05)" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#8b93a9" },
          grid:  { color: "rgba(255,255,255,0.05)" }
        }
      }
    }
  });
}

function renderSetChart(listMs, setMs) {
  var container = document.getElementById("set-chart-container");
  container.classList.remove("hidden");

  if (setChartInstance) {
    setChartInstance.destroy();
    setChartInstance = null;
  }

  var ctx = document.getElementById("set-chart").getContext("2d");
  setChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["List Membership (O(n))", "Set Membership (O(1))"],
      datasets: [{
        label: "Time (ms)",
        data: [listMs, setMs],
        backgroundColor: ["rgba(251,146,60,0.65)", "rgba(129,140,248,0.65)"],
        borderColor:     ["rgba(251,146,60,1)",    "rgba(129,140,248,1)"],
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) { return " " + ctx.parsed.y.toFixed(4) + " ms"; }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#8b93a9" },
          grid:  { color: "rgba(255,255,255,0.05)" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#8b93a9" },
          grid:  { color: "rgba(255,255,255,0.05)" }
        }
      }
    }
  });
}


/* ─────────────────────────────────────────────────────────
   MODULE 1 — Sorting Comparison
───────────────────────────────────────────────────────── */

function runSort() {
  hideError("sort-error");
  var raw = document.getElementById("sort-input").value;
  var numbers = parseNumbers(raw);

  if (numbers.length < 2) {
    showError("sort-error", "Please enter at least 2 numbers (or use a Quick Fill button).");
    return;
  }
  if (numbers.length > 10000) {
    showError("sort-error", "Maximum 10,000 numbers allowed.");
    return;
  }

  setLoading("sort-btn-text", "sort-btn-loader", "sort-run-btn", true);
  document.getElementById("sort-results").classList.add("hidden");
  document.getElementById("sort-chart-container").classList.add("hidden");

  fetch(API_BASE + "/api/sort", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numbers: numbers })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    setLoading("sort-btn-text", "sort-btn-loader", "sort-run-btn", false);

    if (data.error) {
      showError("sort-error", data.error);
      return;
    }

    var b = data.bubble_sort;
    var m = data.merge_sort;

    // ── Bubble Sort metrics ───────────────────────────
    document.getElementById("sort-bubble-metrics").innerHTML =
      metricRow("Elapsed Time",  formatTime(b.elapsed_seconds)) +
      metricRow("Time (ms)",     b.elapsed_ms + " ms") +
      metricRow("Comparisons",   b.comparisons.toLocaleString()) +
      metricRow("Swaps",         b.swaps.toLocaleString()) +
      metricRow("Best Case",     b.best_case) +
      metricRow("Worst Case",    b.worst_case) +
      metricRow("Input Size",    data.input_size.toLocaleString());

    // ── Merge Sort metrics ────────────────────────────
    document.getElementById("sort-merge-metrics").innerHTML =
      metricRow("Elapsed Time",  formatTime(m.elapsed_seconds)) +
      metricRow("Time (ms)",     m.elapsed_ms + " ms") +
      metricRow("Comparisons",   m.comparisons.toLocaleString()) +
      metricRow("Swaps",         m.swaps) +
      metricRow("Best Case",     m.best_case) +
      metricRow("Worst Case",    m.worst_case) +
      metricRow("Input Size",    data.input_size.toLocaleString());

    // ── Winner card ───────────────────────────────────
    document.getElementById("sort-winner-name").textContent = data.winner;
    document.getElementById("sort-speedup").textContent     = data.speedup + "×";

    // ── Show results ──────────────────────────────────
    document.getElementById("sort-results").classList.remove("hidden");

    // ── Chart ─────────────────────────────────────────
    renderSortChart(b.elapsed_ms, m.elapsed_ms);
  })
  .catch(function(err) {
    setLoading("sort-btn-text", "sort-btn-loader", "sort-run-btn", false);
    showError("sort-error", "Could not connect to the Flask server. Make sure app.py is running on port 5000.");
    console.error(err);
  });
}


/* ─────────────────────────────────────────────────────────
   MODULE 2 — List vs Set Membership
───────────────────────────────────────────────────────── */

function runSet() {
  hideError("set-error");
  var raw     = document.getElementById("set-input").value;
  var rawTgt  = document.getElementById("set-target-input").value;
  var numbers = parseNumbers(raw);
  var targets = parseNumbers(rawTgt);

  if (numbers.length < 2) {
    showError("set-error", "Please enter at least 2 numbers (or use a Quick Fill button).");
    return;
  }

  setLoading("set-btn-text", "set-btn-loader", "set-run-btn", true);
  document.getElementById("set-results").classList.add("hidden");
  document.getElementById("set-chart-container").classList.add("hidden");

  var payload = { numbers: numbers };
  if (targets.length > 0) { payload.search_targets = targets; }

  fetch(API_BASE + "/api/membership", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    setLoading("set-btn-text", "set-btn-loader", "set-run-btn", false);

    if (data.error) {
      showError("set-error", data.error);
      return;
    }

    var l = data.list_membership;
    var s = data.set_membership;

    // ── List metrics ──────────────────────────────────
    document.getElementById("set-list-metrics").innerHTML =
      metricRow("Elapsed Time",      formatTime(l.elapsed_seconds)) +
      metricRow("Time (ms)",         l.elapsed_ms + " ms") +
      metricRow("Items Found",       l.found) +
      metricRow("Lookup Strategy",   l.description) +
      metricRow("Input Size",        data.input_size.toLocaleString()) +
      metricRow("Unique Elements",   data.unique_elements.toLocaleString()) +
      metricRow("Duplicate Elements",data.duplicate_elements.toLocaleString()) +
      metricRow("Targets Searched",  data.targets_searched);

    // ── Set metrics ───────────────────────────────────
    document.getElementById("set-set-metrics").innerHTML =
      metricRow("Elapsed Time",      formatTime(s.elapsed_seconds)) +
      metricRow("Time (ms)",         s.elapsed_ms + " ms") +
      metricRow("Items Found",       s.found) +
      metricRow("Lookup Strategy",   s.description) +
      metricRow("Input Size",        data.input_size.toLocaleString()) +
      metricRow("Unique Elements",   data.unique_elements.toLocaleString()) +
      metricRow("Duplicate Elements",data.duplicate_elements.toLocaleString()) +
      metricRow("Targets Searched",  data.targets_searched);

    // ── Winner card ───────────────────────────────────
    document.getElementById("set-winner-name").textContent = data.winner;
    document.getElementById("set-speedup").textContent     = data.speedup + "×";

    // ── Show results ──────────────────────────────────
    document.getElementById("set-results").classList.remove("hidden");

    // ── Chart ─────────────────────────────────────────
    renderSetChart(l.elapsed_ms, s.elapsed_ms);
  })
  .catch(function(err) {
    setLoading("set-btn-text", "set-btn-loader", "set-run-btn", false);
    showError("set-error", "Could not connect to the Flask server. Make sure app.py is running on port 5000.");
    console.error(err);
  });
}
