'use strict';
const { validateAuth, sanitizeBody } = require('../middleware/validate');
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const { db }  = require('../database');

const { JWT_SECRET: _secret, JWT_EXPIRES: EXPIRES, REFRESH_EXPIRES: REXP, REFRESH_EXPIRES_MS: REXP_MS } = require('../lib/config');
const { sendOTP, verifyOTP } = require('../lib/otp');

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, _secret, { expiresIn: EXPIRES });
}
function safe(user) { const { password: _, ...rest } = user; return rest; }

// Generate a secure random refresh token — store only its SHA-256 hash in DB
async function issueRefreshToken(userId) {
  const raw   = crypto.randomBytes(40).toString('hex');
  const hash  = crypto.createHash('sha256').update(raw).digest('hex');
  const expAt = new Date(Date.now() + REXP_MS).toISOString();
  await db.createRefreshToken(userId, hash, expAt);
  return raw;
}

// POST /api/auth/register
router.post('/register', sanitizeBody, validateAuth, async (req, res) => {
  try {
    const { name, email, password, storeName } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (await db.getUserByEmail(email)) return res.status(409).json({ error: 'Email already registered' });

    const user = await db.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      role: 'admin',
    });

    const { defaultSettings } = require('../defaults');
    await db.saveSettings(user.id, { ...defaultSettings, brand: { ...defaultSettings.brand, name: storeName || `${name}'s Store`, email: user.email } });
    await db.addLog({ userId: user.id, user: 'System', action: 'Account registered', details: user.email, type: 'auth', severity: 'info' });

    const token        = sign(user);
    const refreshToken = await issueRefreshToken(user.id);
    res.status(201).json({ token, refreshToken, user: safe(user) });
  } catch (e) { console.error('[Auth register]', e); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/auth/login
router.post('/login', sanitizeBody, validateAuth, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await db.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }
    await db.addLog({ userId: user.id, user: user.name, action: 'Login', details: '', type: 'auth', severity: 'info' });
    const token        = sign(user);
    const refreshToken = await issueRefreshToken(user.id);
    res.json({ token, refreshToken, user: safe(user) });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db.getUser(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: safe(user) });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/auth/refresh — exchange refresh token for a new access token (rotation)
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(401).json({ error: 'Refresh token required' });
  }
  try {
    const hash   = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const record = await db.getRefreshToken(hash);
    if (!record) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    // Revoke old token (rotation — single-use)
    await db.revokeRefreshToken(hash);

    const user = await db.getUser(record.user_id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const token      = sign(user);
    const newRefresh = await issueRefreshToken(user.id);
    res.json({ token, refreshToken: newRefresh });
  } catch (e) { console.error('[Auth refresh]', e); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/auth/logout — revoke refresh token
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken && typeof refreshToken === 'string') {
    try {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db.revokeRefreshToken(hash);
    } catch {}
  }
  res.json({ ok: true });
});

// POST /api/auth/request-otp — send OTP for 2FA (DB-backed + email delivery)
router.post('/request-otp', auth, async (req, res) => {
  try {
    const user = await db.getUser(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const settings  = await db.getSettings(req.user.id) || {};
    const storeName = settings.brand?.name || 'SAHAR Shop';
    const result    = await sendOTP(user.email, storeName);

    res.json({
      sent:   result.sent,
      method: result.method,
      email:  user.email.replace(/(.{2}).*(@)/, '$1***$2'),
    });
  } catch (e) { console.error('[OTP request]', e); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/auth/verify-otp — verify OTP (single-use, DB-backed)
router.post('/verify-otp', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'الرمز مطلوب' });
    const user = await db.getUser(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await verifyOTP(user.email, String(code).trim());
    if (!result.valid) {
      const msg = result.reason === 'expired'
        ? 'انتهت صلاحية الرمز — اطلب رمزاً جديداً'
        : 'رمز غير صحيح';
      return res.status(400).json({ error: msg });
    }
    res.json({ verified: true, message: 'تم التحقق بنجاح' });
  } catch (e) { console.error('[OTP verify]', e); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/auth/forgot-password — public: send OTP to user's email for reset
router.post('/forgot-password', sanitizeBody, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'بريد إلكتروني غير صالح' });
    }
    const user = await db.getUserByEmail(email.toLowerCase().trim());
    // Always return success — prevents user enumeration
    if (!user) return res.json({ sent: true });
    const settings  = await db.getSettings(user.id) || {};
    const storeName = settings.brand?.name || 'SAHAR Shop';
    await sendOTP(user.email, storeName);
    await db.addLog({ userId: user.id, user: 'System', action: 'Password reset requested', details: user.email, type: 'auth', severity: 'warning' });
    res.json({ sent: true, email: user.email.replace(/(.{2}).*(@)/, '$1***$2') });
  } catch (e) { console.error('[Auth forgot]', e); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/auth/reset-password — public: verify OTP then set new password
router.post('/reset-password', sanitizeBody, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    const user = await db.getUserByEmail(email.toLowerCase().trim());
    if (!user) return res.status(400).json({ error: 'رمز التحقق غير صحيح' });
    const result = await verifyOTP(user.email, String(code).trim());
    if (!result.valid) {
      const msg = result.reason === 'expired'
        ? 'انتهت صلاحية الرمز — اطلب رمزاً جديداً'
        : 'رمز التحقق غير صحيح';
      return res.status(400).json({ error: msg });
    }
    await db.updateUserPassword(user.id, await bcrypt.hash(newPassword, 10));
    await db.revokeAllRefreshTokens(user.id);
    await db.addLog({ userId: user.id, user: 'System', action: 'Password reset completed', details: user.email, type: 'auth', severity: 'warning' });
    res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور — يمكنك الدخول الآن' });
  } catch (e) { console.error('[Auth reset]', e); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/auth/change-password — change password (requires old password)
router.post('/change-password', auth, async (req, res) => {
  const oldPassword = req.body.oldPassword || req.body.current;
  const newPassword = req.body.newPassword || req.body.next;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'كلا الحقلين مطلوبان' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

  const user = await db.getUser(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.updateUserPassword(req.user.id, hashed);
  await db.revokeAllRefreshTokens(req.user.id);
  res.json({ success: true, message: 'تم تغيير كلمة المرور' });
});

module.exports = router;
