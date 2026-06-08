'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');
const https  = require('https');
const multer = require('multer');
const { db } = require('../database');

// ── Cloudinary adapter ────────────────────────────────────────
// If CLOUDINARY_* env vars are set, all uploads go to Cloudinary (persistent).
// Otherwise falls back to local disk (ephemeral on Railway — loses files on deploy).
const CLOUDINARY_CONFIGURED =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY    &&
  process.env.CLOUDINARY_API_SECRET;

let cloudinary = null;
if (CLOUDINARY_CONFIGURED) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
  console.log('[Media] Cloudinary adapter active — uploads are persistent');
} else {
  console.warn('[Media] ⚠️  Cloudinary not configured — using local disk (ephemeral on Railway). Set CLOUDINARY_* env vars for persistent storage.');
}

// ── Local fallback dir ────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Magic-bytes validator — rejects non-image data regardless of MIME ──
const IMAGE_SIGNATURES = [
  { sig: Buffer.from([0xFF, 0xD8, 0xFF]),             ext: 'jpg'  }, // JPEG
  { sig: Buffer.from([0x89, 0x50, 0x4E, 0x47]),       ext: 'png'  }, // PNG
  { sig: Buffer.from([0x47, 0x49, 0x46]),              ext: 'gif'  }, // GIF
  { sig: Buffer.from([0x52, 0x49, 0x46, 0x46]),        ext: 'webp' }, // WEBP (RIFF header)
  { sig: Buffer.from([0x00, 0x00, 0x00]),              ext: 'mp4'  }, // skip — not an image
];
function isValidImageBuffer(buf) {
  return IMAGE_SIGNATURES.slice(0, 4).some(({ sig }) =>
    buf.slice(0, sig.length).equals(sig)
  );
}

// ── Cloudinary upload helper (stream-based, no tmp file) ──────
const UPLOAD_TIMEOUT_MS = 30000;
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Cloudinary upload timed out (30s)')), UPLOAD_TIMEOUT_MS);
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sahar-shop', resource_type: 'image', ...options },
      (err, result) => { clearTimeout(timer); err ? reject(err) : resolve(result); }
    );
    stream.on('error', (e) => { clearTimeout(timer); reject(e); });
    stream.end(buffer);
  });
}

// ── Dynamic Cloudinary upload using user's DB credentials (no global state) ──
async function uploadToCloudinaryDynamic(buffer, cloudName, apiKey, apiSecret) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'sahar-shop';
  const sig = crypto.createHash('sha256')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const boundary = 'sb' + crypto.randomBytes(8).toString('hex');
  const CRLF = '\r\n';
  const field = (name, val) => Buffer.from(
    `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${val}${CRLF}`
  );

  const body = Buffer.concat([
    field('api_key', apiKey),
    field('timestamp', String(timestamp)),
    field('signature', sig),
    field('folder', folder),
    Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="file"; filename="img.jpg"${CRLF}Content-Type: image/jpeg${CRLF}${CRLF}`),
    buffer,
    Buffer.from(`${CRLF}--${boundary}--${CRLF}`),
  ]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloudName}/image/upload`,
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const r = JSON.parse(d);
          if (r.error) reject(new Error(r.error.message));
          else resolve({ secure_url: r.secure_url, public_id: r.public_id, bytes: r.bytes });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Multer config (memory storage so we can inspect + forward to Cloudinary) ─
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// POST /api/media/upload  (multipart/form-data)
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Magic-bytes check on actual buffer
  if (!isValidImageBuffer(req.file.buffer)) {
    return res.status(400).json({ error: 'Invalid image data — magic bytes mismatch' });
  }

  try {
    if (CLOUDINARY_CONFIGURED) {
      const result = await uploadToCloudinary(req.file.buffer, { public_id: `${req.user.id}-${Date.now()}` });
      return res.json({ url: result.secure_url, filename: result.public_id, size: result.bytes, provider: 'cloudinary' });
    }

    // Fallback: check user's DB Cloudinary settings
    const us = await db.getSettings(req.user.id) || {};
    if (us.cloudinaryCloudName && us.cloudinaryApiKey && us.cloudinaryApiSecret) {
      const result = await uploadToCloudinaryDynamic(req.file.buffer, us.cloudinaryCloudName, us.cloudinaryApiKey, us.cloudinaryApiSecret);
      return res.json({ url: result.secure_url, filename: result.public_id, size: result.bytes, provider: 'cloudinary' });
    }

    // ⚠️ Local fallback: ephemeral on Railway — connect Cloudinary for persistence
    const ext      = path.extname(req.file.originalname) || '.jpg';
    const filename = `${req.user.id}-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
    res.json({ url: `/api/media/files/${filename}`, filename, size: req.file.size, provider: 'local' });
  } catch (e) {
    console.error('[Media] upload error:', e.message);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/media/upload-base64  (JSON body with base64 string)
router.post('/upload-base64', auth, async (req, res) => {
  const { data, ext = 'jpg' } = req.body;
  if (!data) return res.status(400).json({ error: 'No data' });

  // Strip data URI prefix and decode
  const base64str = data.replace(/^data:image\/\w+;base64,/, '');
  let buffer;
  try {
    buffer = Buffer.from(base64str, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid base64 encoding' });
  }

  // Magic-bytes validation — prevents disguised executables
  if (!isValidImageBuffer(buffer)) {
    return res.status(400).json({ error: 'Invalid image data — magic bytes mismatch' });
  }

  // Reject oversized images — protects memory when Cloudinary is not active
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(413).json({ error: 'الصورة كبيرة جداً (الحد الأقصى 5 ميجا) — يرجى ضغطها أولاً أو استخدام Cloudinary' });
  }

  try {
    if (CLOUDINARY_CONFIGURED) {
      const result = await uploadToCloudinary(buffer, { public_id: `${req.user.id}-${Date.now()}`, format: ext });
      return res.json({ url: result.secure_url, filename: result.public_id, provider: 'cloudinary' });
    }

    // Fallback: check user's DB Cloudinary settings
    const us = await db.getSettings(req.user.id) || {};
    if (us.cloudinaryCloudName && us.cloudinaryApiKey && us.cloudinaryApiSecret) {
      const result = await uploadToCloudinaryDynamic(buffer, us.cloudinaryCloudName, us.cloudinaryApiKey, us.cloudinaryApiSecret);
      return res.json({ url: result.secure_url, filename: result.public_id, provider: 'cloudinary' });
    }

    // ⚠️ Local fallback: ephemeral on Railway
    const filename = `${req.user.id}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
    res.json({ url: `/api/media/files/${filename}`, filename, provider: 'local' });
  } catch (e) {
    console.error('[Media] base64 upload error:', e.message);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

// ── Video uploader (MP4 / MOV / WEBM) ─────────────────────────
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files allowed'));
  },
});

// POST /api/media/upload-video  (multipart/form-data, field "video")
router.post('/upload-video', auth, uploadVideo.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded' });
  const okExt = ['mp4', 'mov', 'webm', 'quicktime'];
  const mime = (req.file.mimetype || '').toLowerCase();
  if (!okExt.some(e => mime.includes(e))) {
    return res.status(400).json({ error: 'صيغة الفيديو غير مدعومة — استخدم MP4 أو MOV أو WEBM' });
  }
  try {
    if (CLOUDINARY_CONFIGURED) {
      const result = await uploadToCloudinary(req.file.buffer, {
        public_id: `${req.user.id}-vid-${Date.now()}`,
        resource_type: 'video',
      });
      return res.json({ url: result.secure_url, filename: result.public_id, size: result.bytes, provider: 'cloudinary' });
    }
    // Local fallback (ephemeral)
    const ext      = path.extname(req.file.originalname) || '.mp4';
    const filename = `${req.user.id}-vid-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
    res.json({ url: `/api/media/files/${filename}`, filename, size: req.file.size, provider: 'local' });
  } catch (e) {
    console.error('[Media] video upload error:', e.message);
    res.status(500).json({ error: 'فشل رفع الفيديو' });
  }
});

// GET /api/media/files/:filename  (serve local uploads — no-op when Cloudinary is active)
router.get('/files/:filename', (req, res) => {
  // Sanitise filename — prevent path traversal
  const safe = path.basename(req.params.filename);
  const fp   = path.join(UPLOAD_DIR, safe);
  if (!fs.existsSync(fp)) return res.status(404).send('Not found');
  res.sendFile(fp);
});

module.exports = router;
