const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPendingPosts,
  getPostById,
  replyToPost,
  likePost,
  approvePost,
  reportPost,
  deletePost,
  pinPost,
  moderateComment,
  reportComment,
  getFlaggedComments,
  getAdminStats,
  getReports,
  getReportById,
  takeReportAction,
  getReportStats,
  bookmarkPost,
  getUserBookmarks,
  customerLimiter,
  sellerLimiter
} = require('../controllers/forumController');
const { protect, admin, role } = require('../middleware/auth');

// Apply rate limit based on role
const applyPostLimiter = (req, res, next) => {
  if (req.user?.role === 'customer') {
    return customerLimiter(req, res, next);
  } else {
    return sellerLimiter(req, res, next);
  }
};

// 🔥 CRITICAL FIX: ADMIN ROUTES - Move above param routes to prevent shadowing
router.get('/admin/pending', protect, admin, getPendingPosts);
router.put('/admin/:id/approve', protect, admin, approvePost);
router.delete('/admin/:id', protect, admin, deletePost);
router.put('/admin/:id/pin', protect, admin, pinPost);
router.post('/admin/:postId/comments/:commentId/moderate', protect, admin, moderateComment);
router.get('/admin/moderation/flagged-comments', protect, admin, getFlaggedComments);
router.get('/admin/stats', protect, admin, getAdminStats);

// 🔥 NEW: Report management routes (Admin only)
router.get('/admin/reports', protect, admin, getReports);
router.get('/admin/reports/stats', protect, admin, getReportStats);
router.get('/admin/reports/:reportId', protect, admin, getReportById);
router.post('/admin/reports/:reportId/action', protect, admin, takeReportAction);

// 🔥 PUBLIC ROUTES
router.get('/', getPosts);

// 🔥 Bookmark routes (Protected) - MUST be before /:id to prevent shadowing
router.post('/:id/bookmark', protect, bookmarkPost);
router.get('/bookmarks', protect, getUserBookmarks);

// 🔥 Generic ID route - MUST be after specific routes
router.get('/:id', getPostById);

// 🔥 PROTECTED ROUTES
router.post('/', protect, applyPostLimiter, createPost);
router.post('/:id/reply', protect, replyToPost);
router.post('/:id/like', protect, likePost);
router.post('/:id/report', protect, reportPost);
router.delete('/:id', protect, deletePost); // Allow post owners to delete their own posts

// 🔥 Mixed role routes
router.post('/:postId/comments/:commentId/report', protect, reportComment);

module.exports = router;