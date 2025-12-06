const mongoose = require('mongoose');

const searchLogSchema = mongoose.Schema(
  {
    searchQuery: { type: String, required: true },
    resultsCount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SearchLog', searchLogSchema);