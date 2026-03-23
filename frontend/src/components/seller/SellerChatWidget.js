import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Drawer,
    IconButton,
    Typography,
    TextField,
    Fab,
    Badge,
    Avatar,
    Paper,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Tooltip,
    Divider,
    Collapse
} from '@mui/material';
import {
    Chat as ChatIcon,
    Close as CloseIcon,
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Circle as CircleIcon,
    MoreVert as MoreVertIcon,
    Delete as DeleteIcon,
    VolumeOff as MuteIcon,
    Report as ReportIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    Reply as ReplyIcon,
    Edit as EditIcon,
    ContentCopy as CopyIcon,
    PushPin,
    FileDownload as DownloadIcon,
    InsertEmoticon as EmojiIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import axios from 'axios';

const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const SellerChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [adminOnline, setAdminOnline] = useState(false);
    const [adminLastSeen, setAdminLastSeen] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [otherTyping, setOtherTyping] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [msgAnchorEl, setMsgAnchorEl] = useState(null);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMsg, setEditingMsg] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMsgs, setSelectedMsgs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null); // ✅ NEW: Emoji picker state
    const [isMuted, setIsMuted] = useState(localStorage.getItem('chat_muted') === 'true');
    const isMutedRef = useRef(isMuted);

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);
    const [isDisabled, setIsDisabled] = useState(false); // ✅ NEW: Track if chat is disabled
    const [sending, setSending] = useState(false); // ✅ NEW: Loading state for sending

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!userInfo || !isOpen) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(socketUrl, {
            auth: { token: userInfo.token },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            console.log('Seller socket connected:', newSocket.id);
            newSocket.emit('joinUserRoom', userInfo._id);
            fetchConversation();
        });

        newSocket.on('chat:message', (data) => {
            console.log('Received message via socket:', data.message._id);
            setMessages((prev) => {
                if (prev.some(m => m._id === data.message._id)) return prev;
                return [...prev, data.message];
            });
            scrollToBottom();

            if (data.message.sender._id !== userInfo._id) {
                markAsRead(data.conversationId);
                // ✅ FIX BUG #9: Sound behavior (Muted = No Sound, Unmuted = Sound)
                if (!isMutedRef.current) {
                    console.log('Playing notification sound');
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(e => console.log('Audio error:', e));
                }
            }
        });

        newSocket.on('chat:message_updated', (updatedMsg) => {
            setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
        });

        newSocket.on('chat:message_deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        });

        newSocket.on('chat:chat_cleared', ({ conversationId: cId, userId: clearingUserId }) => {
            // Only clear locally if this user is the one who cleared (or if we want a global clear)
            if (cId === conversationId && clearingUserId === userInfo._id) {
                setMessages([]);
            }
        });

        newSocket.on('chat:conversation_disabled', ({ conversationId: cId, isDisabled: val }) => {
            if (cId === conversationId) setIsDisabled(val);
        });

        newSocket.on('chat:conversation_enabled', ({ conversationId: cId }) => {
            if (cId === conversationId) setIsDisabled(false);
        });

        newSocket.on('user:online', (data) => {
            if (data.role === 'admin') setAdminOnline(true);
        });

        newSocket.on('user:offline', (data) => {
            if (data.role === 'admin') {
                setAdminOnline(false);
                setAdminLastSeen(data.lastSeen);
            }
        });

        setSocket(newSocket);

        return () => {
            console.log('Cleaning up seller socket');
            newSocket.disconnect();
        };
    }, [userInfo?.token, isOpen, conversationId]); // Re-run if convId changes to update listeners if needed

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, messages]);

    const fetchConversation = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data: conversations } = await axios.get('/api/chat/conversations', config);
            const adminConv = conversations.find(c =>
                c.participants.some(p => p.role === 'admin' && p._id !== userInfo._id)
            );

            if (adminConv) {
                setConversationId(adminConv._id);
                const { data: msgs } = await axios.get(`/api/chat/messages/${adminConv._id}`, config);
                setMessages(msgs.messages);
                markAsRead(adminConv._id);

                const admin = adminConv.participants.find(p => p.role === 'admin');
                if (admin) {
                    setAdminOnline(admin.isOnline);
                    setAdminLastSeen(admin.lastActive);
                }

                // ✅ FIX BUG #9: Set states
                setIsMuted(adminConv.mutedBy?.includes(userInfo._id) || false);
                setIsDisabled(adminConv.isDisabled || false);
            } else {
                // If no conversation yet, try to find an admin to start one
                const { data: admins } = await axios.get('/api/users/admins', config);
                if (admins?.[0]) {
                    const admin = admins[0];
                    setAdminOnline(admin.isOnline);
                    setAdminLastSeen(admin.lastActive);
                }
            }
        } catch (error) {
            console.error('Error fetching chat:', error);
        }
    };

    const markAsRead = async (cid) => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`/api/chat/read/${cid}`, {}, config);
        } catch (e) { console.error(e); }
    };

    // ✅ FIX BUG #9: Toggle mute for conversation
    const handleToggleMute = async () => {
        if (!conversationId) return;

        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`/api/chat/action/${conversationId}`, { action: 'mute' }, config);

            // Toggle the local state
            setIsMuted(prev => !prev);
        } catch (error) {
            console.error('Error toggling mute:', error);
            alert('Failed to toggle mute: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const handleTyping = (e) => {
        setMessage(e.target.value);
        if (!socket || !conversationId) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('chat:typing', { conversationId, to: 'admin' });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('chat:stop_typing', { conversationId, to: 'admin' });
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
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data: uploadResults } = await axios.post('/api/upload/chat/multiple', formData, config);
            await sendMessage(null, uploadResults);
        } catch (error) {
            console.error('Upload failed', error);
            // ✅ FIX BUG #3: Better error message for file upload failures
            const errorMsg = error.response?.data?.message || 'File upload failed. Please check your internet connection and try again.';
            alert(errorMsg);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const sendMessage = async (content, attachments = []) => {
        const msgContent = content || message;
        if (!msgContent.trim() && attachments.length === 0) return;

        if (editingMsg) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                // ✅ FIX BUG #3: Wait for response and update UI immediately
                const { data: updatedMessage } = await axios.put(`/api/chat/message/${editingMsg._id}`, { content: msgContent }, config);

                // Update UI immediately (optimistic)
                setMessages(prev => prev.map(m => m._id === editingMsg._id ? updatedMessage : m));

                setEditingMsg(null);
                setMessage('');
                return;
            } catch (e) {
                console.error(e);
                alert('Failed to edit message: ' + (e.response?.data?.message || 'Unknown error'));
                return;
            }
        }

        try {
            setSending(true);
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            let adminId = messages.find(m => m.sender.role === 'admin' && m.sender._id !== userInfo._id)?.sender._id;
            if (!adminId) {
                const { data: admins } = await axios.get('/api/users/admins', config);
                if (admins?.[0]) adminId = admins[0]._id;
            }

            if (adminId) {
                const { data: sentMessage } = await axios.post('/api/chat/send', {
                    receiverId: adminId,
                    content: msgContent,
                    attachments,
                    replyTo: replyingTo?._id || null
                }, config);

                // Add to list immediately
                setMessages(prev => {
                    if (prev.some(m => m._id === sentMessage._id)) return prev;
                    return [...prev, sentMessage];
                });
                setMessage('');
                setReplyingTo(null);
                scrollToBottom();
            } else {
                alert('No admin available to receive your message. Please try again later.');
            }
        } catch (error) {
            console.error('Send failed', error);
            alert(error.response?.data?.message || 'Failed to send message.');
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
        // Optimistic update for 'me'
        if (mode === 'me') {
            setMessages(prev => prev.filter(m => m._id !== selectedMsg._id));
        }

        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.delete(`/api/chat/message/${selectedMsg._id}?mode=${mode}`, config);
            // 'everyone' mode handled via socket chat:message_updated
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || 'Failed to delete message');
            // Revert if needed (could refetch, but UI usually fine)
        }
        setMsgAnchorEl(null);
    };

    const handleStar = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`/api/chat/message/${selectedMsg._id}/star`, {}, config);
            setMessages(prev => prev.map(m => m._id === selectedMsg._id ? {
                ...m, isStarredBy: m.isStarredBy.includes(userInfo._id)
                    ? m.isStarredBy.filter(id => id !== userInfo._id)
                    : [...m.isStarredBy, userInfo._id]
            } : m));
        } catch (e) { console.error(e); }
        setMsgAnchorEl(null);
    };

    const handleClearChat = async () => {
        if (!conversationId) return;

        // Optimistic update
        const oldMessages = [...messages];
        setMessages([]);

        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`/api/chat/clear/${conversationId}`, {}, config);
        } catch (e) {
            console.error(e);
            setMessages(oldMessages); // Rollback
            alert(e.response?.data?.message || 'Failed to clear chat');
        }
        setAnchorEl(null);
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
        <Box>
            <Fab color="primary" onClick={() => setIsOpen(true)} sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
                <Badge badgeContent={messages.filter(m => m.status !== 'read' && m.sender._id !== userInfo._id).length} color="error">
                    <ChatIcon />
                </Badge>
            </Fab>

            <Drawer anchor="right" open={isOpen} onClose={() => setIsOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' } }}>
                {selectionMode ? (
                    <Box sx={{ p: 2, bgcolor: '#075e54', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton color="inherit" onClick={() => { setSelectionMode(false); setSelectedMsgs([]); }}><CloseIcon /></IconButton>
                            <Typography variant="h6">{selectedMsgs.length}</Typography>
                        </Box>
                        <Box>
                            <IconButton color="inherit" onClick={async () => {
                                try {
                                    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
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
                    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>A</Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600">Admin Support</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CircleIcon sx={{ fontSize: 8, color: adminOnline ? '#4caf50' : '#bdbdbd' }} />
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        {adminOnline ? 'Online' : adminLastSeen ? `Last seen ${new Date(adminLastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box>
                            <IconButton color="inherit" onClick={() => setShowSearch(!showSearch)}><SearchIcon /></IconButton>
                            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}><MoreVertIcon /></IconButton>
                            <IconButton color="inherit" onClick={() => setIsOpen(false)}><CloseIcon /></IconButton>
                        </Box>
                    </Box>
                )}

                {showSearch && (
                    <Box sx={{ p: 1, bgcolor: 'white' }}>
                        <TextField
                            fullWidth size="small" placeholder="Search messages..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                endAdornment: <IconButton size="small" onClick={() => setShowSearch(false)}><CloseIcon /></IconButton>
                            }}
                        />
                    </Box>
                )}

                <Box sx={{ flex: 1, p: 2, bgcolor: '#e5ddd5', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat' }}>
                    {messages.filter(m => m.content?.toLowerCase().includes(searchTerm.toLowerCase())).map((msg) => {
                        const isMe = msg.sender._id === userInfo._id;
                        const isStarred = msg.isStarredBy?.includes(userInfo._id);
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
                                    position: 'relative',
                                    cursor: selectionMode ? 'pointer' : 'default',
                                    bgcolor: isSelected ? 'rgba(52, 183, 241, 0.2)' : 'transparent',
                                    borderRadius: 1,
                                    p: 0.5
                                }}
                            >
                                <Paper elevation={1} sx={{ p: '6px 10px', bgcolor: isMe ? '#dcf8c6' : 'white', borderRadius: isMe ? '10px 0 10px 10px' : '0 10px 10px 10px', minWidth: 60, position: 'relative' }}>
                                    {msg.replyTo && (
                                        <Box sx={{ bgcolor: 'rgba(0,0,0,0.05)', p: 0.5, mb: 0.5, borderRadius: 1, borderLeft: '4px solid #34b7f1' }}>
                                            <Typography variant="caption" color="primary" fontWeight="bold">Recipient</Typography>
                                            <Typography variant="body2" noWrap sx={{ opacity: 0.7 }}>{msg.replyTo.content || 'Attachment'}</Typography>
                                        </Box>
                                    )}
                                    {msg.attachments?.map((at, i) => (
                                        <Box key={i} sx={{ mb: at.type === 'image' ? 0.5 : 0 }}>
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
                        <Box sx={{ alignSelf: 'flex-start', bgcolor: 'white', p: '4px 10px', borderRadius: '0 10px 10px 10px' }}>
                            <Typography variant="caption" color="text.secondary italic">typing...</Typography>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                <Collapse in={replyingTo || editingMsg}>
                    <Box sx={{ p: 1, bgcolor: 'white', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1, bgcolor: '#f0f0f0', p: 1, borderRadius: 1, borderLeft: '4px solid #34b7f1' }}>
                            <Typography variant="caption" color="primary" fontWeight="bold">{editingMsg ? 'Editing' : 'Replying to'}</Typography>
                            <Typography variant="body2" noWrap>{editingMsg?.content || replyingTo?.content}</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => { setReplyingTo(null); setEditingMsg(null); setMessage(''); }}><CloseIcon /></IconButton>
                    </Box>
                </Collapse>

                {isDisabled ? (
                    <Box sx={{ p: 2, bgcolor: '#fff3e0', borderTop: '1px solid #ffe0b2' }}>
                        <Typography variant="body2" color="warning.main" textAlign="center" fontWeight="bold">
                            You are unable to chat with our company.
                        </Typography>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} sx={{ p: 1.5, bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            multiple
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        />
                        <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            <AttachFileIcon />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => setEmojiAnchorEl(e.currentTarget)}>
                            <EmojiIcon />
                        </IconButton>
                        <TextField
                            fullWidth multiline maxRows={4} size="small" placeholder="Type a message"
                            value={message} onChange={handleTyping} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sending && !uploading) sendMessage(); } }}
                            sx={{ bgcolor: 'white', borderRadius: '20px', '& .MuiOutlinedInput-root': { borderRadius: '20px', px: 2 } }}
                        />
                        <IconButton color="primary" disabled={(!message.trim() && !uploading && !sending) || uploading || sending} onClick={() => sendMessage()}>
                            {(uploading || sending) ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                    </Box>
                )}

                {/* Main Menu */}
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                    <MenuItem onClick={handleClearChat}>Clear Chat</MenuItem>
                    <MenuItem onClick={() => { setSelectionMode(true); setAnchorEl(null); }}>Select Messages</MenuItem>
                    <MenuItem onClick={() => {
                        // ✅ FIX BUG #9: Toggle mute for conversation
                        handleToggleMute();
                        setAnchorEl(null);
                    }}>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</MenuItem>
                </Menu>

                {/* Message Context Menu */}
                <Menu anchorEl={msgAnchorEl} open={Boolean(msgAnchorEl)} onClose={() => setMsgAnchorEl(null)}>
                    <MenuItem onClick={() => { setReplyingTo(selectedMsg); setMsgAnchorEl(null); }}><ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>Reply</MenuItem>
                    {selectedMsg?.sender._id === userInfo._id && (
                        <MenuItem onClick={() => { setEditingMsg(selectedMsg); setMessage(selectedMsg.content); setMsgAnchorEl(null); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Edit</MenuItem>
                    )}
                    <MenuItem onClick={handleCopy}><ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>Copy</MenuItem>
                    <MenuItem onClick={handleStar}><ListItemIcon>{selectedMsg?.isStarredBy?.includes(userInfo._id) ? <StarBorderIcon fontSize="small" /> : <StarIcon fontSize="small" />}</ListItemIcon>{selectedMsg?.isStarredBy?.includes(userInfo._id) ? 'Unstar' : 'Star'}</MenuItem>
                    <Divider />
                    <MenuItem onClick={() => handleDelete('me')}><ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>Delete for me</MenuItem>
                    {selectedMsg?.sender._id === userInfo._id && (
                        <MenuItem onClick={() => handleDelete('everyone')} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Delete for everyone</MenuItem>
                    )}
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
            </Drawer>
        </Box>
    );
};

export default SellerChatWidget;

