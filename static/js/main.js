/*
 * Algorithm Complexity Visualizer — main.js
 * Calls Flask backend at http://127.0.0.1:5000
 * Modules: Sorting (Bubble vs Merge) with Live DOM Visualization | Membership (List vs Set)
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

var visPaused = false;
var currentNumbersToVis = [];

/** A helper promise delay function supporting pause and stop checks */
async function sleep(ms) {
  await new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
  while (visPaused && !visStopRequested) {
    await new Promise(function(resolve) {
      setTimeout(resolve, 50);
    });
  }
}

/** Update visualizer animation delay dynamically */
function updateVisDelay(val) {
  visDelayMs = parseInt(val) || 150;
  var display = document.getElementById("vis-delay-val");
  if (display) {
    display.textContent = val + "ms";
  }
}

/** Toggle play/pause state for visualizer */
async function toggleVisPlayback() {
  var playBtnText = document.getElementById("vis-play-text");
  var playBtnIcon = document.getElementById("vis-play-icon");

  if (!visPlaying) {
    var raw = document.getElementById("sort-input").value;
    var numbers = parseNumbers(raw);

    if (numbers.length < 2 || numbers.length > 50) {
      showError("sort-error", "Please enter between 2 and 50 numbers to run the live visualizer.");
      return;
    }

    visPlaying = true;
    visPaused = false;
    visStopRequested = false;
    currentNumbersToVis = numbers.slice();

    if (playBtnText) playBtnText.textContent = "Pause";
    if (playBtnIcon) playBtnIcon.textContent = "⏸";

    drawVisualizerBars(numbers);

    try {
      await Promise.all([
        visualizeBubbleSort(numbers),
        visualizeMergeSort(numbers)
      ]);
    } catch(e) {
      console.error(e);
    }

    // Reset buttons when animation finished
    visPlaying = false;
    visPaused = false;
    if (playBtnText) playBtnText.textContent = "Play Visualizer";
    if (playBtnIcon) playBtnIcon.textContent = "▶";
  } else {
    // Toggle pause flag
    visPaused = !visPaused;
    if (visPaused) {
      if (playBtnText) playBtnText.textContent = "Resume";
      if (playBtnIcon) playBtnIcon.textContent = "▶";
    } else {
      if (playBtnText) playBtnText.textContent = "Pause";
      if (playBtnIcon) playBtnIcon.textContent = "⏸";
    }
  }
}

/** Reset the live visualizer to its initial state */
function resetVisPlayback() {
  visStopRequested = true;
  visPaused = false;
  setTimeout(function() {
    visStopRequested = false;
    visPlaying = false;

    var playBtnText = document.getElementById("vis-play-text");
    var playBtnIcon = document.getElementById("vis-play-icon");
    if (playBtnText) playBtnText.textContent = "Play Visualizer";
    if (playBtnIcon) playBtnIcon.textContent = "▶";

    var raw = document.getElementById("sort-input").value;
    var numbers = parseNumbers(raw);
    if (numbers.length >= 2 && numbers.length <= 50) {
      drawVisualizerBars(numbers);
    }

    var bubbleStats = document.getElementById("bubble-vis-stats");
    var mergeStats = document.getElementById("merge-vis-stats");
    if (bubbleStats) bubbleStats.textContent = "Comparisons: 0 | Swaps: 0";
    if (mergeStats) mergeStats.textContent = "Comparisons: 0 | Writes: 0";
  }, 100);
}

/** Step-by-step Bubble Sort visualizer with highlight animations */
async function visualizeBubbleSort(arr) {
  var a = arr.slice();
  var n = a.length;
  var comparisons = 0;
  var swaps = 0;
  var statsEl = document.getElementById("bubble-vis-stats");

  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n - i - 1; j++) {
      if (visStopRequested) return;

      var bar1 = document.getElementById("bubble-bar-" + j);
      var bar2 = document.getElementById("bubble-bar-" + (j + 1));

      if (bar1 && bar2) {
        bar1.classList.add("comparing");
        bar2.classList.add("comparing");
      }

      comparisons++;
      if (statsEl) {
        statsEl.textContent = "Comparisons: " + comparisons + " | Swaps: " + swaps;
      }

      await sleep(visDelayMs);
      if (visStopRequested) return;

      if (a[j] > a[j + 1]) {
        if (bar1 && bar2) {
          bar1.classList.remove("comparing");
          bar2.classList.remove("comparing");
          bar1.classList.add("swapping");
          bar2.classList.add("swapping");
        }

        // Swap state in array
        var temp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = temp;

        // Swap heights/titles in DOM
        if (bar1 && bar2) {
          var h1 = bar1.style.height;
          var h2 = bar2.style.height;
          bar1.style.height = h2;
          bar2.style.height = h1;

          var t1 = bar1.getAttribute("title");
          var t2 = bar2.getAttribute("title");
          bar1.setAttribute("title", t2);
          bar2.setAttribute("title", t1);
        }

        swaps++;
        if (statsEl) {
          statsEl.textContent = "Comparisons: " + comparisons + " | Swaps: " + swaps;
        }

        await sleep(visDelayMs);
        if (visStopRequested) return;
      }

      if (bar1 && bar2) {
        bar1.classList.remove("comparing", "swapping");
        bar2.classList.remove("comparing", "swapping");
      }
    }

    // Mark tail element as sorted
    var sortedBar = document.getElementById("bubble-bar-" + (n - i - 1));
    if (sortedBar) {
      sortedBar.classList.add("sorted");
    }
  }

  // Highlight all bars as fully sorted
  for (var i = 0; i < n; i++) {
    var bar = document.getElementById("bubble-bar-" + i);
    if (bar) {
      bar.classList.add("sorted");
    }
  }
}

/** Step-by-step Merge Sort visualizer with recursion and merge highlight animations */
async function visualizeMergeSort(arr) {
  var a = arr.slice();
  var n = a.length;
  var comparisons = 0;
  var writes = 0;
  var statsEl = document.getElementById("merge-vis-stats");

  var max = Math.max.apply(null, arr);
  var min = Math.min.apply(null, arr);
  var range = (max - min) || 1;

  async function merge(start, mid, end) {
    var left = a.slice(start, mid + 1);
    var right = a.slice(mid + 1, end + 1);
    var i = 0, j = 0, k = start;

    while (i < left.length && j < right.length) {
      if (visStopRequested) return;

      var barLeft = document.getElementById("merge-bar-" + (start + i));
      var barRight = document.getElementById("merge-bar-" + (mid + 1 + j));

      if (barLeft && barRight) {
        barLeft.classList.add("comparing");
        barRight.classList.add("comparing");
      }

      comparisons++;
      if (statsEl) {
        statsEl.textContent = "Comparisons: " + comparisons + " | Writes: " + writes;
      }

      await sleep(visDelayMs);
      if (visStopRequested) return;

      if (barLeft && barRight) {
        barLeft.classList.remove("comparing");
        barRight.classList.remove("comparing");
      }

      if (left[i] <= right[j]) {
        a[k] = left[i];
        i++;
      } else {
        a[k] = right[j];
        j++;
      }

      var barK = document.getElementById("merge-bar-" + k);
      if (barK) {
        barK.classList.add("swapping");
        var val = a[k];
        var heightPercent = 10 + ((val - min) / range) * 85;
        barK.style.height = heightPercent + "%";
        barK.setAttribute("title", val);
      }

      writes++;
      if (statsEl) {
        statsEl.textContent = "Comparisons: " + comparisons + " | Writes: " + writes;
      }

      await sleep(visDelayMs);
      if (visStopRequested) return;

      if (barK) {
        barK.classList.remove("swapping");
      }

      k++;
    }

    while (i < left.length) {
      if (visStopRequested) return;
      a[k] = left[i];

      var barK = document.getElementById("merge-bar-" + k);
      if (barK) {
        barK.classList.add("swapping");
        var val = a[k];
        var heightPercent = 10 + ((val - min) / range) * 85;
        barK.style.height = heightPercent + "%";
        barK.setAttribute("title", val);
      }

      writes++;
      if (statsEl) {
        statsEl.textContent = "Comparisons: " + comparisons + " | Writes: " + writes;
      }

      await sleep(visDelayMs);
      if (visStopRequested) return;

      if (barK) {
        barK.classList.remove("swapping");
      }

      i++;
      k++;
    }

    while (j < right.length) {
      if (visStopRequested) return;
      a[k] = right[j];

      var barK = document.getElementById("merge-bar-" + k);
      if (barK) {
        barK.classList.add("swapping");
        var val = a[k];
        var heightPercent = 10 + ((val - min) / range) * 85;
        barK.style.height = heightPercent + "%";
        barK.setAttribute("title", val);
      }

      writes++;
      if (statsEl) {
        statsEl.textContent = "Comparisons: " + comparisons + " | Writes: " + writes;
      }

      await sleep(visDelayMs);
      if (visStopRequested) return;

      if (barK) {
        barK.classList.remove("swapping");
      }

      j++;
      k++;
    }

    // Temporarily highlight merged portion as sorted
    for (var m = start; m <= end; m++) {
      var barM = document.getElementById("merge-bar-" + m);
      if (barM) {
        barM.classList.add("sorted");
      }
    }

    await sleep(visDelayMs);
    if (visStopRequested) return;

    for (var m = start; m <= end; m++) {
      var barM = document.getElementById("merge-bar-" + m);
      if (barM && end < n - 1) {
        barM.classList.remove("sorted");
      }
    }
  }

  async function mergeSortHelper(start, end) {
    if (start >= end) return;
    var mid = Math.floor((start + end) / 2);
    await mergeSortHelper(start, mid);
    if (visStopRequested) return;
    await mergeSortHelper(mid + 1, end);
    if (visStopRequested) return;
    await merge(start, mid, end);
  }

  await mergeSortHelper(0, n - 1);

  if (!visStopRequested) {
    for (var i = 0; i < n; i++) {
      var bar = document.getElementById("merge-bar-" + i);
      if (bar) {
        bar.classList.add("sorted");
      }
    }
  }
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

var sortHistoryData = [];
var setHistoryData = [];
var sortHistoryChartInstance = null;
var setHistoryChartInstance = null;

function clearSortHistory() {
  sortHistoryData = [];
  if (sortHistoryChartInstance) {
    sortHistoryChartInstance.destroy();
    sortHistoryChartInstance = null;
  }
  var container = document.getElementById("sort-history-container");
  if (container) {
    container.classList.add("hidden");
  }
}

function clearSetHistory() {
  setHistoryData = [];
  if (setHistoryChartInstance) {
    setHistoryChartInstance.destroy();
    setHistoryChartInstance = null;
  }
  var container = document.getElementById("set-history-container");
  if (container) {
    container.classList.add("hidden");
  }
}

var sortChartLogScale = false;
var lastBubbleMs = 0;
var lastMergeMs = 0;

function toggleSortLogScale() {
  var chk = document.getElementById("sort-log-scale-chk");
  if (chk) {
    sortChartLogScale = chk.checked;
  }
  renderSortChart();
}

function renderSortChart(bubbleMs, mergeMs) {
  var container = document.getElementById("sort-chart-container");
  if (!container) return;
  container.classList.remove("hidden");

  if (bubbleMs !== undefined) lastBubbleMs = bubbleMs;
  if (mergeMs !== undefined) lastMergeMs = mergeMs;

  var bMs = lastBubbleMs;
  var mMs = lastMergeMs;

  if (sortChartInstance) {
    sortChartInstance.destroy();
    sortChartInstance = null;
  }

  var ctx = document.getElementById("sort-chart");
  if (!ctx) return;
  var ctx2d = ctx.getContext("2d");

  var yScales = {};
  var chartData = [];
  if (sortChartLogScale) {
    var displayBubble = Math.max(0.0001, bMs);
    var displayMerge = Math.max(0.0001, mMs);
    yScales = {
      type: "logarithmic",
      ticks: {
        color: "#8b93a9",
        callback: function(value) {
          return value.toLocaleString() + " ms";
        }
      },
      grid: { color: "rgba(255,255,255,0.05)" }
    };
    chartData = [displayBubble, displayMerge];
  } else {
    yScales = {
      type: "linear",
      beginAtZero: true,
      ticks: { color: "#8b93a9" },
      grid: { color: "rgba(255,255,255,0.05)" }
    };
    chartData = [bMs, mMs];
  }

  sortChartInstance = new Chart(ctx2d, {
    type: "bar",
    data: {
      labels: ["Bubble Sort (O(n²))", "Merge Sort (O(n log n))"],
      datasets: [{
        label: "Time (ms)",
        data: chartData,
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
            label: function(context) { 
              var originalVal = context.dataIndex === 0 ? bMs : mMs;
              return " " + originalVal.toFixed(4) + " ms"; 
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#8b93a9" },
          grid:  { color: "rgba(255,255,255,0.05)" }
        },
        y: yScales
      }
    }
  });
}

var setChartLogScale = false;
var lastListMs = 0;
var lastSetMs = 0;

function toggleSetLogScale() {
  var chk = document.getElementById("set-log-scale-chk");
  if (chk) {
    setChartLogScale = chk.checked;
  }
  renderSetChart();
}

function renderSetChart(listMs, setMs) {
  var container = document.getElementById("set-chart-container");
  if (!container) return;
  container.classList.remove("hidden");

  if (listMs !== undefined) lastListMs = listMs;
  if (setMs !== undefined) lastSetMs = setMs;

  var lMs = lastListMs;
  var sMs = lastSetMs;

  if (setChartInstance) {
    setChartInstance.destroy();
    setChartInstance = null;
  }

  var ctx = document.getElementById("set-chart");
  if (!ctx) return;
  var ctx2d = ctx.getContext("2d");

  var yScales = {};
  var chartData = [];
  if (setChartLogScale) {
    var displayList = Math.max(0.0001, lMs);
    var displaySet = Math.max(0.0001, sMs);
    yScales = {
      type: "logarithmic",
      ticks: {
        color: "#8b93a9",
        callback: function(value) {
          return value.toLocaleString() + " ms";
        }
      },
      grid: { color: "rgba(255,255,255,0.05)" }
    };
    chartData = [displayList, displaySet];
  } else {
    yScales = {
      type: "linear",
      beginAtZero: true,
      ticks: { color: "#8b93a9" },
      grid: { color: "rgba(255,255,255,0.05)" }
    };
    chartData = [lMs, sMs];
  }

  setChartInstance = new Chart(ctx2d, {
    type: "bar",
    data: {
      labels: ["List Membership (O(n))", "Set Membership (O(1))"],
      datasets: [{
        label: "Time (ms)",
        data: chartData,
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
            label: function(context) { 
              var originalVal = context.dataIndex === 0 ? lMs : sMs;
              return " " + originalVal.toFixed(4) + " ms"; 
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#8b93a9" },
          grid:  { color: "rgba(255,255,255,0.05)" }
        },
        y: yScales
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

  // Auto-run or clear live visualizer based on input size
  if (numbers.length >= 2 && numbers.length <= 50) {
    checkAndToggleVisualizer(numbers);
    resetVisPlayback();
    setTimeout(function() {
      toggleVisPlayback();
    }, 200);
  } else {
    var panel = document.getElementById("live-visualizer");
    if (panel) {
      panel.classList.remove("active");
    }
    visStopRequested = true;
    visPlaying = false;
    visPaused = false;
  }

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

    // ── History Tracking ──────────────────────────────
    var inputSize = data.input_size;
    var existingIdx = sortHistoryData.findIndex(function(d) { return d.size === inputSize; });
    if (existingIdx !== -1) {
      sortHistoryData[existingIdx] = { size: inputSize, bubbleMs: b.elapsed_ms, mergeMs: m.elapsed_ms };
    } else {
      sortHistoryData.push({ size: inputSize, bubbleMs: b.elapsed_ms, mergeMs: m.elapsed_ms });
    }
    sortHistoryData.sort(function(x, y) { return x.size - y.size; });

    if (typeof renderSortHistoryChart === "function") {
      renderSortHistoryChart();
    }
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

  // Auto-run or clear live visualizer based on input size
  if (numbers.length >= 2 && numbers.length <= 30) {
    var target = targets.length > 0 ? targets[0] : null;
    checkAndToggleMemVisualizer(numbers, target);
    resetMemVisPlayback();
    setTimeout(function() {
      toggleMemVisPlayback();
    }, 200);
  } else {
    var panel = document.getElementById("live-membership-visualizer");
    if (panel) {
      panel.classList.remove("active");
    }
    memVisStopRequested = true;
    memVisPlaying = false;
    memVisPaused = false;
  }

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

    // ── History Tracking ──────────────────────────────
    var inputSize = data.input_size;
    var existingIdx = setHistoryData.findIndex(function(d) { return d.size === inputSize; });
    if (existingIdx !== -1) {
      setHistoryData[existingIdx] = { size: inputSize, listMs: l.elapsed_ms, setMs: s.elapsed_ms };
    } else {
      setHistoryData.push({ size: inputSize, listMs: l.elapsed_ms, setMs: s.elapsed_ms });
    }
    setHistoryData.sort(function(x, y) { return x.size - y.size; });

    if (typeof renderSetHistoryChart === "function") {
      renderSetHistoryChart();
    }
  })
  .catch(function(err) {
    setLoading("set-btn-text", "set-btn-loader", "set-run-btn", false);
    showError("set-error", "Could not connect to the Flask server. Make sure app.py is running on port 5000.");
    console.error(err);
  });
}

/* ─────────────────────────────────────────────────────────
   MODULE 2 — List vs Set Membership Live Visualizer
   ───────────────────────────────────────────────────────── */
var memVisPlaying = false;
var memVisStopRequested = false;
var memVisPaused = false;
var memVisDelayMs = 300;

var memVisListNumbers = [];
var memVisSearchTargets = [];
var memVisCurrentTargetIndex = 0;

/** Draw list nodes and hash buckets dynamically */
function drawMemVisualizer(numbers, target) {
  var listContainer = document.getElementById("list-nodes-container");
  var setContainer  = document.getElementById("set-buckets-container");
  if (!listContainer || !setContainer) return;

  listContainer.innerHTML = "";
  setContainer.innerHTML = "";

  // 1. Draw List nodes
  numbers.forEach(function(val, idx) {
    var node = document.createElement("div");
    node.className = "list-node";
    node.id = "list-node-" + idx;
    node.textContent = val;
    node.setAttribute("title", "Index: " + idx + ", Value: " + val);
    listContainer.appendChild(node);
  });

  // 2. Hash elements into 8 buckets (0 to 7)
  var buckets = [[], [], [], [], [], [], [], []];
  numbers.forEach(function(val) {
    var bIdx = Math.floor(Math.abs(val) % 8);
    buckets[bIdx].push(val);
  });

  // 3. Draw Set buckets
  for (var i = 0; i < 8; i++) {
    var row = document.createElement("div");
    row.className = "bucket-row";
    row.id = "bucket-row-" + i;

    var label = document.createElement("div");
    label.className = "bucket-label";
    label.textContent = "B[" + i + "]:";
    row.appendChild(label);

    var itemsCont = document.createElement("div");
    itemsCont.className = "bucket-items";

    buckets[i].forEach(function(val, idx) {
      var itemNode = document.createElement("div");
      itemNode.className = "list-node";
      itemNode.id = "set-node-" + i + "-" + idx;
      itemNode.textContent = val;
      itemsCont.appendChild(itemNode);
    });

    row.appendChild(itemsCont);
    setContainer.appendChild(row);
  }
  
  // Update stats labels
  var listStats = document.getElementById("list-vis-stats");
  var setStats  = document.getElementById("set-vis-stats");
  var targetStr = (target !== null && target !== undefined) ? target : "-";
  if (listStats) listStats.textContent = "Comparisons: 0 | Target: " + targetStr;
  if (setStats)  setStats.textContent  = "Steps: 0 | Target: " + targetStr;
}

/** Toggles the visibility of the membership visualizer based on array length */
function checkAndToggleMemVisualizer(numbers, target) {
  var panel = document.getElementById("live-membership-visualizer");
  if (!panel) return false;
  
  if (numbers.length >= 2 && numbers.length <= 30) {
    panel.classList.add("active");
    drawMemVisualizer(numbers, target);
    return true;
  } else {
    panel.classList.remove("active");
    return false;
  }
}

/** Update visualizer animation delay dynamically */
function updateMemVisDelay(val) {
  memVisDelayMs = parseInt(val) || 300;
  var display = document.getElementById("mem-vis-delay-val");
  if (display) {
    display.textContent = val + "ms";
  }
}

/** Toggle play/pause state for visualizer */
async function toggleMemVisPlayback() {
  var playBtnText = document.getElementById("mem-vis-play-text");
  var playBtnIcon = document.getElementById("mem-vis-play-icon");

  if (!memVisPlaying) {
    var raw = document.getElementById("set-input").value;
    var numbers = parseNumbers(raw);
    var rawTgt = document.getElementById("set-target-input").value;
    var targets = parseNumbers(rawTgt);

    if (numbers.length < 2 || numbers.length > 30) {
      showError("set-error", "Please enter between 2 and 30 numbers to run the live visualizer.");
      return;
    }

    var target;
    if (targets.length > 0) {
      target = targets[0];
    } else {
      if (Math.random() < 0.7 && numbers.length > 0) {
        target = numbers[Math.floor(Math.random() * numbers.length)];
      } else {
        var minVal = Math.min.apply(null, numbers);
        var maxVal = Math.max.apply(null, numbers);
        target = Math.floor(minVal + Math.random() * (maxVal - minVal + 10)) + 5;
        while (numbers.indexOf(target) !== -1) {
          target += 1;
        }
      }
    }

    memVisPlaying = true;
    memVisPaused = false;
    memVisStopRequested = false;

    if (playBtnText) playBtnText.textContent = "Pause";
    if (playBtnIcon) playBtnIcon.textContent = "⏸";

    drawMemVisualizer(numbers, target);

    try {
      await Promise.all([
        visualizeListSearch(numbers, target),
        visualizeSetSearch(numbers, target)
      ]);
    } catch(e) {
      console.error(e);
    }

    memVisPlaying = false;
    memVisPaused = false;
    if (playBtnText) playBtnText.textContent = "Play Visualizer";
    if (playBtnIcon) playBtnIcon.textContent = "▶";
  } else {
    memVisPaused = !memVisPaused;
    if (memVisPaused) {
      if (playBtnText) playBtnText.textContent = "Resume";
      if (playBtnIcon) playBtnIcon.textContent = "▶";
    } else {
      if (playBtnText) playBtnText.textContent = "Pause";
      if (playBtnIcon) playBtnIcon.textContent = "⏸";
    }
  }
}

/** Reset the live visualizer to its initial state */
function resetMemVisPlayback() {
  memVisStopRequested = true;
  memVisPaused = false;
  setTimeout(function() {
    memVisStopRequested = false;
    memVisPlaying = false;

    var playBtnText = document.getElementById("mem-vis-play-text");
    var playBtnIcon = document.getElementById("mem-vis-play-icon");
    if (playBtnText) playBtnText.textContent = "Play Visualizer";
    if (playBtnIcon) playBtnIcon.textContent = "▶";

    var raw = document.getElementById("set-input").value;
    var numbers = parseNumbers(raw);
    var rawTgt = document.getElementById("set-target-input").value;
    var targets = parseNumbers(rawTgt);
    var target = targets.length > 0 ? targets[0] : null;

    if (numbers.length >= 2 && numbers.length <= 30) {
      drawMemVisualizer(numbers, target);
    }

    var listStats = document.getElementById("list-vis-stats");
    var setStats = document.getElementById("set-vis-stats");
    var targetStr = target !== null ? target : "-";
    if (listStats) listStats.textContent = "Comparisons: 0 | Target: " + targetStr;
    if (setStats)  setStats.textContent  = "Steps: 0 | Target: " + targetStr;
  }, 100);
}

/** A helper promise delay function for membership visualizer */
async function memSleep(ms) {
  await new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
  while (memVisPaused && !memVisStopRequested) {
    await new Promise(function(resolve) {
      setTimeout(resolve, 50);
    });
  }
}

/** Step-by-step sequential search visualizer with highlight animations */
async function visualizeListSearch(numbers, target) {
  var statsEl = document.getElementById("list-vis-stats");
  var comparisons = 0;
  
  for (var i = 0; i < numbers.length; i++) {
    if (memVisStopRequested) return;

    var node = document.getElementById("list-node-" + i);
    if (node) {
      node.classList.add("comparing");
    }

    comparisons++;
    if (statsEl) {
      statsEl.textContent = "Comparisons: " + comparisons + " | Target: " + target;
    }

    await memSleep(memVisDelayMs);
    if (memVisStopRequested) return;

    if (numbers[i] === target) {
      if (node) {
        node.classList.remove("comparing");
        node.classList.add("match");
      }
      if (statsEl) {
        statsEl.textContent = "Comparisons: " + comparisons + " | Target: " + target + " (FOUND!)";
      }
      return;
    } else {
      if (node) {
        node.classList.remove("comparing");
        node.classList.add("mismatch");
      }
    }
  }

  if (statsEl) {
    statsEl.textContent = "Comparisons: " + comparisons + " | Target: " + target + " (NOT FOUND)";
  }
}

/** Step-by-step set lookup (hash table bucket check) visualizer */
async function visualizeSetSearch(numbers, target) {
  var statsEl = document.getElementById("set-vis-stats");
  var steps = 0;

  if (memVisStopRequested) return;

  // Step 1: Calculate hash and highlight the targeted bucket row
  var bIdx = Math.floor(Math.abs(target) % 8);
  var row = document.getElementById("bucket-row-" + bIdx);
  if (row) {
    row.classList.add("hashed");
  }

  steps++;
  if (statsEl) {
    statsEl.textContent = "Steps: " + steps + " | Target: " + target + " (Hashed to B[" + bIdx + "])";
  }

  await memSleep(memVisDelayMs * 1.5); // Give extra time to see the hashing step
  if (memVisStopRequested) return;

  // Step 2: Search elements inside the bucket sequentially
  var buckets = [[], [], [], [], [], [], [], []];
  numbers.forEach(function(val) {
    var h = Math.floor(Math.abs(val) % 8);
    buckets[h].push(val);
  });

  var targetBucketItems = buckets[bIdx];
  var found = false;

  for (var j = 0; j < targetBucketItems.length; j++) {
    if (memVisStopRequested) return;

    var itemNode = document.getElementById("set-node-" + bIdx + "-" + j);
    if (itemNode) {
      itemNode.classList.add("comparing");
    }

    steps++;
    if (statsEl) {
      statsEl.textContent = "Steps: " + steps + " | Target: " + target + " (Checking B[" + bIdx + "] index " + j + ")";
    }

    await memSleep(memVisDelayMs);
    if (memVisStopRequested) return;

    if (targetBucketItems[j] === target) {
      if (itemNode) {
        itemNode.classList.remove("comparing");
        itemNode.classList.add("match");
      }
      found = true;
      if (statsEl) {
        statsEl.textContent = "Steps: " + steps + " | Target: " + target + " (FOUND in B[" + bIdx + "]!)";
      }
      break;
    } else {
      if (itemNode) {
        itemNode.classList.remove("comparing");
        itemNode.classList.add("mismatch");
      }
    }
  }

  if (!found) {
    if (statsEl) {
      statsEl.textContent = "Steps: " + steps + " | Target: " + target + " (NOT FOUND in B[" + bIdx + "])";
    }
  }
}
