'use strict';
const jwt = require('jsonwebtoken');
const { JWT_SECRET: SECRET } = require('../lib/config');
const logger = require('../lib/logger');

// C-3: Bearer أولاً (الجلسة الحية في هذا التبويب — يمنع الرجوع لكوكي قديم
// يخص حساباً آخر عند تعدد التبويبات)، ثم كوكي HttpOnly `token` كمسار أساسي
// بعد تحديث الصفحة — التوكن لم يعد يُخزَّن في localStorage.
module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
  if (!token) token = (req.cookies && req.cookies.token) || '';
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
