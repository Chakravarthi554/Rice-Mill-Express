const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth');
const {
  submitKycApplication,
  getKycApplications,
  approveKycApplication,
  rejectKycApplication,
  getKycStatus,
  uploadMiddleware,
} = require('../controllers/kycController');

// Submit KYC
router.post('/submit', protect, uploadMiddleware, submitKycApplication);

// Check status
router.get('/status', protect, getKycStatus);

// Admin: Get all applications
router.get('/applications', protect, role('admin'), getKycApplications);

// Admin: Approve
router.put('/approve/:id', protect, role('admin'), approveKycApplication);

// Admin: Reject
router.put('/reject/:id', protect, role('admin'), rejectKycApplication);

module.exports = router;