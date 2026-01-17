import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  TextField,
  CircularProgress,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Circle as CircleIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  PushPin,
  FileDownload as DownloadIcon,
  Person as PersonIcon,
  InsertEmoticon as EmojiIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import io from 'socket.io-client';
import axios from 'axios';

const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminChatWindow = ({ conversation, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [msgAnchorEl, setMsgAnchorEl] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null); // ✅ NEW: Emoji picker state
  const [showProfile, setShowProfile] = useState(false); // ✅ FIX BUG #7: Profile dialog state
  const [fullSellerProfile, setFullSellerProfile] = useState(null); // ✅ FIX BUG #5: Full seller data
  const [loadingProfile, setLoadingProfile] = useState(false); // ✅ FIX BUG #5: Loading state
  const [sending, setSending] = useState(false); // ✅ NEW: Loading state for sending

  const scrollRef = useRef();
  const fileInputRef = useRef();
  const socketRef = useRef();
  const typingTimeoutRef = useRef();

  const otherUser = conversation.participants.find(p => p._id !== currentUser._id) || {};

  useEffect(() => {
    fetchMessages();
    setupSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [conversation._id]);

  const setupSocket = () => {
    // ✅ FIX BUG #7: Properly cleanup old socket before creating new one
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    socketRef.current = io(socketUrl, {
      auth: { token: currentUser.token }
    });

    socketRef.current.on('connect', () => {
      console.log('Admin socket connected:', socketRef.current.id);
      socketRef.current.emit('joinAdminRoom'); // Corrected event name from socketServer.js
      socketRef.current.emit('joinUserRoom', currentUser._id);
    });

    socketRef.current.on('chat:message', (data) => {
      if (data.conversationId === conversation._id) {
        // ✅ FIX BUG #7 & #8: Prevent duplicate messages from admin sending
        setMessages(prev => {
          // Check if message already exists (from optimistic update or previous receive)
          const exists = prev.some(m => m._id === data.message._id);
          if (exists) {
            console.log('Message already exists, skipping duplicate');
            return prev;
          }
          return [...prev, data.message];
        });
        scrollToBottom();
        markAsRead();
      }
    });

    socketRef.current.on('chat:message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    socketRef.current.on('chat:message_updated', (updatedMsg) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    socketRef.current.on('chat:typing', ({ conversationId: cId }) => {
      if (cId === conversation._id) setOtherTyping(true);
    });

    socketRef.current.on('chat:stop_typing', ({ conversationId: cId }) => {
      if (cId === conversation._id) setOtherTyping(false);
    });

    socketRef.current.on('chat:chat_cleared', ({ conversationId: cId, userId: clearingUserId }) => {
      if (cId === conversation._id && clearingUserId === currentUser._id) {
        setMessages([]);
      }
    });
  };

  const fetchMessages = async () => {
    if (!conversation._id) {
      setMessages([]);
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const { data } = await axios.get(`/api/chat/messages/${conversation._id}`, config);
      setMessages(data.messages);
      scrollToBottom();
      markAsRead();
    } catch (e) { console.error(e); }
  };

  const markAsRead = async () => {
    if (!conversation._id) return;
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.put(`/api/chat/read/${conversation._id}`, {}, config);
    } catch (e) { console.error(e); }
  };

  const scrollToBottom = () => {
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
  };

  // ✅ FIX BUG #5: Fetch full seller profile with business details
  const fetchSellerProfile = async () => {
    if (!otherUser._id || otherUser.role !== 'seller') {
      console.warn('Other user is not a seller or ID missing');
      return;
    }

    setLoadingProfile(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const { data } = await axios.get(`/api/users/${otherUser._id}`, config);
      console.log('Fetched full seller profile:', data);
      setFullSellerProfile(data);
    } catch (e) {
      console.error('Failed to fetch seller profile:', e);
      alert('Failed to load seller profile: ' + (e.response?.data?.message || 'Unknown error'));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!socketRef.current) return;

    socketRef.current.emit('chat:typing', { conversationId: conversation._id, to: otherUser._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (conversation._id) {
        socketRef.current.emit('chat:stop_typing', { conversationId: conversation._id, to: otherUser._id });
      }
    }, 3000);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${currentUser.token}`,
        },
      };
      const { data: uploadResults } = await axios.post('/api/upload/chat/multiple', formData, config);
      await handleSend(null, uploadResults);
    } catch (e) {
      console.error(e);
      // ✅ FIX BUG #3: Better error message for file upload failures
      const errorMsg = e.response?.data?.message || 'File upload failed. Please check your internet connection and try again.';
      alert(errorMsg);
    }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleSend = async (content, attachments = []) => {
    const msgContent = content || message;
    if (!msgContent.trim() && attachments.length === 0) return;

    // ✅ FIX BUG #8: Prevent sending in disabled chats
    if (conversation.isDisabled) {
      alert('This chat is disabled. You cannot send messages.');
      return;
    }

    if (editingMsg) {
      try {
        const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
        await axios.put(`/api/chat/message/${editingMsg._id}`, { content: msgContent }, config);
        setEditingMsg(null);
        setMessage('');
        return;
      } catch (e) { console.error(e); return; }
    }

    try {
      setSending(true);
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      // ✅ FIX: Get response from API to add message immediately
      const { data: sentMessage } = await axios.post('/api/chat/send', {
        receiverId: otherUser._id,
        content: msgContent,
        attachments,
        replyTo: replyingTo?._id || null
      }, config);

      // ✅ FIX: Add message to UI immediately (optimistic update) with duplicate check
      setMessages(prev => {
        if (prev.some(m => m._id === sentMessage._id)) return prev;
        return [...prev, sentMessage];
      });
      setMessage('');
      setReplyingTo(null);
      scrollToBottom();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleMsgAction = (event, msg) => {
    setSelectedMsg(msg);
    setMsgAnchorEl(event.currentTarget);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedMsg.content);
    setMsgAnchorEl(null);
  };

  const handleDelete = async (mode) => {
    // Optimistic update
    if (mode === 'me') {
      setMessages(prev => prev.filter(m => m._id !== selectedMsg._id));
    }

    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.delete(`/api/chat/message/${selectedMsg._id}?mode=${mode}`, config);
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
    setMsgAnchorEl(null);
  };

  const handleStar = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.put(`/api/chat/message/${selectedMsg._id}/star`, {}, config);
      setMessages(prev => prev.map(m => m._id === selectedMsg._id ? {
        ...m, isStarredBy: m.isStarredBy.includes(currentUser._id)
          ? m.isStarredBy.filter(id => id !== currentUser._id)
          : [...m.isStarredBy, currentUser._id]
      } : m));
    } catch (e) { console.error(e); }
    setMsgAnchorEl(null);
  };

  const handleClearChat = async () => {
    if (!conversation._id) return;

    if (conversation.isDisabled && currentUser.role !== 'admin') {
      alert('This chat is disabled. You cannot clear messages.');
      return;
    }

    const oldMessages = [...messages];
    setMessages([]);

    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.put(`/api/chat/clear/${conversation._id}`, {}, config);
    } catch (e) {
      console.error(e);
      setMessages(oldMessages);
      alert('Clear chat failed');
    }
    setMsgAnchorEl(null);
  };

  // ✅ NEW: Emoji picker handler
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setEmojiAnchorEl(null);
  };

  // ✅ NEW: Common emojis
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
    '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
    '😮', '😯', '😲', '🥺', '🥵', '😢', '😭', '😱', '😨', '😰',
    '👍', '👎', '👏', '🙏', '❤️', '💔', '💕', '💖', '💗', '💞',
    '🔥', '⭐', '✨', '🎉', '🎈', '🎆', '🎁', '🎂', '🍰', '🥳'
  ];

  return (
    <Paper elevation={3} sx={{ height: '75vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      {selectionMode ? (
        <Box sx={{ p: 2, bgcolor: '#075e54', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit" onClick={() => { setSelectionMode(false); setSelectedMsgs([]); }}><CloseIcon /></IconButton>
            <Typography variant="h6">{selectedMsgs.length}</Typography>
          </Box>
          <Box>
            <IconButton color="inherit" onClick={async () => {
              try {
                const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
                for (const id of selectedMsgs) {
                  await axios.delete(`/api/chat/message/${id}?mode=me`, config);
                }
                setMessages(prev => prev.filter(m => !selectedMsgs.includes(m._id)));
                setSelectionMode(false);
                setSelectedMsgs([]);
              } catch (e) { console.error(e); }
            }}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f0f2f5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={otherUser.profileImage}>{otherUser.name?.[0]}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="600">{otherUser.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircleIcon sx={{ fontSize: 8, color: otherUser.isOnline ? '#4caf50' : '#bdbdbd' }} />
                <Typography variant="caption" color="text.secondary">
                  {otherUser.isOnline ? 'Online' : otherUser.lastActive ? `Last seen ${new Date(otherUser.lastActive).toLocaleTimeString()}` : 'Offline'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Search Messages"><IconButton size="small" onClick={() => setShowSearch(!showSearch)}><SearchIcon /></IconButton></Tooltip>
            <Tooltip title="Clear Chat"><IconButton size="small" onClick={handleClearChat}><DeleteIcon color="error" /></IconButton></Tooltip>
            {/* ✅ FIX BUG #7: Wire profile view */}
            <Tooltip title="Seller Profile"><IconButton size="small" onClick={() => { setShowProfile(true); fetchSellerProfile(); }}><PersonIcon /></IconButton></Tooltip>
            <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
          </Box>
        </Box>
      )}

      {/* ✅ FIX BUG #8: Disabled chat warning */}
      {conversation.isDisabled && (
        <Box sx={{ p: 1, bgcolor: '#ffebee', borderBottom: 1, borderColor: '#ffcdd2', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="error" fontWeight="bold">
            ⚠️ This chat is disabled. {currentUser.role === 'admin' ? 'Only admins can send messages.' : 'You cannot send or delete messages.'}
          </Typography>
        </Box>
      )}

      {showSearch && (
        <Box sx={{ p: 1, bgcolor: 'white', borderBottom: 1, borderColor: '#eee' }}>
          <TextField
            fullWidth size="small" placeholder="Search messages..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: <IconButton size="small" onClick={() => setShowSearch(false)}><CloseIcon /></IconButton>
            }}
          />
        </Box>
      )}

      {/* Messages */}
      <Box ref={scrollRef} sx={{ flex: 1, p: 2, bgcolor: '#e5ddd5', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat' }}>
        {messages.filter(m => m.content?.toLowerCase().includes(searchTerm.toLowerCase())).map((msg) => {
          const isMe = msg.sender._id === currentUser._id;
          const isStarred = msg.isStarredBy?.includes(currentUser._id);
          const isSelected = selectedMsgs.includes(msg._id);
          return (
            <Box
              key={msg._id}
              onClick={() => {
                if (selectionMode) {
                  setSelectedMsgs(prev => prev.includes(msg._id) ? prev.filter(id => id !== msg._id) : [...prev, msg._id]);
                }
              }}
              sx={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                cursor: selectionMode ? 'pointer' : 'default',
                bgcolor: isSelected ? 'rgba(52, 183, 241, 0.2)' : 'transparent',
                borderRadius: 1,
                p: 0.5
              }}
            >
              <Paper elevation={1} sx={{ p: '6px 10px', bgcolor: isMe ? '#dcf8c6' : 'white', borderRadius: isMe ? '10px 0 10px 10px' : '0 10px 10px 10px', boxShadow: 1, position: 'relative' }}>
                {msg.replyTo && (
                  <Box sx={{ bgcolor: 'rgba(0,0,0,0.05)', p: 0.5, mb: 0.5, borderRadius: 1, borderLeft: '4px solid #34b7f1' }}>
                    <Typography variant="caption" color="primary" fontWeight="bold">Original</Typography>
                    <Typography variant="body2" noWrap sx={{ opacity: 0.7 }}>{msg.replyTo.content || 'Attachment'}</Typography>
                  </Box>
                )}
                {msg.attachments?.map((at, i) => (
                  <Box key={i} sx={{ mb: 0.5 }}>
                    {at.type === 'image' ? (
                      <img src={at.url} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }} />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
                        <IconButton size="small" component="a" href={at.url} target="_blank" download>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{ textDecoration: 'none', color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          component="a"
                          href={at.url}
                          target="_blank"
                          download
                        >
                          {at.filename}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
                {/* ✅ FIX: Handle deleted messages */}
                {msg.isDeletedForEveryone ? (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', pr: 4 }}>
                    🚫 This message was deleted
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', pr: 4 }}>{msg.content}</Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.2 }}>
                  {msg.isPinnedBy?.length > 0 && <PushPin sx={{ fontSize: 12, ml: 0.5, color: 'primary.main' }} />}
                  {isStarred && <StarIcon sx={{ fontSize: 12, color: 'text.secondary' }} />}
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  {isMe && (
                    <Typography sx={{ fontSize: 14, color: msg.status === 'read' ? '#34b7f1' : 'text.secondary', ml: 0.5 }}>
                      {msg.status === 'read' ? '✓✓' : '✓'}
                    </Typography>
                  )}
                </Box>
                {!selectionMode && (
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMsgAction(e, msg); }} sx={{ position: 'absolute', top: 0, right: 0, opacity: 0, '&:hover': { opacity: 1 }, transition: '0.2s', '.MuiPaper-root:hover &': { opacity: 0.5 } }}>
                    <MoreVertIcon fontSize="inherit" />
                  </IconButton>
                )}
              </Paper>
            </Box>
          );
        })}
        {otherTyping && (
          <Box sx={{ alignSelf: 'flex-start', bgcolor: 'white', p: '4px 10px', borderRadius: '10px' }}>
            <Typography variant="caption" color="text.secondary">typing...</Typography>
          </Box>
        )}
      </Box>

      {/* Input */}
      <Collapse in={replyingTo || editingMsg}>
        <Box sx={{ p: 1, bgcolor: 'white', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1, bgcolor: '#f0f0f0', p: 1, borderRadius: 1, borderLeft: '4px solid #34b7f1' }}>
            <Typography variant="caption" color="primary" fontWeight="bold">{editingMsg ? 'Editing' : 'Replying'}</Typography>
            <Typography variant="body2" noWrap>{editingMsg?.content || replyingTo?.content}</Typography>
          </Box>
          <IconButton size="small" onClick={() => { setReplyingTo(null); setEditingMsg(null); setMessage(''); }}><CloseIcon /></IconButton>
        </Box>
      </Collapse>

      <Box sx={{ p: 1.5, bgcolor: '#f0f2f5', display: 'flex', alignItems: 'center', gap: 1 }}>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
        <IconButton size="small" onClick={() => fileInputRef.current.click()} disabled={uploading}><AttachFileIcon /></IconButton>
        {/* ✅ FIX: Emoji picker button */}
        <IconButton size="small" onClick={(e) => setEmojiAnchorEl(e.currentTarget)}><EmojiIcon /></IconButton>
        <TextField
          fullWidth multiline maxRows={4} size="small" placeholder="Type a message"
          value={message} onChange={handleTyping}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!sending && !uploading) handleSend();
            }
          }}
          sx={{ bgcolor: 'white', borderRadius: '20px', '& .MuiOutlinedInput-root': { borderRadius: '20px' } }}
        />
        <IconButton color="primary" disabled={(!message.trim() && !uploading && !sending) || uploading || sending} onClick={() => handleSend()}>
          {(uploading || sending) ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>

      {/* Msg Menu */}
      <Menu anchorEl={msgAnchorEl} open={Boolean(msgAnchorEl)} onClose={() => setMsgAnchorEl(null)}>
        <MenuItem onClick={() => { setReplyingTo(selectedMsg); setMsgAnchorEl(null); }}><ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>Reply</MenuItem>
        {selectedMsg?.sender._id === currentUser._id && (
          <MenuItem onClick={() => { setEditingMsg(selectedMsg); setMessage(selectedMsg.content); setMsgAnchorEl(null); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Edit</MenuItem>
        )}
        <MenuItem onClick={handleCopy}><ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>Copy</MenuItem>
        <MenuItem onClick={handleStar}><ListItemIcon>{selectedMsg?.isStarredBy?.includes(currentUser._id) ? <StarBorderIcon fontSize="small" /> : <StarIcon fontSize="small" />}</ListItemIcon>{selectedMsg?.isStarredBy?.includes(currentUser._id) ? 'Unstar' : 'Star'}</MenuItem>
        <Divider />
        <MenuItem onClick={() => handleDelete('me')}><ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>Delete for me</MenuItem>
        <MenuItem onClick={() => handleDelete('everyone')} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Delete for everyone</MenuItem>
      </Menu>

      {/* ✅ NEW: Emoji Picker Menu */}
      <Menu
        anchorEl={emojiAnchorEl}
        open={Boolean(emojiAnchorEl)}
        onClose={() => setEmojiAnchorEl(null)}
        PaperProps={{
          sx: {
            maxWidth: 320,
            maxHeight: 300,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5 }}>
          {commonEmojis.map((emoji, index) => (
            <IconButton
              key={index}
              size="small"
              onClick={() => handleEmojiSelect(emoji)}
              sx={{ fontSize: '1.5rem', p: 0.5 }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Menu>

      {/* ✅ FIX BUG #7: Seller Profile Dialog */}
      <Dialog open={showProfile} onClose={() => setShowProfile(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={otherUser.profileImage} sx={{ width: 56, height: 56 }}>
              {otherUser.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{otherUser.name || 'Seller'}</Typography>
              <Typography variant="caption">{otherUser.role || 'Seller'}</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* ✅ FIX BUG #5: Show loading state */}
          {loadingProfile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {/* ✅ FIX BUG #5: Use fullSellerProfile if available, fallback to otherUser */}
              {(() => {
                const profile = fullSellerProfile || otherUser;
                return (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{profile.email || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">{profile.phone || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Business Name</Typography>
                      <Typography variant="body1">{profile.businessDetails?.businessName || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Business Type</Typography>
                      <Typography variant="body1">{profile.businessDetails?.businessType || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">GST Number</Typography>
                      <Typography variant="body1">{profile.businessDetails?.gstNumber || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">PAN Number</Typography>
                      <Typography variant="body1">{profile.businessDetails?.panNumber || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                      <Typography variant="body1">
                        {profile.businessDetails?.address?.street ?
                          `${profile.businessDetails.address.street}, ${profile.businessDetails.address.city}, ${profile.businessDetails.address.state} ${profile.businessDetails.address.pinCode}`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <CircleIcon sx={{ fontSize: 10, color: profile.isOnline ? '#4caf50' : '#bdbdbd' }} />
                        <Typography variant="body2">
                          {profile.isOnline ? 'Online' : profile.lastActive ? `Last seen ${new Date(profile.lastActive).toLocaleString()}` : 'Offline'}
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                );
              })()}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProfile(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdminChatWindow;