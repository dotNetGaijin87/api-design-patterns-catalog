'use strict';

// The entire UI is data-driven from GET /api/_meta. Each pattern declares its
// own demo requests; this script renders them and runs them against the live
// API, showing the request, the response, and any sensible follow-up actions.

let patterns = [];
let active = null;

const $ = (sel, root = document) => root.querySelector(sel);

init();

async function init() {
  try {
    const res = await fetch('/api/_meta');
    patterns = await res.json();
  } catch (err) {
    $('#detail').innerHTML = `<p class="loading">Could not load /api/_meta — is the server running?</p>`;
    return;
  }
  renderSidebar();
  if (patterns.length) select(patterns[0].id);
}

function renderSidebar() {
  const nav = $('#patternList');
  nav.innerHTML = '';
  for (const p of patterns) {
    const btn = document.createElement('button');
    btn.className = 'pattern-item';
    btn.dataset.id = p.id;
    btn.innerHTML = `${escapeHtml(p.title)}<span class="pi-sub">${escapeHtml(p.blurb)}</span>`;
    btn.addEventListener('click', () => select(p.id));
    nav.appendChild(btn);
  }
}

function select(id) {
  active = patterns.find((p) => p.id === id);
  if (!active) return;
  for (const el of document.querySelectorAll('.pattern-item')) {
    el.classList.toggle('active', el.dataset.id === id);
  }
  renderDetail(active);
}

function renderDetail(p) {
  const detail = $('#detail');
  detail.innerHTML = '';
  detail.scrollTop = 0;

  const head = document.createElement('div');
  head.className = 'detail-head';
  head.innerHTML =
    `<h2>${escapeHtml(p.title)}</h2>` +
    `<span class="source">${escapeHtml(p.source)}</span>` +
    `<p class="blurb">${escapeHtml(p.blurb)}</p>`;
  detail.appendChild(head);

  if (p.docs) {
    const docs = document.createElement('div');
    docs.className = 'docs';
    docs.textContent = p.docs;
    detail.appendChild(docs);
  }

  const tryTitle = document.createElement('h3');
  tryTitle.className = 'section-title';
  tryTitle.textContent = 'Try it';
  detail.appendChild(tryTitle);

  const demos = document.createElement('div');
  demos.className = 'demo-buttons';
  for (const demo of p.demos) {
    const btn = document.createElement('button');
    btn.className = 'demo-btn';
    btn.innerHTML = `<span class="method ${demo.method}">${demo.method}</span>${escapeHtml(demo.label)}`;
    btn.addEventListener('click', () => runRequest({ ...demo }));
    demos.appendChild(btn);
  }
  detail.appendChild(demos);

  const consoleHead = document.createElement('div');
  consoleHead.className = 'console-head';
  consoleHead.innerHTML = `<h3 class="section-title" style="margin:0">Request / response console</h3>`;
  const clear = document.createElement('button');
  clear.className = 'clear-btn';
  clear.textContent = 'Clear';
  clear.addEventListener('click', () => resetConsole());
  consoleHead.appendChild(clear);
  detail.appendChild(consoleHead);

  const con = document.createElement('div');
  con.className = 'console';
  con.id = 'console';
  detail.appendChild(con);
  resetConsole();
}

function resetConsole() {
  const con = $('#console');
  if (con) con.innerHTML = `<div class="console-empty">Click a request above to see it run live.</div>`;
}

// --- Run a request and render the exchange -------------------------------

async function runRequest(req) {
  const con = $('#console');
  const empty = con.querySelector('.console-empty');
  if (empty) empty.remove();

  const opts = { method: req.method, headers: { ...(req.headers || {}) } };
  if (req.body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(req.body);
  }

  const started = performance.now();
  let res, bodyText, json = null, networkError = null;
  try {
    res = await fetch(req.path, opts);
    bodyText = await res.text();
    if (bodyText) {
      try { json = JSON.parse(bodyText); } catch { json = null; }
    }
  } catch (err) {
    networkError = err;
  }
  const ms = Math.round(performance.now() - started);

  con.appendChild(renderExchange(req, res, json, bodyText, ms, networkError));
  con.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderExchange(req, res, json, bodyText, ms, networkError) {
  const card = document.createElement('div');
  card.className = 'exchange';

  // Request line
  const reqLine = document.createElement('div');
  reqLine.className = 'req-line';
  reqLine.innerHTML = `<span class="method ${req.method}">${req.method}</span><span class="path">${escapeHtml(req.path)}</span>`;
  card.appendChild(reqLine);

  // Request headers / body (if any)
  if (req.headers || req.body !== undefined) {
    const meta = document.createElement('div');
    meta.className = 'req-meta';
    const bits = [];
    if (req.headers) {
      bits.push(Object.entries(req.headers).map(([k, v]) => `${escapeHtml(k)}: <code>${escapeHtml(String(v))}</code>`).join('&nbsp;&nbsp;'));
    }
    if (req.body !== undefined) {
      bits.push(`body: <code>${escapeHtml(JSON.stringify(req.body))}</code>`);
    }
    meta.innerHTML = bits.join('<br>');
    card.appendChild(meta);
  }

  if (networkError) {
    const resLine = document.createElement('div');
    resLine.className = 'res-line';
    resLine.innerHTML = `<span class="status s0">NETWORK ERROR</span><span class="timing">${escapeHtml(String(networkError.message || networkError))}</span>`;
    card.appendChild(resLine);
    return card;
  }

  // Response status line
  const cls = res.ok ? 's2' : res.status >= 500 ? 's5' : 's4';
  const resLine = document.createElement('div');
  resLine.className = 'res-line';
  let statusHtml = `<span class="status ${cls}">${res.status} ${escapeHtml(res.statusText || '')}</span><span class="timing">${ms} ms</span>`;
  if (res.headers.get('Idempotent-Replayed') === 'true') {
    statusHtml += `<span class="replay-flag">⟳ replayed (deduplicated)</span>`;
  }
  resLine.innerHTML = statusHtml;
  card.appendChild(resLine);

  // Interesting response headers
  const interesting = ['Location', 'Idempotent-Replayed', 'Content-Type'];
  const shown = interesting
    .map((h) => [h, res.headers.get(h)])
    .filter(([, v]) => v);
  if (shown.length) {
    const hdr = document.createElement('div');
    hdr.className = 'res-headers';
    hdr.innerHTML = shown.map(([k, v]) => `<span><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</span>`).join('');
    card.appendChild(hdr);
  }

  // Body
  const pre = document.createElement('pre');
  pre.className = 'body';
  if (json !== null) {
    pre.innerHTML = syntaxHighlight(json);
  } else {
    pre.textContent = bodyText || '(empty body)';
  }
  card.appendChild(pre);

  // Follow-up actions
  const followups = buildFollowups(req, res, json);
  if (followups.length) {
    const wrap = document.createElement('div');
    wrap.className = 'followups';
    for (const f of followups) {
      const b = document.createElement('button');
      b.className = 'follow-btn';
      b.textContent = f.label;
      b.addEventListener('click', () => runRequest(f.request));
      wrap.appendChild(b);
    }
    card.appendChild(wrap);
  }

  return card;
}

// Offer the natural next step based on real HTTP/REST conventions in the
// response — a Location header to follow, or a pagination token to chase.
function buildFollowups(req, res, json) {
  const out = [];

  const location = res.headers.get('Location');
  if (location) {
    out.push({ label: 'Follow Location →', request: { method: 'GET', path: location } });
  }

  if (json && json.nextPageToken) {
    out.push({
      label: 'Next page →',
      request: { method: 'GET', path: setQueryParam(req.path, 'pageToken', json.nextPageToken) }
    });
  }

  return out;
}

// --- helpers --------------------------------------------------------------

function setQueryParam(path, key, value) {
  const url = new URL(path, window.location.origin);
  url.searchParams.set(key, value);
  return url.pathname + url.search;
}

function syntaxHighlight(value) {
  const json = JSON.stringify(value, null, 2)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'tok-num';
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'tok-key' : 'tok-str';
      else if (/true|false/.test(match)) cls = 'tok-bool';
      else if (/null/.test(match)) cls = 'tok-null';
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
