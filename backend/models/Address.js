const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },  // ✅ FIXED: Added for order shipping address
  phone: { type: String, required: true }, // ✅ FIXED: Added for order shipping address
  type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  houseNumber: { type: String },
  colony: { type: String },
  landmark: { type: String },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  alternativePhone: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

addressSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Address', addressSchema);