import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Search,
  MarkChatRead,
  Chat,
  Person,
  LocalShipping,
  Store,
  MoreVert,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import {
  getAdminConversations,
  getConversationWithUser,
  adminSendMessage,
  markConversationResolved,
  getMessageStats
} from '../../../redux/actions/adminMessageActions';


import AdminChatWindow from '../AdminChatWindow';

const MessagesTab = () => {
  const dispatch = useDispatch();
  const { conversations, loading, error, stats } = useSelector(state => state.adminMessages);
  const { userInfo } = useSelector(state => state.userLogin);
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedConversationMenu, setSelectedConversationMenu] = useState(null);
  
  const socketRef = useRef();

  useEffect(() => {
    dispatch(getAdminConversations({ page: 1, limit: 50 }));
    dispatch(getMessageStats());
  }, [dispatch]);

  useEffect(() => {
    // Setup socket connection for real-time updates
    if (userInfo?.token) {
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
        auth: { token: `Bearer ${userInfo.token}` },
        transports: ["websocket"],
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('joinAdminRoom');
      });

      socketRef.current.on('NEW_MESSAGE', (newMessage) => {
        // Refresh conversations when new message arrives
        dispatch(getAdminConversations({ page: 1, limit: 50 }));
      });

      socketRef.current.on('ADMIN_MESSAGE_SENT', () => {
        dispatch(getAdminConversations({ page: 1, limit: 50 }));
      });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [dispatch, userInfo]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    dispatch(getConversationWithUser(conversation.userId));
  };

  const handleMenuOpen = (event, conversation) => {
    setAnchorEl(event.currentTarget);
    setSelectedConversationMenu(conversation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConversationMenu(null);
  };

  const handleMarkResolved = () => {
    if (selectedConversationMenu) {
      dispatch(markConversationResolved(selectedConversationMenu.userId, {
        resolutionNotes: 'Issue resolved by admin'
      }));
      handleMenuClose();
    }
  };

  const handleRefresh = () => {
    dispatch(getAdminConversations({ page: 1, limit: 50 }));
    dispatch(getMessageStats());
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'seller': return <Store color="primary" />;
      case 'deliveryPartner': return <LocalShipping color="secondary" />;
      default: return <Person color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'sent': return 'warning';
      case 'read': return 'info';
      default: return 'default';
    }
  };

  const filteredConversations = conversations?.filter(conv => {
    const matchesSearch = 
      conv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.lastMessage?.content && conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'unread' && conv.unreadCount > 0);
    
    const matchesRole = roleFilter === 'all' || conv.user?.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  if (loading && !conversations) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" gutterBottom>
              💬 Admin Messages
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={handleRefresh}
              variant="outlined"
            >
              Refresh
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="h6">{stats?.totalMessages || 0}</Typography>
                <Typography variant="body2">Total Messages</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                <Typography variant="h6">{stats?.todayMessages || 0}</Typography>
                <Typography variant="body2">Today</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                <Typography variant="h6">{stats?.unreadMessages || 0}</Typography>
                <Typography variant="body2">Unread</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                <Typography variant="h6">{stats?.activeConversations || 0}</Typography>
                <Typography variant="body2">Active Chats</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                <Typography variant="h6">
                  {conversations?.filter(c => c.unreadCount === 0).length || 0}
                </Typography>
                <Typography variant="body2">Resolved</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="unread">Unread</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Role"
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="customer">Customer</MenuItem>
                    <MenuItem value="seller">Seller</MenuItem>
                    <MenuItem value="deliveryPartner">Delivery</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {filteredConversations?.map((conversation) => (
                  <ListItem
                    key={conversation.userId}
                    button
                    selected={selectedConversation?.userId === conversation.userId}
                    onClick={() => handleConversationSelect(conversation)}
                    sx={{
                      borderLeft: conversation.unreadCount > 0 ? '4px solid #ff6b6b' : '4px solid transparent',
                      mb: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={conversation.unreadCount}
                        color="error"
                        overlap="circular"
                      >
                        <Avatar src={conversation.user?.profileImage}>
                          {conversation.user?.name?.[0] || 'U'}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" noWrap>
                            {conversation.user?.name || 'Unknown User'}
                          </Typography>
                          {getRoleIcon(conversation.user?.role)}
                          {conversation.user?.role === 'seller' && (
                            <Chip
                              label="Seller"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" noWrap sx={{ color: 'text.primary' }}>
                            {conversation.lastMessage?.content || '📎 Attachment'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {conversation.lastMessage?.createdAt ? 
                              new Date(conversation.lastMessage.createdAt).toLocaleTimeString() : 
                              'No messages'
                            }
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, conversation)}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItem>
                ))}
                {(!filteredConversations || filteredConversations.length === 0) && (
                  <ListItem>
                    <ListItemText
                      primary="No conversations found"
                      secondary="Try adjusting your search or filters"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Window */}
        <Grid item xs={12} md={8}>
          {selectedConversation ? (
            <AdminChatWindow
              user={selectedConversation.user}
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <Card sx={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Chat sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start chatting
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Choose from the list on the left to view and reply to messages
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMarkResolved}>
          <MarkChatRead sx={{ mr: 1 }} />
          Mark as Resolved
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          View User Profile
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          View Orders
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessagesTab;