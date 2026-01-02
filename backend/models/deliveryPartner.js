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
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);