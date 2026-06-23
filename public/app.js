'use strict';

let categories = [];
let patterns = [];
let active = null;
let openCategory = null;

const $ = (sel, root = document) => root.querySelector(sel);

init();

async function init() {
  try {
    const data = await (await fetch('/api/_meta')).json();
    categories = data.categories || [];
    patterns = data.patterns || [];
  } catch (err) {
    $('#detail').innerHTML = `<p class="loading">/api/_meta を読み込めませんでした — サーバーは起動していますか？</p>`;
    return;
  }
  renderSidebar();
  wireChrome();
  resetConsole();
  if (patterns.length) select(patterns[0].id);
}

function wireChrome() {
  const toggle = $('#themeToggle');
  syncThemeIcon();
  toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeIcon();
  });

  $('#clearConsole').addEventListener('click', resetConsole);
  $('#patternSearch').addEventListener('input', (e) => applySearch(e.target.value));
}

function syncThemeIcon() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  $('#themeToggle').textContent = dark ? '☀' : '☾';
}

function patternsIn(catId) {
  return patterns.filter((p) => p.category === catId);
}

function renderSidebar() {
  const nav = $('#patternList');
  nav.innerHTML = '';
  for (const cat of categories) {
    const pats = patternsIn(cat.id);
    if (!pats.length) continue;

    const group = document.createElement('div');
    group.className = 'cat-group';
    group.dataset.cat = cat.id;

    const header = document.createElement('button');
    header.className = 'cat-header';
    header.innerHTML =
      `<span class="cat-caret">▸</span>` +
      `<span class="cat-label">${escapeHtml(cat.label)}</span>` +
      `<span class="cat-count">${pats.length}</span>`;
    header.addEventListener('click', () => toggleCategory(cat.id));
    group.appendChild(header);

    const list = document.createElement('div');
    list.className = 'cat-patterns';
    for (const p of pats) {
      const btn = document.createElement('button');
      btn.className = 'pattern-item';
      btn.dataset.id = p.id;
      btn.dataset.search = `${p.title} ${p.blurb}`.toLowerCase();
      btn.innerHTML = `${escapeHtml(p.title)}<span class="pi-sub">${escapeHtml(p.blurb)}</span>`;
      btn.addEventListener('click', () => select(p.id));
      list.appendChild(btn);
    }
    group.appendChild(list);
    nav.appendChild(group);
  }
}

function toggleCategory(id) {
  openCategory = openCategory === id ? null : id;
  applyOpenState();
}

function applyOpenState() {
  for (const g of document.querySelectorAll('.cat-group')) {
    g.classList.toggle('open', g.dataset.cat === openCategory);
  }
}

function applySearch(query) {
  const q = query.trim().toLowerCase();
  for (const group of document.querySelectorAll('.cat-group')) {
    let any = false;
    for (const item of group.querySelectorAll('.pattern-item')) {
      const match = !q || item.dataset.search.includes(q);
      item.style.display = match ? '' : 'none';
      if (match) any = true;
    }
    group.style.display = any ? '' : 'none';
    if (q) group.classList.toggle('open', any);
  }
  if (!q) applyOpenState();
}

function select(id) {
  active = patterns.find((p) => p.id === id);
  if (!active) return;
  openCategory = active.category;
  applyOpenState();
  for (const el of document.querySelectorAll('.pattern-item')) {
    el.classList.toggle('active', el.dataset.id === id);
  }
  renderDetail(active);
  resetConsole();
}

function renderDetail(p) {
  const detail = $('#detail');
  detail.innerHTML = '';
  detail.scrollTop = 0;

  const cat = categories.find((c) => c.id === p.category);
  const crumb = document.createElement('div');
  crumb.className = 'breadcrumb';
  crumb.innerHTML =
    `<span>ドキュメント</span><span class="sep">/</span>` +
    `<span>${escapeHtml(cat ? cat.label : '')}</span><span class="sep">/</span>` +
    `<span class="crumb-current">${escapeHtml(p.title)}</span>`;
  detail.appendChild(crumb);

  const head = document.createElement('div');
  head.className = 'detail-head';
  head.innerHTML = `<h2>${escapeHtml(p.title)}</h2><p class="blurb">${escapeHtml(p.blurb)}</p>`;
  detail.appendChild(head);

  if (p.docs) {
    const docs = document.createElement('div');
    docs.className = 'docs';
    docs.textContent = p.docs;
    detail.appendChild(docs);
  }

  const tryTitle = document.createElement('h3');
  tryTitle.className = 'section-title';
  tryTitle.textContent = '試す';
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
}

function resetConsole() {
  const con = $('#console');
  if (con) con.innerHTML = `<div class="console-empty">中央の「試す」にあるリクエストをクリックすると、ここに実行結果（リクエストとレスポンス）が表示されます。</div>`;
}

async function runRequest(req) {
  const con = $('#console');
  con.innerHTML = ''; // 最新の1件だけを表示する

  const opts = {
    method: req.method,
    headers: { ...(req.headers || {}) },
    cache: 'no-store' // ブラウザのキャッシュを介さず 304 をそのまま観測する
  };
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

  // --- リクエストパネル ---
  const reqPanel = document.createElement('div');
  reqPanel.className = 'panel req-panel';
  const reqHead = document.createElement('div');
  reqHead.className = 'panel-head';
  reqHead.innerHTML =
    `<span class="panel-tag">リクエスト</span>` +
    `<span class="method ${req.method}">${req.method}</span>` +
    `<span class="path">${escapeHtml(req.path)}</span>`;
  reqPanel.appendChild(reqHead);

  if (req.headers) {
    const meta = document.createElement('div');
    meta.className = 'req-meta';
    meta.innerHTML = Object.entries(req.headers)
      .map(([k, v]) => `${escapeHtml(k)}: <code>${escapeHtml(String(v))}</code>`)
      .join('&nbsp;&nbsp;');
    reqPanel.appendChild(meta);
  }
  if (req.body !== undefined) {
    reqPanel.appendChild(codeBlock('リクエスト本文', req.body));
  }
  card.appendChild(reqPanel);

  const connector = document.createElement('div');
  connector.className = 'connector';
  connector.textContent = '↓';
  card.appendChild(connector);

  // --- レスポンスパネル ---
  const resPanel = document.createElement('div');
  resPanel.className = 'panel res-panel';

  if (networkError) {
    resPanel.classList.add('s0');
    const head = document.createElement('div');
    head.className = 'panel-head';
    head.innerHTML = `<span class="panel-tag">レスポンス</span><span class="status">ネットワークエラー</span>`;
    const body = document.createElement('div');
    body.className = 'req-meta';
    body.textContent = String(networkError.message || networkError);
    resPanel.appendChild(head);
    resPanel.appendChild(body);
    card.appendChild(resPanel);
    return card;
  }

  const cls = res.status < 300 ? 's2' : res.status < 400 ? 's3' : res.status < 500 ? 's4' : 's5';
  resPanel.classList.add(cls);
  const resHead = document.createElement('div');
  resHead.className = 'panel-head';
  let headHtml =
    `<span class="panel-tag">レスポンス</span>` +
    `<span class="status">${res.status} ${escapeHtml(res.statusText || '')}</span>` +
    `<span class="timing">${ms} ms</span>`;
  if (res.headers.get('Idempotent-Replayed') === 'true') headHtml += `<span class="replay-flag">⟳ リプレイ（重複排除）</span>`;
  if (res.status === 304) headHtml += `<span class="replay-flag">本文の転送なし</span>`;
  resHead.innerHTML = headHtml;
  resPanel.appendChild(resHead);

  const interesting = ['Location', 'ETag', 'Last-Modified', 'Cache-Control', 'Idempotent-Replayed', 'Content-Type'];
  const shown = interesting.map((h) => [h, res.headers.get(h)]).filter(([, v]) => v);
  if (shown.length) {
    const hdr = document.createElement('div');
    hdr.className = 'res-headers';
    hdr.innerHTML = shown.map(([k, v]) => `<span><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</span>`).join('');
    resPanel.appendChild(hdr);
  }

  resPanel.appendChild(codeBlock('レスポンス本文', json !== null ? json : (bodyText || '')));

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
    resPanel.appendChild(wrap);
  }

  card.appendChild(resPanel);
  return card;
}

function codeBlock(label, value) {
  const isObject = value !== null && typeof value === 'object';
  const text = isObject ? JSON.stringify(value, null, 2) : String(value ?? '');

  const block = document.createElement('div');
  block.className = 'code-block';

  const bar = document.createElement('div');
  bar.className = 'code-bar';
  bar.innerHTML = `<span class="code-lang">${escapeHtml(label)}</span>`;
  bar.appendChild(copyButton(() => text));

  const pre = document.createElement('pre');
  pre.className = 'body';
  if (isObject) pre.innerHTML = syntaxHighlight(value);
  else pre.textContent = text || '（本文なし）';

  block.appendChild(bar);
  block.appendChild(pre);
  return block;
}

function copyButton(getText) {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = 'コピー';
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(getText());
      btn.textContent = 'コピーしました';
    } catch {
      btn.textContent = 'コピー失敗';
    }
    setTimeout(() => { btn.textContent = 'コピー'; }, 1200);
  });
  return btn;
}

// Location ヘッダーやページトークン、ETag など、レスポンスに応じた次の操作を提示する。
function buildFollowups(req, res, json) {
  const out = [];
  const patternId = active && active.id;

  const location = res.headers.get('Location');
  if (location) out.push({ label: 'Location をたどる →', request: { method: 'GET', path: location } });

  if (json && json.nextPageToken) {
    out.push({ label: '次のページ →', request: { method: 'GET', path: setQueryParam(req.path, 'pageToken', json.nextPageToken) } });
  }

  const etag = res.headers.get('ETag');
  const lastMod = res.headers.get('Last-Modified');
  const conditional = req.headers && (req.headers['If-None-Match'] || req.headers['If-Modified-Since']);

  if (patternId === 'conditional-requests' && req.method === 'GET' && !conditional) {
    if (etag) out.push({ label: 'If-None-Match で再取得 → 304', request: { method: 'GET', path: req.path, headers: { 'If-None-Match': etag } } });
    if (lastMod) out.push({ label: 'If-Modified-Since で再取得 → 304', request: { method: 'GET', path: req.path, headers: { 'If-Modified-Since': lastMod } } });
  }

  if (patternId === 'optimistic-concurrency' && req.method === 'GET' && etag) {
    out.push({ label: 'この ETag で更新 → 200', request: { method: 'PATCH', path: req.path, headers: { 'If-Match': etag }, body: { rating: 5.0 } } });
  }

  return out;
}

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
