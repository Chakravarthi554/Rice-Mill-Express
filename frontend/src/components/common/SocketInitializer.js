import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { initializeSocket, disconnectSocket, getCurrentSocket } from '../../utils/socket';
import { refreshFirebaseToken } from '../../utils/authUtils';
import { useAuth } from '../../context/AuthContext';

const SocketInitializer = () => {
  const { userInfo } = useSelector((state) => state.userLogin);
  const { loading } = useAuth();
  const socketInitialized = useRef(false);

  useEffect(() => {
    // Prevent initialization if no user or if AuthContext is still resolving the session
    if (!userInfo?._id || loading) {
      return;
    }

    console.log('🔄 Socket: Initializing/Updating for user:', userInfo._id);

    const socket = initializeSocket(userInfo);

    if (!socket) {
      console.error('❌ Failed to initialize socket');
      socketInitialized.current = false;
      return;
    }

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);

      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        console.log('🔄 Server disconnected socket, attempting reconnect...');
        socket.connect();
      }
    });

    socket.on('connect_error', async (error) => {
      console.error('❌ Socket connection error:', error.message);

      // Handle authentication errors proactively
      if (error.message.toLowerCase().includes('auth') || error.message.toLowerCase().includes('token') || error.message.toLowerCase().includes('expire')) {
        console.warn('🔐 Socket authentication failed, attempting proactive token refresh...');
        const newToken = await refreshFirebaseToken();
        if (newToken) {
          console.log('🔄 Socket: Token refreshed, attempting to reconnect...');
          socket.connect();
        } else {
          console.error('❌ Socket: Proactive refresh failed, check session status.');
        }
      }
    });

    // Heartbeat for connection monitoring
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('PING');
      }
    }, 30000);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up socket initializer');
      clearInterval(pingInterval);

      // Don't disconnect socket - keep connection alive for app lifetime
      // Only disconnect on logout or token refresh
    };
  }, [userInfo?._id, userInfo?.token, loading]); // Depend on ID, Token, and loading state

  return null;
};

export default SocketInitializer;