import React, { useEffect, Component } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, IconButton, Button, Box, Chip, Paper, Stack
} from '@mui/material';
import { Delete as DeleteIcon, DoneAll, Notifications as NotifIcon, ArrowForward } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Message from '../../components/common/Message';
import {
  listNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead
} from '../../redux/actions/notificationActions';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <Message severity="error">Something went wrong with notifications.</Message>;
    }
    return this.props.children;
  }
}

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { notifications = [], loading, error } =
    useSelector((state) => state.notification) || {};

  const { userInfo } = useSelector((state) => state.userLogin) || {};

  useEffect(() => {
    if (userInfo) {
      dispatch(listNotifications());
    }
  }, [dispatch, userInfo]);

  const handleMarkAsRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteNotification(id));
  };

  if (!userInfo) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center' }}>
          <Message severity="warning">Please log in to view notifications.</Message>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Loading notifications...</Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Message severity="error">{error}</Message>
      </Container>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ bgcolor: '#F0FDF4', minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="md" sx={{ pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotifIcon sx={{ color: '#16A34A', fontSize: 28 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                sx={{ bgcolor: '#16A34A', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}
              />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<DoneAll />}
              onClick={() => dispatch(markAllNotificationsAsRead())}
              sx={{ borderRadius: 3, fontWeight: 700 }}
            >
              Mark All Read
            </Button>
          )}
        </Box>

        <ErrorBoundary>
          {notifications.length === 0 ? (
            <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center', border: '1px dashed #BBF7D0', bgcolor: '#F0FDF4' }}>
              <NotifIcon sx={{ fontSize: 56, color: '#16A34A', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                No notifications
              </Typography>
              <Typography sx={{ color: '#9CA3AF', mb: 3 }}>
                You're all caught up! New notifications will appear here.
              </Typography>
            </Paper>
          ) : (
            <AnimatePresence>
              <Stack spacing={1.5}>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Paper
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: notification.read ? '#F3F4F6' : '#BBF7D0',
                        bgcolor: notification.read ? '#fff' : '#F0FDF4',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          borderColor: '#16A34A',
                        },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Box sx={{
                        width: 10, height: 10, borderRadius: 5,
                        bgcolor: notification.read ? '#D1D5DB' : '#16A34A',
                        flexShrink: 0,
                      }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{
                          fontWeight: notification.read ? 500 : 700,
                          color: '#111827',
                          fontSize: 14,
                          mb: 0.3,
                        }}>
                          {notification.message}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        {!notification.read && (
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification._id); }}
                            sx={{ color: '#16A34A', '&:hover': { bgcolor: '#F0FDF4' } }}
                          >
                            <DoneAll fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleDelete(notification._id); }}
                          sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {notification.actionUrl && (
                          <ArrowForward sx={{ fontSize: 16, color: '#D1D5DB', alignSelf: 'center' }} />
                        )}
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Stack>
            </AnimatePresence>
          )}
        </ErrorBoundary>
      </Container>
    </Box>
  );
};

export default NotificationsPage;
