'use strict';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Config] FATAL: JWT_SECRET must be set in production. Exiting.');
    process.exit(1);
  }
  console.warn('[Config] ⚠️  JWT_SECRET not set — dev default in use. NEVER deploy without setting this.');
}

module.exports = {
  JWT_SECRET:         JWT_SECRET || 'sahar-dev-secret-CHANGE-IN-PRODUCTION-2026',
  JWT_EXPIRES:        '1h',
  REFRESH_EXPIRES:    '30d',
  REFRESH_EXPIRES_MS: 30 * 24 * 60 * 60 * 1000,
};
