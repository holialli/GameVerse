const path = require('path');
const fs = require('fs');

// Handle file upload
exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/public/uploads/${req.file.filename}`;

    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
