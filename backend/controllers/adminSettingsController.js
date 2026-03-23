const asyncHandler = require('express-async-handler');
const AdminSettings = require('../models/AdminSettings');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/pushNotifications');

// @desc    Get admin settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getAdminSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();

    // Populate recipe of the day if exists
    if (settings.recipeOfTheDay) {
      await settings.populate('recipeOfTheDay', 'title image cookingTime rating');
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({
      message: 'Error fetching admin settings',
      error: error.message
    });
  }
});

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateAdminSettings = asyncHandler(async (req, res) => {
  try {
    const {
      platformCommissionRate,
      codLimit,
      freeDeliveryThreshold,
      deliveryFee,
      festivalMode,
      recipeOfTheDay,
      maintenanceMode,
      supportContact,
      pushNotification,
      minOrderValue,
      sellerCommission,
      autoApproveRecipes,
      autoApproveForumPosts,
      referralRewardAmount,
      minWithdrawalAmount,
      referralCampaignEnabled,
      appVersion
    } = req.body;

    let settings = await AdminSettings.getSettings();

    // Update fields if provided
    const updateFields = {};

    if (platformCommissionRate !== undefined) updateFields.platformCommissionRate = platformCommissionRate;
    if (codLimit !== undefined) updateFields.codLimit = codLimit;
    if (freeDeliveryThreshold !== undefined) updateFields.freeDeliveryThreshold = freeDeliveryThreshold;
    if (deliveryFee !== undefined) updateFields.deliveryFee = deliveryFee;
    if (festivalMode !== undefined) updateFields.festivalMode = festivalMode;
    if (recipeOfTheDay !== undefined) updateFields.recipeOfTheDay = recipeOfTheDay;
    if (maintenanceMode !== undefined) updateFields.maintenanceMode = maintenanceMode;
    if (supportContact !== undefined) updateFields.supportContact = supportContact;
    if (pushNotification !== undefined) updateFields.pushNotification = pushNotification;
    if (minOrderValue !== undefined) updateFields.minOrderValue = minOrderValue;
    if (sellerCommission !== undefined) updateFields.sellerCommission = sellerCommission;
    if (autoApproveRecipes !== undefined) updateFields.autoApproveRecipes = autoApproveRecipes;
    if (autoApproveForumPosts !== undefined) updateFields.autoApproveForumPosts = autoApproveForumPosts;
    if (referralRewardAmount !== undefined) updateFields.referralRewardAmount = referralRewardAmount;
    if (minWithdrawalAmount !== undefined) updateFields.minWithdrawalAmount = minWithdrawalAmount;
    if (referralCampaignEnabled !== undefined) updateFields.referralCampaignEnabled = referralCampaignEnabled;
    if (appVersion !== undefined) updateFields.appVersion = appVersion;

    settings = await AdminSettings.findByIdAndUpdate(
      settings._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    // Populate recipe of the day if exists
    if (settings.recipeOfTheDay) {
      await settings.populate('recipeOfTheDay', 'title image cookingTime rating');
    }

    console.log('✅ Admin settings updated by:', req.user.name);
    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      message: 'Error updating admin settings',
      error: error.message
    });
  }
});

// @desc    Send push notification to all users
// @route   POST /api/admin/settings/push-notification
// @access  Private/Admin
const sendBulkPushNotification = asyncHandler(async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: 'Title and message are required'
      });
    }

    // Get all active users
    const users = await User.find({ active: true }).select('_id');
    const userIds = users.map(user => user._id.toString());

    // Send notification to all users
    const io = req.app.get('io');
    await sendPushNotification(userIds, {
      title,
      message,
      type: 'ADMIN_BROADCAST',
      data: { timestamp: new Date().toISOString() }
    }, io);

    // Update the push notification in settings
    const settings = await AdminSettings.getSettings();
    settings.pushNotification = {
      title,
      message,
      scheduledAt: new Date()
    };
    await settings.save();

    console.log(`📢 Bulk notification sent to ${userIds.length} users by:`, req.user.name);

    res.json({
      message: `Notification sent to ${userIds.length} users successfully`,
      sentAt: new Date()
    });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({
      message: 'Error sending notification',
      error: error.message
    });
  }
});

// @desc    Get available recipes for "Recipe of the Day"
// @route   GET /api/admin/settings/recipes
// @access  Private/Admin
const getAvailableRecipes = asyncHandler(async (req, res) => {
  try {
    const recipes = await Recipe.find({ status: 'approved' })
      .select('title image cookingTime averageRating riceType createdAt')
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(50);

    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      message: 'Error fetching recipes',
      error: error.message
    });
  }
});

// @desc    Reset settings to default
// @route   POST /api/admin/settings/reset
// @access  Private/Admin
const resetSettingsToDefault = asyncHandler(async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();

    // Reset to default values
    const defaultSettings = {
      platformCommissionRate: 15,
      codLimit: 2000,
      freeDeliveryThreshold: 999,
      deliveryFee: 40,
      festivalMode: {
        enabled: false,
        name: '',
        bannerText: '',
        extraDiscount: 10
      },
      recipeOfTheDay: null,
      maintenanceMode: {
        enabled: false,
        message: 'App is under maintenance. We will be back soon!'
      },
      supportContact: {
        email: 'support@ricemill.app',
        phone: '+91 98765 43210',
        whatsapp: '+91 98765 43210'
      },
      pushNotification: {
        title: '',
        message: '',
        scheduledAt: null
      },
      minOrderValue: 100,
      sellerCommission: 85,
      autoApproveRecipes: false,
      autoApproveForumPosts: false,
      referralRewardAmount: 100,
      minWithdrawalAmount: 300,
      referralCampaignEnabled: true,
      appVersion: {
        android: '1.0.0',
        ios: '1.0.0',
        forceUpdate: false
      }
    };

    await AdminSettings.findByIdAndUpdate(settings._id, { $set: defaultSettings });

    const updatedSettings = await AdminSettings.getSettings();

    console.log('🔄 Admin settings reset to default by:', req.user.name);
    res.json({
      message: 'Settings reset to default successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      message: 'Error resetting settings',
      error: error.message
    });
  }
});

// @desc    Get public settings (non-sensitive) for customers and sellers
// @route   GET /api/settings/public
// @access  Private (all authenticated users)
const getPublicSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();

    // Return only non-sensitive settings that should be visible to customers/sellers
    const publicSettings = {
      festivalMode: settings.festivalMode || { enabled: false },
      maintenanceMode: settings.maintenanceMode || { enabled: false },
      deliverySettings: {
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        deliveryFee: settings.deliveryFee,
        minOrderValue: settings.minOrderValue
      },
      referralSettings: {
        minWithdrawalAmount: settings.minWithdrawalAmount || 300,
        referralCampaignEnabled: settings.referralCampaignEnabled !== false,
        referralRewardAmount: settings.referralRewardAmount || 100
      },
      supportContact: settings.supportContact || {},
      recipeOfTheDay: settings.recipeOfTheDay || null
    };

    // Populate recipe of the day if exists
    if (publicSettings.recipeOfTheDay) {
      await settings.populate('recipeOfTheDay', 'title image cookingTime rating');
      publicSettings.recipeOfTheDay = {
        _id: settings.recipeOfTheDay._id,
        title: settings.recipeOfTheDay.title,
        image: settings.recipeOfTheDay.image,
        cookingTime: settings.recipeOfTheDay.cookingTime,
        rating: settings.recipeOfTheDay.rating
      };
    }

    res.json(publicSettings);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({
      message: 'Error fetching settings',
      error: error.message
    });
  }
});


module.exports = {
  getAdminSettings,
  updateAdminSettings,
  sendBulkPushNotification,
  getAvailableRecipes,
  resetSettingsToDefault,
  getPublicSettings
};
