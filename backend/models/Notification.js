const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: [
        'ORDER_UPDATE',
        'ORDER_PLACED',
        'ORDER_CANCELLED',
        'ORDER_STATUS_UPDATE',
        'KYC_STATUS',
        'PAYMENT_STATUS',
        'SYSTEM',
        'POST_APPROVED',
        'RECIPE_STATUS',
        'RECIPE_SUBMITTED',
        'NEW_KYC_APPLICATION',
        'PAYMENT_DISPUTE',
        'COD_NOT_REPORTED',
        'LOW_STOCK_ALERT',
        'SPAM_REPORT',
        'NEW_CHAT_MESSAGE',
        'REFUND_REQUESTED',
        'PAYOUT_READY',
        'ADMIN_ALERT',
        // Bulk order notification types
        'BULK_ORDER_REQUEST',
        'BULK_ORDER_UPDATE',
        'BULK_ORDER_CANCELLED',
        'BULK_ORDER_QUOTE_SENT',
        'BULK_ORDER_CONFIRMED',
        'BULK_ORDER_PLACED'  // ← THIS WAS MISSING — NOW FIXED!
      ],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: 'Notification'
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'entityModel'
    },
    entityModel: {
      type: String,
      enum: [
        'Order',
        'Payment',
        'User',
        'ForumPost',
        'BulkOrder',
        'Recipe',
        'KycApplication',
        'Product',
        'Message',
        'Payout',
        'Notification'
      ]
    },
    actionUrl: {
      type: String,
      trim: true
    },
    actionLabel: {
      type: String,
      trim: true,
      maxlength: 50
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
 
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
});

// Static method to create admin notifications
notificationSchema.statics.createAdminNotification = async function(data) {
  const adminUsers = await mongoose.model('User').find({ role: 'admin' }).select('_id');
 
  const notifications = adminUsers.map(admin => ({
    user: admin._id,
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority || 'medium',
    relatedEntity: data.relatedEntity,
    entityModel: data.entityModel,
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel,
    metadata: data.metadata
  }));
 
  return this.insertMany(notifications);
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);