// [AI: Three-dot menu bookmark logic and Redux connect added]
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card, CardHeader, CardContent, CardActions, Typography, Avatar,
  IconButton, Box, Chip, Button, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert, TextField
} from '@mui/material';
import {
  Favorite, FavoriteBorder, Comment, Share, MoreVert, Bookmark,
  BookmarkBorder, Report, Send
} from '@mui/icons-material';
import {
  likePost, deleteForumPost, reportPost, addComment, reportForumComment, toggleBookmark
} from '../../redux/actions/forumActions';
import { emitSocialAction, joinPostRoom, leavePostRoom } from '../../utils/socket';
import ReportModal from './ReportModal';

const ForumPostCard = ({ post, onUpdate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);
  const [currentPost, setCurrentPost] = useState(post);
  const [anchorEl, setAnchorEl] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => setCurrentPost(post), [post]);

  // Real-time updates
  useEffect(() => {
    const handler = (data) => {
      if (data.itemId === currentPost._id) {
        if (data.type === 'LIKE') {
          console.log('📡 Received SOCIAL_UPDATE LIKE event:', data);
          setCurrentPost(prev => ({
            ...prev,
            likesCount: data.likesCount,
            // Update userLiked if this action was performed by the current user
            userLiked: data.userId === userInfo?._id
              ? data.action === 'liked'
              : prev.userLiked
          }));
        } else if (data.type === 'COMMENT_ADDED') {
          setCurrentPost(prev => ({
            ...prev,
            commentsCount: (prev.commentsCount || 0) + 1
          }));
        } else if (data.type === 'BOOKMARK') {
          console.log('📡 Received SOCIAL_UPDATE BOOKMARK event:', data);
          if (data.userId === userInfo?._id) {
            setCurrentPost(prev => ({
              ...prev,
              isBookmarked: data.action === 'bookmarked'
            }));
          }
        }
      }
    };
    const eventHandler = (e) => handler(e.detail);
    window.addEventListener('socialUpdate', eventHandler);

    // Join room for this post
    joinPostRoom(currentPost._id);

    return () => {
      window.removeEventListener('socialUpdate', eventHandler);
      leavePostRoom(currentPost._id);
    };
  }, [currentPost._id, userInfo?._id]);

  const hasLiked = currentPost.userLiked;
  const isBookmarkedInPost = Array.isArray(currentPost.bookmarkedBy)
    ? currentPost.bookmarkedBy.includes(userInfo?._id)
    : Boolean(currentPost.isBookmarked);
  const isOwner = userInfo?._id === currentPost.userId?._id;
  const isAdmin = userInfo?.role === 'admin';

  const handleLike = async () => {
    if (!userInfo) return showSnackbar('Please login to like', 'warning');

    // Toggle state immediately for instantaneous feedback
    const wasLiked = hasLiked;
    setCurrentPost(prev => ({
      ...prev,
      userLiked: !wasLiked,
      likesCount: wasLiked ? Math.max(0, (prev.likesCount || 0) - 1) : (prev.likesCount || 0) + 1
    }));

    try {
      await dispatch(likePost(currentPost._id));
      // Action emission is handled by backend or SOCIAL_UPDATE listener
    } catch {
      // Revert if failed
      setCurrentPost(prev => ({
        ...prev,
        userLiked: wasLiked,
        likesCount: wasLiked ? (prev.likesCount || 0) + 1 : Math.max(0, (prev.likesCount || 0) - 1)
      }));
      showSnackbar('Failed to like post', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return showSnackbar('Enter a comment', 'warning');
    try {
      await dispatch(addComment(currentPost._id, commentText));
      // Local counter increment for immediate feedback
      setCurrentPost(prev => ({
        ...prev,
        commentsCount: (prev.commentsCount || 0) + 1
      }));
      setCommentText('');
      setCommentOpen(false);
      showSnackbar('Comment added', 'success');
    } catch {
      showSnackbar('Failed to comment', 'error');
    }
  };

  const handleReportComment = async (commentId) => {
    try {
      await dispatch(reportForumComment(currentPost._id, commentId, 'Inappropriate'));
      showSnackbar('Comment reported', 'success');
    } catch (error) {
      const errorMsg = typeof error === 'string' ? error : (error.message || 'Failed to report');
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleShare = (platform) => {
    const url = `${window.location.origin}/forum/post/${currentPost._id}`;
    const text = `Check: ${currentPost.title}`;
    let link = '';

    if (platform === 'whatsapp') link = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    if (platform === 'twitter') link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === 'facebook') link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      showSnackbar('Link copied to clipboard!', 'success');
      setShareOpen(false);
      return;
    }

    if (link) window.open(link, '_blank');
    setShareOpen(false);
    showSnackbar('Shared!', 'success');
  };

  const handleReport = async (reportData) => {
    try {
      await dispatch(reportPost(currentPost._id, reportData));
      setReportOpen(false);
      showSnackbar('Report submitted successfully. Thank you for keeping our community safe.', 'success');
    } catch (error) {
      const errorMsg = typeof error === 'string' ? error : (error.message || 'Failed to submit report');
      showSnackbar(errorMsg, 'error');
      throw error; // Re-throw to let ReportModal handle it
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await dispatch(deleteForumPost(currentPost._id));
      showSnackbar('Post deleted', 'success');
      if (onUpdate) onUpdate();
    } catch {
      showSnackbar('Failed to delete', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!userInfo) return showSnackbar('Please login to bookmark', 'warning');
    try {
      await dispatch(toggleBookmark(currentPost._id));
      // Update local state for immediate feedback
      setCurrentPost(prev => {
        const bookmarkedBy = prev.bookmarkedBy || [];
        const isBookmarked = bookmarkedBy.includes(userInfo._id); // This refers to the state *before* the toggle
        return {
          ...prev,
          bookmarkedBy: isBookmarked
            ? bookmarkedBy.filter(id => id !== userInfo._id)
            : [...bookmarkedBy, userInfo._id]
        };
      });
      // The snackbar message should reflect the *new* state after the toggle
      showSnackbar(isBookmarkedInPost ? 'Bookmark removed' : 'Post bookmarked', 'success');
      emitSocialAction({
        type: 'BOOKMARK',
        itemType: 'forum',
        itemId: currentPost._id,
        userId: userInfo._id,
        action: isBookmarkedInPost ? 'unbookmarked' : 'bookmarked'
      });
    } catch (error) {
      showSnackbar(error.message || 'Failed to toggle bookmark', 'error');
    }
  };

  const showSnackbar = (msg, sev) => setSnackbar({ open: true, message: msg, severity: sev });
  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const getImageUrl = (path) => {
    if (!path) return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/uploads/default_avatar.jpg`;
    if (path.startsWith('http')) return path;
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${cleanPath}`;
  };

  return (
    <>
      <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 2, border: currentPost.status !== 'approved' && isAdmin ? '2px solid #ff9800' : 'none' }}>
        <CardHeader
          avatar={<Avatar src={getImageUrl(currentPost.userId?.profilePic)}>{currentPost.userId?.name?.[0]}</Avatar>}
          action={<IconButton onClick={(e) => setAnchorEl(e.currentTarget)}><MoreVert /></IconButton>}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" fontWeight="bold">{currentPost.userId?.name}</Typography>
              {currentPost.status !== 'approved' && isAdmin && <Chip label="Pending" size="small" color="warning" />}
              {currentPost.pinned && <Chip label="Pinned" size="small" color="primary" />}
            </Box>
          }
          subheader={new Date(currentPost.createdAt).toLocaleString()}
        />
        <CardContent sx={{ cursor: 'pointer' }} onClick={() => navigate(`/forum/post/${currentPost._id}`)}>
          <Typography variant="h5" gutterBottom>{currentPost.title}</Typography>
          <Typography paragraph>{currentPost.content}</Typography>
          {currentPost.tags?.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {currentPost.tags.map(t => <Chip key={t} label={`#${t}`} size="small" />)}
            </Box>
          )}

        </CardContent>
        <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            {currentPost.likesCount || 0} likes • {currentPost.commentsCount || 0} comments • {currentPost.viewCount || 0} views
          </Typography>
        </Box>
        <CardActions>
          <IconButton onClick={handleLike} color={hasLiked ? 'error' : 'default'}>
            {hasLiked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <IconButton onClick={() => navigate(`/forum/post/${currentPost._id}#comment-section`)}><Comment /></IconButton>
          <IconButton onClick={() => setShareOpen(true)}><Share /></IconButton>
          <IconButton onClick={handleBookmark} color={isBookmarkedInPost ? 'primary' : 'default'}>
            {isBookmarkedInPost ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
        </CardActions>
      </Card>

      {/* Dialogs */}
      <Dialog open={commentOpen} onClose={() => setCommentOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent><TextField fullWidth multiline rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} /></DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComment} variant="contained" disabled={!commentText.trim()}>Post</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={shareOpen} onClose={() => setShareOpen(false)}>
        <DialogTitle>Share Post</DialogTitle>
        <DialogContent>
          <Button fullWidth onClick={() => handleShare('whatsapp')}>WhatsApp</Button>
          <Button fullWidth onClick={() => handleShare('twitter')}>Twitter</Button>
          <Button fullWidth onClick={() => handleShare('facebook')}>Facebook</Button>
          <Button fullWidth onClick={() => handleShare('copy')}>Copy Link</Button>
        </DialogContent>
      </Dialog>

      {/* Enhanced Report Modal */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        post={currentPost}
        onSubmit={handleReport}
      />

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); navigate(`/forum/post/${currentPost._id}`); }}>View</MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); handleBookmark(); }}>Bookmark</MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/bookmarks'); }}>View Bookmarks</MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); setReportOpen(true); }}>Report</MenuItem>
        {(isOwner || isAdmin) && <MenuItem onClick={() => { setAnchorEl(null); handleDelete(); }} sx={{ color: 'error.main' }}>Delete</MenuItem>}
      </Menu>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={closeSnackbar}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default ForumPostCard;
