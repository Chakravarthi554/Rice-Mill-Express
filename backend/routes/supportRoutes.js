const express = require('express');
const router = express.Router();
const {
    createTicket,
    getAdminTickets,
    getUserTickets,
    updateTicketStatus,
    getTicketDetails
} = require('../controllers/supportController');
const { protect, admin } = require('../middleware/auth');

// Customer & Admin Shared
router.route('/tickets').post(protect, createTicket);
router.route('/tickets').get(protect, getUserTickets);
router.route('/tickets/:id').get(protect, getTicketDetails);

// Admin Only
router.route('/admin/tickets').get(protect, admin, getAdminTickets);
router.route('/admin/tickets/:id').put(protect, admin, updateTicketStatus);

module.exports = router;
