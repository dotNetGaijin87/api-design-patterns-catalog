'use strict';

// ---------------------------------------------------------------------------
// Long-Running Operations (LRO)
// ---------------------------------------------------------------------------
// 1リクエストで終わらない処理（エクスポート、一括インポート、トランスコードなど）。
// ブロックせず、ただちに 202 Accepted と、クライアントが done == true までポーリングできる
// Operation リソースを返す。

const BASE = '/api/lro';
const DURATION_MS = 6000; // 疑似的な「エクスポート」は約6秒で完了する。

let operations = new Map();
let nextOp = 1;

// 進捗は経過時間から算出するので、バックグラウンドワーカーなしでもポーリングごとに
// 最新のパーセンテージが得られる。
function snapshot(op) {
  const elapsed = Date.now() - op.startedAt;
  const progress = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));
  const done = progress >= 100;
  return {
    name: op.name,
    done,
    metadata: { progressPercent: progress, target: op.target },
    // 結果は完了時にのみ現れる。
    response: done ? { downloadUrl: `${BASE}/downloads/${op.id}.json`, exported: op.target } : undefined
  };
}

function register(app) {
  // 処理を開始する。
  app.post(`${BASE}/exports`, (req, res) => {
    const id = String(nextOp++);
    const op = {
      id,
      name: `operations/${id}`,
      target: (req.body && req.body.target) || 'full-catalog',
      startedAt: Date.now()
    };
    operations.set(id, op);
    // 202 Accepted + ポーリング先を指す Location ヘッダー。
    res
      .status(202)
      .location(`${BASE}/operations/${id}`)
      .json(snapshot(op));
  });

  // Operation をポーリングする。
  app.get(`${BASE}/operations/:id`, (req, res) => {
    const op = operations.get(req.params.id);
    if (!op) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `'${req.params.id}' のオペレーションは存在しません。` } });
    }
    res.json(snapshot(op));
  });

  app.post(`${BASE}/_reset`, (_req, res) => {
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
    { label: 'エクスポート開始 → 202', method: 'POST', path: `${BASE}/exports`, body: { target: 'full-catalog' } },
    { label: 'オペレーションをリセット', method: 'POST', path: `${BASE}/_reset` }
  ],
  register
};
