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

// 🔥 CRITICAL FIX: PUBLIC ROUTES - No authentication required for public forum access
router.get('/', getPosts);
router.get('/:id', getPostById);

// 🔥 CRITICAL FIX: PROTECTED ROUTES - Authentication required but all roles allowed
router.post('/', protect, applyPostLimiter, createPost);
router.post('/:id/reply', protect, replyToPost);
router.post('/:id/like', protect, likePost);
router.post('/:id/report', protect, reportPost);

// 🔥 CRITICAL FIX: ADMIN ROUTES - protect FIRST, admin SECOND with proper error handling
router.get('/admin/pending', protect, admin, getPendingPosts);
router.put('/admin/:id/approve', protect, admin, approvePost);
router.delete('/admin/:id', protect, admin, deletePost);
router.put('/admin/:id/pin', protect, admin, pinPost);
router.post('/admin/:postId/comments/:commentId/moderate', protect, admin, moderateComment);
router.get('/admin/moderation/flagged-comments', protect, admin, getFlaggedComments);
router.get('/admin/stats', protect, admin, getAdminStats);

// 🔥 NEW: Mixed role routes - protect first, then specific roles
router.post('/:postId/comments/:commentId/report', protect, reportComment);

// 🔥 NEW: Report management routes (Admin only)
router.get('/admin/reports', protect, admin, getReports);
router.get('/admin/reports/stats', protect, admin, getReportStats);
router.get('/admin/reports/:reportId', protect, admin, getReportById);
router.post('/admin/reports/:reportId/action', protect, admin, takeReportAction);

// 🔥 NEW: Bookmark routes (Protected)
router.post('/:id/bookmark', protect, bookmarkPost);
router.get('/bookmarks', protect, getUserBookmarks);

module.exports = router;