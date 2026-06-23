'use strict';

const { seedBooks } = require('../data');

// ---------------------------------------------------------------------------
// Idempotency / Request Deduplication
// ---------------------------------------------------------------------------
// POST は本来べき等ではない。レスポンスが失われた後にリトライすると「作成」が重複する。
// Idempotency-Key ヘッダーにより、サーバーはリトライを認識し、二重に実行する代わりに
// 元の結果を返せる。

let books = seedBooks();
let nextId = books.length + 1;
let keyCache = new Map(); // Idempotency-Key -> 保存したレスポンスボディ

const BASE = '/api/idempotency';

function register(app) {
  app.post(`${BASE}/books`, (req, res) => {
    const key = req.get('Idempotency-Key');

    // リプレイ: 既知のキーなら、元の作成結果を返す。重複排除されたことが分かるように
    // フラグを付ける。
    if (key && keyCache.has(key)) {
      return res
        .status(200)
        .set('Idempotent-Replayed', 'true')
        .json(keyCache.get(key));
    }

    const id = `book-${String(nextId++).padStart(2, '0')}`;
    const book = {
      id,
      title: req.body.title || '無題',
      author: req.body.author || '著者不明',
      year: req.body.year || new Date().getFullYear(),
      category: req.body.category || '純文学',
      pages: req.body.pages || 0,
      rating: req.body.rating || 0
    };
    books.push(book);

    if (key) keyCache.set(key, book);
    res.status(201).location(`${BASE}/books/${id}`).json(book);
  });

  app.get(`${BASE}/books`, (_req, res) => {
    res.json({ totalSize: books.length, books });
  });

  app.post(`${BASE}/_reset`, (_req, res) => {
    books = seedBooks();
    nextId = books.length + 1;
    keyCache = new Map();
    res.json({ reset: true, count: books.length });
  });
}

module.exports = {
  meta: {
    id: 'idempotency',
    category: 'writes-reliability',
    title: '冪等性キー',
    blurb: 'POST を安全にリトライ可能にする。同じ Idempotency-Key は元の結果を返す。',
    docs:
      'POST のレスポンスが返ってこなかったクライアントは難しい判断を迫られます。作成は成功したのか？ ' +
      'リトライすれば重複のリスクがあります。Idempotency-Key ヘッダー（クライアントが生成する一意な値）' +
      'はこれを解決します。サーバーは結果をキーに紐づけて保存し、同じキーのリトライに対しては再実行せず、' +
      '元のレスポンスを返します。\n\n' +
      '「作成（key=abc-123）」を実行すると、新しい id と 201 が返ります。もう一度実行すると、同じ id ' +
      'ながら 200 になり、Idempotent-Replayed: true ヘッダーが付きます（レスポンスヘッダーを確認して' +
      'ください）。次に「作成（key=xyz-789）」は本当に新しい書籍を作成します。「一覧取得」で件数を確認できます。'
  },
  demos: [
    {
      label: '作成（key=abc-123）',
      method: 'POST',
      path: `${BASE}/books`,
      headers: { 'Idempotency-Key': 'abc-123' },
      body: { title: '坊っちゃん', author: '夏目漱石', year: 1906, category: '純文学' }
    },
    {
      label: '再実行（key=abc-123）→ リプレイ',
      method: 'POST',
      path: `${BASE}/books`,
      headers: { 'Idempotency-Key': 'abc-123' },
      body: { title: '坊っちゃん', author: '夏目漱石', year: 1906, category: '純文学' }
    },
    {
      label: '作成（key=xyz-789）→ 新規',
      method: 'POST',
      path: `${BASE}/books`,
      headers: { 'Idempotency-Key': 'xyz-789' },
      body: { title: '砂の女', author: '安部公房', year: 1962, category: '純文学' }
    },
    { label: '書籍を一覧取得', method: 'GET', path: `${BASE}/books` },
    { label: 'デモデータをリセット', method: 'POST', path: `${BASE}/_reset` }
  ],
  register
};
