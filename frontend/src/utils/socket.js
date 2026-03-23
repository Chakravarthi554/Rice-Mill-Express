import { io } from 'socket.io-client';

// ✅ FIXED: Enhanced API URL configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
let socketInstance = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// ✅ FIXED: Enhanced socket connection with better error handling
export const getSocket = (userId, role, token) => {
  const tokenStr = token || localStorage.getItem('token');

  // Enhanced validation
  if (!userId || !tokenStr) {
    console.warn('❌ Socket init failed: missing userId or token');
    return null;
  }

  // Return existing connected socket ONLY if token hasn't changed
  if (socketInstance?.connected) {
    const currentToken = socketInstance.auth?.token;

    if (currentToken && currentToken === tokenStr) {
      console.log('🔄 Reusing existing socket connection (Token fresh)');

      // 🔥 CRITICAL: Ensure we still join relevant rooms even on reuse
      if (userId) {
        socketInstance.emit('joinUserRoom', userId);
        socketInstance.emit('joinNotifications', userId);
      }
      if (role === 'admin') {
        socketInstance.emit('joinAdminRoom');
      }
      if (role === 'seller') {
        socketInstance.emit('joinSellerRoom', userId);
      }

      return socketInstance;
    } else {
      console.log('⚠️ Socket token changed or missing, forcing reconnection...');
    }
  }

  // Clean up existing socket
  if (socketInstance) {
    console.log('🧹 Cleaning up existing socket instance');
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }

  console.log('🔄 Creating new socket connection...');

  // ✅ FIXED: Enhanced socket configuration
  socketInstance = io(API_URL, {
    auth: {
      token: tokenStr,
      userId: userId,
      role: role
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 30000,
    forceNew: false,
    autoConnect: true,
  });

  // ✅ FIXED: Enhanced event handlers with better logging
  socketInstance.on('connect', () => {
    console.log('✅ Socket connected:', socketInstance.id);
    reconnectAttempts = 0;

    // Join relevant rooms
    if (userId) {
      socketInstance.emit('joinUserRoom', userId);
      socketInstance.emit('joinNotifications', userId);
      console.log(`✅ Joined user room: user_${userId}`);
    }

    if (role === 'admin') {
      socketInstance.emit('joinAdminRoom');
      console.log('✅ Joined admin room');
    }

    if (role === 'seller') {
      socketInstance.emit('joinSellerRoom', userId);
      console.log(`✅ Joined seller room: seller_${userId}`);
    }

    // Process any pending actions
    processPendingSocialActions();
    processPendingNotifications();
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('🔴 Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server forcefully disconnected, try to reconnect
      setTimeout(() => {
        if (socketInstance) {
          socketInstance.connect();
        }
      }, 1000);
    }
  });

  socketInstance.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    reconnectAttempts++;

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('🔄 Max reconnection attempts reached');
      disconnectSocket();
    }
  });

  socketInstance.on('reconnect_attempt', (attempt) => {
    console.log(`🔄 Socket reconnection attempt ${attempt}`);
  });

  socketInstance.on('reconnect_failed', () => {
    console.error('❌ Socket reconnection failed');
    disconnectSocket();
  });

  // 🔥 ENHANCED: REAL-TIME SOCIAL EVENT HANDLERS
  socketInstance.on('POST_COMMENTED', (data) => {
    console.log('💬 Post commented event received:', data);
    if (window.socialUpdateCallback) {
      window.socialUpdateCallback({
        type: 'COMMENT_ADDED',
        postId: data.postId,
        comment: data.comment,
        timestamp: new Date()
      });
    }
  });

  socketInstance.on('POST_LIKED', (data) => {
    console.log('❤️ Post liked event received:', data);
    if (window.socialUpdateCallback) {
      window.socialUpdateCallback({
        type: 'LIKE_UPDATED',
        postId: data.postId,
        likesCount: data.likesCount,
        userId: data.userId,
        action: data.action,
        timestamp: new Date()
      });
    }
  });

  socketInstance.on('SOCIAL_UPDATE', (data) => {
    console.log('🔄 SOCIAL_UPDATE received:', data);

    // Dispatch as a custom window event for non-react components or legacy listeners
    const event = new CustomEvent('socialUpdate', { detail: data });
    window.dispatchEvent(event);

    if (window.socialUpdateCallback) {
      window.socialUpdateCallback(data);
    }
  });

  socketInstance.on('ENGAGEMENT_UPDATE', (data) => {
    console.log('📈 ENGAGEMENT_UPDATE received:', data);

    // Standardize the event for the window
    const event = new CustomEvent('ENGAGEMENT_UPDATE', { detail: data });
    window.dispatchEvent(event);

    // Optional: Also trigger socialUpdate listner for compatibility
    const socialEvent = new CustomEvent('socialUpdate', { detail: data });
    window.dispatchEvent(socialEvent);
  });

  socketInstance.on('NEW_FORUM_POST', (data) => {
    console.log('📝 New forum post received:', data);
    if (window.forumUpdateCallback) {
      window.forumUpdateCallback(data);
    }
  });

  socketInstance.on('POST_STATUS_CHANGED', (data) => {
    console.log('🔄 Post status changed:', data);
    if (window.forumUpdateCallback) {
      window.forumUpdateCallback({
        type: 'POST_STATUS_CHANGED',
        ...data
      });
    }
  });

  // ✅ FIXED: NOTIFICATION EVENT HANDLERS
  socketInstance.on('newNotification', (notification) => {
    console.log('📨 New notification received:', notification);
    if (window.notificationCallback) {
      window.notificationCallback(notification);
    }
  });

  socketInstance.on('newAdminNotification', (notification) => {
    console.log('📨 New admin notification received:', notification);
    if (window.adminNotificationCallback) {
      window.adminNotificationCallback(notification);
    }
  });

  socketInstance.on('NOTIFICATION_READ', (data) => {
    console.log('✅ Notification marked as read:', data.notificationId);
    if (window.notificationUpdateCallback) {
      window.notificationUpdateCallback('read', data.notificationId);
    }
  });

  socketInstance.on('UNREAD_COUNT', (data) => {
    console.log('🔢 Unread count received:', data.count);
    if (window.unreadCountCallback) {
      window.unreadCountCallback(data.count);
    }
  });

  // ORDER UPDATES
  socketInstance.on('ORDER_UPDATE', (data) => {
    console.log('📦 Order update received:', data);
    if (window.orderUpdateCallback) {
      window.orderUpdateCallback(data);
    }
  });

  socketInstance.on('BULK_ORDER_UPDATE', (data) => {
    console.log('📦 Bulk order update received:', data);
    if (window.bulkOrderUpdateCallback) {
      window.bulkOrderUpdateCallback(data);
    }
  });

  // TYPING INDICATORS
  socketInstance.on('TYPING', (data) => {
    console.log('⌨️ Typing indicator:', data);
    if (window.typingCallback) {
      window.typingCallback(data);
    }
  });

  socketInstance.on('STOP_TYPING', (data) => {
    console.log('⏹️ Stop typing:', data);
    if (window.stopTypingCallback) {
      window.stopTypingCallback(data);
    }
  });

  // HEARTBEAT
  socketInstance.on('PONG', (data) => {
    console.log('💓 Pong received:', data);
  });

  // ✅ FIXED: Handle authentication errors
  socketInstance.on('unauthorized', (error) => {
    console.error('❌ Socket unauthorized:', error);
    if (error.message?.includes('token') || error.message?.includes('auth')) {
      console.log('🔐 Socket authentication failed, clearing storage...');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  });

  socketInstance.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  return socketInstance;
};

export const initializeSocket = (userInfo) => {
  if (!userInfo?._id) {
    console.warn('❌ Cannot initialize socket: No user info');
    return null;
  }

  return getSocket(
    userInfo._id,
    userInfo.role,
    userInfo.token || localStorage.getItem('token')
  );
};

export const getCurrentSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    console.log('🔌 Disconnecting socket...');
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
  reconnectAttempts = 0;
};

// 🔥 ENHANCED: SOCIAL ACTION FUNCTIONS
export const emitSocialAction = (actionData) => {
  const socket = getCurrentSocket();
  if (socket?.connected) {
    socket.emit('SOCIAL_ACTION', actionData);
    console.log('📤 Emitted social action:', actionData);
    return true;
  }

  // Queue action for when socket reconnects
  const pending = JSON.parse(localStorage.getItem('pendingSocialActions') || '[]');
  pending.push({
    ...actionData,
    timestamp: Date.now(),
    attempt: (actionData.attempt || 0) + 1
  });

  // Keep only recent actions
  const recentPending = pending.slice(-10);
  localStorage.setItem('pendingSocialActions', JSON.stringify(recentPending));

  console.log('📦 Queued social action for later delivery');
  return false;
};

export const processPendingSocialActions = () => {
  const pending = JSON.parse(localStorage.getItem('pendingSocialActions') || '[]');
  if (pending.length && socketInstance?.connected) {
    console.log(`🔄 Processing ${pending.length} pending social actions`);

    pending.forEach(action => {
      if (socketInstance.connected) {
        socketInstance.emit('SOCIAL_ACTION', action);
      }
    });

    localStorage.removeItem('pendingSocialActions');
  }
};

// 🔥 ENHANCED: SETUP SOCIAL LISTENERS
export const setupSocialListeners = (callbacks = {}) => {
  const socket = getCurrentSocket();
  if (!socket) return;

  // Set up callbacks for different social events
  if (callbacks.onSocialUpdate) {
    window.socialUpdateCallback = callbacks.onSocialUpdate;
  }

  if (callbacks.onForumUpdate) {
    window.forumUpdateCallback = callbacks.onForumUpdate;
  }

  if (callbacks.onNotification) {
    window.notificationCallback = callbacks.onNotification;
  }

  if (callbacks.onAdminNotification) {
    window.adminNotificationCallback = callbacks.onAdminNotification;
  }

  if (callbacks.onNotificationUpdate) {
    window.notificationUpdateCallback = callbacks.onNotificationUpdate;
  }

  if (callbacks.onUnreadCount) {
    window.unreadCountCallback = callbacks.onUnreadCount;
  }

  if (callbacks.onOrderUpdate) {
    window.orderUpdateCallback = callbacks.onOrderUpdate;
  }

  if (callbacks.onBulkOrderUpdate) {
    window.bulkOrderUpdateCallback = callbacks.onBulkOrderUpdate;
  }

  if (callbacks.onTyping) {
    window.typingCallback = callbacks.onTyping;
  }

  if (callbacks.onStopTyping) {
    window.stopTypingCallback = callbacks.onStopTyping;
  }
};

export const removeSocialListeners = () => {
  const socket = getCurrentSocket();
  if (socket) {
    socket.off('POST_COMMENTED');
    socket.off('POST_LIKED');
    socket.off('SOCIAL_UPDATE');
    socket.off('NEW_FORUM_POST');
    socket.off('POST_STATUS_CHANGED');
    socket.off('newNotification');
    socket.off('newAdminNotification');
    socket.off('NOTIFICATION_READ');
    socket.off('UNREAD_COUNT');
    socket.off('ORDER_UPDATE');
    socket.off('BULK_ORDER_UPDATE');
    socket.off('TYPING');
    socket.off('STOP_TYPING');
  }

  // Clear global callbacks
  window.socialUpdateCallback = null;
  window.forumUpdateCallback = null;
  window.notificationCallback = null;
  window.adminNotificationCallback = null;
  window.notificationUpdateCallback = null;
  window.unreadCountCallback = null;
  window.orderUpdateCallback = null;
  window.bulkOrderUpdateCallback = null;
  window.typingCallback = null;
  window.stopTypingCallback = null;
};

// 🔥 ENHANCED: ROOM MANAGEMENT
export const joinPostRoom = (postId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && postId) {
    socket.emit('joinPostRoom', postId);
    console.log(`✅ Joined post room: post_${postId}`);
  }
};

export const leavePostRoom = (postId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && postId) {
    socket.emit('leavePostRoom', postId);
    console.log(`✅ Left post room: post_${postId}`);
  }
};

export const joinOrderRoom = (orderId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && orderId) {
    socket.emit('joinOrderRoom', orderId);
    console.log(`✅ Joined order room: order_${orderId}`);
  }
};

export const leaveOrderRoom = (orderId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && orderId) {
    socket.emit('leaveOrderRoom', orderId);
    console.log(`✅ Left order room: order_${orderId}`);
  }
};

export const joinRecipeRoom = (recipeId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && recipeId) {
    socket.emit('joinRecipeRoom', recipeId);
    console.log(`✅ Joined recipe room: recipe_${recipeId}`);
  }
};

export const leaveRecipeRoom = (recipeId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && recipeId) {
    socket.emit('leaveRecipeRoom', recipeId);
    console.log(`✅ Left recipe room: recipe_${recipeId}`);
  }
};

export const joinItemRoom = (type, itemId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && type && itemId) {
    // Standardize type
    const prefix = type.endsWith('s') ? type.slice(0, -1) : type;
    const room = `${prefix.toLowerCase()}_${itemId}`;
    socket.emit('joinRoom', room);
    console.log(`✅ Joined item room: ${room}`);
  }
};

export const leaveItemRoom = (type, itemId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && type && itemId) {
    const prefix = type.endsWith('s') ? type.slice(0, -1) : type;
    const room = `${prefix.toLowerCase()}_${itemId}`;
    socket.emit('leaveRoom', room);
    console.log(`✅ Left item room: ${room}`);
  }
};

// 🔥 ENHANCED: PROCESS PENDING NOTIFICATIONS
export const processPendingNotifications = () => {
  const pending = JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
  if (pending.length) {
    console.log(`🔄 Processing ${pending.length} pending notifications`);

    // Re-emit any pending notification actions
    pending.forEach(action => {
      if (action.type === 'markRead' && getCurrentSocket()?.connected) {
        markNotificationRead(action.notificationId, action.userId);
      }
    });

    localStorage.removeItem('pendingNotifications');
  }
};

// 🔥 ENHANCED: NOTIFICATION ACTIONS
export const markNotificationRead = (notificationId, userId) => {
  const socket = getCurrentSocket();
  if (socket?.connected) {
    socket.emit('markNotificationRead', { notificationId, userId });
    return true;
  }
  return false;
};

export const getUnreadCount = (userId) => {
  const socket = getCurrentSocket();
  if (socket?.connected) {
    socket.emit('getUnreadCount', userId);
    return true;
  }
  return false;
};

// 🔥 ENHANCED: TYPING INDICATORS
export const startTyping = (toUserId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && toUserId) {
    socket.emit('TYPING', { to: toUserId });
  }
};

export const stopTyping = (toUserId) => {
  const socket = getCurrentSocket();
  if (socket?.connected && toUserId) {
    socket.emit('STOP_TYPING', { to: toUserId });
  }
};

// 🔥 ENHANCED: HEARTBEAT
export const sendPing = () => {
  const socket = getCurrentSocket();
  if (socket?.connected) {
    socket.emit('PING');
  }
};

// Order tracking socket class
export class OrderTrackingSocket {
  constructor(userId, role, token, onMessageCallback) {
    this.userId = userId;
    this.role = role;
    this.token = token;
    this.onMessageCallback = onMessageCallback;
    this.socket = getSocket(userId, role, token);
    this.joinedRooms = new Set();

    if (this.socket) {
      this.setupListeners();
    }
  }

  setupListeners() {
    if (!this.socket) return;

    this.orderUpdateHandler = (data) => {
      if (this.onMessageCallback) this.onMessageCallback({ type: 'ORDER_UPDATE', data });
    };
    this.bulkOrderUpdateHandler = (data) => {
      if (this.onMessageCallback) this.onMessageCallback({ type: 'BULK_ORDER_UPDATE', data });
    };

    this.socket.off('ORDER_UPDATE', this.orderUpdateHandler);
    this.socket.off('BULK_ORDER_UPDATE', this.bulkOrderUpdateHandler);
    this.socket.on('ORDER_UPDATE', this.orderUpdateHandler);
    this.socket.on('BULK_ORDER_UPDATE', this.bulkOrderUpdateHandler);
  }

  joinOrderRoom(orderId) {
    if (this.socket && orderId && !this.joinedRooms.has(orderId)) {
      this.socket.emit('joinOrderRoom', orderId);
      this.joinedRooms.add(orderId);
      console.log(`✅ Joined order room: order_${orderId}`);
    }
  }

  leaveOrderRoom(orderId) {
    if (this.socket && orderId && this.joinedRooms.has(orderId)) {
      this.socket.emit('leaveOrderRoom', orderId);
      this.joinedRooms.delete(orderId);
      console.log(`✅ Left order room: order_${orderId}`);
    }
  }

  cleanup() {
    this.joinedRooms.forEach(room => this.leaveOrderRoom(room));
    if (this.socket) {
      this.socket.off('ORDER_UPDATE', this.orderUpdateHandler);
      this.socket.off('BULK_ORDER_UPDATE', this.bulkOrderUpdateHandler);
    }
    this.joinedRooms.clear();
  }

  disconnect() {
    this.cleanup();
  }
}

export const socket = socketInstance;
export default socketInstance;
