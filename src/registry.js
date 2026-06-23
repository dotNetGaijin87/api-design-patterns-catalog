'use strict';

// The ordered list of pattern modules. Adding a new pattern is a one-file
// change: create src/patterns/<name>.js exporting { meta, demos, register }
// and drop it into this array. The server and the UI pick it up automatically.

module.exports = [
  require('./patterns/standard-methods'),
  require('./patterns/pagination'),
  require('./patterns/filtering'),
  require('./patterns/partial-response'),
  require('./patterns/conditional-requests'),
  require('./patterns/long-running-operations'),
  require('./patterns/idempotency'),
  require('./patterns/soft-deletion')
];
