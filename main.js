/*
 * Algorithm Time Complexity Visualizer
 * main.js — talks to Flask backend at http://127.0.0.1:5000
 */

const API_BASE = 'http://127.0.0.1:5000';

/* ─────────────────────────────────────────────────────────────────
   Utility functions
───────────────────────────────────────────────────────────────── */

/**
 * Format a time value (in ms) into a human-readable string.
 * Automatically scales to ns, µs, or ms.
 */
function formatTime(ms) {
  if (ms === 0)    return '0 ms';
  if (ms < 0.001)  return (ms * 1e6).toFixed(2) + ' ns';
  if (ms < 1)      return (ms * 1e3).toFixed(2) + ' µs';
  return ms.toFixed(4) + ' ms';
}

/** Format a number with thousand-separator commas. */
function formatNum(n) {
  return Number(n).toLocaleString();
}

/** Generate n random integers in [1, max]. */
function randomInts(n, max) {
  max = max || 1000;
  var out = [];
  for (var i = 0; i < n; i++) {
    out.push(Math.floor(Math.random() * max) + 1);
  }
  return out;
}

/** Toggle loader visibility and button disabled state. */
function setLoading(section, isLoading) {
  var loader = document.getElementById(section + 'Loader');
  var btn    = document.getElementById(section + 'Btn');
  if (isLoading) {
    loader.classList.remove('hidden');
    btn.disabled = true;
  } else {
    loader.classList.add('hidden');
    btn.disabled = false;
  }
}

/** Build an error banner and inject it into the result container. */
function showError(containerId, message) {
  var el = document.getElementById(containerId);
  el.innerHTML = '<div class="error-banner">' +
    '<strong>⚠ Error —</strong> ' + message +
    '</div>';
  el.classList.remove('hidden');
}

/* ─────────────────────────────────────────────────────────────────
   Quick-fill helpers (called by HTML onclick)
───────────────────────────────────────────────────────────────── */

function fillSort(n) {
  var arr = randomInts(n, 9999);
  document.getElementById('sortInput').value = arr.join(', ');
}

function fillSet(n) {
  // Build array with many duplicates by repeating a smaller base set.
  var baseSize = Math.max(10, Math.ceil(n / 4));
  var base     = randomInts(baseSize, baseSize);
  var arr      = [];
  var bi       = 0;
  while (arr.length < n) {
    arr.push(base[bi % base.length]);
    bi++;
  }
  document.getElementById('listInput').value  = arr.join(', ');
  // Put the target near the end so the list search has to do the most work
  document.getElementById('targetInput').value = arr[Math.floor(n * 0.88)];
}

/* ─────────────────────────────────────────────────────────────────
   Section 1 — Bubble Sort vs Merge Sort
───────────────────────────────────────────────────────────────── */

/**
 * Build the result HTML for the sorting benchmark.
 * Using string concatenation (no nested template literals) to avoid syntax bugs.
 */
function buildSortHTML(d) {
  var bubbleFaster = d.bubble.time_ms < d.merge.time_ms;
  var winner       = bubbleFaster ? 'Bubble Sort' : 'Merge Sort';
  var slower       = Math.max(d.bubble.time_ms, d.merge.time_ms);
  var faster       = Math.min(d.bubble.time_ms, d.merge.time_ms);
  var speedup      = faster > 0 ? (slower / faster).toFixed(1) : 'N/A';

  var bubbleWinTag = bubbleFaster
    ? ' <span class="winner-tag">✓ Faster</span>'
    : '';
  var mergeWinTag  = !bubbleFaster
    ? ' <span class="winner-tag">✓ Faster</span>'
    : '';

  var note = d.n >= 200
    ? 'Merge Sort\'s O(n log n) advantage grows significantly with larger input.'
    : 'Try larger inputs (500+) to see the O(n\u00b2) vs O(n log n) gap widen.';

  // Bubble Sort card
  var bubbleCard =
    '<div class="result-card card-cyan">' +
      '<div class="card-title">' +
        '<h3>Bubble Sort</h3>' + bubbleWinTag +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Time Complexity</span>' +
        '<span class="metric-value val-cyan">O(n\u00b2)</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Elapsed Time</span>' +
        '<span class="metric-value val-cyan">' + formatTime(d.bubble.time_ms) + '</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Comparisons</span>' +
        '<span class="metric-value val-white">' + formatNum(d.bubble.comparisons) + '</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Swaps</span>' +
        '<span class="metric-value val-white">' + formatNum(d.bubble.swaps) + '</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Best / Worst Case</span>' +
        '<span class="metric-value val-white">O(n) &nbsp;/&nbsp; O(n\u00b2)</span>' +
      '</div>' +
    '</div>';

  // Merge Sort card
  var mergeCard =
    '<div class="result-card card-purple">' +
      '<div class="card-title">' +
        '<h3>Merge Sort</h3>' + mergeWinTag +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Time Complexity</span>' +
        '<span class="metric-value val-purple">O(n log n)</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Elapsed Time</span>' +
        '<span class="metric-value val-purple">' + formatTime(d.merge.time_ms) + '</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Comparisons</span>' +
        '<span class="metric-value val-white">' + formatNum(d.merge.comparisons) + '</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Swaps</span>' +
        '<span class="metric-value val-white">\u2014 (merge-based)</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Best / Worst Case</span>' +
        '<span class="metric-value val-white">O(n log n) &nbsp;/&nbsp; O(n log n)</span>' +
      '</div>' +
    '</div>';

  // Summary bar
  var summary =
    '<div class="summary-bar">' +
      '\uD83D\uDCCA &nbsp; Input size: <strong>n = ' + formatNum(d.n) + '</strong>' +
      ' &nbsp;|&nbsp; ' +
      '<strong>' + winner + '</strong> was <span class="highlight">' + speedup + '\u00d7 faster</span> on this input.' +
      '<br/>' +
      '<span style="font-size:0.82rem">' + note + '</span>' +
    '</div>';

  return bubbleCard + mergeCard + summary;
}

async function runSort() {
  var raw = document.getElementById('sortInput').value.trim();
  if (!raw) {
    alert('Please enter a comma-separated sequence of numbers.');
    return;
  }

  var parts = raw.split(',');
  var arr   = [];
  for (var i = 0; i < parts.length; i++) {
    var n = Number(parts[i].trim());
    if (!isNaN(n)) arr.push(n);
  }
  if (arr.length < 2) {
    alert('Please enter at least 2 valid numbers.');
    return;
  }

  var resultEl = document.getElementById('sortResult');
  resultEl.classList.add('hidden');
  setLoading('sort', true);

  try {
    var response = await fetch(API_BASE + '/sort', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ array: arr })
    });

    if (!response.ok) {
      throw new Error('Server responded with status ' + response.status);
    }

    var data = await response.json();
    resultEl.innerHTML = buildSortHTML(data);
    resultEl.classList.remove('hidden');

  } catch (err) {
    showError('sortResult',
      'Could not connect to the Flask server. ' +
      'Make sure <code>app.py</code> is running on port 5000.<br/>' +
      '<small style="opacity:0.7">' + err.message + '</small>'
    );
  } finally {
    setLoading('sort', false);
  }
}

/* ─────────────────────────────────────────────────────────────────
   Section 2 — List Linear Search vs Set Hash Lookup
───────────────────────────────────────────────────────────────── */

/**
 * Build the result HTML for the list vs set benchmark.
 */
function buildSetHTML(d) {
  var setFaster = d.set.time_ms < d.list.time_ms;
  var slower    = Math.max(d.list.time_ms, d.set.time_ms);
  var faster    = Math.min(d.list.time_ms, d.set.time_ms);
  var speedup   = faster > 0 ? (slower / faster).toFixed(1) : 'N/A';

  var listWinTag = !setFaster
    ? ' <span class="winner-tag">✓ Faster</span>'
    : '';
  var setWinTag  = setFaster
    ? ' <span class="winner-tag">✓ Faster</span>'
    : '';

  var foundLabel = d.found ? 'Found' : 'Not Found';
  var foundClass = d.found ? 'val-found' : 'val-notfound';
  var foundIcon  = d.found ? '\u2713' : '\u2717';

  var listStepsNote = d.list.steps + ' out of ' + formatNum(d.n) + ' elements checked';

  // List card
  var listCard =
    '<div class="result-card card-orange">' +
      '<div class="card-title">' +
        '<h3>List Search</h3>' + listWinTag +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Time Complexity</span>' +
        '<span class="metric-value val-orange">O(n)</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Elapsed Time</span>' +
        '<span class="metric-value val-orange">' + formatTime(d.list.time_ms) + '</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Steps Taken</span>' +
        '<span class="metric-value val-white">' + formatNum(d.list.steps) + '</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Elements Scanned</span>' +
        '<span class="metric-value val-white" style="font-size:0.78rem">' + listStepsNote + '</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Result</span>' +
        '<span class="metric-value ' + foundClass + '">' + foundIcon + ' ' + foundLabel + '</span>' +
      '</div>' +
    '</div>';

  // Set card
  var setCard =
    '<div class="result-card card-green">' +
      '<div class="card-title">' +
        '<h3>Set Lookup</h3>' + setWinTag +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Time Complexity</span>' +
        '<span class="metric-value val-green">O(1)</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Elapsed Time</span>' +
        '<span class="metric-value val-green">' + formatTime(d.set.time_ms) + '</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Steps Taken</span>' +
        '<span class="metric-value val-white">1 (hash lookup)</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Elements Scanned</span>' +
        '<span class="metric-value val-white">1 regardless of n</span>' +
      '</div>' +
      '<div class="metric">' +
        '<span class="metric-label">Result</span>' +
        '<span class="metric-value ' + foundClass + '">' + foundIcon + ' ' + foundLabel + '</span>' +
      '</div>' +
    '</div>';

  // Summary bar
  var summary =
    '<div class="summary-bar">' +
      '\uD83D\uDCCA &nbsp; Array size: <strong>n = ' + formatNum(d.n) + '</strong>' +
      ' &nbsp;|&nbsp; Target: <strong>' + d.target + '</strong>' +
      ' &nbsp;|&nbsp; ' +
      'Set lookup was <span class="highlight">' + speedup + '\u00d7 faster</span> \u2014 ' +
      'O(1) constant time vs O(n) linear scan.' +
      '<br/>' +
      '<span style="font-size:0.82rem">' +
        'Sets use a hash table internally, so membership checks do not depend on array size.' +
      '</span>' +
    '</div>';

  return listCard + setCard + summary;
}

async function runSet() {
  var raw    = document.getElementById('listInput').value.trim();
  var target = document.getElementById('targetInput').value.trim();

  if (!raw) {
    alert('Please enter a comma-separated sequence of numbers.');
    return;
  }
  if (target === '') {
    alert('Please enter a search target number.');
    return;
  }

  var parts = raw.split(',');
  var arr   = [];
  for (var i = 0; i < parts.length; i++) {
    var n = Number(parts[i].trim());
    if (!isNaN(n)) arr.push(n);
  }
  if (arr.length < 2) {
    alert('Please enter at least 2 valid numbers.');
    return;
  }

  var resultEl = document.getElementById('setResult');
  resultEl.classList.add('hidden');
  setLoading('set', true);

  try {
    var response = await fetch(API_BASE + '/set', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ array: arr, target: Number(target) })
    });

    if (!response.ok) {
      throw new Error('Server responded with status ' + response.status);
    }

    var data = await response.json();
    resultEl.innerHTML = buildSetHTML(data);
    resultEl.classList.remove('hidden');

  } catch (err) {
    showError('setResult',
      'Could not connect to the Flask server. ' +
      'Make sure <code>app.py</code> is running on port 5000.<br/>' +
      '<small style="opacity:0.7">' + err.message + '</small>'
    );
  } finally {
    setLoading('set', false);
  }
}