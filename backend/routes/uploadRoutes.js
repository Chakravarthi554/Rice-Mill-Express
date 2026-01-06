const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { uploadProfileImage } = require('../controllers/userController');

const router = express.Router();

const upload = require('../middleware/uploadMiddleware');

// Profile image upload
router.post('/profile-image', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const result = await uploadProfileImage(req, res);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Multiple files upload
router.post('/', protect, upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  res.status(200).json({
    message: 'Files uploaded successfully',
    files: req.files.map(file => ({
      originalName: file.originalname,
      fileName: file.filename,
      filePath: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    })),
  });
});

module.exports = router;
