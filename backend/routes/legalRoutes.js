const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const { getPolicyByType, updatePolicy } = require('../controllers/legalController');

// Dynamic policy route
router.get('/:type', getPolicyByType);

// Admin only update route (add auth middleware if relevant in your system)
// router.put('/:type', admin, updatePolicy);

const { protect } = require('../middleware/auth');
const { createTicket } = require('../controllers/supportController');

// Dynamic policy route
router.get('/:type', getPolicyByType);

// Admin only update route (add auth middleware if relevant in your system)
// router.put('/:type', admin, updatePolicy);

// ✅ Contact form submission - Refactored to support ticket system
router.post('/contact', protect, createTicket);

module.exports = router;
