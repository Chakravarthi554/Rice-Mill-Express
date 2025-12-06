const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { 
    type: String,
    validate: {
      validator: function(v) {
        return (v && v.trim().length > 0) || !!this.image;
      },
      message: 'At least one of content or image is required'
    }
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  image: { type: String, default: null },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  isFlagged: { type: Boolean, default: false },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Added to track sender explicitly
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);