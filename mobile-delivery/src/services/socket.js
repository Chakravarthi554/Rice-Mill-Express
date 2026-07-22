import { io } from 'socket.io-client';
import { auth } from '../config/firebase';
import { API_URL } from '../config/env';

let socket = null;

export const connectSocket = async () => {
    // Prevent duplicate connections
    if (socket && socket.connected) {
        console.log('✅ Socket already connected:', socket.id);
        return socket;
    }

    // Disconnect any stale socket before reconnecting
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    const user = auth.currentUser;
    if (!user) {
        console.log('⚠️ No Firebase user logged in, skipping socket connection');
        return null;
    }

    try {
        const token = await user.getIdToken(false);

        // Force websocket transport in React Native to avoid HTTP polling timeout/server errors
        socket = io(API_URL, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 10000,
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            // Suppress repeated errors to keep the console clean
            console.warn('⚠️ Socket connect failed (real-time updates unavailable):', error.message);
        });

        return socket;
    } catch (error) {
        console.warn('⚠️ Could not initiate socket connection:', error.message);
        return null;
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('Socket disconnected manually');
    }
};

export const joinRoom = (room) => {
    if (socket) {
        socket.emit('join', room);
        console.log(`📡 Joined room: ${room}`);
    }
};

export const leaveRoom = (room) => {
    if (socket) {
        socket.emit('leave', room);
        console.log(`📡 Left room: ${room}`);
    }
};

export const subscribeToOrderUpdates = (callback) => {
    if (!socket) {
        console.warn('Socket not connected');
        return;
    }
    socket.on('ORDER_UPDATE', callback);
};

export const subscribeToDeliveryAssignment = (callback) => {
    if (!socket) {
        console.warn('Socket not connected');
        return;
    }
    socket.on('ORDER_ASSIGNED', callback);
};

export const subscribeToDeliveryPickup = (callback) => {
    if (!socket) {
        console.warn('Socket not connected');
        return;
    }
    socket.on('DELIVERY_PICKUP', callback);
};

export const subscribeToNavigationStarted = (callback) => {
    if (!socket) {
        console.warn('Socket not connected');
        return;
    }
    socket.on('NAVIGATION_STARTED', callback);
};

export const subscribeToDeliveryCompleted = (callback) => {
    if (!socket) {
        console.warn('Socket not connected');
        return;
    }
    socket.on('DELIVERY_COMPLETED', callback);
};

export const subscribeToSocialUpdates = (callback) => {
    if (!socket) {
        console.warn('Socket not connected');
        return;
    }
    socket.on('SOCIAL_UPDATE', callback);
};

export const subscribeToEngagementUpdates = (callback) => {
    if (!socket) {
        console.warn('Socket not connected');
        return;
    }
    socket.on('ENGAGEMENT_UPDATE', callback);
};

export const unsubscribeFromOrderUpdates = () => {
    if (socket) {
        socket.off('ORDER_UPDATE');
    }
};

export const unsubscribeFromDeliveryAssignment = () => {
    if (socket) {
        socket.off('ORDER_ASSIGNED');
    }
};

export const unsubscribeFromSocialUpdates = () => {
    if (socket) {
        socket.off('SOCIAL_UPDATE');
    }
};

export const unsubscribeFromEngagementUpdates = () => {
    if (socket) {
        socket.off('ENGAGEMENT_UPDATE');
    }
};

export const subscribeToChatMessage = (callback) => {
    if (!socket) {
        console.warn('Socket not connected');
        return;
    }
    socket.on('chat:message', callback);
};

export const unsubscribeFromChatMessage = () => {
    if (socket) {
        socket.off('chat:message');
    }
};

export const emitDeliveryLocationUpdate = (data) => {
    if (socket && socket.connected) {
        socket.emit('deliveryLocationUpdate', data);
    }
};

export const emitDeliveryStatusUpdate = (data) => {
    if (socket && socket.connected) {
        socket.emit('deliveryStatusUpdate', data);
    }
};

export const emitDeliveryPartnerOnline = (userId) => {
    if (socket && socket.connected) {
        socket.emit('deliveryPartnerOnline', { userId });
    }
};

export const emitDeliveryPartnerOffline = (userId) => {
    if (socket && socket.connected) {
        socket.emit('deliveryPartnerOffline', { userId });
    }
};

export const subscribeToNewOrderAssigned = (callback) => {
    if (socket) {
        socket.on('newOrderAssigned', callback);
        socket.on('ORDER_ASSIGNED', callback);
    }
};

export const subscribeToOrderCancelled = (callback) => {
    if (socket) {
        socket.on('orderCancelled', callback);
    }
};

export const subscribeToMessageReceived = (callback) => {
    if (socket) {
        socket.on('messageReceived', callback);
        socket.on('chat:message', callback);
    }
};

export const unsubscribeFromDeliveryPartnerEvents = () => {
    if (socket) {
        socket.off('newOrderAssigned');
        socket.off('ORDER_ASSIGNED');
        socket.off('orderCancelled');
        socket.off('messageReceived');
        socket.off('chat:message');
    }
};

export const getSocket = () => socket;

export default {
    connectSocket,
    disconnectSocket,
    subscribeToOrderUpdates,
    subscribeToDeliveryAssignment,
    subscribeToDeliveryPickup,
    subscribeToNavigationStarted,
    subscribeToDeliveryCompleted,
    unsubscribeFromSocialUpdates,
    unsubscribeFromEngagementUpdates,
    subscribeToChatMessage,
    unsubscribeFromChatMessage,
    emitDeliveryLocationUpdate,
    emitDeliveryStatusUpdate,
    emitDeliveryPartnerOnline,
    emitDeliveryPartnerOffline,
    subscribeToNewOrderAssigned,
    subscribeToOrderCancelled,
    subscribeToMessageReceived,
    unsubscribeFromDeliveryPartnerEvents,
    joinRoom,
    leaveRoom,
    getSocket,
};
