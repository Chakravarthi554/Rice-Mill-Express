import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  TextField,
  InputAdornment,
  Grid,
  Paper,
  CircularProgress,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import {
  Search,
  Refresh,
  Store,
  Person,
  LocalShipping,
  MoreVert,
  Info,
  Block,
  CheckCircle,
  PushPin,
  VolumeOff,
  VolumeUp
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import io from 'socket.io-client';
import AdminChatWindow from '../AdminChatWindow';
import { Add as AddIcon } from '@mui/icons-material';

const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const MessagesTab = () => {
  const { userInfo } = useSelector(state => state.userLogin);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuConversation, setMenuConversation] = useState(null);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const socketRef = useRef();

  const fetchConversations = async () => {
    if (!userInfo?.token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/chat/conversations', config);
      setConversations(Array.isArray(data) ? data : data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/users', config);
      // Filter out admins and delivery partners if we only want to chat with sellers/customers
      setUsers(data.filter(u => u._id !== userInfo._id));
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (userInfo?.token && userInfo.role === 'admin') {
      socketRef.current = io(socketUrl, {
        auth: { token: userInfo.token }
      });

      socketRef.current.on('connect', () => {
        console.log('Admin connected to socket');
        // CRITICAL FIX: Join admin_room to receive all seller messages
        socketRef.current.emit('join', 'admin_room');
      });

      socketRef.current.on('chat:conversation_update', (updatedConv) => {
        setConversations(prev => {
          const exists = prev.find(c => c._id === updatedConv._id);
          if (exists) {
            return prev.map(c => c._id === updatedConv._id ? updatedConv : c)
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          }
          return [updatedConv, ...prev].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });
      });

      socketRef.current.on('chat:message', (data) => {
        // Refresh conversations to update last message
        fetchConversations();
      });

      // ✅ FIX BUG #6: Listen for read receipt updates to update unread counts
      socketRef.current.on('chat:message_read', ({ conversationId, userId }) => {
        console.log('Message read event received for conversation:', conversationId, 'by user:', userId);
        if (userId === userInfo._id) {
          // Update conversation to reflect read status
          fetchConversations();
        }
      });

      return () => socketRef.current.disconnect();
    }
  }, [userInfo]);

  const getOtherParticipant = (conv) => {
    return conv.participants.find(p => p._id !== userInfo._id) || {};
  };

  const getUnreadCount = (conv) => {
    return conv.unreadCounts ? (conv.unreadCounts[userInfo._id] || 0) : 0;
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setProfileDialogOpen(true);
    handleMenuClose();
  };

  const handleMenuOpen = (event, conv) => {
    setAnchorEl(event.currentTarget);
    setMenuConversation(conv);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuConversation(null);
  };

  const handleStartNewChat = (user) => {
    // Check if conversation already exists
    const existing = conversations.find(c =>
      c.participants.some(p => p._id === user._id)
    );

    if (existing) {
      setSelectedConversation(existing);
    } else {
      // Create a "draft" conversation object
      setSelectedConversation({
        _id: null,
        participants: [userInfo, user],
        isActive: false
      });
    }
    setNewChatDialogOpen(false);
  };

  const handleDisableChat = async () => {
    if (menuConversation) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`/api/chat/action/${menuConversation._id}`, {
          action: 'disable'
        }, config);
        fetchConversations();
      } catch (error) {
        console.error('Error disabling chat:', error);
      }
    }
    handleMenuClose();
  };

  // Sort conversations: Pinned first, then by date
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = a.pinnedBy?.includes(userInfo._id);
    const bPinned = b.pinnedBy?.includes(userInfo._id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const filteredConversations = sortedConversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      other.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      other.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">💬 Messages</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { fetchUsers(); setNewChatDialogOpen(true); }}
                sx={{ mr: 2 }}
              >
                New Chat
              </Button>
              <IconButton onClick={fetchConversations}><Refresh /></IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
            <Box p={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              />
            </Box>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {loading ? <CircularProgress sx={{ m: 2 }} /> : filteredConversations.map(conv => {
                const other = getOtherParticipant(conv);
                const unread = getUnreadCount(conv);
                const isDisabled = conv.isDisabled;

                return (
                  <ListItem
                    key={conv._id}
                    button
                    selected={selectedConversation?._id === conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    sx={{
                      borderLeft: unread > 0 ? '4px solid red' : '4px solid transparent',
                      opacity: isDisabled ? 0.6 : 1
                    }}
                  >
                    <ListItemAvatar>
                      <Badge badgeContent={unread} color="error">
                        <Avatar src={other.profileImage}>{other.name?.[0]}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">{other.name}</Typography>
                          <Chip
                            label={other.role}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.6rem' }}
                          />
                          {isDisabled && <Chip label="Disabled" size="small" color="error" sx={{ height: 20 }} />}
                          {conv.pinnedBy?.includes(userInfo._id) && <PushPin sx={{ fontSize: 16, color: 'primary.main', ml: 'auto' }} />}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" noWrap display="block" color={unread > 0 ? 'text.primary' : 'text.secondary'} fontWeight={unread > 0 ? 'bold' : 'normal'}>
                          {conv.lastMessage?.content || 'Attachment'}
                        </Typography>
                      }
                    />
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, conv); }}>
                      <MoreVert />
                    </IconButton>
                  </ListItem>
                );
              })}
              {!loading && filteredConversations.length === 0 && (
                <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
                  No conversations found
                </Typography>
              )}
            </List>
          </Card>
        </Grid>

        {/* Window */}
        <Grid item xs={12} md={8}>
          {selectedConversation ? (
            <AdminChatWindow
              conversation={selectedConversation}
              currentUser={userInfo}
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <Paper sx={{ height: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
              <Typography color="text.secondary">Select a conversation to start chatting</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleViewProfile(getOtherParticipant(menuConversation))}>
          <ListItemIcon><Info fontSize="small" /></ListItemIcon>
          <ListItemText>View Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDisableChat}>
          <ListItemIcon>
            {menuConversation?.isDisabled ? <CheckCircle fontSize="small" /> : <Block fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{menuConversation?.isDisabled ? 'Enable Chat' : 'Disable Chat'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={async () => {
          try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`/api/chat/action/${menuConversation._id}`, { action: 'pin' }, config);
            fetchConversations();
          } catch (e) { console.error(e); }
          handleMenuClose();
        }}>
          <ListItemIcon><PushPin fontSize="small" /></ListItemIcon>
          <ListItemText>{menuConversation?.pinnedBy?.includes(userInfo._id) ? 'Unpin Chat' : 'Pin Chat'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={async () => {
          try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`/api/chat/action/${menuConversation._id}`, { action: 'mute' }, config);
            fetchConversations();
          } catch (e) { console.error(e); }
          handleMenuClose();
        }}>
          <ListItemIcon>{menuConversation?.mutedBy?.includes(userInfo._id) ? <VolumeUp fontSize="small" /> : <VolumeOff fontSize="small" />}</ListItemIcon>
          <ListItemText>{menuConversation?.mutedBy?.includes(userInfo._id) ? 'Unmute Chat' : 'Mute Chat'}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={selectedUser?.profileImage} sx={{ width: 56, height: 56 }} />
            <Box>
              <Typography variant="h6">{selectedUser?.name}</Typography>
              <Chip label={selectedUser?.role} color="primary" size="small" />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><Divider /></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" fontWeight="bold">Business Details</Typography>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Business Name</Typography>
              <Typography variant="body1">{selectedUser?.businessDetails?.businessName || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">GST Number</Typography>
              <Typography variant="body1">{selectedUser?.businessDetails?.gstNumber || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Business Type</Typography>
              <Typography variant="body1">{selectedUser?.businessDetails?.businessType || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Address</Typography>
              <Typography variant="body2">
                {selectedUser?.businessDetails?.address ?
                  `${selectedUser.businessDetails.address.street}, ${selectedUser.businessDetails.address.city}, ${selectedUser.businessDetails.address.state} - ${selectedUser.businessDetails.address.pinCode}` :
                  'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" fontWeight="bold">Account Info</Typography>
              <Divider sx={{ mb: 1 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              <Typography variant="body1">{selectedUser?.email || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
              <Typography variant="body1">{selectedUser?.phone || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Typography variant="body1" color={selectedUser?.isOnline ? 'success.main' : 'text.disabled'}>
                {selectedUser?.isOnline ? 'Active Now' : 'Offline'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Last Active</Typography>
              <Typography variant="body1">
                {selectedUser?.lastActive ? new Date(selectedUser.lastActive).toLocaleString() : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New Chat Dialog */}
      <Dialog open={newChatDialogOpen} onClose={() => setNewChatDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Start New Chat</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search sellers/customers..."
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          />
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {loadingUsers ? <CircularProgress size={24} sx={{ display: 'block', m: 'auto' }} /> :
              users.filter(u =>
                u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
              ).map(user => (
                <ListItem key={user._id} button onClick={() => handleStartNewChat(user)}>
                  <ListItemAvatar><Avatar src={user.profileImage}>{user.name[0]}</Avatar></ListItemAvatar>
                  <ListItemText primary={user.name} secondary={`${user.role} - ${user.email}`} />
                </ListItem>
              ))
            }
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessagesTab;
