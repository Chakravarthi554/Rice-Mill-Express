const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('./logger');
const { auth: firebaseAuth } = require('../config/firebase');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const setupSocketServer = async (server) => {
  const io = socketio(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'https://c111b7c7.rice-mill-frontend.pages.dev',
        /^https:\/\/.*\.pages\.dev$/,
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Attach Redis adapter for scaling across multiple instances
  const pubClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
    }
  });
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => {
    logger.error('❌ Redis pubClient Error (Socket.io Adapter):', err.message);
    // Optional: Could process.exit(1) here if strict scaling is required
  });
  subClient.on('error', (err) => {
    logger.error('❌ Redis subClient Error (Socket.io Adapter):', err.message);
  });

  // Await adapter connection before allowing sockets to connect
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  logger.info('✅ Socket.io Redis adapter connected');

  // 🔥 ENHANCED AUTH: Better token validation with role checking
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

      if (!token) {
        logger.error(`❌ No token for socket ${socket.id}`);
        return next(new Error('Authentication error: No token provided'));
      }

      // Extract token from "Bearer <token>" format
      const cleanToken = (token || '').replace(/^Bearer\s+/i, '').trim();
      if (!cleanToken) return next(new Error('Invalid token format'));

      let decoded;
      let user;

      // 1. Try Firebase verification FIRST
      try {
        decoded = await firebaseAuth.verifyIdToken(cleanToken);
        logger.info(`✅ Socket Auth: Firebase Token verified for UID: ${decoded.uid}`);

        // Prepare lookup criteria
        const lookupCriteria = [{ firebaseUid: decoded.uid }];
        if (decoded.email) lookupCriteria.push({ email: decoded.email });
        if (decoded.phone_number) {
          const p = decoded.phone_number.replace(/\D/g, '').slice(-10);
          if (p.length === 10) lookupCriteria.push({ phone: p });
        }

        user = await User.findOne({ $or: lookupCriteria }).select('role name email firebaseUid');

        if (user && !user.firebaseUid) {
          user.firebaseUid = decoded.uid;
          await user.save();
        }

        // ✅ AUTO-PROVISION: If user not found in MongoDB but valid in Firebase
        if (!user) {
          logger.info(`🆕 Socket Auth: Provisioning MongoDB user for Firebase UID: ${decoded.uid}`);

          let sanitisedPhone = decoded.phone_number || '';
          if (sanitisedPhone) {
            sanitisedPhone = sanitisedPhone.replace(/\D/g, '').slice(-10);
          }

          user = await User.create({
            name: decoded.name || decoded.email?.split('@')[0] || 'User',
            email: decoded.email,
            phone: sanitisedPhone || undefined,
            firebaseUid: decoded.uid,
            role: 'customer',
            isVerified: true
          });
        }
      } catch (err) {
        // Distinguish between Firebase verification errors and DB errors
        const isFirebaseError = err.code && err.code.startsWith('auth/');

        if (isFirebaseError) {
          logger.warn(`🔵 Socket Auth: Firebase verification failed, trying legacy JWT: ${err.message}`);
          try {
            if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
            decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
            user = await User.findById(decoded.id).select('role name email');
          } catch (jwtErr) {
            // Re-throw original firebase error if legacy also fails
            throw new Error(`Auth failed: ${err.message}`);
          }
        } else {
          // If it's a DB error (like validation), re-throw it
          throw err;
        }
      }

      if (!user) {
        throw new Error('User not found in database');
      }

      // Attach user info to socket
      socket.userId = user._id.toString();
      socket.role = user.role;
      socket.userInfo = user;

      logger.info(`✅ Socket authenticated ${socket.id} user:${socket.userId} role:${socket.role}`);
      next();
    } catch (err) {
      logger.error(`❌ Socket auth failed: ${err.message}`);
      next(new Error('Authentication failed: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🟢 Socket connected ${socket.id} user:${socket.userId} role:${socket.role}`);

    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    // Join role-based rooms
    if (socket.role === 'admin') {
      socket.join('admin_room');
      logger.info(`👨‍💼 Admin ${socket.userId} joined admin room`);
    }
    if (socket.role === 'seller') {
      socket.join(`seller_${socket.userId}`);
      socket.join('sellers_room'); // ✅ FIX: Global seller room for admin broadcasts
      logger.info(`👨‍💼 Seller ${socket.userId} joined seller rooms`);
    }
    if (socket.role === 'deliveryPartner') {
      socket.join(`delivery_partner_${socket.userId}`);
      socket.join('delivery_partners_room'); // Global delivery partner room
      logger.info(`🚚 Delivery Partner ${socket.userId} joined delivery partner rooms`);
    }

    // 🟢 PRESENCE: Broadcast online status
    socket.broadcast.emit('user:online', {
      userId: socket.userId,
      role: socket.role
    });

    // Update DB status (async, no await needed here to block)
    User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastActive: new Date()
    }).catch(err => logger.error(`Failed to update online status for ${socket.userId}`, err));

    // Enhanced room management
    socket.on('joinUserRoom', (uid) => {
      // ✅ FLEXIBLE JOIN: Allow joining if UID matches MongoDB ID OR Firebase UID
      const isMatch = uid === socket.userId || uid === socket.userInfo?.firebaseUid;

      if (isMatch) {
        socket.join(`user_${uid}`);
        logger.info(`✅ Socket ${socket.id} joined user room: user_${uid}`);
      } else {
        logger.warn(`⚠️ Socket ${socket.id} attempted to join unauthorized room: user_${uid} (Current: ${socket.userId})`);
      }
    });

    socket.on('joinAdminRoom', () => {
      if (socket.role === 'admin') {
        socket.join('admin_room');
        logger.info(`✅ Admin ${socket.userId} joined admin room via event`);
      } else {
        logger.warn(`⚠️ Non-admin user ${socket.userId} attempted to join admin room`);
      }
    });

    socket.on('joinSellerRoom', (sellerId) => {
      if (socket.role === 'seller' && sellerId === socket.userId) {
        socket.join(`seller_${sellerId}`);
        logger.info(`✅ Seller ${socket.userId} joined seller room via event`);
      }
    });

    socket.on('joinOrderRoom', (orderId) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
        logger.info(`✅ Socket ${socket.id} joined order room: order_${orderId}`);
      }
    });

    socket.on('joinPostRoom', (postId) => {
      if (postId) {
        socket.join(`post_${postId}`);
        logger.info(`✅ Socket ${socket.id} joined post room: post_${postId}`);
      }
    });

    socket.on('joinRecipeRoom', (recipeId) => {
      if (recipeId) {
        socket.join(`recipe_${recipeId}`);
        logger.info(`✅ Socket ${socket.id} joined recipe room: recipe_${recipeId}`);
      }
    });

    socket.on('join', (room) => {
      if (room) {
        socket.join(room);
        logger.info(`✅ Socket ${socket.id} joined room: ${room}`);
      }
    });

    socket.on('joinNotifications', (userId) => {
      if (userId && userId === socket.userId) {
        socket.join(`notifications_${userId}`);
        logger.info(`✅ Socket ${socket.id} joined notifications room: notifications_${userId}`);
      }
    });

    socket.on('leavePostRoom', (postId) => {
      if (postId) {
        socket.leave(`post_${postId}`);
        logger.info(`✅ Socket ${socket.id} left post room: post_${postId}`);
      }
    });

    // --- NOTIFICATION MANAGEMENT ---
    socket.on('markNotificationRead', async (data) => {
      try {
        const { notificationId, userId } = data;

        // Verify user owns the notification
        if (userId !== socket.userId) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const Notification = require('../models/Notification');
        const notification = await Notification.findById(notificationId);

        if (notification && notification.user.toString() === userId) {
          await notification.markAsRead();
          socket.emit('NOTIFICATION_READ', { notificationId });
        }
      } catch (error) {
        logger.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    socket.on('getUnreadCount', async (userId) => {
      try {
        if (userId !== socket.userId) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const Notification = require('../models/Notification');
        const count = await Notification.countDocuments({
          user: userId,
          read: false
        });
        socket.emit('UNREAD_COUNT', { count });
      } catch (error) {
        logger.error('Error getting unread count:', error);
        socket.emit('error', { message: 'Failed to get unread count' });
      }
    });

    // --- ADMIN NOTIFICATION EVENTS ---
    socket.on('RECIPE_SUBMITTED', (data) => {
      logger.info('📝 Recipe submitted:', data.recipe?.title || data.title);

      // Notify all admins
      socket.to('admin_room').emit('NEW_RECIPE_FOR_APPROVAL', {
        recipeId: data.recipe?._id || data.recipeId,
        title: data.recipe?.title || data.title,
        sellerName: data.sellerName,
        timestamp: new Date()
      });

      // Create admin notifications
      const Notification = require('../models/Notification');
      Notification.createAdminNotification({
        type: 'RECIPE_SUBMITTED',
        title: 'New Recipe Submitted',
        message: `New recipe "${data.recipe?.title || data.title}" submitted by ${data.sellerName}`,
        priority: 'medium',
        relatedEntity: data.recipe?._id || data.recipeId,
        entityModel: 'Recipe',
        actionUrl: `/admin/dashboard?tab=recipes&recipe=${data.recipe?._id || data.recipeId}`,
        actionLabel: 'Review Now'
      });
    });

    socket.on('KYC_SUBMITTED', (data) => {
      logger.info('📋 KYC submitted by:', data.userName);

      socket.to('admin_room').emit('NEW_KYC_SUBMITTED', {
        kycId: data.kycId,
        userName: data.userName,
        businessName: data.businessName,
        timestamp: new Date()
      });

      // Create admin notifications for KYC
      const Notification = require('../models/Notification');
      Notification.createAdminNotification({
        type: 'NEW_KYC_APPLICATION',
        title: 'New KYC Application',
        message: `New KYC application from ${data.businessName} (${data.userName})`,
        priority: 'high',
        relatedEntity: data.kycId,
        entityModel: 'KycApplication',
        actionUrl: `/admin/dashboard?tab=kyc&application=${data.kycId}`,
        actionLabel: 'Review KYC'
      });
    });

    socket.on('PAYMENT_DISPUTE', (data) => {
      logger.info('⚠️ Payment dispute:', data.orderId);

      socket.to('admin_room').emit('NEW_PAYMENT_DISPUTE', {
        orderId: data.orderId,
        customerName: data.customerName,
        reason: data.reason,
        timestamp: new Date()
      });

      const Notification = require('../models/Notification');
      Notification.createAdminNotification({
        type: 'PAYMENT_DISPUTE',
        title: 'Payment Dispute Reported',
        message: `Payment dispute for order #${data.orderId} by ${data.customerName}`,
        priority: 'high',
        relatedEntity: data.orderId,
        entityModel: 'Order',
        actionUrl: `/admin/dashboard?tab=payments&order=${data.orderId}`,
        actionLabel: 'Resolve Now'
      });
    });

    socket.on('LOW_STOCK_ALERT', (data) => {
      logger.info('📉 Low stock alert:', data.productName);

      socket.to('admin_room').emit('LOW_STOCK_WARNING', {
        productId: data.productId,
        productName: data.productName,
        currentStock: data.currentStock,
        sellerName: data.sellerName,
        timestamp: new Date()
      });

      const Notification = require('../models/Notification');
      Notification.createAdminNotification({
        type: 'LOW_STOCK_ALERT',
        title: 'Low Stock Alert',
        message: `Product "${data.productName}" has low stock (${data.currentStock} units left)`,
        priority: 'medium',
        relatedEntity: data.productId,
        entityModel: 'Product',
        actionUrl: `/admin/dashboard?tab=products&product=${data.productId}`,
        actionLabel: 'Check Stock'
      });
    });

    // --- GENERAL NOTIFICATION EMITTER ---
    socket.on('SEND_NOTIFICATION', (data) => {
      const { userId, notificationData } = data;

      if (userId) {
        // Send to specific user
        socket.to(`user_${userId}`).emit('newNotification', {
          ...notificationData,
          timestamp: new Date(),
        });
        logger.info(`📩 Emitted notification to user_${userId}: ${notificationData.message}`);
      } else {
        // Send to all admins
        socket.to('admin_room').emit('newAdminNotification', {
          ...notificationData,
          timestamp: new Date(),
        });
        logger.info(`🛠️ Emitted admin notification: ${notificationData.title}`);
      }
    });

    // Enhanced social actions with validation
    socket.on('SOCIAL_ACTION', (data) => {
      // Validate user matches socket user
      if (data.userId !== socket.userId) {
        logger.warn(`❌ Social action user mismatch: socket=${socket.userId}, action=${data.userId}`);
        return;
      }

      const { type, itemType, itemId, itemUserId, userId } = data;

      // Emit to relevant rooms
      if (itemType === 'forum') {
        io.to(`post_${itemId}`).emit('SOCIAL_UPDATE', data);
      } else if (itemType === 'recipe') {
        io.to(`recipe_${itemId}`).emit('SOCIAL_UPDATE', data);
      }

      // Notify item owner if different from action user
      if (itemUserId && itemUserId !== userId) {
        io.to(`user_${itemUserId}`).emit('SOCIAL_NOTIFICATION', data);
      }

      // Notify admins for moderation
      if (type === 'COMMENT' && data.needsApproval) {
        io.to('admin_room').emit('NEW_COMMENT_NEEDS_APPROVAL', data);
      }

      logger.info(`🔔 Social event: ${type} on ${itemType} ${itemId} by ${userId}`);
    });

    // Enhanced chat event handlers
    socket.on('chat:typing', ({ conversationId, to }) => {
      // Broadcast to specific conversation room if user joined it, or directly to recipient user room
      // Since we don't force joining conversation rooms explicitly yet, exact targeting via user room is safer for direct chats
      if (to) {
        io.to(`user_${to}`).emit('chat:typing', {
          userId: socket.userId,
          conversationId
        });
      }
    });

    socket.on('chat:stop_typing', ({ conversationId, to }) => {
      if (to) {
        io.to(`user_${to}`).emit('chat:stop_typing', {
          userId: socket.userId,
          conversationId
        });
      }
    });

    // ✅ NEW: Delivery receipt handler
    socket.on('chat:message_delivered', async ({ messageId, conversationId }) => {
      try {
        const Message = require('../models/Message');
        const message = await Message.findById(messageId);

        if (message && message.receiver.toString() === socket.userId && message.status === 'sent') {
          message.status = 'delivered';
          message.deliveredAt = new Date();
          await message.save();

          // Notify sender about delivery
          io.to(`user_${message.sender}`).emit('chat:message_delivered', {
            messageId,
            conversationId,
            deliveredAt: message.deliveredAt
          });

          logger.info(`✅ Message ${messageId} marked as delivered`);
        }
      } catch (error) {
        logger.error('Error marking message as delivered:', error);
      }
    });

    // ✅ NEW: Read receipt handler
    socket.on('chat:messages_read', async ({ conversationId, messageIds }) => {
      try {
        const Message = require('../models/Message');
        const Conversation = require('../models/Conversation');

        // Update messages to read status
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            receiver: socket.userId,
            status: { $ne: 'read' }
          },
          {
            status: 'read',
            readAt: new Date()
          }
        );

        // Reset unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.unreadCounts.set(socket.userId.toString(), 0);
          await conversation.save();

          // Notify sender(s)
          const otherParticipant = conversation.participants.find(p => p.toString() !== socket.userId);
          if (otherParticipant) {
            io.to(`user_${otherParticipant}`).emit('chat:messages_read', {
              conversationId,
              messageIds,
              readBy: socket.userId,
              readAt: new Date()
            });
          }
        }

        logger.info(`✅ ${messageIds.length} messages marked as read in conversation ${conversationId}`);
      } catch (error) {
        logger.error('Error marking messages as read:', error);
      }
    });

    // Previous legacy handlers kept for backward compatibility if needed, or replace them.
    // The previous code had specific 'TYPING' event. We can keep it or merge.
    // Let's keep the new ones namespaced as 'chat:' for clarity.

    // Legacy handlers (optional to remove if not used by old frontend)
    socket.on('TYPING', ({ to }) => {
      if (to && to !== socket.userId) {
        io.to(`user_${to}`).emit('TYPING', { from: socket.userId });
      }
    });

    socket.on('STOP_TYPING', ({ to }) => {
      if (to && to !== socket.userId) {
        io.to(`user_${to}`).emit('STOP_TYPING', { from: socket.userId });
      }
    });

    // Heartbeat for connection health
    socket.on('PING', () => {
      socket.emit('PONG', { timestamp: Date.now() });
    });

    socket.on('disconnect', async (reason) => { // Made async
      logger.info(`🔴 Socket disconnected ${socket.id}, reason: ${reason}`);

      // 🔴 PRESENCE: Broadcast offline status
      // We only broadcast if the user has no other active sockets (optional optimization, but for now simple broadcast is safer)
      // Actually, simplest is to broadcast. Frontend can debounce.
      socket.broadcast.emit('user:offline', {
        userId: socket.userId,
        lastSeen: new Date()
      });

      // Update DB status
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastActive: new Date()
        });
      } catch (err) {
        logger.error(`Failed to update offline status for ${socket.userId}`, err);
      }

      // Leave all rooms on disconnect
      const rooms = [...socket.rooms];
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
    });

    socket.on('error', (error) => {
      logger.error(`❌ Socket error ${socket.id}:`, error);
    });
  });

  // Order update broadcast
  const broadcastOrderUpdate = async (orderId, extra = {}) => {
    try {
      const Order = require('../models/Order');
      const order = await Order.findById(orderId)
        .populate('user', '_id')
        .populate('seller', '_id')
        .populate('deliveryPartner', '_id');

      if (!order) return logger.error(`❌ Order not found ${orderId}`);

      const userList = [
        order.user?._id?.toString(),
        order.seller?._id?.toString(),
        order.deliveryPartner?._id?.toString(),
      ].filter(Boolean);

      const payload = {
        type: 'ORDER_UPDATE',
        data: {
          orderId,
          status: order.orderStatus,
          deliveryPartnerStatus: order.deliveryPartnerStatus,
          isDelivered: order.isDelivered,
          deliveredAt: order.deliveredAt,
          ...extra
        },
      };

      // Emit to all relevant parties
      userList.forEach(uid => io.to(`user_${uid}`).emit('ORDER_UPDATE', payload));
      io.to(`order_${orderId}`).emit('ORDER_UPDATE', payload);
      io.to('admin_room').emit('ORDER_UPDATE', payload);

      // Also emit to delivery partner room if assigned
      if (order.deliveryPartner) {
        io.to(`delivery_partner_${order.deliveryPartner._id}`).emit('ORDER_UPDATE', payload);
      }

      // Create notifications
      const Notification = require('../models/Notification');
      const createdNotifications = await Notification.create(
        userList.map(uid => ({
          user: uid,
          type: 'ORDER_UPDATE',
          title: `Order Status Update`,
          message: `Order #${order._id.toString().slice(-6)} updated to ${order.orderStatus}`,
          relatedEntity: order._id,
          entityModel: 'Order',
          priority: 'medium'
        }))
      );

      // Emit to each user's socket room for real-time updates
      createdNotifications.forEach(n => {
        emitNotification(n.user.toString(), n.toJSON ? n.toJSON() : n);
      });

      logger.info(`✅ Order update broadcast for order ${orderId} & notifications emitted`);
    } catch (err) {
      logger.error('❌ broadcastOrderUpdate error', err);
    }
  };

  // Delivery Partner specific event handlers
  const broadcastDeliveryPickup = (orderId, deliveryPartnerId, orderData) => {
    io.to(`order_${orderId}`).emit('delivery:pickup-confirmed', {
      orderId,
      deliveryPartnerId,
      timestamp: new Date(),
      ...orderData
    });
    io.to('admin_room').emit('delivery:pickup-confirmed', {
      orderId,
      deliveryPartnerId,
      timestamp: new Date(),
      ...orderData
    });
    logger.info(`✅ Delivery pickup broadcast for order ${orderId}`);
  };

  const broadcastNavigationStarted = (orderId, deliveryPartnerId, navigationData) => {
    io.to(`order_${orderId}`).emit('delivery:navigation-started', {
      orderId,
      deliveryPartnerId,
      timestamp: new Date(),
      ...navigationData
    });
    logger.info(`✅ Navigation started broadcast for order ${orderId}`);
  };

  const broadcastDeliveryCompleted = (orderId, deliveryPartnerId, deliveryData) => {
    io.to(`order_${orderId}`).emit('delivery:completed', {
      orderId,
      deliveryPartnerId,
      timestamp: new Date(),
      ...deliveryData
    });
    io.to('admin_room').emit('delivery:completed', {
      orderId,
      deliveryPartnerId,
      timestamp: new Date(),
      ...deliveryData
    });
    logger.info(`✅ Delivery completed broadcast for order ${orderId}`);
  };

  const broadcastEmergencyAlert = (alertData) => {
    // Alert admin and seller
    io.to('admin_room').emit('emergency:alert', {
      ...alertData,
      timestamp: new Date()
    });

    if (alertData.sellerId) {
      io.to(`seller_${alertData.sellerId}`).emit('emergency:alert', {
        ...alertData,
        timestamp: new Date()
      });
    }

    logger.info(`🚨 Emergency alert broadcast from delivery partner ${alertData.deliveryPartnerId}`);
  };

  const broadcastReplacementRequest = (orderId, replacementData) => {
    io.to(`order_${orderId}`).emit('replacement:requested', {
      orderId,
      timestamp: new Date(),
      ...replacementData
    });
    io.to('admin_room').emit('replacement:requested', {
      orderId,
      timestamp: new Date(),
      ...replacementData
    });
    logger.info(`✅ Replacement request broadcast for order ${orderId}`);
  };

  const broadcastBulkOrderUpdate = async (bulkId) => {
    try {
      const BulkOrder = require('../models/BulkOrder');
      const order = await BulkOrder.findById(bulkId)
        .populate('buyer', '_id')
        .populate('seller', '_id');

      if (!order) return;

      const payload = { type: 'BULK_ORDER_UPDATE', data: { orderId: bulkId } };

      [order.buyer?._id, order.seller?._id].filter(Boolean)
        .forEach(uid => io.to(`user_${uid}`).emit('BULK_ORDER_UPDATE', payload));

      logger.info(`✅ Bulk order update broadcast for order ${bulkId}`);
    } catch (err) {
      logger.error('❌ broadcastBulkOrderUpdate error', err);
    }
  };

  // Notification utility functions
  const emitAdminNotification = (notificationData) => {
    if (!io || !notificationData) return;

    io.to('admin_room').emit('newAdminNotification', {
      ...notificationData,
      timestamp: new Date(),
    });

    logger.info(`🛠️ Emitted admin notification: ${notificationData.title}`);
  };

  const emitNotification = (userId, notificationData) => {
    if (!io || !userId || !notificationData) return;

    io.to(`user_${userId}`).emit('newNotification', {
      ...notificationData,
      timestamp: new Date(),
    });

    logger.info(`📩 Emitted notification to user_${userId}: ${notificationData.message}`);
  };

  return {
    io,
    broadcastOrderUpdate,
    broadcastBulkOrderUpdate,
    emitAdminNotification,
    emitNotification,
    broadcastDeliveryPickup,
    broadcastNavigationStarted,
    broadcastDeliveryCompleted,
    broadcastEmergencyAlert,
    broadcastReplacementRequest,
  };
};

module.exports = setupSocketServer;