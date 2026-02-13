const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

router.get('/terms', (req, res) => {
    res.json({ title: 'Terms of Service', content: 'These are the terms of service...' });
});

router.get('/privacy-policy', (req, res) => {
    res.json({ title: 'Privacy Policy', content: 'This is the privacy policy...' });
});

router.get('/refund-policy', (req, res) => {
    res.json({ title: 'Refund Policy', content: 'These are the refund policies...' });
});

// ✅ NEW: Contact form submission
router.post('/contact', asyncHandler(async (req, res) => {
    const { name, email, subject, message, category } = req.body;
    
    // Validation
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid email format' 
        });
    }
    
    try {
        // Log the contact request (in production, save to database or send email)
        console.log('📬 New Contact Form Submission:', {
            name,
            email,
            subject,
            category,
            message: message.substring(0, 100) + '...' // Truncate for logging
        });
        
        // TODO: In production, integrate with:
        // - Email service (SendGrid, AWS SES, etc.)
        // - Database storage for tracking
        // - Admin notification system
        
        res.status(200).json({
            success: true,
            message: 'Thank you for contacting us. We will respond within 24-48 hours.'
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process your request. Please try again later.'
        });
    }
}));

module.exports = router;
