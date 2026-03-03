import { io } from 'socket.io-client';
import { auth } from '../config/firebase';
import { API_URL } from '../config/env';

let socket = null;

export const connectSocket = async () => {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user logged in, cannot connect socket');
        return null;
    }

    try {
        const token = await user.getIdToken();

        socket = io(API_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });

        return socket;
    } catch (error) {
        console.error('Error connecting socket:', error);
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
    joinRoom,
    leaveRoom,
    getSocket,
};
