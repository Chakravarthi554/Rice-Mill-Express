const mongoose = require('mongoose');

const kycApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  businessType: { type: String, required: true },
  gstNumber: { type: String, required: true },
  panNumber: { type: String, required: true },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    pinCode: String,
    country: { type: String, default: 'India' },
  },
  documents: [{ documentType: String, documentUrl: String }],
  status: { type: String, enum: ['not_submitted', 'under_review', 'approved', 'rejected'], default: 'under_review' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewNotes: String,
});

module.exports = mongoose.model('KycApplication', kycApplicationSchema);