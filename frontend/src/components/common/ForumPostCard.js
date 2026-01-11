// [AI: Three-dot menu bookmark logic and Redux connect added]
import React, { useState, useEffect, useMemo } from 'react';
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
  likePost, deleteForumPost, reportPost, addComment, reportForumComment
} from '../../redux/actions/forumActions';
import { bookmarkPost, unbookmarkPost } from '../../redux/actions/userActions';
import { emitSocialAction } from '../../utils/socket';
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
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => setCurrentPost(post), [post]);

  // Real-time updates
  useEffect(() => {
    const handler = (data) => {
      if (data.postId === currentPost._id) {
        if (data.type === 'LIKE') {
          setCurrentPost(prev => ({ ...prev, likes: data.likes }));
        } else if (data.type === 'COMMENT') {
          setCurrentPost(prev => ({
            ...prev,
            comments: [...prev.comments, data.comment].filter(
              (c, i, a) => a.findIndex(t => t._id === c._id) === i
            )
          }));
        }
      }
    };
    window.addEventListener('socialUpdate', (e) => handler(e.detail));
    return () => window.removeEventListener('socialUpdate', handler);
  }, [currentPost._id]);

  const displayComments = useMemo(() => {
    if (!currentPost?.comments) return [];
    return userInfo?.role === 'admin'
      ? currentPost.comments
      : currentPost.comments.filter(c => c.approved && !c.isFlagged);
  }, [currentPost.comments, userInfo?.role]);

  const hasLiked = currentPost.likes?.includes(userInfo?._id);
  const isOwner = userInfo?._id === currentPost.userId?._id;
  const isAdmin = userInfo?.role === 'admin';

  const handleLike = async () => {
    if (!userInfo) return showSnackbar('Please login to like', 'warning');
    try {
      const result = await dispatch(likePost(currentPost._id));
      emitSocialAction({
        type: 'LIKE',
        itemType: 'forum',
        itemId: currentPost._id,
        userId: userInfo._id,
        likes: result.likes,
        action: hasLiked ? 'unliked' : 'liked'
      });
    } catch {
      showSnackbar('Failed to like post', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return showSnackbar('Enter a comment', 'warning');
    try {
      const result = await dispatch(addComment(currentPost._id, commentText));
      emitSocialAction({
        type: 'COMMENT',
        itemType: 'forum',
        itemId: currentPost._id,
        comment: result
      });
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
    } catch {
      showSnackbar('Failed to report', 'error');
    }
  };

  const handleShare = (platform) => {
    const url = `${window.location.origin}/forum/post/${currentPost._id}`;
    const text = `Check: ${currentPost.title}`;
    let link = '';
    if (platform === 'whatsapp') link = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    if (platform === 'twitter') link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === 'facebook') link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
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
      showSnackbar(error.message || 'Failed to submit report', 'error');
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
    try {
      await dispatch(bookmarkPost(currentPost._id));
      showSnackbar('Post bookmarked', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Failed to bookmark', 'error');
    }
  };

  const handleUnbookmark = async () => {
    try {
      await dispatch(unbookmarkPost(currentPost._id));
      showSnackbar('Bookmark removed', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Failed to remove bookmark', 'error');
    }
  };

  const showSnackbar = (msg, sev) => setSnackbar({ open: true, message: msg, severity: sev });
  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const getImageUrl = (path) => {
    if (!path) return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/default_avatar.jpg`;
    if (path.startsWith('http')) return path;
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${cleanPath}`;
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
        <CardContent>
          <Typography variant="h5" gutterBottom>{currentPost.title}</Typography>
          <Typography paragraph>{currentPost.content}</Typography>
          {currentPost.tags?.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {currentPost.tags.map(t => <Chip key={t} label={`#${t}`} size="small" />)}
            </Box>
          )}
          {displayComments.length > 0 && (
            <Box sx={{ mt: 2, bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Comments ({displayComments.length})</Typography>
              {displayComments.slice(0, 2).map(c => (
                <Box key={c._id} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Avatar sx={{ width: 24, height: 24 }} src={getImageUrl(c.userId?.profilePic)}>{c.userId?.name?.[0]}</Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">{c.userId?.name}</Typography>
                    <Typography variant="body2">{c.text}</Typography>
                  </Box>
                  {isAdmin && <IconButton size="small" onClick={() => handleReportComment(c._id)}><Report fontSize="small" /></IconButton>}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
        <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            {currentPost.likes?.length || 0} likes • {displayComments.length} comments
          </Typography>
        </Box>
        <CardActions>
          <IconButton onClick={handleLike} color={hasLiked ? 'error' : 'default'}>
            {hasLiked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <IconButton onClick={() => setCommentOpen(true)}><Comment /></IconButton>
          <IconButton onClick={() => setShareOpen(true)}><Share /></IconButton>
          <IconButton onClick={() => setIsBookmarked(!isBookmarked)}>
            {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
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