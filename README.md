# API デザインパターン — インタラクティブ・プレイグラウンド

よく使われる **Web API のデザインパターン** を、それぞれ実際に動作する HTTP エンドポイント
として体験できる、小さく実行可能なリファレンスです。左の一覧からパターンを選び、リクエストを
クリックすると、右側のコンソールに「リクエスト・レスポンス（ステータス・ヘッダー・ボディ）・
妥当な次の操作（`Location` をたどる、ページトークンを追う）」が表示されます。画面をスクロール
しなくても結果が確認できます。

例として扱うリソースは、よく知られた日本の書籍の小さなカタログです。パターンを示すための
馴染みのある中立的なドメインとして使っているだけです。

![patterns](https://img.shields.io/badge/patterns-7-4f46e5) ![node](https://img.shields.io/badge/node-%E2%89%A518-3c873a)

## クイックスタート

```bash
npm start            # 依存関係なし — npm install は不要
# http://localhost:3000 を開く
```

**依存パッケージはありません。** サーバーは Node 標準の `http` モジュールを、小さな
Express 風シム（[src/lib/mini-app.js](src/lib/mini-app.js)）経由で利用するため、`npm install`
は不要です。Node ≥ 18 が必要です。

ポート 3000 が使用中の場合は、別のポートを指定します:

```bash
PORT=5050 npm start
```

編集中の自動リロードには `npm run dev`（Node 標準の `--watch`）を使ってください。

## 含まれるパターン

| パターン | 何を示すか | エンドポイント名前空間 |
|---|---|---|
| **標準メソッド（CRUD）** | List / Get / Create / Update / Delete の正攻法。`201 + Location`、部分更新の `PATCH`、`204` | `/api/standard-methods` |
| **ページネーション** | 不透明な `nextPageToken` カーソルによる固定サイズのページ | `/api/pagination` |
| **フィルタリング** | AND で結合するクエリパラメータでコレクションを絞り込む | `/api/filtering` |
| **部分レスポンス** | フィールドマスク（`?fields=id,title`）で over-fetching を避ける | `/api/partial-response` |
| **長時間実行オペレーション** | `202 Accepted` ＋ 進捗をポーリングできる Operation | `/api/lro` |
| **冪等性キー** | 安全な POST リトライ。同じ `Idempotency-Key` は元の結果を返す | `/api/idempotency` |
| **ソフトデリート** | 物理削除ではなくトゥームストーン化。`showDeleted` と `:undelete` | `/api/soft-deletion` |

## 構成

```
server.js              HTTP サーバー: UI を配信し、全パターンをマウントする
src/
  data.js              共有シードデータ（書籍カタログ）＋ デモごとのコピー
  registry.js          パターンモジュールの順序付きリスト
  patterns/*.js        パターンごとに 1 つの自己完結したモジュール
public/
  index.html           プレイグラウンドの土台（3 カラムレイアウト）
  app.js               データ駆動の UI: /api/_meta を読み、リクエストをライブ実行
  style.css            スタイル
```

画面は 3 カラム構成です。**左**: パターン一覧、**中央**: 解説とデモ用リクエスト、
**右**: リクエスト／レスポンスのコンソール（常に表示）。

UI は単一のエンドポイント `GET /api/_meta` だけで駆動されます。これは各パターンの
メタデータとデモリクエストを返します。フロントエンドはパターンをハードコードせず、
API が公開する内容をそのまま描画します。

### 新しいパターンの追加

`src/patterns/<name>.js` を作成して `{ meta, demos, register }` を export し、
`src/registry.js` の配列に加えるだけです。サーバーがルートをマウントし、UI も自動的に
取り込みます。ほかに変更は要りません。

```js
module.exports = {
  meta: { id, title, blurb, docs },
  demos: [{ label, method, path, headers?, body? }],
  register(app) { app.get('/api/<name>/...', handler); }
};
```

## メモ

- データはすべてメモリ上にあり、再起動でリセットされます。状態を変更するパターンには
  **リセット**用リクエストも用意してあり、いつでもクリーンな状態に戻せます。
- ローカルの PDF はリポジトリを軽く保つため git 管理から除外しています。PDF をコミット
  したい場合は `.gitignore` の `*.pdf` の行を削除してください。
