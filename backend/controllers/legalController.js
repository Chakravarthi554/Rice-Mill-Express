const asyncHandler = require('express-async-handler');
const LegalPolicy = require('../models/LegalPolicy');

// @desc    Get policy by type
// @route   GET /api/legal/:type
// @access  Public
const getPolicyByType = asyncHandler(async (req, res) => {
    const { type } = req.params;

    if (!['terms', 'privacy', 'refund'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid policy type'
        });
    }

    const policy = await LegalPolicy.findOne({ type, isActive: true });

    if (!policy) {
        return res.status(404).json({
            success: false,
            message: `Policy ${type} not found`
        });
    }

    res.json({
        success: true,
        data: {
            type: policy.type,
            title: policy.title,
            content: policy.content,
            version: policy.version,
            lastUpdated: policy.lastUpdated
        }
    });
});

// @desc    Update policy (Admin Only)
// @route   PUT /api/legal/:type
// @access  Private/Admin
const updatePolicy = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { content, title, version, isActive } = req.body;

    let policy = await LegalPolicy.findOne({ type });

    if (policy) {
        policy.content = content || policy.content;
        policy.title = title || policy.title;
        policy.version = version || policy.version;
        policy.isActive = isActive !== undefined ? isActive : policy.isActive;
        await policy.save();
    } else {
        policy = await LegalPolicy.create({
            type,
            title,
            content,
            version,
            isActive
        });
    }

    res.json({
        success: true,
        data: policy
    });
});

module.exports = {
    getPolicyByType,
    updatePolicy
};
