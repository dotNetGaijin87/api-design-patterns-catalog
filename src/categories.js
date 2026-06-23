'use strict';

// パターンの分類（カテゴリ）。順序はそのまま UI のナビゲーションの並び順になる。
// 各パターンの meta.category がここの id を参照する。

module.exports = [
  { id: 'fundamentals',       label: '基礎',                   blurb: 'リソース設計の土台となる操作。' },
  { id: 'data-transfer',      label: 'データ転送の削減',       blurb: 'ペイロードと往復回数を減らし、無駄な転送を避ける。' },
  { id: 'writes-reliability', label: '書き込みと信頼性',       blurb: '失敗やリトライに強い、安全な書き込み。' },
  { id: 'security',           label: 'セキュリティ',           blurb: '認証・認可・濫用防止で API を守る。' },
  { id: 'lifecycle',          label: 'リソースのライフサイクル', blurb: 'リソースの作成・削除・復元の扱い方。' }
];
