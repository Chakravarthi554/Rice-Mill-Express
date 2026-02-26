const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  // Platform Commission Settings
  platformCommissionRate: {
    type: Number,
    default: 15,
    min: 5,
    max: 30,
    required: true
  },

  // COD Settings
  codLimit: {
    type: Number,
    default: 2000,
    min: 500,
    max: 10000,
    required: true
  },

  // Delivery Settings
  freeDeliveryThreshold: {
    type: Number,
    default: 999,
    min: 0,
    max: 5000
  },
  deliveryFee: {
    type: Number,
    default: 40,
    min: 0,
    max: 200
  },

  // Festival & Promotional Settings
  festivalMode: {
    enabled: { type: Boolean, default: false },
    name: { type: String, default: '' },
    bannerText: { type: String, default: '' },
    extraDiscount: { type: Number, default: 10, min: 0, max: 50 }
  },

  // Recipe of the Day
  recipeOfTheDay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null
  },

  // App Settings
  maintenanceMode: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: 'App is under maintenance. We will be back soon!' }
  },

  // Support Settings
  supportContact: {
    email: { type: String, default: 'support@ricemill.app' },
    phone: { type: String, default: '+91 98765 43210' },
    whatsapp: { type: String, default: '+91 98765 43210' }
  },

  // Notification Settings
  pushNotification: {
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    scheduledAt: { type: Date, default: null }
  },

  // Platform Rules
  minOrderValue: {
    type: Number,
    default: 100,
    min: 0,
    max: 1000
  },

  sellerCommission: {
    type: Number,
    default: 85,
    min: 70,
    max: 95
  },

  // Auto-approval settings
  autoApproveRecipes: {
    type: Boolean,
    default: false
  },

  autoApproveForumPosts: {
    type: Boolean,
    default: false
  },

  // Referral & Reward Settings
  referralRewardReferrer: {
    type: Number,
    default: 500,
    min: 0
  },
  referralRewardReferee: {
    type: Number,
    default: 200,
    min: 0
  },
  minWithdrawalAmount: {
    type: Number,
    default: 300,
    min: 100
  },
  referralCampaignEnabled: {
    type: Boolean,
    default: true
  },

  // Version info
  appVersion: {
    android: { type: String, default: '1.0.0' },
    ios: { type: String, default: '1.0.0' },
    forceUpdate: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
adminSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);