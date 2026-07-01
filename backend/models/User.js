// [AI: Updated bookmarks field – forum bookmarking enabled]
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, minlength: 8, select: false },
    role: { type: String, enum: ['customer', 'seller', 'admin', 'deliveryPartner'], default: 'customer' },
    firebaseUid: { type: String, unique: true, sparse: true },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    dob: { type: Date },
    trusted: { type: Boolean, default: false },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'not_submitted', 'not_required'],
      default: 'not_required',
    },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    profileImage: { type: String, default: '/uploads/default_avatar.jpg' },
    businessDetails: {
      businessName: String,
      gstNumber: String,
      licenseNumber: String,
      businessType: String,
      panNumber: String,
      address: {
        houseNumber: String,
        colony: String,
        street: String,
        city: String,
        state: String,
        pinCode: String,
        landmark: String,
        country: { type: String, default: 'India' },
        location: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: { type: [Number], default: [0, 0] }
        }
      },
      bankAccount: { accountNumber: String, ifscCode: String, accountHolderName: String },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
    cartItems: [{
      _id: false,
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, default: 1, min: 1 },   // <-- field name is `quantity`
    }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    active: { type: Boolean, default: true, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    preferences: {
      language: { type: String, enum: ['english', 'hindi', 'telugu'], default: 'english' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      recommendationsEnabled: { type: Boolean, default: true },
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      categories: {
        orders: { type: Boolean, default: true },
        marketing: { type: Boolean, default: true },
        social: { type: Boolean, default: true },
      },
    },

    referralCode: { type: String, unique: true, sparse: true },
    referralStats: {
      referredUsers: { type: Number, default: 0 },
      earnedCredits: { type: Number, default: 0 },
      pendingCredits: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
    },
    walletBalance: { type: Number, default: 0 },
    savedBanks: [{
      bankName: { type: String, required: true },
      branchName: { type: String },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      accountHolderName: { type: String, required: true },
      isDefault: { type: Boolean, default: false }
    }],
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isReferralRewardClaimed: { type: Boolean, default: false },
    paymentMethods: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      cardNumber: { type: String, required: true },
      cardType: { type: String, default: 'Credit Card' },
      last4: { type: String },
      expiry: { type: String, required: true },
      isDefault: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    linkedAccounts: [{ type: String, enum: ['google', 'facebook', 'twitter'] }],
    subscription: {
      plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
      active: { type: Boolean, default: false },
      startDate: { type: Date },
      endDate: { type: Date },
      autoRenew: { type: Boolean, default: false },
      paymentMethodId: { type: String }
    },
    rewardsBalance: { type: Number, default: 0 },
    rewardsHistory: [{
      amount: { type: Number, required: true },
      type: { type: String, enum: ['earned', 'redeemed', 'expired', 'referral'], required: true },
      description: { type: String },
      date: { type: Date, default: Date.now },
      referenceId: { type: mongoose.Schema.Types.ObjectId }, // Order ID, Campaign ID, etc.
      status: { type: String, enum: ['pending', 'completed', 'cancelled', 'expired'], default: 'completed' }
    }],
    // (referredBy and isReferralRewardClaimed declared above at lines 96-97; no duplicate needed)

    // ✅ Enhanced referral tracking fields are included in referralStats above

    bookmarks: [{
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
      bookmarkedAt: { type: Date, default: Date.now }
    }],
    defaultAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    defaultPayment: { type: String },

    // SECURITY FEATURES
    twoFactorEnabled: { type: Boolean, default: false },
    loginHistory: [{
      ip: String,
      device: String,
      browser: String,
      os: String,
      location: String,
      timestamp: { type: Date, default: Date.now },
      status: { type: String, enum: ['success', 'failed'], default: 'success' }
    }],
    privacySettings: {
      profileVisible: { type: Boolean, default: true },
      showActivity: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false }
    },
    isProfilePublic: { type: Boolean, default: true },
    registrationDevice: { type: String, select: false }, // Store Device ID for anti-abuse
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.index({ location: '2dsphere' });
// firebaseUid index created automatically by unique: true in schema (line 22)
userSchema.index({ role: 1, kycStatus: 1 });
userSchema.index({ role: 1, isVerified: 1 });

// === CUSTOM VALIDATION FOR FLEXIBLE AUTH ===
userSchema.pre('validate', function (next) {
  const hasPhone = this.phone && this.phone.trim();
  const hasEmail = this.email && this.email.trim();
  const hasPassword = this.password && this.password.trim();

  // Validate: At least one authentication method must be provided
  if (!hasPhone && !hasEmail) {
    return next(new Error('Either phone number or email must be provided'));
  }

  // Validate: If email is provided, password must also be provided (for new users)
  // EXCEPT if they are authenticated via Firebase (Social/Phone)
  if (hasEmail && !this.firebaseUid && !hasPassword && this.isNew) {
    return next(new Error('Password is required when email is provided'));
  }

  // Validate: Phone format when provided
  if (hasPhone && !/^[0-9]{10}$/.test(this.phone)) {
    return next(new Error('Phone number must be exactly 10 digits'));
  }

  next();
});

// === PASSWORD & REFERRAL CODE ===
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.isNew && !this.referralCode) {
    let code, exists = true, attempts = 0;
    while (exists && attempts < 10) {
      code = generateReferralCode();
      exists = await this.constructor.findOne({ referralCode: code });
      attempts++;
    }
    this.referralCode = exists ? `${code}-${Date.now().toString().slice(-4)}` : code;
  }

  // ✅ SYNC: isProfilePublic and privacySettings.profileVisible
  if (this.isModified('isProfilePublic')) {
    this.privacySettings.profileVisible = this.isProfilePublic;
  } else if (this.isModified('privacySettings.profileVisible')) {
    this.isProfilePublic = this.privacySettings.profileVisible;
  }

  next();
});

// === ROBUST LOCATION SANITIZATION ===
userSchema.pre('save', function (next) {
  let loc = this.location;

  // 1. Handle stringified JSON
  if (typeof loc === 'string' && loc.trim() !== '') {
    try {
      const parsed = JSON.parse(loc);
      loc = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e) {
      console.warn('User.save() - Invalid location JSON:', loc);
      loc = null;
    }
  }

  // 2. Handle array-wrapped GeoJSON
  if (Array.isArray(loc)) {
    loc = loc.find(item =>
      item &&
      item.type === 'Point' &&
      Array.isArray(item.coordinates) &&
      item.coordinates.length === 2 &&
      typeof item.coordinates[0] === 'number' &&
      typeof item.coordinates[1] === 'number'
    ) || null;
  }

  // 3. Validate final object
  if (
    loc &&
    loc.type === 'Point' &&
    Array.isArray(loc.coordinates) &&
    loc.coordinates.length === 2 &&
    typeof loc.coordinates[0] === 'number' &&
    typeof loc.coordinates[1] === 'number'
  ) {
    this.location = loc;
  } else {
    this.location = { type: 'Point', coordinates: [0, 0] };
  }

  next();
});

userSchema.methods.matchPassword = async function (pass) {
  console.log(`🔐 matchPassword check: pass provided? ${!!pass}, hash exists? ${!!this.password}`);
  if (!this.password || !pass) {
    console.warn('⚠️ matchPassword returning false due to missing pass or hash');
    return false;
  }
  try {
    return await bcrypt.compare(String(pass), this.password);
  } catch (error) {
    console.error('❌ bcrypt.compare error:', error.message);
    return false;
  }
};

userSchema.methods.getPasswordResetToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

module.exports = mongoose.model('User', userSchema);