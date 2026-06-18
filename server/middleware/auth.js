'use strict';
const jwt = require('jsonwebtoken');
const { JWT_SECRET: SECRET } = require('../lib/config');
const logger = require('../lib/logger');

// Bearer-only authentication: token read strictly from the Authorization
// header (frontend localStorage), so auth is tied to the current login and
// can't fall back to a stale `token` cookie pointing at another account.
// (Trade-off: relies on localStorage Bearer; the long-term hardening is
//  HttpOnly-cookie-only auth. WS auth keeps its own cookie/token path.)
module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7); // strip 'Bearer '
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = jwt.verify(token, SECRET);
    logger.debug('auth ok', { userId: req.user.id }); // silent in production
    next();
  } catch (e) {
    logger.debug('auth failed', { error: e.name });
    const msg = e.name === 'TokenExpiredError'
      ? 'Session expired — please login again'
      : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
};
