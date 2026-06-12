'use strict';
const jwt = require('jsonwebtoken');
const { JWT_SECRET: SECRET } = require('../lib/config');

module.exports = function auth(req, res, next) {
  // هجين آمن: Authorization header أولاً، ثم كوكي HttpOnly كبديل
  // (تمهيد للتخلي عن localStorage دون كسر الجلسات الحالية)
  const h = req.headers.authorization;
  const raw = (h && h.startsWith('Bearer ')) ? h.slice(7) : req.cookies?.token;
  if (!raw) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(raw, SECRET);
    next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Session expired — please login again' : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
};
