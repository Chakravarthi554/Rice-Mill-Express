import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  RestaurantMenu as RecipeIcon,
  Assignment as KycIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  Inventory as StockIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentSocket, setupSocialListeners } from '../../utils/socket';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBadge = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userInfo } = useSelector((state) => state.userLogin);
  const dispatch = useDispatch();

  const iconMap = {
    RECIPE_SUBMITTED: <RecipeIcon color="primary" />,
    NEW_KYC_APPLICATION: <KycIcon color="secondary" />,
    PAYMENT_DISPUTE: <PaymentIcon color="error" />,
    LOW_STOCK_ALERT: <StockIcon color="warning" />,
    SPAM_REPORT: <WarningIcon color="error" />,
    NEW_CHAT_MESSAGE: <ChatIcon color="info" />,
    SUPPORT_TICKET: <ChatIcon color="success" />, // Or a dedicated support icon
    REFUND_REQUESTED: <PaymentIcon color="warning" />,
    PAYOUT_READY: <PaymentIcon color="success" />,
    default: <CircleIcon color="action" />
  };

  useEffect(() => {
    if (!userInfo) return;

    const socket = getCurrentSocket();
    if (!socket) return;

    // Setup notification listeners
    const callbacks = {
      onNotification: (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
      },
      onAdminNotification: (notification) => {
        if (userInfo.role === 'admin') {
          setNotifications(prev => [notification, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
        }
      },
      onUnreadCount: (count) => {
        setUnreadCount(count);
      }
    };

    setupSocialListeners(callbacks);

    // Fetch initial notifications
    fetchNotifications();

    return () => {
      // Cleanup will be handled by the socket utility
    };
  }, [userInfo]);

  const fetchNotifications = async () => {
    try {
      if (!userInfo?.token) return;

      const response = await fetch('/api/notifications?limit=10', {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setUnreadCount(0);
    // Mark all as read when opening
    markAllAsRead();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAllAsRead = async () => {
    try {
      if (!userInfo?.token) return;

      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Handle notification action
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        component={motion.div}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPopover-paper': {
            width: 360,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Notifications
            {unreadCount > 0 && (
              <Typography
                component="span"
                sx={{
                  ml: 1,
                  fontSize: '0.8rem',
                  color: 'primary.main',
                  fontWeight: 'bold'
                }}
              >
                ({unreadCount} new)
              </Typography>
            )}
          </Typography>

          <Divider sx={{ mb: 1 }} />

          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            <AnimatePresence>
              {notifications.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No notifications"
                    secondary="You're all caught up!"
                  />
                </ListItem>
              ) : (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                  >
                    <ListItem
                      button
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        borderLeft: notification.priority === 'high' ? '4px solid' : '4px solid transparent',
                        borderLeftColor: notification.priority === 'high' ? 'error.main' :
                          notification.priority === 'medium' ? 'warning.main' : 'transparent',
                        mb: 0.5,
                        borderRadius: 1
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {iconMap[notification.type] || iconMap.default}
                      </ListItemIcon>
                      <ListItemText
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }} component="span">
                            {notification.title || 'Notification'}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message || 'No message'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {notification.timeAgo || (notification.createdAt ? new Date(notification.createdAt).toLocaleTimeString() : 'Just now')}
                            </Typography>
                          </Box>
                        }
                      />
                      {!notification.read && (
                        <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                      )}
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </List>

          {notifications.length > 0 && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Button
                size="small"
                color="primary"
                onClick={() => window.location.href = '/notifications'}
              >
                View All Notifications
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBadge;