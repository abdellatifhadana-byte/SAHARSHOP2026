'use strict';
// ============================================================
// Structured logger — leveled & timestamped.
// JSON lines in production (machine-parseable / shippable to a
// log aggregator), pretty output in development.
// Optional Sentry-compatible capture hook (no-op until wired).
// ============================================================
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT = (process.env.LOG_LEVEL && LEVELS[process.env.LOG_LEVEL] !== undefined)
  ? LEVELS[process.env.LOG_LEVEL]
  : (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug);
const isProd = process.env.NODE_ENV === 'production';

function emit(level, msg, meta) {
  if (LEVELS[level] > CURRENT) return;
  const ts = new Date().toISOString();
  const fn = console[level] ? level : 'log';
  if (isProd) {
    try { console[fn](JSON.stringify({ ts, level, msg, ...(meta || {}) })); }
    catch { console[fn](JSON.stringify({ ts, level, msg })); }
  } else {
    const tag = { error: '❌', warn: '⚠️', info: 'ℹ️', debug: '·' }[level] || '';
    console[fn](`${tag} [${level}] ${msg}`, meta || '');
  }
}

module.exports = {
  error: (m, meta) => emit('error', m, meta),
  warn:  (m, meta) => emit('warn', m, meta),
  info:  (m, meta) => emit('info', m, meta),
  debug: (m, meta) => emit('debug', m, meta),
  // Wire an error-tracking SDK by setting global.__sentry = Sentry (optional).
  capture: (err, ctx) => {
    try { if (global.__sentry && typeof global.__sentry.captureException === 'function') global.__sentry.captureException(err, ctx); }
    catch { /* never throw from logging */ }
  },
};
