const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  content: {
    type: String,
    validate: {
      validator: function (v) {
        // Must have content OR an image/attachment
        // For type=text, content required. For others, just needs to exist? 
        // Logic: if image/doc/audio, content might be optional (caption).
        // Let's keep it simple: if 'type' is NOT text, content is optional.
        if (this.type !== 'text') return true;
        return (v && v.trim().length > 0);
      },
      message: 'Message content is required for text messages'
    }
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  image: { type: String, default: null }, // Legacy support
  // ✅ FIX: Enhanced attachment support with MIME type validation
  attachments: [{
    url: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number },
    mimeType: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          // Relaxed validation to allow most common office and image formats
          const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
          ];
          return allowedTypes.includes(v) || v.startsWith('image/') || v.startsWith('application/');
        },
        message: 'Unsupported file type'
      }
    },
    type: { type: String, enum: ['image', 'document', 'video', 'audio'] }
  }],

  // New Fields
  type: { type: String, enum: ['text', 'image', 'document', 'audio', 'video'], default: 'text' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isStarredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For pinning specific messages
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],

  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  readAt: { type: Date },
  deliveredAt: { type: Date },
  sentAt: { type: Date, default: Date.now },
  isFlagged: { type: Boolean, default: false },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDeletedForEveryone: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);