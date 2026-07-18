import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { likeItem, addComment, getComments, trackShare } from '../../redux/actions/socialActions';
import { socket } from '../../utils/socket';

const SocialInteraction = ({ itemType, itemId, itemUserId, showComments = true }) => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.userLogin);

  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const socialLike = useSelector((state) => state.socialLike);
  const socialComment = useSelector((state) => state.socialComment);
  const socialCommentsList = useSelector((state) => state.socialCommentsList);

  useEffect(() => {
    setComments([]);
    setCurrentItemId(itemId);
    dispatch(getComments(itemType, itemId));
  }, [dispatch, itemType, itemId]);

  useEffect(() => {
    if (socialCommentsList.comments && currentItemId === itemId) {
      setComments(socialCommentsList.comments);
    }
  }, [socialCommentsList, currentItemId, itemId]);

  // Socket.io real-time updates and room joining
  useEffect(() => {
    if (!socket || !itemId || !itemType) return;

    const roomName = `${itemType.slice(0, -1)}_${itemId}`;
    socket.emit('join', roomName);
    console.log(`🔌 Joined social room: ${roomName}`);

    const handler = (data) => {
      if (data.itemId === itemId && data.itemType?.toLowerCase() === itemType.toLowerCase()) {
        const isLike = data.type === 'LIKE' || data.type === 'LIKE_UPDATED';
        const isComment = data.type === 'COMMENT' || data.type === 'COMMENT_ADDED';

        if (isLike && data.likesCount != null) {
          setLikes(data.likesCount);
          setHasLiked(data.userLiked ?? false);
        }

        if (isComment) {
          setComments(prev => [...prev, data.comment].filter(Boolean));
          dispatch(getComments(itemType, itemId));
        }
      }
    };

    socket.on('SOCIAL_UPDATE', handler);

    return () => {
      socket.off('SOCIAL_UPDATE', handler);
      socket.emit('leave', roomName);
      console.log(`🔌 Left social room: ${roomName}`);
    };
  }, [itemType, itemId, dispatch]);

  const handleLike = () => {
    if (!userInfo) {
      setSnackbar({
        open: true,
        message: 'Please login to like',
        severity: 'warning'
      });
      return;
    }

    dispatch(likeItem(itemType, itemId));
  };

  const handleAddComment = () => {
    if (!userInfo) {
      setSnackbar({
        open: true,
        message: 'Please login to comment',
        severity: 'warning'
      });
      return;
    }

    if (commentText.trim()) {
      dispatch(addComment(itemType, itemId, commentText));
      setCommentText('');
      setShowCommentDialog(false);
    }
  };

  const handleShare = (platform) => {
    if (!userInfo) {
      setSnackbar({
        open: true,
        message: 'Please login to share',
        severity: 'warning'
      });
      return;
    }

    const shareUrl = `${window.location.origin}/${itemType}/${itemId}`;
    const shareText = `Check out this amazing ${itemType.slice(0, -1)}!`;

    let shareLink = '';
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      default:
        break;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
      dispatch(trackShare(itemType, itemId, platform));
    }

    setShowShareDialog(false);
  };

  const ShareDialog = () => (
    <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Share this {itemType.slice(0, -1)}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<span style={{ color: '#25D366' }}>📱</span>}
            onClick={() => handleShare('whatsapp')}
            sx={{ justifyContent: 'flex-start' }}
          >
            Share on WhatsApp
          </Button>
          <Button
            variant="outlined"
            startIcon={<span style={{ color: '#1DA1F2' }}>🐦</span>}
            onClick={() => handleShare('twitter')}
            sx={{ justifyContent: 'flex-start' }}
          >
            Share on Twitter
          </Button>
          <Button
            variant="outlined"
            startIcon={<span style={{ color: '#1877F2' }}>📘</span>}
            onClick={() => handleShare('facebook')}
            sx={{ justifyContent: 'flex-start' }}
          >
            Share on Facebook
          </Button>
          <Button
            variant="outlined"
            startIcon={<span style={{ color: '#0088cc' }}>📨</span>}
            onClick={() => handleShare('telegram')}
            sx={{ justifyContent: 'flex-start' }}
          >
            Share on Telegram
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowShareDialog(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default_avatar.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.REACT_APP_API_URL}/uploads/${imagePath}`;
  };

  const CommentDialog = () => (
    <Dialog open={showCommentDialog} onClose={() => setShowCommentDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Comments ({comments.length})</DialogTitle>
      <DialogContent>
        <List sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
          {comments.map((comment) => (
            <ListItem key={comment._id} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar src={getImageUrl(comment.user?.profilePic)}>
                  {comment.user?.name?.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {comment.user?.name}
                    </Typography>
                    {!comment.approved && (
                      <Chip label="Pending" color="warning" size="small" />
                    )}
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.primary">
                      {comment.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
          {comments.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              No comments yet. Be the first to comment!
            </Typography>
          )}
        </List>

        {userInfo && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <IconButton
              color="primary"
              onClick={handleAddComment}
              disabled={!commentText.trim() || socialComment.loading}
            >
              {socialComment.loading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCommentDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
        <IconButton
          onClick={handleLike}
          color={hasLiked ? 'error' : 'default'}
          disabled={socialLike.loading}
        >
          {hasLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {likes}
        </Typography>

        {showComments && (
          <>
            <IconButton onClick={() => setShowCommentDialog(true)}>
              <CommentIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {comments.length}
            </Typography>
          </>
        )}

        <IconButton onClick={() => setShowShareDialog(true)}>
          <ShareIcon />
        </IconButton>
      </Box>

      <ShareDialog />
      <CommentDialog />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SocialInteraction;