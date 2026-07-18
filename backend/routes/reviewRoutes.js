const express = require('express');
const router = express.Router();
const { updateReview, deleteReview } = require('../controllers/socialController');
const { protect } = require('../middleware/auth');

router.route('/:reviewId')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
