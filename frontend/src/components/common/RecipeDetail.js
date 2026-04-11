// [FORCED UPDATE: Jan 11 23:35] - Standardizing Social Engagement System
/**
 * FILE: frontend/src/components/common/RecipeDetail.js
 * PURPOSE:
 * - Full recipe details page with robust social engagement features
 * - Instagram-like comments, nested replies, mentions, and real-time updates
 * - Rating histogram and advanced sorting
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Rating, CircularProgress, Paper, Grid,
  List, ListItem, ListItemText, Divider, Avatar, Card, CardHeader, CardContent, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, ListItemAvatar, Alert,
  Stack, LinearProgress, Menu, MenuItem, Tooltip, Badge, Collapse, Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Favorite, FavoriteBorder, Comment as CommentIcon, Share as ShareIcon,
  Send as SendIcon, Sort as SortIcon, Star as StarIcon,
  MoreVert as MoreVertIcon, Flag as FlagIcon, Reply as ReplyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { getRecipeDetails, rateRecipe } from '../../redux/actions/recipeActions';
import { addToCart } from '../../redux/actions/cartActions';
import {
  likeItem, addComment, trackShare,
  getSortedComments, getRatingDistribution
} from '../../redux/actions/socialActions';
import { getCurrentSocket } from '../../utils/socket';

import CommentSystem from '../social/CommentSystem';
import RatingSystem from '../social/RatingSystem';
import Loader from './Loader';
import Message from './Message';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
  borderRadius: theme.shape.borderRadius * 2,
}));

const SocialStatsBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const RecipeDetail = () => {
  const { id: recipeId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const commentInputRef = useRef(null);

  // Pagination and sorting (managed by CommentSystem now, but keep sortBy if needed locally)
  const [sortBy, setSortBy] = useState('recent');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [anchorElSort, setAnchorElSort] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Toast notification state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const recipeDetails = useSelector((state) => state.recipeDetails);
  const { loading, error, recipe } = recipeDetails || { recipe: {} };

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const socialLike = useSelector((state) => state.socialLike);
  const socialComment = useSelector((state) => state.socialComment);
  const socialCommentsList = useSelector((state) => state.socialCommentsList);
  const socialRatingDist = useSelector((state) => state.socialRatingDist);

  useEffect(() => {
    if (recipeId) {
      dispatch(getRecipeDetails(recipeId));
    }
  }, [dispatch, recipeId]);

  // ✅ Listen for real-time social updates
  useEffect(() => {
    const socket = getCurrentSocket();
    if (!socket) return;

    const handleSocialUpdate = (data) => {
      console.log('📡 Desktop: SOCIAL_UPDATE received:', data);
      if (data.itemId === recipeId) {
        // Refresh recipe data to get updated counts
        dispatch(getRecipeDetails(recipeId));
      }
    };

    const handleEngagementUpdate = (data) => {
      console.log('📡 Desktop: ENGAGEMENT_UPDATE received:', data);
      if (data.itemId === recipeId) {
        // Refresh recipe data to get updated counts
        dispatch(getRecipeDetails(recipeId));
      }
    };

    socket.on('SOCIAL_UPDATE', handleSocialUpdate);
    socket.on('ENGAGEMENT_UPDATE', handleEngagementUpdate);

    return () => {
      socket.off('SOCIAL_UPDATE', handleSocialUpdate);
      socket.off('ENGAGEMENT_UPDATE', handleEngagementUpdate);
    };
  }, [dispatch, recipeId]);

  const handleLike = () => {
    if (!userInfo) {
      setSnackbar({ open: true, message: 'Please log in to like this recipe.', severity: 'warning' });
      return;
    }
    dispatch(likeItem('recipes', recipeId));
  };

  const handleShare = (platform) => {
    if (!userInfo) return alert('Please log in to share.');
    dispatch(trackShare('recipes', recipeId, platform));

    const shareUrl = `${window.location.origin}/recipes/${recipeId}`;
    const shareText = `Check out this amazing recipe: ${recipe.title}`;
    let shareLink = '';

    switch (platform) {
      case 'whatsapp': shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`; break;
      case 'twitter': shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`; break;
      case 'facebook': shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`; break;
      default: break;
    }
    if (shareLink) window.open(shareLink, '_blank', 'width=600,height=400');
    setShowShareDialog(false);
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/recipes/${recipeId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('Failed to copy link');
    }
  };



  const handleAddToCart = (productId) => {
    if (!userInfo) return alert('Please log in to add items to cart.');
    dispatch(addToCart(productId, 1));
    navigate('/cart');
  };

  // Organize comments into tree
  const commentTree = useMemo(() => {
    const comments = socialCommentsList.comments || [];
    const commentMap = {};
    const roots = [];

    // First pass: create map
    comments.forEach(c => {
      commentMap[c._id] = { ...c, replies: [] };
    });

    // Second pass: link children to parents
    comments.forEach(c => {
      if (c.parentComment) {
        if (commentMap[c.parentComment]) {
          commentMap[c.parentComment].replies.push(commentMap[c._id]);
        }
      } else {
        roots.push(commentMap[c._id]);
      }
    });

    return roots;
  }, [socialCommentsList.comments]);

  const hasLiked = recipe.userLiked || false;
  const displayRating = recipe.averageRating || 0;

  if (loading) return <Loader />;
  if (error) return <Message severity="error">{error}</Message>;
  if (!recipe || !recipe.title) return <Typography>Recipe not found.</Typography>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Grid container spacing={4}>
        {/* Left Column: Media & Details */}
        <Grid item xs={12} md={7}>
          <StyledPaper sx={{ overflow: 'hidden', p: 0 }}>
            <Box sx={{ position: 'relative' }}>
              <img
                src={recipe.image || '/images/default-image.jpg'}
                alt={recipe.title}
                style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'cover' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/images/default-image.jpg'; }}
              />
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', p: 3, pt: 8 }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>{recipe.title}</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Chip label={recipe.riceType} color="primary" size="small" />
                  <Typography variant="subtitle2" sx={{ color: 'white' }}>By {recipe.sellerId?.name || 'Unknown'}</Typography>
                </Stack>
              </Box>
            </Box>

            <SocialStatsBar>
              <Tooltip title={hasLiked ? "Unlike" : "Like"}>
                <IconButton onClick={handleLike} color={hasLiked ? 'error' : 'default'}>
                  <AnimatePresence mode='wait'>
                    {hasLiked ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key="filled">
                        <Favorite />
                      </motion.div>
                    ) : (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key="outlined">
                        <FavoriteBorder />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </IconButton>
              </Tooltip>
              <Typography variant="body2" fontWeight="bold">{recipe.likesCount || 0} Likes</Typography>

              <Tooltip title="Comment">
                <IconButton onClick={() => commentInputRef.current?.focus()}>
                  <CommentIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" fontWeight="bold">{socialCommentsList.total || 0} Comments</Typography>

              <Tooltip title="Share">
                <IconButton onClick={() => setShowShareDialog(true)}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" fontWeight="bold">{recipe.sharesCount || 0} Shares</Typography>
              
              <Tooltip title="Views">
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, opacity: 0.7 }}>
                  <Typography variant="body2">👁 {recipe.viewCount || 0} Views</Typography>
                </Box>
              </Tooltip>
            </SocialStatsBar>

            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="secondary.main">Ingredients</Typography>
              <List dense sx={{ mb: 3 }}>
                {recipe.ingredients?.map((item, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemText primary={`• ${item}`} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom color="secondary.main">Steps</Typography>
              <List dense>
                {recipe.steps?.map((step, idx) => (
                  <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                    <ListItemText primary={`${idx + 1}. ${step}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </StyledPaper>

          {/* Linked Products */}
          {recipe.linkedProducts?.length > 0 && (
            <Box mt={4}>
              <Typography variant="h5" gutterBottom fontWeight="bold">Shop Ingredients</Typography>
              <Grid container spacing={2}>
                {recipe.linkedProducts.map(product => (
                  <Grid item xs={12} sm={6} key={product._id}>
                    <Card variant="outlined" sx={{ display: 'flex', p: 1 }}>
                      <Avatar src={getImageUrl(product.image)} variant="rounded" sx={{ width: 60, height: 60 }} />
                      <Box sx={{ ml: 2, flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">{product.name}</Typography>
                        <Typography variant="body2" color="primary">₹{product.price}</Typography>
                        <Button size="small" onClick={() => handleAddToCart(product._id)}>Add to Cart</Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>

        {/* Right Column: Social Engagement */}
        <Grid item xs={12} md={5}>
          <StyledPaper sx={{ height: '100%', maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            {/* Rating Section */}
            {/* Rating Section */}
            <RatingSystem
              type="recipes"
              itemId={recipeId}
              onRate={(val) => dispatch(rateRecipe(recipeId, val))}
            />

            {/* Comment System */}
            <CommentSystem type="recipes" itemId={recipeId} />
          </StyledPaper>
        </Grid>
      </Grid>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Share Recipe</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              color={copySuccess ? 'success' : 'primary'}
              onClick={handleCopyLink}
            >
              {copySuccess ? '✓ Link Copied!' : '🔗 Copy Link'}
            </Button>
            <Divider>OR</Divider>
            <Button variant="outlined" startIcon={<span style={{ color: '#25D366' }}>📱</span>} onClick={() => handleShare('whatsapp')}>WhatsApp</Button>
            <Button variant="outlined" startIcon={<span style={{ color: '#1DA1F2' }}>🐦</span>} onClick={() => handleShare('twitter')}>Twitter</Button>
            <Button variant="outlined" startIcon={<span style={{ color: '#1877F2' }}>📘</span>} onClick={() => handleShare('facebook')}>Facebook</Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return '/default_avatar.jpg';
  if (imagePath.startsWith('http')) return imagePath;
  return `${process.env.REACT_APP_API_URL}/uploads/${imagePath}`;
};

export default RecipeDetail;
