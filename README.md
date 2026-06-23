# API Design Patterns — Interactive Playground

A small, runnable reference that demonstrates common **web API design patterns**,
each as a real, live HTTP endpoint with an interactive UI. Pick a pattern in the
sidebar, click a request, and watch it work — the request, the response (status,
headers, body), and the natural next step (follow a `Location`, chase a
pagination token).

The example resource is a small, neutral catalog of (fictional) books, used
purely as a familiar domain for demonstrating the patterns.

![patterns](https://img.shields.io/badge/patterns-7-4f46e5) ![node](https://img.shields.io/badge/node-%E2%89%A518-3c873a)

## Quick start

```bash
npm start            # no dependencies — npm install is not required
# open http://localhost:3000
```

There are **no dependencies** — the server runs on Node's built-in `http`
module via a tiny Express-flavoured shim ([src/lib/mini-app.js](src/lib/mini-app.js)),
so `npm install` is optional. Requires Node ≥ 18.

If port 3000 is busy, pick another:

```bash
PORT=5050 npm start
```

Use `npm run dev` for auto-reload while editing (Node's built-in `--watch`).

## Patterns included

| Pattern | What it shows | Endpoint namespace |
|---|---|---|
| **Standard Methods (CRUD)** | List / Get / Create / Update / Delete done right, with `201 + Location`, partial `PATCH`, and `204` | `/api/standard-methods` |
| **Pagination** | Bounded pages with an opaque `nextPageToken` cursor | `/api/pagination` |
| **Filtering** | Narrow a collection with AND-combined query params | `/api/filtering` |
| **Partial Response** | Field masks (`?fields=id,title`) to avoid over-fetching | `/api/partial-response` |
| **Long-Running Operations** | `202 Accepted` + a pollable Operation with live progress | `/api/lro` |
| **Idempotency Keys** | Safe POST retries — the same `Idempotency-Key` replays the original result | `/api/idempotency` |
| **Soft Deletion** | Tombstones instead of erasure, with `showDeleted` and `:undelete` | `/api/soft-deletion` |

## How it's wired

```
server.js              HTTP server: serves the UI + mounts every pattern
src/
  data.js              Shared seed dataset (sample book catalog) + per-demo copies
  registry.js          The ordered list of pattern modules
  patterns/*.js        One self-contained module per pattern
public/
  index.html           The playground shell
  app.js               Data-driven UI: reads /api/_meta, runs requests live
  style.css            Styling
```

The UI is entirely driven by a single endpoint, `GET /api/_meta`, which returns
each pattern's metadata plus its demo requests. The frontend never hard-codes a
pattern — it just renders whatever the API advertises.

### Adding a new pattern

Create `src/patterns/<name>.js` exporting `{ meta, demos, register }`, then add
it to the array in `src/registry.js`. The server mounts its routes and the UI
picks it up automatically — no other changes needed.

```js
module.exports = {
  meta: { id, title, blurb, docs },
  demos: [{ label, method, path, headers?, body? }],
  register(app) { app.get('/api/<name>/...', handler); }
};
```

## Notes

- All data lives in memory and resets on restart; mutating patterns also expose
  a **Reset** request so you can return to a clean slate at any time.
- Any local PDFs are git-ignored to keep the repo light. Remove the `*.pdf` line
  from `.gitignore` if you want to commit PDFs.
