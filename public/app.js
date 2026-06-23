'use strict';

// UI は GET /api/_meta から完全にデータ駆動で構築される。各パターンは自身のカテゴリと
// デモリクエストを宣言し、このスクリプトがカテゴリ別のナビを描画して、選ばれたパターンの
// リクエストをライブ実行し、結果（最新の1件）を右側に表示する。

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

// テーマ切替・検索・クリアの配線。
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

// サイドバーの検索フィルタ。一致するパターンだけ表示し、該当カテゴリを開く。
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
  if (con) con.innerHTML = `<div class="console-empty">中央の「試す」からリクエストをクリックすると、ここに実行結果（リクエストとレスポンス）が表示されます。</div>`;
}

// --- リクエストを実行し、やり取りを描画する -------------------------------

async function runRequest(req) {
  const con = $('#console');
  con.innerHTML = ''; // 新しい呼び出しごとに、前回の結果をクリアして最新の1件だけを表示する。

  const opts = {
    method: req.method,
    headers: { ...(req.headers || {}) },
    cache: 'no-store' // ブラウザの HTTP キャッシュを介さず、304 をそのまま観測する。
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

  // リクエスト行
  const reqLine = document.createElement('div');
  reqLine.className = 'req-line';
  reqLine.innerHTML = `<span class="method ${req.method}">${req.method}</span><span class="path">${escapeHtml(req.path)}</span>`;
  card.appendChild(reqLine);

  // リクエストのヘッダー／ボディ（あれば）
  if (req.headers || req.body !== undefined) {
    const meta = document.createElement('div');
    meta.className = 'req-meta';
    const bits = [];
    if (req.headers) {
      bits.push(Object.entries(req.headers).map(([k, v]) => `${escapeHtml(k)}: <code>${escapeHtml(String(v))}</code>`).join('&nbsp;&nbsp;'));
    }
    if (req.body !== undefined) {
      bits.push(`ボディ: <code>${escapeHtml(JSON.stringify(req.body))}</code>`);
    }
    meta.innerHTML = bits.join('<br>');
    card.appendChild(meta);
  }

  if (networkError) {
    const resLine = document.createElement('div');
    resLine.className = 'res-line';
    resLine.innerHTML = `<span class="status s0">ネットワークエラー</span><span class="timing">${escapeHtml(String(networkError.message || networkError))}</span>`;
    card.appendChild(resLine);
    return card;
  }

  // レスポンスのステータス行（2xx / 3xx / 4xx / 5xx で色分け）
  const cls = res.status < 300 ? 's2' : res.status < 400 ? 's3' : res.status < 500 ? 's4' : 's5';
  const resLine = document.createElement('div');
  resLine.className = 'res-line';
  let statusHtml = `<span class="status ${cls}">${res.status} ${escapeHtml(res.statusText || '')}</span><span class="timing">${ms} ms</span>`;
  if (res.headers.get('Idempotent-Replayed') === 'true') statusHtml += `<span class="replay-flag">⟳ リプレイ（重複排除）</span>`;
  if (res.status === 304) statusHtml += `<span class="replay-flag">本文の転送なし</span>`;
  resLine.innerHTML = statusHtml;
  card.appendChild(resLine);

  // 注目すべきレスポンスヘッダー
  const interesting = ['Location', 'ETag', 'Last-Modified', 'Cache-Control', 'Idempotent-Replayed', 'Content-Type'];
  const shown = interesting.map((h) => [h, res.headers.get(h)]).filter(([, v]) => v);
  if (shown.length) {
    const hdr = document.createElement('div');
    hdr.className = 'res-headers';
    hdr.innerHTML = shown.map(([k, v]) => `<span><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</span>`).join('');
    card.appendChild(hdr);
  }

  // ボディ（Auth0 風のコードブロック: ヘッダーバー + コピー）
  const pretty = json !== null ? JSON.stringify(json, null, 2) : (bodyText || '');
  const block = document.createElement('div');
  block.className = 'code-block';
  const bar = document.createElement('div');
  bar.className = 'code-bar';
  bar.innerHTML = `<span class="code-lang">レスポンス本文</span>`;
  bar.appendChild(copyButton(() => pretty));
  const pre = document.createElement('pre');
  pre.className = 'body';
  if (json !== null) pre.innerHTML = syntaxHighlight(json);
  else pre.textContent = bodyText || '（本文なし）';
  block.appendChild(bar);
  block.appendChild(pre);
  card.appendChild(block);

  // 次の操作
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

// レスポンスに含まれる実際の HTTP/REST の慣習をもとに、自然な次の操作を提示する。
function buildFollowups(req, res, json) {
  const out = [];

  const location = res.headers.get('Location');
  if (location) out.push({ label: 'Location をたどる →', request: { method: 'GET', path: location } });

  if (json && json.nextPageToken) {
    out.push({ label: '次のページ →', request: { method: 'GET', path: setQueryParam(req.path, 'pageToken', json.nextPageToken) } });
  }

  const etag = res.headers.get('ETag');
  const alreadyConditional = req.headers && req.headers['If-None-Match'];
  if (etag && !alreadyConditional) {
    out.push({ label: 'If-None-Match で再取得 → 304', request: { method: req.method, path: req.path, headers: { 'If-None-Match': etag } } });
  }

  return out;
}

// --- ヘルパー --------------------------------------------------------------

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
