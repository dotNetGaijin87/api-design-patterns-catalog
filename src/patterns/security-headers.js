'use strict';

const { seedBooks } = require('../domain/books');

const books = seedBooks();

const HARDENING = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cache-Control': 'no-store'
};

function register(r) {
  r.get('/books', (_req, res) => {
    for (const [name, value] of Object.entries(HARDENING)) res.set(name, value);
    res.json({ books });
  });
}

module.exports = {
  meta: {
    id: 'security-headers',
    category: 'security',
    title: 'セキュリティヘッダー（ハードニング）',
    blurb: '安全な既定値となる防御的なレスポンスヘッダーを付与する。',
    docs:
      'レスポンスに防御的なヘッダーを付けておくと、ブラウザや中間装置に安全側の挙動を促せます。' +
      '代表的なものは次のとおりです。\n\n' +
      '・Strict-Transport-Security: 以後の通信を HTTPS に限定する（HSTS）。\n' +
      '・X-Content-Type-Options: nosniff: Content-Type の推測（MIME スニッフィング）を禁止する。\n' +
      "・Content-Security-Policy: 読み込めるリソースを制限する。API なら default-src 'none' のように厳しくできる。\n" +
      '・X-Frame-Options / frame-ancestors: フレーム埋め込みを禁止し、クリックジャッキングを防ぐ。\n' +
      '・Referrer-Policy: no-referrer: リファラーの送出を抑える。\n' +
      '・Permissions-Policy: 使わないブラウザ機能（カメラ・位置情報など）を無効化する。\n' +
      '・Cache-Control: no-store: 機微な応答をキャッシュさせない。\n\n' +
      '「ハードニング適用のレスポンスを取得」を実行し、レスポンスヘッダーにこれらが並ぶことを確認して' +
      'ください。\n\n' +
      '（実運用では HSTS は HTTPS 配信が前提で、CSP は各サービスに合わせた調整が必要です。ここでは例として' +
      '固定値を返します。）'
  },
  demos: [
    { label: 'ハードニング適用のレスポンスを取得', method: 'GET', path: '/books' }
  ],
  register
};
