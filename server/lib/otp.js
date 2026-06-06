'use strict';
const crypto     = require('crypto');
const nodemailer = require('nodemailer');
const { db }     = require('../database');

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _transport = null;
function getTransport() {
  if (_transport) return _transport;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  _transport = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transport;
}

async function generateOTP(email) {
  const buf  = Buffer.alloc(3);
  crypto.randomFillSync(buf);
  const code      = (100000 + (buf.readUIntBE(0, 3) % 900000)).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  await db.invalidateOTPs(email);
  await db.createOTP({ email, code, expiresAt });
  return code;
}

async function sendOTP(email, storeName) {
  const code      = await generateOTP(email);
  const transport = getTransport();

  if (transport) {
    const from = process.env.SMTP_FROM || `"${storeName || 'SAHAR Shop'}" <${process.env.SMTP_USER}>`;
    try {
      await transport.sendMail({
        from,
        to: email,
        subject: '🔐 رمز التحقق — SAHAR Shop',
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;background:#07080D;color:#E8E4DC;border-radius:12px">
            <h2 style="color:#FF6A00;text-align:center">🔐 رمز التحقق</h2>
            <p style="text-align:center;color:#aaa">متجر <strong style="color:#FF6A00">${storeName || 'SAHAR Shop'}</strong></p>
            <div style="background:#1a1b21;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
              <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#FF6A00">${code}</span>
            </div>
            <p style="color:#888;font-size:13px;text-align:center">صالح لمدة 5 دقائق — لا تشاركه مع أحد</p>
          </div>`,
      });
      return { sent: true, method: 'email' };
    } catch (err) {
      console.error('[OTP] Email send failed:', err.message);
    }
  }

  // Console fallback for dev / no SMTP
  console.warn(`[OTP] ⚠️  No SMTP configured — OTP for ${email}: ${code}`);
  return { sent: true, method: 'console' };
}

async function verifyOTP(email, code) {
  const otp = await db.getValidOTP(email, code);
  if (!otp) return { valid: false, reason: 'invalid' };
  if (new Date(otp.expires_at) < new Date()) {
    await db.invalidateOTPs(email);
    return { valid: false, reason: 'expired' };
  }
  await db.invalidateOTPs(email);
  return { valid: true };
}

module.exports = { sendOTP, verifyOTP };
