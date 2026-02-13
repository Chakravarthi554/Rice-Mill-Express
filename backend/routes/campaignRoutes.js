const express = require('express');
const router = express.Router();
const {
    createCampaign,
    getCampaigns,
    getActiveCampaigns,
    updateCampaign,
    deleteCampaign
} = require('../controllers/campaignController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(protect, authorize('admin'), getCampaigns).post(protect, authorize('admin'), createCampaign);
router.route('/active').get(getActiveCampaigns);
router.route('/:id').put(protect, authorize('admin'), updateCampaign).delete(protect, authorize('admin'), deleteCampaign);

module.exports = router;
