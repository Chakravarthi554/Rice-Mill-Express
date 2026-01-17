const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, getFileType } = require('../middleware/upload');
const asyncHandler = require('express-async-handler');

// @desc    Upload single file for chat
// @route   POST /api/upload/chat
// @access  Private
router.post('/chat', protect, uploadSingle, asyncHandler(async (req, res) => {
  if (!req.cloudinaryResult) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const result = req.cloudinaryResult;
  const fileData = {
    url: result.secure_url,
    filename: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    type: getFileType(req.file.mimetype)
  };

  res.status(200).json(fileData);
}));

// @desc    Upload multiple files for chat
// @route   POST /api/upload/chat/multiple
// @access  Private
router.post('/chat/multiple', protect, uploadMultiple, asyncHandler(async (req, res) => {
  if (!req.cloudinaryResults || req.cloudinaryResults.length === 0) {
    res.status(400);
    throw new Error('No files uploaded');
  }

  const filesData = req.cloudinaryResults.map((result, index) => ({
    url: result.secure_url,
    filename: req.files[index].originalname,
    size: req.files[index].size,
    mimeType: req.files[index].mimetype,
    type: getFileType(req.files[index].mimetype)
  }));

  res.status(200).json(filesData);
}));

module.exports = router;
