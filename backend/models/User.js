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
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, match: /^[0-9]{10}$/ },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['customer', 'seller', 'admin', 'deliveryPartner'], default: 'customer' },
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
      address: { street: String, city: String, state: String, pinCode: String, country: { type: String, default: 'India' } },
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
    personalization: { bio: { type: String, maxlength: 250 }, tagline: { type: String, maxlength: 100 } },
    referralCode: { type: String, unique: true, sparse: true },
    referralStats: {
      referredUsers: { type: Number, default: 0 },
      earnedCredits: { type: Number, default: 0 },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.index({ location: '2dsphere' });

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
  return await bcrypt.compare(pass, this.password);
};

userSchema.methods.getPasswordResetToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

module.exports = mongoose.model('User', userSchema);