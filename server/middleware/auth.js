'use strict';
const jwt = require('jsonwebtoken');
const { JWT_SECRET: SECRET } = require('../lib/config');

module.exports = function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(h.slice(7), SECRET);
    next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Session expired — please login again' : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
};
