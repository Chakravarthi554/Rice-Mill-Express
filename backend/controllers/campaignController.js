const asyncHandler = require('express-async-handler');
const Campaign = require('../models/Campaign');

// @desc    Create a new campaign
// @route   POST /api/campaigns
// @access  Private/Admin
const createCampaign = asyncHandler(async (req, res) => {
    const { title, description, startDate, endDate, type, value, valueType, minOrderValue, applicableCategories, img } = req.body;

    const campaign = await Campaign.create({
        title, description, startDate, endDate, type, value, valueType, minOrderValue, applicableCategories, img
    });

    res.status(201).json(campaign);
});

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private/Admin
const getCampaigns = asyncHandler(async (req, res) => {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    res.json(campaigns);
});

// @desc    Get active campaigns
// @route   GET /api/campaigns/active
// @access  Public
const getActiveCampaigns = asyncHandler(async (req, res) => {
    const now = new Date();
    const campaigns = await Campaign.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    }).sort({ endDate: 1 });
    res.json(campaigns);
});

// @desc    Update a campaign
// @route   PUT /api/campaigns/:id
// @access  Private/Admin
const updateCampaign = asyncHandler(async (req, res) => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
        res.status(404);
        throw new Error('Campaign not found');
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCampaign);
});

// @desc    Delete a campaign
// @route   DELETE /api/campaigns/:id
// @access  Private/Admin
const deleteCampaign = asyncHandler(async (req, res) => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
        res.status(404);
        throw new Error('Campaign not found');
    }

    await Campaign.deleteOne({ _id: req.params.id });
    res.json({ message: 'Campaign removed' });
});

module.exports = { createCampaign, getCampaigns, getActiveCampaigns, updateCampaign, deleteCampaign };
