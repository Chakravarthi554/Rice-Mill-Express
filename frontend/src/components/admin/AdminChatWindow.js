import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Send,
  AttachFile,
  Close,
  MarkChatRead,
  LocalShipping,
  Store,
  Person
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import {
  getConversationWithUser,
  adminSendMessage,
  markConversationResolved
} from '../../redux/actions/adminMessageActions';

const AdminChatWindow = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const { currentConversation, loading, error } = useSelector(state => state.adminMessages);
  const { userInfo } = useSelector(state => state.userLogin);
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef();
  const messagesEndRef = useRef();

  useEffect(() => {
    if (user?._id) {
      dispatch(getConversationWithUser(user._id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Setup socket for real-time chat
    if (userInfo?.token && user?._id) {
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
        auth: { token: `Bearer ${userInfo.token}` },
        transports: ["websocket"],
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('joinUserRoom', user._id);
      });

      socketRef.current.on('NEW_MESSAGE', (newMessage) => {
        if (newMessage.sender === user._id || newMessage.receiver === user._id) {
          dispatch(getConversationWithUser(user._id));
        }
      });

      socketRef.current.on('TYPING', (data) => {
        if (data.from === user._id) setIsTyping(true);
      });

      socketRef.current.on('STOP_TYPING', (data) => {
        if (data.from === user._id) setIsTyping(false);
      });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [dispatch, userInfo, user]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (message.trim() && user?._id) {
      dispatch(adminSendMessage({
        userId: user._id,
        content: message.trim()
      })).then(() => {
        setMessage('');
        if (socketRef.current) {
          socketRef.current.emit('STOP_TYPING', { to: user._id });
        }
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (socketRef.current && user?._id) {
      socketRef.current.emit('TYPING', { to: user._id, from: userInfo._id });
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socketRef.current.emit('STOP_TYPING', { to: user._id, from: userInfo._id });
      }, 1000);
    }
  };

  const handleMarkResolved = () => {
    if (user?._id) {
      dispatch(markConversationResolved(user._id, {
        resolutionNotes: 'Issue resolved through chat'
      }));
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'seller': return <Store fontSize="small" />;
      case 'deliveryPartner': return <LocalShipping fontSize="small" />;
      default: return <Person fontSize="small" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'seller': return 'primary';
      case 'deliveryPartner': return 'secondary';
      default: return 'default';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return (
      <Card sx={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No user selected
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={user.profileImage}>
              {user.name?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {user.name || 'Unknown User'}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  icon={getRoleIcon(user.role)}
                  label={user.role || 'user'}
                  size="small"
                  color={getRoleColor(user.role)}
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              startIcon={<MarkChatRead />}
              onClick={handleMarkResolved}
              variant="outlined"
              size="small"
            >
              Mark Resolved
            </Button>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* User Details */}
        {currentConversation?.recentOrders && currentConversation.recentOrders.length > 0 && (
          <Box mt={1}>
            <Typography variant="body2" color="text.secondary">
              Recent Orders: {currentConversation.recentOrders.length}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            {currentConversation?.messages?.map((msg) => (
              <Box
                key={msg._id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.sender?._id === userInfo?._id ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '70%',
                    bgcolor: msg.sender?._id === userInfo?._id ? 'primary.main' : 'white',
                    color: msg.sender?._id === userInfo?._id ? 'white' : 'text.primary',
                    borderRadius: 2,
                    boxShadow: 1
                  }}
                >
                  <Typography variant="body2">
                    {msg.content}
                  </Typography>
                  {msg.image && (
                    <Box mt={1}>
                      <img
                        src={msg.image}
                        alt="attachment"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '8px'
                        }}
                        onClick={() => window.open(msg.image, '_blank')}
                      />
                    </Box>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.7,
                      textAlign: 'right'
                    }}
                  >
                    {formatTime(msg.createdAt)}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {isTyping && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2" fontStyle="italic">
                    {user.name} is typing...
                  </Typography>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" gap={1}>
          <IconButton size="small">
            <AttachFile />
          </IconButton>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            size="small"
            multiline
            maxRows={3}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!message.trim()}
            color="primary"
          >
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

export default AdminChatWindow;