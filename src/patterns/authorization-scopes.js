'use strict';

const { seedBooks } = require('../domain/books');
const { createStore } = require('../domain/store');
const { error } = require('../core/http');

const store = createStore(seedBooks);
const TOKENS = {
  'reader-token': ['books:read'],
  'admin-token': ['books:read', 'books:write']
};

function scopesFor(req) {
  const m = (req.get('Authorization') || '').match(/^Bearer\s+(.+)$/i);
  return m && TOKENS[m[1]] ? TOKENS[m[1]] : null;
}

// 認証→スコープ確認をまとめて行う。失敗時はレスポンスを返して null を返す。
function ensure(req, res, scope) {
  const scopes = scopesFor(req);
  if (!scopes) {
    res.set('WWW-Authenticate', 'Bearer');
    error(res, 401, 'UNAUTHORIZED', '認証が必要です。');
    return null;
  }
  if (!scopes.includes(scope)) {
    res.set('WWW-Authenticate', `Bearer error="insufficient_scope", scope="${scope}"`);
    error(res, 403, 'FORBIDDEN', `この操作には ${scope} スコープが必要です。`);
    return null;
  }
  return scopes;
}

function register(r) {
  r.get('/books', (req, res) => {
    if (!ensure(req, res, 'books:read')) return;
    res.json({ books: store.list() });
  });

  r.post('/books', (req, res) => {
    if (!ensure(req, res, 'books:write')) return;
    const id = store.newId();
    const book = {
      id,
      title: req.body.title || '無題',
      author: req.body.author || '著者不明',
      year: req.body.year || new Date().getFullYear(),
      category: req.body.category || '純文学',
      pages: req.body.pages || 0,
      rating: req.body.rating || 0
    };
    store.add(book);
    res.status(201).location(`${r.base}/books/${id}`).json(book);
  });

  r.post('/_reset', (_req, res) => {
    store.reset();
    res.json({ reset: true, count: store.size });
  });
}

module.exports = {
  meta: {
    id: 'authorization-scopes',
    category: 'security',
    title: '認可（スコープ）',
    blurb: 'トークンのスコープで操作を制限する。権限不足は 403。',
    docs:
      '認証で「誰か」が分かったら、次は「何をしてよいか」を判断します（認可）。ここではトークンに' +
      'スコープ（権限）を結び付け、操作ごとに必要なスコープを要求します。最小権限の原則に従い、' +
      '読み取りには books:read、書き込みには books:write を要求します。\n\n' +
      'スコープが足りない場合は 403 Forbidden を返します（認証自体が無い場合は 401）。reader-token は' +
      '一覧取得（200）はできますが、作成は 403 になります。admin-token は作成（201）もできます。同じ' +
      'リクエストでも、トークンの権限次第で結果が変わる点に注目してください。\n\n' +
      '（デモ用にトークンとスコープは固定です。）'
  },
  demos: [
    { label: '読み取りトークンで一覧 → 200', method: 'GET', path: '/books', headers: { Authorization: 'Bearer reader-token' } },
    {
      label: '読み取りトークンで作成 → 403',
      method: 'POST',
      path: '/books',
      headers: { Authorization: 'Bearer reader-token' },
      body: { title: '吾輩は猫である', author: '夏目漱石' }
    },
    {
      label: '管理トークンで作成 → 201',
      method: 'POST',
      path: '/books',
      headers: { Authorization: 'Bearer admin-token' },
      body: { title: '吾輩は猫である', author: '夏目漱石' }
    },
    { label: '管理トークンで一覧 → 200', method: 'GET', path: '/books', headers: { Authorization: 'Bearer admin-token' } },
    { label: 'デモデータをリセット', method: 'POST', path: '/_reset' }
  ],
  register
};
