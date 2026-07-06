import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, TextField, Button, Avatar, IconButton, Chip, CircularProgress,
  Alert, Paper, Divider, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ThumbUp, ThumbUpOutlined, MoreVert, Flag, EmojiEmotions, Send } from '@mui/icons-material';
import axios from '../../utils/axiosInstance';
import { getSocket, joinPostRoom, leavePostRoom, emitSocialAction } from '../../utils/socket';
import { addComment, reportForumComment } from '../../redux/actions/forumActions';
import { useAuth } from '../../context/AuthContext';

const ForumComments = ({ postId, post, onCommentUpdate }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const typingTimeout = useRef(null);
  const commentsEndRef = useRef(null);
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { userInfo } = useSelector((state) => state.userLogin || {});

  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  useEffect(() => {
    if (!postId) return;
    const socket = getSocket(user?._id, user?.role, user?.token);
    if (!socket) return;

    joinPostRoom(postId);

    const handlers = {
      POST_COMMENTED: (data) => {
        if (data.postId === postId && data.comment?._id) {
          setComments(prev => {
            if (prev.some(c => c._id === data.comment._id)) return prev;
            return [...prev, data.comment];
          });
          onCommentUpdate?.();
        }
      },
      COMMENT_APPROVED: (data) => {
        if (data.postId === postId && data.commentId) {
          setComments(prev => prev.map(c => c._id === data.commentId ? { ...c, approved: true, isFlagged: false } : c));
        }
      },
      COMMENT_MODERATED: (data) => {
        if (data.postId === postId && data.commentId) {
          if (data.action === 'delete') {
            setComments(prev => prev.filter(c => c._id !== data.commentId));
          } else if (data.action === 'approve') {
            setComments(prev => prev.map(c => c._id === data.commentId ? { ...c, approved: true, isFlagged: false } : c));
          }
        }
      },
      userTyping: (data) => {
        if (data.postId === postId && data.user._id !== user?._id) {
          setTypingUsers(prev => prev.find(u => u._id === data.user._id) ? prev : [...prev, data.user]);
        }
      },
      userStoppedTyping: (data) => {
        if (data.postId === postId) {
          setTypingUsers(prev => prev.filter(u => u._id !== data.user._id));
        }
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      leavePostRoom(postId);
      Object.keys(handlers).forEach(event => socket.off(event, handlers[event]));
    };
  }, [postId, user, onCommentUpdate]);

  const fetchComments = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      let data = [];
      try {
        const res = await axios.get(`/api/v1/forum/${postId}`);
        data = res.data.comments || [];
      } catch {
        try {
          const res = await axios.get(`/api/v1/forum/${postId}/comments`);
          data = res.data;
        } catch {
          data = post?.comments || [];
        }
      }
      const filtered = userInfo?.role === 'admin' ? data : data.filter(c => c.approved && !c.isFlagged);
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setComments(filtered);
    } catch {
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [postId, post]);

  const handleTyping = (e) => {
    setNewComment(e.target.value);
    const socket = getSocket(user?._id, user?.role, user?.token);
    if (socket && user) {
      socket.emit('typing', { postId, user: { _id: user._id, name: user.name, profilePic: user.profilePic } });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stopTyping', { postId, user: { _id: user._id } });
      }, 1500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return setError(!user ? 'Login to comment' : 'Enter a comment');
    try {
      setSubmitting(true);
      const result = await dispatch(addComment(postId, newComment.trim()));
      setNewComment('');
      emitSocialAction({ type: 'COMMENT', itemType: 'forum', itemId: postId, userId: user._id, comment: result });
      setSuccess('Comment posted!');
      setTimeout(fetchComments, 500);
      onCommentUpdate?.();
    } catch (err) {
      setError(err.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = (commentId) => {
    const comment = comments.find(c => c._id === commentId);
    const liked = comment.likes?.includes(user._id);
    setComments(prev => prev.map(c => c._id === commentId ? {
      ...c,
      likes: liked ? c.likes.filter(id => id !== user._id) : [...c.likes, user._id]
    } : c));
  };

  const handleReportComment = async () => {
    if (!reportReason.trim()) return;
    await dispatch(reportForumComment(postId, selectedComment._id, reportReason));
    setSuccess('Reported');
    setReportDialogOpen(false);
    setReportReason('');
  };

  const getImageUrl = (path) => !path ? '/default_avatar.jpg' : path.startsWith('http') ? path : `${process.env.REACT_APP_API_URL}${path.startsWith('/') ? '' : '/uploads/'}${path}`;
  const formatDate = (d) => {
    const diff = Date.now() - new Date(d);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days < 7 ? `${days}d ago` : new Date(d).toLocaleDateString();
  };

  const emojis = ['Smile', 'Laughing', 'Heart Eyes', 'Surprised', 'Crying', 'Angry', 'Thumbs Up', 'Heart', 'Fire', 'Party', 'Clapping', 'Praying'];
  const addEmoji = (e) => { setNewComment(prev => prev + e); setShowEmojiPicker(false); };

  return (
    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', bgcolor: '#FAFAFA', border: '1px solid #E5E7EB' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
          Comments ({comments.length})
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

      {user ? (
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Avatar src={getImageUrl(user.profilePic)} sx={{ width: 40, height: 40, border: '2px solid #F3F4F6' }} />
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={newComment}
                onChange={handleTyping}
                placeholder="Write a comment..."
                disabled={submitting}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#F9FAFB' } }}
              />
              {typingUsers.length > 0 && (
                <Typography variant="caption" sx={{ color: '#16A34A', mt: 0.5, display: 'block' }}>
                  {typingUsers.map(u => u.name).join(', ')} typing...
                </Typography>
              )}
              {showEmojiPicker && (
                <Paper sx={{ mt: 1, p: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, borderRadius: 3, border: '1px solid #F3F4F6' }}>
                  {emojis.map(e => <IconButton key={e} size="small" onClick={() => addEmoji(e)}>{e}</IconButton>)}
                </Paper>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                <IconButton size="small" onClick={() => setShowEmojiPicker(!showEmojiPicker)} sx={{ color: '#9CA3AF' }}>
                  <EmojiEmotions />
                </IconButton>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={!newComment.trim() || submitting}
                  endIcon={<Send />}
                  sx={{ borderRadius: 3, fontWeight: 700 }}
                >
                  {submitting ? 'Posting...' : 'Post'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>Login to comment.</Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress color="success" /></Box>
      ) : comments.length === 0 ? (
        <Typography sx={{ color: '#9CA3AF', textAlign: 'center', py: 6, fontSize: 14 }}>
          No comments yet. Be the first to share your thoughts!
        </Typography>
      ) : (
        <Box sx={{ maxHeight: 480, overflow: 'auto', pr: 1 }}>
          {comments.map(c => (
            <Box key={c._id} sx={{ mb: 2.5, pb: 2.5, borderBottom: '1px solid #F3F4F6' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Avatar src={getImageUrl(c.userId?.profilePic)} sx={{ width: 40, height: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
                        {c.userId?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{formatDate(c.createdAt)}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {!c.approved && <Chip label="Pending" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: 11, height: 22 }} />}
                        {c.isFlagged && <Chip label="Flagged" size="small" sx={{ bgcolor: '#FEE2E2', color: '#EF4444', fontWeight: 700, fontSize: 11, height: 22 }} />}
                      </Box>
                    </Box>
                    {user && (
                      <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedComment(c); }} sx={{ color: '#9CA3AF' }}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.7 }}>
                    {c.text}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleLikeComment(c._id)}
                      sx={{ color: c.likes?.includes(user?._id) ? '#16A34A' : '#9CA3AF' }}
                    >
                      {c.likes?.includes(user?._id) ? <ThumbUp fontSize="small" /> : <ThumbUpOutlined fontSize="small" />}
                    </IconButton>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#6B7280' }}>{c.likes?.length || 0}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
          <div ref={commentsEndRef} />
        </Box>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedComment(null); }}>
        {user && selectedComment && user._id !== selectedComment.userId?._id && (
          <MenuItem onClick={() => { setReportDialogOpen(true); setAnchorEl(null); }}>
            <Flag sx={{ mr: 1, fontSize: 18 }} /> Report
          </MenuItem>
        )}
      </Menu>

      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Report Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Reason for reporting..."
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)} sx={{ borderRadius: 3, fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleReportComment} variant="contained" color="error" disabled={!reportReason.trim()} sx={{ borderRadius: 3, fontWeight: 700 }}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ForumComments;
