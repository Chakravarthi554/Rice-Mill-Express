import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Button, Container, Card, CardContent,
  Avatar, Chip, Breadcrumbs, CircularProgress, Alert,
  Divider, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Stack
} from '@mui/material';
import {
  ThumbUp, ThumbUpOutlined, Comment, Share, Bookmark, BookmarkBorder,
  ArrowBack, WhatsApp, Twitter, Facebook, Link as LinkIcon
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

      const handler = (e) => {
        const data = e.detail;
        if (data.itemId === id && data.userId && data.userId !== userInfo?._id) {
          dispatch(getPostById(id));
        }
      };

      window.addEventListener('socialUpdate', handler);
      joinPostRoom(id);

      return () => {
        window.removeEventListener('socialUpdate', handler);
        leavePostRoom(id);
      };
    }
  }, [dispatch, id, userInfo]);

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
        <CircularProgress color="success" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/forum')} startIcon={<ArrowBack />} sx={{ borderRadius: 3 }}>
          Back to Forum
        </Button>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>Post not found</Alert>
        <Button variant="contained" onClick={() => navigate('/forum')} startIcon={<ArrowBack />} sx={{ borderRadius: 3 }}>
          Back to Forum
        </Button>
      </Container>
    );
  }

  const hasLiked = post.userLiked;
  const isBookmarked = post.isBookmarked;
  const isAdmin = userInfo?.role === 'admin';

  const displayComments = isAdmin
    ? post.comments || []
    : (post.comments || []).filter(c => c.approved && !c.isFlagged);

  return (
    <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/forum')}
            sx={{ fontWeight: 700, color: '#6B7280', borderRadius: 3 }}
          >
            Back
          </Button>
          <Breadcrumbs sx={{ color: '#9CA3AF', fontSize: 13 }}>
            <Link to="/forum" style={{ textDecoration: 'none', color: '#9CA3AF' }}>Forum</Link>
            <Link to={`/forum?category=${post.category}`} style={{ textDecoration: 'none', color: '#9CA3AF' }}>{post.category}</Link>
            <Typography color="#111827" sx={{ fontWeight: 600, fontSize: 13 }}>{post.title}</Typography>
          </Breadcrumbs>
        </Box>

        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={getImageUrl(post.userId?.profilePic)}
                sx={{ width: 52, height: 52, mr: 2, border: '2px solid #F3F4F6' }}
              >
                {post.userId?.name?.[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
                  {post.userId?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  {new Date(post.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {post.pinned && <Chip label="Pinned" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }} />}
                {post.status !== 'approved' && isAdmin && (
                  <Chip label="Pending" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }} />
                )}
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 2 }}>
              {post.title}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              <Chip label={post.category} size="small" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 700 }} />
              {post.tags?.map((tag) => (
                <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" sx={{ borderColor: '#E5E7EB', color: '#6B7280', fontWeight: 600 }} />
              ))}
            </Box>

            <Typography sx={{ whiteSpace: 'pre-wrap', mb: 4, fontSize: '1.05rem', lineHeight: 1.8, color: '#374151' }}>
              {post.content}
            </Typography>

            {post.linkedRecipe && (
              <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#166534', mb: 1 }}>
                  Linked Recipe
                </Typography>
                <Button component={Link} to={`/recipes/${post.linkedRecipe._id}`} variant="contained" color="success" size="small" sx={{ borderRadius: 3 }}>
                  View Recipe: {post.linkedRecipe.name}
                </Button>
              </Paper>
            )}

            {post.linkedProduct && (
              <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3, bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#C2410C', mb: 1 }}>
                  Linked Product
                </Typography>
                <Button component={Link} to={`/products/${post.linkedProduct._id}`} variant="contained" color="warning" size="small" sx={{ borderRadius: 3 }}>
                  View Product: {post.linkedProduct.name}
                </Button>
              </Paper>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600 }}>
                {post.likesCount || 0} likes
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600 }}>
                {displayComments.length} comments
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600 }}>
                {post.viewCount || 0} views
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant={hasLiked ? 'contained' : 'outlined'}
                color={hasLiked ? 'error' : 'inherit'}
                startIcon={hasLiked ? <ThumbUp /> : <ThumbUpOutlined />}
                onClick={handleLike}
                disabled={!userInfo}
                sx={{ borderRadius: 3, fontWeight: 700 }}
              >
                {hasLiked ? 'Liked' : 'Like'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Comment />}
                onClick={() => document.getElementById('comment-section')?.scrollIntoView({ behavior: 'smooth' })}
                sx={{ borderRadius: 3, fontWeight: 700, color: '#6B7280', borderColor: '#D1D5DB' }}
              >
                Comment
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => setShareOpen(true)}
                sx={{ borderRadius: 3, fontWeight: 700, color: '#6B7280', borderColor: '#D1D5DB' }}
              >
                Share
              </Button>
              <Button
                variant={isBookmarked ? 'contained' : 'outlined'}
                color="success"
                startIcon={isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                onClick={handleBookmark}
                disabled={!userInfo}
                sx={{ borderRadius: 3, fontWeight: 700 }}
              >
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4 }} id="comment-section">
          <CommentSystem type="forum" itemId={id} />
        </Box>

        <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>Share Post</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Button fullWidth variant="outlined" startIcon={<WhatsApp />} onClick={() => handleShare('whatsapp')} sx={{ borderRadius: 3, justifyContent: 'flex-start', py: 1.2 }}>
                Share on WhatsApp
              </Button>
              <Button fullWidth variant="outlined" startIcon={<Twitter />} onClick={() => handleShare('twitter')} sx={{ borderRadius: 3, justifyContent: 'flex-start', py: 1.2 }}>
                Share on Twitter
              </Button>
              <Button fullWidth variant="outlined" startIcon={<Facebook />} onClick={() => handleShare('facebook')} sx={{ borderRadius: 3, justifyContent: 'flex-start', py: 1.2 }}>
                Share on Facebook
              </Button>
              <Button fullWidth variant="outlined" startIcon={<LinkIcon />} onClick={() => handleShare('copy')} sx={{ borderRadius: 3, justifyContent: 'flex-start', py: 1.2 }}>
                Copy Link
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareOpen(false)} sx={{ borderRadius: 3, fontWeight: 700 }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ForumPostDetail;
