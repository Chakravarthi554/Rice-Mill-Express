const mongoose = require('mongoose');

const trackingUpdateSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    status: String,
    location: String,
    notes: String,
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrackingUpdate', trackingUpdateSchema);