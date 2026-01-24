import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { initializeSocket, disconnectSocket, getCurrentSocket } from '../../utils/socket';

const SocketInitializer = () => {
  const { userInfo } = useSelector((state) => state.userLogin);
  const socketInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple socket initializations
    if (!userInfo?._id || socketInitialized.current) {
      return;
    }

    console.log('🔄 Initializing socket for user:', userInfo._id);
    socketInitialized.current = true;

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

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);

      // Handle authentication errors
      if (error.message.includes('auth') || error.message.includes('token')) {
        console.log('🔐 Auth error, clearing storage and redirecting...');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        window.location.href = '/login';
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
  }, [userInfo?._id, userInfo?.token]); // Depend on ID and Token for freshness

  return null;
};

export default SocketInitializer;