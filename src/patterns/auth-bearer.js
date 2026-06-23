'use strict';

const { seedBooks } = require('../domain/books');
const { error } = require('../core/http');

const books = seedBooks();
const VALID_TOKEN = 'demo-token-123';

function register(r) {
  r.get('/books', (req, res) => {
    const m = (req.get('Authorization') || '').match(/^Bearer\s+(.+)$/i);
    if (!m) {
      res.set('WWW-Authenticate', 'Bearer');
      return error(res, 401, 'UNAUTHORIZED', '認証が必要です。Authorization: Bearer <token> を付けてください。');
    }
    if (m[1] !== VALID_TOKEN) {
      res.set('WWW-Authenticate', 'Bearer error="invalid_token"');
      return error(res, 401, 'INVALID_TOKEN', 'トークンが無効です。');
    }
    res.json({ books });
  });
}

module.exports = {
  meta: {
    id: 'auth-bearer',
    category: 'security',
    title: '認証（Bearer トークン）',
    blurb: 'Authorization: Bearer でトークンを検証し、なければ 401 を返す。',
    docs:
      'API はまず「誰からのリクエストか」を確かめます。Bearer トークン認証では、クライアントは ' +
      'Authorization: Bearer <token> ヘッダーにトークンを載せて送ります。サーバーはトークンを検証し、' +
      '無い場合や不正な場合は 401 Unauthorized を返し、WWW-Authenticate ヘッダーで求める認証方式を示します。\n\n' +
      '「トークンなし」「不正なトークン」はいずれも 401 になり、レスポンスヘッダーの WWW-Authenticate を' +
      '確認できます。「有効なトークン」では 200 で一覧が返ります。\n\n' +
      '（このデモは HTTP の挙動を示すためのもので、トークンは固定値です。実運用では署名付きトークンの' +
      '検証や安全な保管・失効が必要です。）'
  },
  demos: [
    { label: 'トークンなしで取得 → 401', method: 'GET', path: '/books' },
    { label: '不正なトークン → 401', method: 'GET', path: '/books', headers: { Authorization: 'Bearer wrong-token' } },
    { label: '有効なトークンで取得 → 200', method: 'GET', path: '/books', headers: { Authorization: 'Bearer demo-token-123' } }
  ],
  register
};
