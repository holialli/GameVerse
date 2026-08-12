const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_DIR || './public/uploads';

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Magic-byte signatures for the image types we accept. The client-supplied
// mimetype/extension are attacker-controlled and are checked only as a
// cheap early rejection in fileFilter - the actual saved extension is
// always derived from these signatures (see verifyUploadedImage below),
// never from file.originalname.
const SIGNATURES = [
  { ext: '.png', mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: '.jpg', mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { ext: '.gif', mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
];

const detectImageSignature = (buffer) => {
  for (const sig of SIGNATURES) {
    if (buffer.length >= sig.bytes.length && sig.bytes.every((b, i) => buffer[i] === b)) {
      return sig;
    }
  }
  // WEBP: 'RIFF'....'WEBP'
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { ext: '.webp', mime: 'image/webp' };
  }
  return null;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // No extension here - content hasn't been written yet, so we can't
    // trust originalname's extension. verifyUploadedImage appends the
    // real, signature-derived extension once bytes are on disk.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
});

// Post-write verification: reads the first bytes of the saved file and
// confirms they actually match a supported image signature, then renames
// the file to carry the detected (not claimed) extension. Rejects anything
// that doesn't match, closing the spoofed-content-type stored-XSS path.
const verifyUploadedImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;

  fs.open(filePath, 'r', (openErr, fd) => {
    if (openErr) {
      return res.status(500).json({ message: 'Failed to process uploaded file' });
    }

    const header = Buffer.alloc(12);
    fs.read(fd, header, 0, 12, 0, (readErr, bytesRead) => {
      fs.close(fd, () => {});
      if (readErr) {
        fs.unlink(filePath, () => {});
        return res.status(500).json({ message: 'Failed to process uploaded file' });
      }

      const signature = detectImageSignature(header.subarray(0, bytesRead));
      if (!signature) {
        fs.unlink(filePath, () => {});
        return res.status(400).json({ message: 'Uploaded file is not a valid image' });
      }

      const newFilename = req.file.filename + signature.ext;
      const newPath = path.join(path.dirname(filePath), newFilename);

      fs.rename(filePath, newPath, (renameErr) => {
        if (renameErr) {
          fs.unlink(filePath, () => {});
          return res.status(500).json({ message: 'Failed to process uploaded file' });
        }

        req.file.filename = newFilename;
        req.file.path = newPath;
        req.file.mimetype = signature.mime;
        next();
      });
    });
  });
};

module.exports = upload;
module.exports.verifyUploadedImage = verifyUploadedImage;
