const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    vehicle_type: { type: String, required: true },
    vehicle_number: { type: String, required: true },
    license_number: { type: String, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The login identity for the DP

    // KYC Fields
    aadharNumber: { type: String },
    aadharPhoto: { type: String }, // File path
    panNumber: { type: String },
    panPhoto: { type: String }, // File path
    driverPhoto: { type: String }, // File path
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    kycRejectionReason: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    currentLoad: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    totalDeliveries: { type: Number, default: 0 },
    onTimeDeliveryRate: { type: Number, default: 100 },
    isAvailable: { type: Boolean, default: true },
    maxCapacity: { type: Number, default: 10 },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },

    // Device Security & Session Management
    loggedInDevices: [{
      deviceId: String,
      deviceName: String,
      deviceType: String, // mobile, tablet, desktop
      lastLogin: Date,
      ipAddress: String,
      userAgent: String
    }],

    // Activity Tracking
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    autoLogoutEnabled: {
      type: Boolean,
      default: true
    },
    autoLogoutMinutes: {
      type: Number,
      default: 30
    },

    // User Preferences
    language: {
      type: String,
      enum: ['en', 'hi', 'te', 'ta', 'kn', 'ml'],
      default: 'en'
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    darkMode: {
      type: Boolean,
      default: false
    },

    // Push Notification Tokens
    fcmTokens: [{
      token: String,
      deviceId: String,
      addedAt: { type: Date, default: Date.now }
    }],

    // Emergency Contacts
    emergencyContacts: [{
      name: String,
      phone: String,
      relation: String
    }],

    // Emergency Alerts History
    emergencyAlerts: [{
      timestamp: { type: Date, default: Date.now },
      location: {
        latitude: Number,
        longitude: Number
      },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      resolved: { type: Boolean, default: false },
      resolvedAt: Date,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: String
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);