'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const path   = require('path');
const fs     = require('fs');
const multer = require('multer');

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
// Checks the first 12 bytes of the buffer for known image signatures
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
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sahar-shop', resource_type: 'image', ...options },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
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
      const result = await uploadToCloudinary(req.file.buffer, {
        public_id: `${req.user.id}-${Date.now()}`,
      });
      return res.json({ url: result.secure_url, filename: result.public_id, size: result.bytes });
    }

    // ⚠️ Local fallback: ephemeral on Railway — configure Cloudinary for persistence
    const ext      = path.extname(req.file.originalname) || '.jpg';
    const filename = `${req.user.id}-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
    res.json({ url: `/api/media/files/${filename}`, filename, size: req.file.size });
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

  // ⚠️ Base64 images can be large — warn if approaching Railway's 20 MB body limit
  if (buffer.length > 15 * 1024 * 1024) {
    console.warn(`[Media] Large base64 image: ${(buffer.length / 1024 / 1024).toFixed(1)} MB from user ${req.user.id}`);
  }

  try {
    if (CLOUDINARY_CONFIGURED) {
      const result = await uploadToCloudinary(buffer, {
        public_id: `${req.user.id}-${Date.now()}`,
        format: ext,
      });
      return res.json({ url: result.secure_url, filename: result.public_id });
    }

    // ⚠️ Local fallback: ephemeral on Railway
    const filename = `${req.user.id}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
    res.json({ url: `/api/media/files/${filename}`, filename });
  } catch (e) {
    console.error('[Media] base64 upload error:', e.message);
    res.status(500).json({ error: 'Failed to save image' });
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
