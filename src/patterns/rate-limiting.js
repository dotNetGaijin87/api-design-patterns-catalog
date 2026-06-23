'use strict';

const { seedBooks } = require('../domain/books');
const { error } = require('../core/http');

const books = seedBooks();
const LIMIT = 5;
const WINDOW_MS = 20000;

let count = 0;
let windowStart = Date.now();

function register(r) {
  r.get('/books', (_req, res) => {
    const now = Date.now();
    if (now - windowStart >= WINDOW_MS) {
      windowStart = now;
      count = 0;
    }
    count++;
    const resetSec = Math.ceil((windowStart + WINDOW_MS - now) / 1000);

    res.set('RateLimit-Limit', String(LIMIT));
    res.set('RateLimit-Remaining', String(Math.max(0, LIMIT - count)));
    res.set('RateLimit-Reset', String(resetSec));

    if (count > LIMIT) {
      res.set('Retry-After', String(resetSec));
      return error(res, 429, 'RATE_LIMITED', `レート制限を超えました。${resetSec} 秒後に再試行してください。`);
    }
    res.json({ remaining: LIMIT - count, books });
  });

  r.post('/_reset', (_req, res) => {
    count = 0;
    windowStart = Date.now();
    res.json({ reset: true });
  });
}

module.exports = {
  meta: {
    id: 'rate-limiting',
    category: 'security',
    title: 'レート制限',
    blurb: '一定時間内のリクエスト数を制限し、超過は 429 + Retry-After。',
    docs:
      'レート制限は、1クライアントが短時間に送れるリクエスト数に上限を設け、濫用や過負荷から API を' +
      '守ります。各レスポンスは残り回数を RateLimit-Remaining などのヘッダーで知らせ、上限を超えると ' +
      '429 Too Many Requests と、再試行できる時刻までの秒数を示す Retry-After を返します。\n\n' +
      'ここでは 20 秒あたり 5 回までに制限しています。「リクエスト」を続けて押すと RateLimit-Remaining ' +
      'が減っていき、上限を超えると 429 になります。「カウンタをリセット」で元に戻せます。\n\n' +
      '（デモはプロセス全体で1つのカウンタを共有する簡易版です。実運用では利用者ごとに、分散環境でも' +
      '正しく集計する必要があります。）'
  },
  demos: [
    { label: 'リクエスト（残り回数を確認）', method: 'GET', path: '/books' },
    { label: 'カウンタをリセット', method: 'POST', path: '/_reset' }
  ],
  register
};
