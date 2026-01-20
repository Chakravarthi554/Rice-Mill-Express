/**
 * Socket-based Push Notification Utility
 * Sends real-time push notifications to users via Socket.IO
 */

const Notification = require('../models/Notification');

/**
 * Send push notification to one or more users
 * @param {Array|String} userIds - Single user ID or array of user IDs
 * @param {Object} notificationData - {title, message, type, data, priority}
 * @param {Object} io - Socket.IO instance (optional, if not provided won't emit socket event)
 * @returns {Promise<Object>} - Created notifications
 */
const sendPushNotification = async (userIds, notificationData, io = null) => {
  try {
    // Ensure userIds is an array
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];

    if (userIdArray.length === 0) {
      console.warn('⚠️ No user IDs provided for push notification');
      return { success: false, message: 'No recipients' };
    }

    const { title, message, type = 'general', data = {}, priority = 'medium' } = notificationData;

    if (!title || !message) {
      console.error('❌ Push notification must have title and message');
      return { success: false, message: 'Title and message required' };
    }

    // Create notifications in database for each user
    const notifications = await Promise.all(
      userIdArray.map(async (userId) => {
        try {
          const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            data,
            priority,
            read: false,
            createdAt: new Date()
          });
          return notification;
        } catch (error) {
          console.error(`Failed to create notification for user ${userId}:`, error);
          return null;
        }
      })
    );

    const successfulNotifications = notifications.filter(n => n !== null);

    console.log(`✅ Created ${successfulNotifications.length} push notifications`);

    // Send socket notification if io instance is provided
    if (io) {
      userIdArray.forEach(userId => {
        io.to(`user_${userId}`).emit('NEW_NOTIFICATION', {
          title,
          message,
          type,
          data,
          priority,
          createdAt: new Date()
        });
      });
      console.log(`📡 Sent socket notifications to ${userIdArray.length} users`);
    }

    return {
      success: true,
      count: successfulNotifications.length,
      notifications: successfulNotifications
    };
  } catch (error) {
    console.error('❌ Error sending push notifications:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

/**
 * Send notification to all active users
 * @param {Object} notificationData - {title, message, type, data}
 * @param {Object} io - Socket.IO instance
 * @returns {Promise<Object>}
 */
const sendBulkPushNotification = async (notificationData, io = null) => {
  try {
    const User = require('../models/User');
    const activeUsers = await User.find({ active: { $ne: false } }).select('_id');
    const userIds = activeUsers.map(user => user._id.toString());

    console.log(`📢 Sending bulk notification to ${userIds.length} users`);

    return await sendPushNotification(userIds, notificationData, io);
  } catch (error) {
    console.error('❌ Error sending bulk notifications:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
};

module.exports = {
  sendPushNotification,
  sendBulkPushNotification
};
