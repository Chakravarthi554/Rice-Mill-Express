const express = require('express');
const router = express.Router();
const {
  getPendingContent,
  getFlaggedContent,
  approveContent,
  rejectContent,
  deleteContent,
  pinForumPost,
  getModerationStats
} = require('../controllers/moderationController');
const { protect, admin } = require('../middleware/auth');

// All routes are protected and admin-only
router.use(protect, admin);

router.get('/pending', getPendingContent);
router.get('/flagged', getFlaggedContent);
router.get('/stats', getModerationStats);
router.put('/approve/:type/:id', approveContent);
router.put('/reject/:type/:id', rejectContent);
router.delete('/delete/:type/:id', deleteContent);
router.put('/pin/forum/:id', pinForumPost);

module.exports = router;