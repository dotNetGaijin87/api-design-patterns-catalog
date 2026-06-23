'use strict';

const crypto = require('crypto');

// パターン間で共有する HTTP ヘルパー。エラー応答の形と ETag の算出を一箇所に集約する。

// 構造化されたエラーボディを返す。
function error(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

// 404 Not Found のショートカット。
function notFound(res, message) {
  return error(res, 404, 'NOT_FOUND', message);
}

// 内容から強い ETag を計算する（リソースが変われば値も変わる）。
function etag(obj) {
  return '"' + crypto.createHash('sha1').update(JSON.stringify(obj)).digest('base64').slice(0, 16) + '"';
}

module.exports = { error, notFound, etag };
