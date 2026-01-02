const express = require('express');
const router = express.Router();

router.get('/terms', (req, res) => {
    res.json({ title: 'Terms of Service', content: 'These are the terms of service...' });
});

router.get('/privacy-policy', (req, res) => {
    res.json({ title: 'Privacy Policy', content: 'This is the privacy policy...' });
});

router.get('/refund-policy', (req, res) => {
    res.json({ title: 'Refund Policy', content: 'These are the refund policies...' });
});

module.exports = router;
