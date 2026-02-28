const multer = require("multer");
const path = require("path");

// Multer decodes filenames as latin1 by default, but browsers send UTF-8.
// This re-encodes the latin1 bytes back to a proper UTF-8 string.
function fixUtf8(str) {
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

const ALLOWED_EXTENSIONS = new Set([
  // Images
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico",
  // Documents
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".ods", ".odp",
  ".txt", ".csv", ".rtf",
  // Archives
  ".zip", ".rar", ".7z", ".tar", ".gz",
  // Video
  ".mp4", ".webm", ".ogg", ".mov", ".avi",
  // Audio
  ".mp3", ".wav", ".aac", ".flac",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  },
});

function fileFilter(req, file, cb) {
  // Fix UTF-8 filename encoding before any consumer reads originalname
  file.originalname = fixUtf8(file.originalname);

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext} is not allowed`), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
