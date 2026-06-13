import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  RestaurantMenu as RecipeIcon,
  Assignment as KycIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  Inventory as StockIcon,
  Forum as ForumIcon,
  Chat as ChatIcon,
  Check as CheckIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);

  const iconMap = {
    RECIPE_SUBMITTED: <RecipeIcon color="primary" />,
    NEW_KYC_APPLICATION: <KycIcon color="secondary" />,
    PAYMENT_DISPUTE: <PaymentIcon color="error" />,
    LOW_STOCK_ALERT: <StockIcon color="warning" />,
    SPAM_REPORT: <WarningIcon color="error" />,
    NEW_CHAT_MESSAGE: <ChatIcon color="info" />,
    SUPPORT_TICKET: <ChatIcon color="success" />,
    REFUND_REQUESTED: <PaymentIcon color="warning" />,
    PAYOUT_READY: <PaymentIcon color="success" />,
    ORDER_PLACED: <PaymentIcon color="info" />,
    default: <CircleIcon color="action" />
  };

  const priorityColors = {
    low: 'default',
    medium: 'primary',
    high: 'warning',
    critical: 'error'
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = '/api/notifications?limit=50';
      if (filter === 'unread') {
        url = '/api/notifications?read=false&limit=50';
      } else if (filter !== 'all') {
        url = `/api/notifications?type=${filter}&limit=50`;
      }

      const { data } = await api.get(url);
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event, newValue) => {
    setFilter(newValue);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      // Update local state
      setNotifications(prev => prev.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      ));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      // Remove from local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/api/notifications');
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const handleNotificationAction = (notification) => {
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('http')) {
        window.location.href = notification.actionUrl;
      } else {
        navigate(notification.actionUrl);
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    handleNotificationAction(notification);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {unreadCount > 0 && (
                <Button
                  startIcon={<CheckIcon />}
                  onClick={markAllAsRead}
                  variant="outlined"
                  size="small"
                >
                  Mark All Read
                </Button>
              )}
              <Button
                startIcon={<DeleteIcon />}
                onClick={clearAllNotifications}
                variant="outlined"
                color="error"
                size="small"
              >
                Clear All
              </Button>
            </Box>
          </Box>

          <Tabs
            value={filter}
            onChange={handleFilterChange}
            sx={{ mb: 3 }}
          >
            <Tab label="All" value="all" />
            <Tab label="Unread" value="unread" />
            <Tab label="Recipes" value="RECIPE_SUBMITTED" />
            <Tab label="KYC" value="NEW_KYC_APPLICATION" />
            <Tab label="Payments" value="PAYMENT_DISPUTE" />
            <Tab label="Alerts" value="LOW_STOCK_ALERT" />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {notifications.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No notifications found"
                    secondary="You're all caught up with your notifications!"
                    sx={{ textAlign: 'center', py: 4 }}
                  />
                </ListItem>
              ) : (
                notifications.map((notification, index) => (
                  <React.Fragment key={notification._id}>
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        borderLeft: notification.priority === 'high' || notification.priority === 'critical'
                          ? '4px solid'
                          : '1px solid',
                        borderLeftColor: notification.priority === 'critical' ? 'error.main' :
                          notification.priority === 'high' ? 'warning.main' :
                            notification.priority === 'medium' ? 'primary.main' : 'grey.300',
                        mb: 1,
                        borderRadius: 1,
                        backgroundColor: notification.read ? 'transparent' : 'action.hover'
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {iconMap[notification.type] || iconMap.default}
                      </ListItemIcon>
                      <ListItemText
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} component="span">
                              {notification.title}
                            </Typography>
                            <Chip
                              label={notification.priority}
                              size="small"
                              color={priorityColors[notification.priority] || 'default'}
                            />
                            {!notification.read && (
                              <Chip
                                label="New"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(notification.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {!notification.read && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            color="primary"
                          >
                            <CheckIcon />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                        {notification.actionUrl && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationAction(notification);
                            }}
                          >
                            {notification.actionLabel || 'View'}
                          </Button>
                        )}
                      </Box>
                    </ListItemButton>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationCenter;