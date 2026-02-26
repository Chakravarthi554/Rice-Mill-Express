const mongoose = require('mongoose');

const legalPolicySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    enum: ['terms', 'privacy', 'refund']
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to update lastUpdated on save
legalPolicySchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

const LegalPolicy = mongoose.model('LegalPolicy', legalPolicySchema);

module.exports = LegalPolicy;
