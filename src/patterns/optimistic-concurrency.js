'use strict';

const { seedBooks } = require('../domain/books');
const { createStore } = require('../domain/store');
const { notFound, error, etag } = require('../core/http');

const store = createStore(seedBooks);

function register(r) {
  r.get('/books/:id', (req, res) => {
    const book = store.find(req.params.id);
    if (!book) return notFound(res, `'${req.params.id}' の書籍は存在しません。`);
    res.set('ETag', etag(book)).json(book);
  });

  r.patch('/books/:id', (req, res) => {
    const book = store.find(req.params.id);
    if (!book) return notFound(res, `'${req.params.id}' の書籍は存在しません。`);

    const ifMatch = req.get('If-Match');
    if (!ifMatch) {
      return error(res, 428, 'PRECONDITION_REQUIRED', '更新には If-Match ヘッダー（取得時の ETag）が必要です。');
    }
    if (ifMatch !== etag(book)) {
      return error(res, 412, 'PRECONDITION_FAILED', 'ETag が一致しません。ほかのクライアントが先に更新した可能性があります。最新を取得してからやり直してください。');
    }

    const { id, ...patch } = req.body;
    Object.assign(book, patch);
    res.set('ETag', etag(book)).json(book);
  });

  r.post('/_reset', (_req, res) => {
    store.reset();
    res.json({ reset: true, count: store.size });
  });
}

module.exports = {
  meta: {
    id: 'optimistic-concurrency',
    category: 'writes-reliability',
    title: '楽観的並行性制御',
    blurb: 'ETag と If-Match で、他者の変更を上書きしてしまう「ロストアップデート」を防ぐ。',
    docs:
      '複数のクライアントが同じリソースを編集すると、後から書き込んだ更新が、先に行われた更新に' +
      '気づかないまま上書きしてしまうこと（ロストアップデート）があります。楽観的並行性制御は、これを ' +
      'ETag を使って防ぎます。\n\n' +
      'まずクライアントはリソースを取得し、その ETag を控えます。更新時には If-Match ヘッダーに' +
      'その ETag を載せて送ります。サーバーは現在の ETag と一致するときだけ更新を適用し、一致しなければ ' +
      '412 Precondition Failed を返します。412 を受け取ったクライアントは、最新の状態を取得し直して' +
      'から再試行します。If-Match を付けずに更新しようとした場合は、前提条件が必須であることを示す ' +
      '428 Precondition Required を返します。\n\n' +
      '「書籍を取得」を実行すると ETag が得られ、「この ETag で更新 → 200」ボタンが現れます（成功する' +
      '更新）。一方「古い ETag で更新」は一致しない ETag を送るため 412 に、「If-Match なしで更新」は ' +
      '428 になります。'
  },
  demos: [
    { label: '書籍を取得（ETagを得る）', method: 'GET', path: '/books/book-10' },
    {
      label: '古い ETag で更新 → 412',
      method: 'PATCH',
      path: '/books/book-10',
      headers: { 'If-Match': '"outdated-etag"' },
      body: { rating: 4.9 }
    },
    { label: 'If-Match なしで更新 → 428', method: 'PATCH', path: '/books/book-10', body: { rating: 4.9 } },
    { label: 'デモデータをリセット', method: 'POST', path: '/_reset' }
  ],
  register
};
