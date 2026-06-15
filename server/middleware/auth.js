'use strict';
const jwt = require('jsonwebtoken');
const { JWT_SECRET: SECRET } = require('../lib/config');

module.exports = function auth(req, res, next) {
  // قراءة التوكن فقط من Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[auth] No Bearer token provided');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.slice(7); // إزالة 'Bearer '
  if (!token) {
    console.log('[auth] Empty token');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    req.user = jwt.verify(token, SECRET);
    console.log('[auth] User authenticated:', req.user.id);
    next();
  } catch (e) {
    console.log('[auth] Token verification failed:', e.name);
    const msg = e.name === 'TokenExpiredError' 
      ? 'Session expired — please login again' 
      : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
};