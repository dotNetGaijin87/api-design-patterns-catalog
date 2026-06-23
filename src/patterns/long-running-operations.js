'use strict';

// ---------------------------------------------------------------------------
// Long-Running Operations (LRO)
// ---------------------------------------------------------------------------
// Some work can't finish within one request (exports, batch imports, video
// transcodes). Instead of blocking, return 202 Accepted immediately with an
// Operation resource the client can poll until done == true.
// Source: "API Design Patterns" (Geewax), ch. 10.

const BASE = '/api/lro';
const DURATION_MS = 6000; // the fake "export" takes ~6 seconds to complete.

let operations = new Map();
let nextOp = 1;

// Progress is derived from elapsed wall-clock time, so every poll shows a
// fresh percentage without any background workers.
function snapshot(op) {
  const elapsed = Date.now() - op.startedAt;
  const progress = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));
  const done = progress >= 100;
  return {
    name: op.name,
    done,
    metadata: { progressPercent: progress, target: op.target },
    // The result only materialises once the operation is done.
    response: done ? { downloadUrl: `${BASE}/downloads/${op.id}.json`, exported: op.target } : undefined
  };
}

function register(app) {
  // Kick off the operation.
  app.post(`${BASE}/exports`, (req, res) => {
    const id = String(nextOp++);
    const op = {
      id,
      name: `operations/${id}`,
      target: (req.body && req.body.target) || 'full-catalog',
      startedAt: Date.now()
    };
    operations.set(id, op);
    // 202 Accepted + Location header pointing at the pollable operation.
    res
      .status(202)
      .location(`${BASE}/operations/${id}`)
      .json(snapshot(op));
  });

  // Poll the operation.
  app.get(`${BASE}/operations/:id`, (req, res) => {
    const op = operations.get(req.params.id);
    if (!op) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `No operation '${req.params.id}'.` } });
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
    title: 'Long-Running Operations',
    blurb: 'Return 202 + a pollable Operation for work that can\'t finish in one request.',
    source: 'API Design Patterns (Geewax), ch. 10',
    docs:
      'When work takes too long for a single request — an export, a bulk import, a transcode — ' +
      'don\'t hold the connection open. Accept the request, return 202 Accepted with an ' +
      'Operation resource ({ name, done, metadata }) and a Location header, then let the client ' +
      'poll that operation until done == true.\n\n' +
      'Run "Start export" — it returns done:false with progress 0. The "Follow Location →" ' +
      'button polls the operation; click it a few times over ~6 seconds and watch ' +
      'progressPercent climb until the response payload (the downloadUrl) appears.'
  },
  demos: [
    { label: 'Start export → 202', method: 'POST', path: `${BASE}/exports`, body: { target: 'full-catalog' } },
    { label: 'Reset operations', method: 'POST', path: `${BASE}/_reset` }
  ],
  register
};
