var util = require('util'),
    winston = require('winston'),
    raven = require('raven'),
    Transport = require('winston/lib/winston/transports/transport.js').Transport;

var SENTRY_LOG_LEVELS = [
  'debug',
  'info',
  'warning',
  'error',
  'fatal'
];

//
// ### function Sentry (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Sentry transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var Sentry = exports.Sentry = function (options) {
  Transport.call(this, options);
  options = options || {};

  this.name = 'sentry';
  this.dsn = options.dsn;

var clients = {};
  SENTRY_LOG_LEVELS.forEach(function (level) {
    clients[level] = new raven.Client(options.dsn, { level: level });
  });
  this._clients = clients;
};

util.inherits(Sentry, winston.Transport);

//
// Expose the name of this Transport on the prototype
//
Sentry.prototype.name = 'sentry';

//
// ### function _request (options, callback)
// #### @callback {function} Continuation to respond to when complete.
// Make a request to a winstond server or any Sentry server which can
// handle json-rpc.
//

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Sentry.prototype.log = function (level, msg, meta, tags, callback) {
  var self = this, client;
  if (typeof meta === 'function') {
    callback = meta;
    meta = {};
    tags = {};
  } else if (typeof tags === 'function') {
    callback = tags;
    tags = {};
  }

  if (this._clients.hasOwnProperty(level)) {
    client = this._clients[level];
  } else {
    client = this._clients.debug;
  }
  client.captureMessage(msg, { extra: meta, tags: tags });

  client.on('logged', function () {
    self.emit('logged');
    if (callback) callback(null, true);
  });

  client.on('error', function (err) {
    return callback(err);
  });
};
