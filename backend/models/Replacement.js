const mongoose = require('mongoose');

const replacementSchema = new mongoose.Schema({
    // Reference to the original order
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },

    // Who requested the replacement
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Role of the requester (deliveryPartner or customer)
    requesterRole: {
        type: String,
        enum: ['deliveryPartner', 'customer'],
        required: true
    },

    // Reason for replacement
    reason: {
        type: String,
        required: true,
        enum: [
            'damaged_product',
            'wrong_product',
            'quality_issue',
            'incomplete_order',
            'customer_refused',
            'address_issue',
            'other'
        ]
    },

    // Detailed description
    description: {
        type: String,
        required: true
    },

    // Photo proof (required for delivery partner, optional for customer)
    photoProof: {
        type: String, // URL to uploaded image
        required: function () {
            return this.requesterRole === 'deliveryPartner';
        }
    },

    // Status of the replacement request
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },

    // Who reviewed the request (admin or seller)
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Review notes from admin/seller
    reviewNotes: {
        type: String
    },

    // Reviewed at timestamp
    reviewedAt: {
        type: Date
    },

    // New delivery partner assigned for replacement delivery
    replacementDeliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner'
    },

    // Replacement delivery status
    replacementDeliveryStatus: {
        type: String,
        enum: ['not_started', 'assigned', 'in_transit', 'delivered'],
        default: 'not_started'
    },

    // Replacement delivery confirmation photo
    replacementDeliveryPhoto: {
        type: String
    },

    // Replacement delivery location
    replacementDeliveryLocation: {
        latitude: Number,
        longitude: Number,
        timestamp: Date
    },

    // Replacement delivery completed at
    replacementDeliveredAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
replacementSchema.index({ order: 1 });
replacementSchema.index({ requestedBy: 1 });
replacementSchema.index({ status: 1 });
replacementSchema.index({ createdAt: -1 });

const Replacement = mongoose.model('Replacement', replacementSchema);

module.exports = Replacement;
