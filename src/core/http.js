'use strict';

const crypto = require('crypto');

function error(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function notFound(res, message) {
  return error(res, 404, 'NOT_FOUND', message);
}

function etag(obj) {
  return '"' + crypto.createHash('sha1').update(JSON.stringify(obj)).digest('base64').slice(0, 16) + '"';
}

module.exports = { error, notFound, etag };
