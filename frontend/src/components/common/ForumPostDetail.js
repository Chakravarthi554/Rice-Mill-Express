import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Container, Card, CardContent,
  Avatar, IconButton, Chip, Breadcrumbs, CircularProgress, Alert,
  Divider, Paper, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  ThumbUp, ThumbUpOutlined, Comment, Share, Bookmark, BookmarkBorder,
  ArrowBack, Report, Send, WhatsApp, Twitter, Facebook, Link as LinkIcon
} from '@mui/icons-material';
import { getPostById, likePost, toggleBookmark } from '../../redux/actions/forumActions';
import CommentSystem from '../social/CommentSystem';
import { joinPostRoom, leavePostRoom } from '../../utils/socket';

const ForumPostDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.userLogin);
  const { post, loading, error } = useSelector((state) => state.forumPostDetails || {});

  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(getPostById(id));

      const handler = (data) => {
        if (data.itemId === id) {
          // We re-fetch or update local state? Re-fetching is safer for now 
          // but maybe we can just manually update the post in redux?
          // forumActions.js should probably handle this.
          // For now, let's just re-fetch to be safe.
          dispatch(getPostById(id));
        }
      };

      window.addEventListener('socialUpdate', (e) => handler(e.detail));
      joinPostRoom(id);

      return () => {
        window.removeEventListener('socialUpdate', handler);
        leavePostRoom(id);
      };
    }
  }, [dispatch, id]);

  const handleLike = async () => {
    if (!userInfo) return alert('Please login to like posts');
    try {
      await dispatch(likePost(id));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleBookmark = async () => {
    if (!userInfo) return alert('Please login to bookmark posts');
    try {
      await dispatch(toggleBookmark(id));
      // Re-fetch is handled by the socket listener as well, but we can do it here for extra safety
      // although the socket listener already dispatches getPostById(id)
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };


  const handleShare = (platform) => {
    const url = `${window.location.origin}/forum/post/${id}`;
    const text = `Check out: ${post?.title}`;
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        setShareOpen(false);
        return;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
      setShareOpen(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '/default_avatar.jpg';
    return path.startsWith('http') ? path : `${process.env.REACT_APP_API_URL || ''}${path}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/forum')} startIcon={<ArrowBack />}>
          Back to Forum
        </Button>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Post not found
        </Alert>
        <Button variant="contained" onClick={() => navigate('/forum')} startIcon={<ArrowBack />}>
          Back to Forum
        </Button>
      </Container>
    );
  }

  const hasLiked = post.userLiked;
  const isBookmarked = post.isBookmarked;
  const isOwner = userInfo?._id === post.userId?._id;
  const isAdmin = userInfo?.role === 'admin';

  // Filter comments for non-admins
  const displayComments = isAdmin
    ? post.comments || []
    : (post.comments || []).filter(c => c.approved && !c.isFlagged);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link to="/forum" style={{ textDecoration: 'none', color: 'inherit' }}>
          Forum
        </Link>
        <Link to={`/forum?category=${post.category}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          {post.category}
        </Link>
        <Typography color="text.primary">{post.title}</Typography>
      </Breadcrumbs>

      {/* Back Button */}
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate('/forum')}
        sx={{ mb: 3 }}
      >
        Back to Forum
      </Button>

      {/* Main Post Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
        {/* Post Header */}
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={getImageUrl(post.userId?.profilePic)}
              sx={{ width: 56, height: 56, mr: 2 }}
            >
              {post.userId?.name?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {post.userId?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(post.createdAt).toLocaleString()}
              </Typography>
            </Box>
            {post.pinned && <Chip label="📌 Pinned" color="primary" size="small" />}
            {post.status !== 'approved' && isAdmin && (
              <Chip label="⚠️ Pending" color="warning" size="small" sx={{ ml: 1 }} />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Post Title */}
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {post.title}
          </Typography>

          {/* Post Category & Tags */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip label={post.category} color="primary" size="small" />
            {post.tags?.map((tag) => (
              <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
            ))}
          </Box>

          {/* Post Content */}
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3, fontSize: '1.1rem', lineHeight: 1.8 }}>
            {post.content}
          </Typography>

          {/* Linked Recipe/Product */}
          {post.linkedRecipe && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="subtitle2" gutterBottom>
                🍚 Linked Recipe
              </Typography>
              <Button
                component={Link}
                to={`/recipes/${post.linkedRecipe._id}`}
                variant="contained"
                size="small"
              >
                View Recipe: {post.linkedRecipe.name}
              </Button>
            </Paper>
          )}

          {post.linkedProduct && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
              <Typography variant="subtitle2" gutterBottom>
                🛒 Linked Product
              </Typography>
              <Button
                component={Link}
                to={`/products/${post.linkedProduct._id}`}
                variant="contained"
                size="small"
              >
                View Product: {post.linkedProduct.name}
              </Button>
            </Paper>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Engagement Stats */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              ❤️ {post.likesCount || 0} likes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              💬 {displayComments.length} comments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              👁️ {post.viewCount || 0} views
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant={hasLiked ? 'contained' : 'outlined'}
              startIcon={hasLiked ? <ThumbUp /> : <ThumbUpOutlined />}
              onClick={handleLike}
              disabled={!userInfo}
            >
              {hasLiked ? 'Liked' : 'Like'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Comment />}
              onClick={() => document.getElementById('comment-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Comment
            </Button>
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={() => setShareOpen(true)}
            >
              Share
            </Button>
            <Button
              variant={isBookmarked ? 'contained' : 'outlined'}
              startIcon={isBookmarked ? <Bookmark /> : <BookmarkBorder />}
              onClick={handleBookmark}
              disabled={!userInfo}
              color="secondary"
            >
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Comments Section */}
      {/* Comment Section */}
      <Box sx={{ mt: 3 }} id="comment-section">
        <CommentSystem type="forum" itemId={id} />
      </Box>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)}>
        <DialogTitle>Share Post</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 300 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<WhatsApp />}
              onClick={() => handleShare('whatsapp')}
              sx={{ justifyContent: 'flex-start' }}
            >
              Share on WhatsApp
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Twitter />}
              onClick={() => handleShare('twitter')}
              sx={{ justifyContent: 'flex-start' }}
            >
              Share on Twitter
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Facebook />}
              onClick={() => handleShare('facebook')}
              sx={{ justifyContent: 'flex-start' }}
            >
              Share on Facebook
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() => handleShare('copy')}
              sx={{ justifyContent: 'flex-start' }}
            >
              Copy Link
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ForumPostDetail;