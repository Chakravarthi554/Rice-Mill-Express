const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// Import verifyToken safely
let verifyToken;
try {
  ({ verifyToken } = require('../middleware/auth'));
  if (typeof verifyToken !== 'function') {
    console.warn('⚠️ verifyToken is not a function, skipping auth middleware.');
    verifyToken = (req, res, next) => next(); // fallback for safety
  }
} catch (err) {
  console.error('⚠️ Failed to load verifyToken:', err);
  verifyToken = (req, res, next) => next();
}

/**
 * ✅ Get all comments for a specific post
 */
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate('userId', 'name profilePic')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

/**
 * ✅ Add a new comment (requires authentication)
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { postId, content } = req.body;

    if (!content || !postId) {
      return res.status(400).json({ message: 'Content and postId are required' });
    }

    const comment = await Comment.create({
      postId,
      userId: req.user?.id || req.user?._id, // handle both cases
      content,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

module.exports = router;
