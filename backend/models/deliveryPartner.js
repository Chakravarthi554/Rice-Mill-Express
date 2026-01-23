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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);