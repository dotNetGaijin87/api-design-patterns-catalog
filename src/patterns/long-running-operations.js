'use strict';

const { notFound } = require('../core/http');

const DURATION_MS = 6000;

let operations = new Map();
let nextOp = 1;

// 進捗は経過時間から算出する（バックグラウンドワーカー不要）。base は downloadUrl を絶対URLにするため。
function snapshot(op, base) {
  const elapsed = Date.now() - op.startedAt;
  const progress = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));
  const done = progress >= 100;
  return {
    name: op.name,
    done,
    metadata: { progressPercent: progress, target: op.target },
    response: done ? { downloadUrl: `${base}/downloads/${op.id}.json`, exported: op.target } : undefined
  };
}

function register(r) {
  r.post('/exports', (req, res) => {
    const id = String(nextOp++);
    const op = {
      id,
      name: `operations/${id}`,
      target: (req.body && req.body.target) || 'full-catalog',
      startedAt: Date.now()
    };
    operations.set(id, op);
    res.status(202).location(`${r.base}/operations/${id}`).json(snapshot(op, r.base));
  });

  r.get('/operations/:id', (req, res) => {
    const op = operations.get(req.params.id);
    if (!op) return notFound(res, `'${req.params.id}' のオペレーションは存在しません。`);
    res.json(snapshot(op, r.base));
  });

  r.post('/_reset', (_req, res) => {
    operations = new Map();
    nextOp = 1;
    res.json({ reset: true });
  });
}

module.exports = {
  meta: {
    id: 'long-running-operations',
    category: 'writes-reliability',
    title: '長時間実行オペレーション',
    blurb: '1リクエストで終わらない処理は、202 とポーリング可能な Operation を返す。',
    docs:
      'エクスポート、一括インポート、動画のトランスコードなど、1回のリクエストでは終わらない' +
      '処理があります。その場合は接続を保持し続けるのではなく、リクエストを受理して 202 Accepted ' +
      'を返し、Operation リソース（{ name, done, metadata }）と Location ヘッダーを渡します。' +
      'クライアントは done が true になるまでその Operation をポーリングします。\n\n' +
      '「エクスポート開始」を実行すると、done:false・進捗0 が返ります。「Location をたどる →」' +
      'ボタンで Operation をポーリングできます。約6秒のあいだ何度かクリックすると progressPercent ' +
      'が増えていき、最後に結果のペイロード（downloadUrl）が現れます。'
  },
  demos: [
    { label: 'エクスポート開始 → 202', method: 'POST', path: '/exports', body: { target: 'full-catalog' } },
    { label: 'オペレーションをリセット', method: 'POST', path: '/_reset' }
  ],
  register
};
