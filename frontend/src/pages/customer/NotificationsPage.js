import React, { useEffect, Component } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Button,
  Box,
} from '@mui/material';
import { Delete as DeleteIcon, Done as DoneIcon } from '@mui/icons-material';
import Message from '../../components/common/Message';
import NotificationCenter from '../../components/common/NotificationCenter';

// ======================
// ERROR BOUNDARY
// ======================
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

// ======================
// MAIN PAGE COMPONENT
// ======================
const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { notifications = [], loading, error } =
    useSelector((state) => state.notificationList) || {};

  const { userInfo } = useSelector((state) => state.userLogin) || {};

  // Fetch notifications on load
  useEffect(() => {
    if (userInfo) {
      dispatch({ type: 'NOTIFICATION_LIST_REQUEST' }); 
      // You can hook your action here later
    }
  }, [dispatch, userInfo]);

  const handleMarkAsRead = (id) => {
    dispatch({ type: 'MARK_NOTIFICATIONS_AS_READ', payload: [id] });
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
  };

  if (!userInfo) {
    return <Message severity="warning">Please log in to view notifications.</Message>;
  }

  if (loading) {
    return <Message severity="info">Loading notifications...</Message>;
  }

  if (error) {
    return <Message severity="error">{error}</Message>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Section Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Notification Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all your notifications in one place
        </Typography>
      </Box>

      {/* Existing Component (Optional Use) */}
      <NotificationCenter />

      {/* Error Boundary Wrapper */}
      <ErrorBoundary>
        {notifications.length === 0 ? (
          <Message severity="info" sx={{ mt: 4 }}>
            No notifications available.
          </Message>
        ) : (
          <>
            {/* Notification List */}
            <List>
              {notifications.map((notification) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    secondaryAction={
                      <>
                        <IconButton
                          edge="end"
                          aria-label="mark as read"
                          onClick={() => handleMarkAsRead(notification._id)}
                          disabled={notification.read}
                        >
                          <DoneIcon color={notification.read ? 'success' : 'primary'} />
                        </IconButton>

                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(notification._id)}
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText
                      primary={notification.message}
                      secondary={new Date(notification.createdAt).toLocaleString()}
                      sx={{
                        textDecoration: notification.read ? 'none' : 'underline',
                      }}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            {/* Mark All as Read Button */}
            <Button
              variant="contained"
              onClick={() =>
                dispatch({
                  type: 'MARK_ALL_NOTIFICATIONS_AS_READ',
                  payload: notifications.filter((n) => !n.read).map((n) => n._id),
                })
              }
              disabled={notifications.every((n) => n.read)}
              sx={{ mt: 2 }}
            >
              Mark All as Read
            </Button>
          </>
        )}
      </ErrorBoundary>
    </Container>
  );
};

export default NotificationsPage;
