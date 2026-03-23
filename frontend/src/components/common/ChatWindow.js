import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { sendMessage, getChatHistory, getMessages } from "../../redux/actions/messageActions";
import {
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Box,
  Typography,
  Avatar,
  Badge,
  CircularProgress
} from "@mui/material";
import {
  Send,
  AttachFile,
  Close,
  Minimize,
  OpenInFull,
  CloseFullscreen,
  Mic,
  EmojiEmotions,
  MoreVert,
  Done,
  DoneAll,
  Schedule
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

// Styled Components for WhatsApp-like design
const ChatContainer = styled(Box)(({ maximized, position, size }) => ({
  position: 'fixed',
  right: maximized ? 0 : position.right,
  bottom: maximized ? 0 : position.bottom,
  width: maximized ? '100vw' : size.width,
  height: maximized ? '100vh' : size.height,
  minWidth: maximized ? 'auto' : 320,
  minHeight: maximized ? 'auto' : 400,
  maxWidth: maximized ? '100vw' : 600,
  maxHeight: maximized ? '100vh' : 800,
  backgroundColor: 'white',
  borderRadius: maximized ? 0 : '12px',
  boxShadow: '0 4px 25px rgba(0, 0, 0, 0.15)',
  border: '1px solid #e0e0e0',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 9999,
  overflow: 'hidden',
  transition: 'all 0.3s ease'
}));

const ChatHeader = styled(Box)({
  background: 'linear-gradient(135deg, #075E54 0%, #128C7E 100%)',
  color: 'white',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'move',
  userSelect: 'none',
  flexShrink: 0
});

const ChatBody = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  backgroundImage: 'url("https://i.ibb.co/3mTQWmF/chat-bg.png")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  flexDirection: 'column'
});

const MessageBubble = styled(Box)(({ isOwn }) => ({
  maxWidth: '70%',
  padding: '8px 12px',
  marginBottom: '8px',
  borderRadius: '18px',
  position: 'relative',
  wordWrap: 'break-word',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  background: isOwn
    ? 'linear-gradient(135deg, #DCF8C6 0%, #B9F6CA 100%)'
    : 'white',
  border: isOwn ? 'none' : '1px solid #e0e0e0',
  '&::after': isOwn ? {
    content: '""',
    position: 'absolute',
    bottom: 0,
    right: '-8px',
    width: 0,
    height: 0,
    borderLeft: '8px solid #DCF8C6',
    borderTop: '8px solid transparent',
    borderBottom: '8px solid transparent'
  } : {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '-8px',
    width: 0,
    height: 0,
    borderRight: '8px solid white',
    borderTop: '8px solid transparent',
    borderBottom: '8px solid transparent'
  }
}));

const InputContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  backgroundColor: '#f0f0f0',
  borderTop: '1px solid #e0e0e0',
  gap: '8px',
  flexShrink: 0
});

const MinimizedChat = styled(Box)(({ position }) => ({
  position: 'fixed',
  right: position.right,
  bottom: position.bottom,
  backgroundColor: '#25D366',
  color: 'white',
  padding: '12px 16px',
  borderRadius: '24px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  zIndex: 9999,
  minWidth: '200px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#128C7E',
    transform: 'translateY(-2px)'
  }
}));

const DateSeparator = styled(Box)({
  textAlign: 'center',
  margin: '16px 0',
  '& > div': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#666',
    display: 'inline-block'
  }
});

const ChatWindow = ({ receiverId, orderId, productId, postId, onClose, receiverName }) => {
  const dispatch = useDispatch();
  const { messages = [], loading, error } = useSelector((state) => state.messageHistory || { messages: [] });
  const { userInfo } = useSelector((state) => state.userLogin);
  const { error: sendError, success } = useSelector((state) => state.messageSend || {});

  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState("last seen recently");
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [size, setSize] = useState({ width: 380, height: 600 });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const draggingRef = useRef(false);
  const resizeRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  const socketRef = useRef();
  const chatEndRef = useRef();
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef();

  useEffect(() => {
    if (sendError) setOpenSnackbar(true);
  }, [sendError]);

  useEffect(() => {
    if (success) {
      setMessage("");
      setImage(null);
      setImagePreview(null);
      socketRef.current?.emit("STOP_TYPING", { to: receiverId });
    }
  }, [success, receiverId]);

  useEffect(() => {
    if (!receiverId || !userInfo?._id) return;

    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5001", {
      auth: { token: `Bearer ${userInfo.token}` },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("joinUserRoom", userInfo._id);
      if (receiverId) socketRef.current.emit("joinUserRoom", receiverId);
    });

    socketRef.current.on("NEW_MESSAGE", (newMessage) => {
      if (newMessage.sender === receiverId || newMessage.receiver === receiverId) {
        if (postId) dispatch(getMessages(postId));
        else dispatch(getChatHistory(receiverId));
      }
    });

    // ✅ FIX: Unified socket event for better cross-tab/cross-component sync
    socketRef.current.on("chat:message", ({ message, conversationId }) => {
      console.log("Chat window received unified message:", message);
      if (message.sender === receiverId || message.receiver === receiverId) {
        if (postId) dispatch(getMessages(postId));
        else dispatch(getChatHistory(receiverId));
      }
    });

    socketRef.current.on("TYPING", (data) => {
      if (data?.from === receiverId) setIsTyping(true);
    });

    socketRef.current.on("STOP_TYPING", (data) => {
      if (data?.from === receiverId) setIsTyping(false);
    });

    socketRef.current.on("USER_STATUS", (data) => {
      if (data.userId === receiverId) {
        setLastSeen(data.status === "online" ? "online" : `last seen ${data.lastSeen || "recently"}`);
      }
    });

    if (postId) dispatch(getMessages(postId));
    else dispatch(getChatHistory(receiverId));

    return () => socketRef.current?.disconnect();
  }, [dispatch, receiverId, userInfo, postId]);

  const groupedMessages = useMemo(() => {
    const groupByDate = (msgs) =>
      msgs.reduce((groups, msg) => {
        const dateKey = new Date(msg.createdAt || new Date()).toDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(msg);
        return groups;
      }, {});
    return groupByDate(messages);
  }, [messages]);

  useEffect(() => {
    if (chatEndRef.current && !minimized)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [groupedMessages, isTyping, minimized]);

  // Drag & Resize handlers
  const startDrag = (e) => {
    if (maximized) return;
    draggingRef.current = true;
    offsetRef.current = { x: e.clientX, y: e.clientY };
    document.body.style.userSelect = 'none';
  };

  const onDrag = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - offsetRef.current.x;
    const dy = e.clientY - offsetRef.current.y;
    setPosition((prev) => ({
      bottom: Math.max(0, prev.bottom - dy),
      right: Math.max(0, prev.right - dx),
    }));
    offsetRef.current = { x: e.clientX, y: e.clientY };
  };

  const stopDrag = () => {
    draggingRef.current = false;
    document.body.style.userSelect = '';
  };

  const startResize = (e) => {
    if (maximized) return;
    resizeRef.current = true;
    startSizeRef.current = { width: size.width, height: size.height };
    offsetRef.current = { x: e.clientX, y: e.clientY };
    document.body.style.userSelect = 'none';
  };

  const onResize = (e) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - offsetRef.current.x;
    const dy = e.clientY - offsetRef.current.y;
    setSize({
      width: Math.max(320, startSizeRef.current.width + dx),
      height: Math.max(400, startSizeRef.current.height + dy),
    });
  };

  const stopResize = () => {
    resizeRef.current = false;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("mousemove", onResize);
    window.addEventListener("mouseup", stopResize);
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("mousemove", onResize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, []);

  const handleSend = () => {
    if ((message.trim() || image) && (receiverId || postId)) {
      const formData = new FormData();
      if (receiverId) formData.append("receiverId", receiverId);
      if (postId) formData.append("postId", postId);
      if (message.trim()) formData.append("content", message);
      if (orderId) formData.append("orderId", orderId);
      if (productId) formData.append("productId", productId);
      if (image) formData.append("image", image);

      dispatch(sendMessage(formData)).then(() => {
        socketRef.current?.emit("NEW_MESSAGE_SENT", { receiverId, postId, senderId: userInfo._id });
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (socketRef.current && receiverId) {
      socketRef.current.emit("TYPING", { to: receiverId, from: userInfo._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("STOP_TYPING", { to: receiverId, from: userInfo._id });
      }, 900);
    }
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const formatDateLabel = (date) => {
    const today = new Date();
    const msgDate = new Date(date);
    const diffDays = Math.floor((today - msgDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 0 && msgDate.getDate() === today.getDate()) return "Today";
    if (diffDays === 1) return "Yesterday";
    return msgDate.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'read': return <DoneAll sx={{ fontSize: 14, color: '#53bdeb' }} />;
      case 'delivered': return <DoneAll sx={{ fontSize: 14, color: '#666' }} />;
      case 'sent': return <Done sx={{ fontSize: 14, color: '#666' }} />;
      default: return <Schedule sx={{ fontSize: 14, color: '#666' }} />;
    }
  };

  // Minimized View
  if (minimized) {
    return (
      <MinimizedChat
        position={position}
        onClick={() => setMinimized(false)}
      >
        <Badge
          color="error"
          variant="dot"
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'white',
              color: '#075E54',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {receiverName?.[0]?.toUpperCase() || "U"}
          </Avatar>
        </Badge>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
            {receiverName || "User"}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1 }}>
            {isTyping ? "typing..." : lastSeen}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          sx={{ color: 'white' }}
        >
          <Close fontSize="small" />
        </IconButton>
      </MinimizedChat>
    );
  }

  return (
    <>
      <ChatContainer maximized={maximized} position={position} size={size}>
        {/* Header */}
        <ChatHeader onMouseDown={startDrag}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'rgba(255,255,255,0.2)',
                fontWeight: 'bold'
              }}
            >
              {receiverName?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                {receiverName || "User"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1 }}>
                {isTyping ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CircularProgress size={8} sx={{ color: 'white' }} />
                    typing...
                  </Box>
                ) : (
                  lastSeen
                )}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setMinimized(true)}
              sx={{ color: 'white' }}
            >
              <Minimize fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setMaximized(!maximized)}
              sx={{ color: 'white' }}
            >
              {maximized ? <CloseFullscreen fontSize="small" /> : <OpenInFull fontSize="small" />}
            </IconButton>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: 'white' }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </ChatHeader>

        {/* Chat Body */}
        <ChatBody>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', color: 'error.main', p: 2 }}>
              Error loading messages
            </Box>
          ) : Object.keys(groupedMessages).length === 0 ? (
            <Box sx={{ textAlign: 'center', color: 'text.secondary', p: 4 }}>
              No messages yet. Start a conversation!
            </Box>
          ) : (
            Object.keys(groupedMessages).map((dateKey) => (
              <Box key={dateKey}>
                <DateSeparator>
                  <Typography variant="caption">
                    {formatDateLabel(dateKey)}
                  </Typography>
                </DateSeparator>
                {groupedMessages[dateKey].map((msg) => {
                  const isOwn = msg.sender === userInfo._id;
                  return (
                    <MessageBubble key={msg._id} isOwn={isOwn}>
                      {msg.content && (
                        <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                          {msg.content}
                        </Typography>
                      )}
                      {msg.image && (
                        <Box sx={{ mt: 1 }}>
                          <img
                            src={msg.image}
                            alt="attachment"
                            style={{
                              maxWidth: '200px',
                              maxHeight: '200px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(msg.image, '_blank')}
                          />
                        </Box>
                      )}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 0.5
                      }}>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '10px' }}>
                          {formatTime(msg.createdAt)}
                        </Typography>
                        {isOwn && getStatusIcon(msg.status)}
                      </Box>
                    </MessageBubble>
                  );
                })}
              </Box>
            ))
          )}
          <div ref={chatEndRef} />
        </ChatBody>

        {/* Image Preview */}
        {imagePreview && (
          <Box sx={{
            p: 2,
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
            <Typography variant="body2" sx={{ flex: 1 }}>
              Image ready to send
            </Typography>
            <IconButton onClick={handleRemoveImage} size="small">
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Input Area */}
        <InputContainer>
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            sx={{ color: '#666' }}
          >
            <AttachFile />
          </IconButton>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          <IconButton sx={{ color: '#666' }}>
            <EmojiEmotions />
          </IconButton>

          <TextField
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            variant="outlined"
            size="small"
            multiline
            maxRows={3}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                backgroundColor: 'white',
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#bdbdbd',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#075E54',
                },
              },
            }}
          />

          {message.trim() || image ? (
            <IconButton
              onClick={handleSend}
              disabled={loading}
              sx={{
                color: 'white',
                backgroundColor: '#075E54',
                '&:hover': {
                  backgroundColor: '#064c43',
                },
              }}
            >
              <Send fontSize="small" />
            </IconButton>
          ) : (
            <IconButton sx={{ color: '#666' }}>
              <Mic />
            </IconButton>
          )}
        </InputContainer>

        {/* Resize Handle */}
        {!maximized && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              cursor: 'nw-resize',
              backgroundColor: '#e0e0e0',
              borderTopLeftRadius: '4px'
            }}
            onMouseDown={startResize}
          />
        )}
      </ChatContainer>

      {/* Snackbar for Errors */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {sendError || "Failed to send message"}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ChatWindow;
