const express = require('express');
const router = express.Router();
const {
  likeItem,
  addComment,
  getComments,
  approveComment,
  deleteComment,
  trackShare,
  getSocialAnalytics
} = require('../controllers/socialController');
const { protect, role } = require('../middleware/auth');

// Social routes for products, recipes, and forum
router.post('/:type/:id/like', protect, likeItem);
router.post('/:type/:id/comment', protect, addComment);
router.get('/:type/:id/comments', getComments);
router.put('/:type/:id/comments/:commentId/approve', protect, role('admin'), approveComment);
router.delete('/:type/:id/comments/:commentId', protect, deleteComment);
router.post('/:type/:id/share', protect, trackShare);

// Admin analytics
router.get('/admin/social-analytics', protect, role('admin'), getSocialAnalytics);

module.exports = router;

