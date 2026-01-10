const mongoose = require('mongoose');

const forumPostReportSchema = new mongoose.Schema({
    // Post and Reporter Information
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumPost',
        required: true,
        index: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Report Details
    reportReason: {
        type: String,
        required: true,
        enum: [
            'Spam or Misleading',
            'Harassment or Hate Speech',
            'Violence or Dangerous Content',
            'Adult Content',
            'Graphic Content',
            'Copyright Infringement',
            'Trademark Violation',
            'Misinformation',
            'Impersonation',
            'Other'
        ]
    },
    reportCategory: {
        type: String,
        required: true,
        enum: [
            'spam',
            'inappropriate_content',
            'intellectual_property',
            'false_information',
            'other'
        ]
    },
    additionalDetails: {
        type: String,
        maxlength: 500
    },

    // Report Metadata
    isAnonymous: {
        type: Boolean,
        default: false
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    reporterIp: {
        type: String
    },

    // Admin Review
    status: {
        type: String,
        enum: ['pending', 'under_review', 'resolved', 'dismissed'],
        default: 'pending',
        index: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },

    // Admin Action
    adminAction: {
        type: String,
        enum: ['none', 'warning_sent', 'post_removed', 'user_banned_temp', 'user_banned_permanent', 'dismissed'],
        default: 'none'
    },
    adminNotes: {
        type: String,
        maxlength: 1000
    },
    actionTakenAt: {
        type: Date
    },

    // Ban Details (if applicable)
    banDuration: {
        type: Number, // in days, 0 for permanent
        default: 0
    },
    banExpiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
forumPostReportSchema.index({ postId: 1, reportedBy: 1 }); // Prevent duplicate reports
forumPostReportSchema.index({ status: 1, createdAt: -1 }); // Admin queue sorting
forumPostReportSchema.index({ severity: 1, status: 1 }); // Filter by severity
forumPostReportSchema.index({ reportCategory: 1 }); // Filter by category
forumPostReportSchema.index({ createdAt: -1 }); // Recent reports

// Compound index for admin dashboard
forumPostReportSchema.index({ status: 1, severity: -1, createdAt: -1 });

// Virtual for report age
forumPostReportSchema.virtual('reportAge').get(function () {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to check if report is stale (> 30 days)
forumPostReportSchema.methods.isStale = function () {
    const daysSinceReport = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
    return daysSinceReport > 30;
};

// Static method to get report statistics
forumPostReportSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        {
            $facet: {
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                bySeverity: [
                    { $group: { _id: '$severity', count: { $sum: 1 } } }
                ],
                byCategory: [
                    { $group: { _id: '$reportCategory', count: { $sum: 1 } } }
                ],
                totalReports: [
                    { $count: 'total' }
                ],
                pendingReports: [
                    { $match: { status: 'pending' } },
                    { $count: 'count' }
                ],
                highSeverityPending: [
                    { $match: { status: 'pending', severity: 'high' } },
                    { $count: 'count' }
                ]
            }
        }
    ]);

    return stats[0];
};

module.exports = mongoose.model('ForumPostReport', forumPostReportSchema);
