// frontend/src/components/customer/RecipeDetail.js
/**
 * FILE: frontend/src/components/customer/RecipeDetail.js
 * PURPOSE:
 * - Full recipe details page with like, comment, share, and rating features
 * - Integrated chat, linked products, and admin-level comment filtering
 * - Enhanced comments: shows only approved/unflagged comments to non-admins
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Rating, CircularProgress, Paper, Grid,
  List, ListItem, ListItemText, Divider, Avatar, Card, CardHeader, CardContent, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, ListItemAvatar, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentIcon from '@mui/icons-material/Comment';
import ShareIcon from '@mui/icons-material/Share';
import SendIcon from '@mui/icons-material/Send';

import { getRecipeDetails, rateRecipe } from '../../redux/actions/recipeActions';
import { addToCart } from '../../redux/actions/cartActions';
import { likeItem, addComment, getComments, trackShare } from '../../redux/actions/socialActions';

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

  const [rating, setRating] = useState(0);
  const [commentText, setCommentText] = useState('');

  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const recipeDetails = useSelector((state) => state.recipeDetails);
  const { loading, error, recipe } = recipeDetails || { recipe: {} };

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const socialLike = useSelector((state) => state.socialLike);
  const socialComment = useSelector((state) => state.socialComment);
  const socialCommentsList = useSelector((state) => state.socialCommentsList);

  useEffect(() => {
    if (recipeId) {
      dispatch(getRecipeDetails(recipeId));
      dispatch(getComments('recipes', recipeId));
    }
  }, [dispatch, recipeId]);

  // ✅ FIXED: Listen for comment approval events to refresh comments
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCommentApproved = (data) => {
      if (data.recipeId === recipeId || data.itemId === recipeId) {
        // Refresh comments when one is approved
        dispatch(getComments('recipes', recipeId));
      }
    };

    const handleCommentAdded = (data) => {
      if (data.recipeId === recipeId || data.itemId === recipeId) {
        // Refresh comments when new comment is added
        dispatch(getComments('recipes', recipeId));
      }
    };

    socket.on('RECIPE_COMMENTED', handleCommentAdded);
    socket.on('COMMENT_APPROVED', handleCommentApproved);
    socket.on('SOCIAL_UPDATE', (data) => {
      if (data.itemType === 'recipe' && data.itemId === recipeId && data.type === 'COMMENT') {
        dispatch(getComments('recipes', recipeId));
      }
    });

    return () => {
      socket.off('RECIPE_COMMENTED', handleCommentAdded);
      socket.off('COMMENT_APPROVED', handleCommentApproved);
      socket.off('SOCIAL_UPDATE');
    };
  }, [recipeId, dispatch]);

  const handleLike = () => {
    if (!userInfo) {
      alert('Please log in to like this recipe.');
      return;
    }
    dispatch(likeItem('recipes', recipeId));
  };

  const handleAddComment = () => {
    if (!userInfo) {
      alert('Please log in to comment.');
      return;
    }
    if (commentText.trim()) {
      dispatch(addComment('recipes', recipeId, commentText));
      setCommentText('');
    }
  };

  const handleShare = (platform) => {
    if (!userInfo) {
      alert('Please log in to share.');
      return;
    }
    dispatch(trackShare('recipes', recipeId, platform));

    const shareUrl = `${window.location.origin}/recipes/${recipeId}`;
    const shareText = `Check out this amazing recipe: ${recipe.title}`;

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
      default:
        break;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
    setShowShareDialog(false);
  };

  const handleAddToCart = (productId) => {
    if (productId && userInfo) {
      dispatch(addToCart(productId, 1));
      navigate('/cart');
    } else if (!userInfo) {
      alert('Please log in to add items to cart.');
    }
  };



  const hasLiked = recipe.likes?.includes(userInfo?._id);

  // --- FIX: Filter comments for admin vs non-admin ---
  const displayComments = useMemo(() => {
    const comments = socialCommentsList.comments || [];
    if (userInfo?.role !== 'admin') {
      return comments.filter((c) => c.approved && !c.isFlagged);
    }
    return comments;
  }, [socialCommentsList.comments, userInfo?.role]);

  if (loading) return <Loader />;
  if (error) return <Message severity="error">{error}</Message>;
  if (!recipe || !recipe.title) return <Typography>Recipe not found.</Typography>;

  const displayRating =
    recipe.ratings && recipe.ratings.length > 0
      ? recipe.ratings.reduce((acc, item) => item.rating + acc, 0) / recipe.ratings.length
      : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <StyledPaper>
        {/* Social Stats Bar */}
        <SocialStatsBar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleLike} color={hasLiked ? 'error' : 'default'} disabled={socialLike.loading}>
              {hasLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography variant="body2">{recipe.likes?.length || 0} likes</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setShowComments(true)}>
              <CommentIcon />
            </IconButton>
            <Typography variant="body2">{displayComments.length || 0} comments</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setShowShareDialog(true)}>
              <ShareIcon />
            </IconButton>
            <Typography variant="body2">{recipe.shares || 0} shares</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            <Rating value={displayRating} precision={0.5} readOnly />
            <Typography>({recipe.numReviews || 0} reviews)</Typography>
          </Box>
        </SocialStatsBar>

        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark', mt: 2 }}>
          {recipe.title}
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
              <img
                src={recipe.image || '/images/default-image.jpg'}
                alt={recipe.title}
                style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/images/default-image.jpg'; }}
              />
            </Box>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Rice Type: <Chip label={recipe.riceType} size="small" color="primary" />
            </Typography>
            {recipe.sellerId && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Recipe By: {recipe.sellerId.name || 'Unknown'}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom sx={{ color: 'secondary.main' }}>Ingredients</Typography>
            <List dense sx={{ mb: 3 }}>
              {recipe.ingredients?.map((item, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemText primary={`- ${item}`} />
                </ListItem>
              ))}
            </List>
            <Typography variant="h5" gutterBottom sx={{ color: 'secondary.main' }}>Steps</Typography>
            <List dense>
              {recipe.steps?.map((step, idx) => (
                <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                  <ListItemText primary={`${idx + 1}. ${step}`} />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>

        {/* Quick Comment Section */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>Quick Comment</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 32, height: 32, mt: 1 }}>
              {userInfo?.name?.charAt(0) || 'U'}
            </Avatar>
            <TextField
              fullWidth
              size="small"
              placeholder="Share your thoughts about this recipe..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleAddComment}
              disabled={!commentText.trim() || socialComment.loading}
              sx={{ mt: 1 }}
            >
              {socialComment.loading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Linked Products Section */}
        {recipe.linkedProducts && recipe.linkedProducts.length > 0 && (
          <Box mt={4}>
            <Typography variant="h5" gutterBottom sx={{ color: 'secondary.main' }}>
              Recommended Rice Products
            </Typography>
            <Grid container spacing={2}>
              {recipe.linkedProducts.map(product => (
                <Grid item xs={12} sm={6} md={4} key={product._id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardHeader
                      avatar={<Avatar sx={{ bgcolor: 'primary.light' }}>{product.name ? product.name[0] : 'R'}</Avatar>}
                      title={product.name}
                      subheader={`₹${product.price}`}
                    />
                    <CardContent>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleAddToCart(product._id)}
                        disabled={!userInfo}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        component={RouterLink}
                        to={`/product/${product._id}`}
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        View Product
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        {/* Rating Section */}
        <Box component="form" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Rate This Recipe</Typography>
          <Rating
            name="recipe-rating"
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            disabled={!userInfo}
            sx={{ mb: 1 }}
          />
          <Button
            variant="contained"
            disabled={!userInfo || rating === 0}
            onClick={() => dispatch(rateRecipe(recipeId, rating))}
          >
            Submit Rating
          </Button>
          {!userInfo && <Typography variant="caption" display="block" color="textSecondary">Please log in to rate.</Typography>}
        </Box>
      </StyledPaper>

      {/* Comments Dialog - UPDATED */}
      <Dialog open={showComments} onClose={() => setShowComments(false)} maxWidth="md" fullWidth>
        <DialogTitle>Comments ({displayComments.length})</DialogTitle>
        <DialogContent>
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {displayComments.map((comment) => (
              <ListItem key={comment._id} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar src={getImageUrl(comment.userId?.profilePic)}>
                    {comment.userId?.name?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {comment.userId?.name}
                      </Typography>
                      {!comment.approved && (
                        <Chip label="Pending Approval" color="warning" size="small" />
                      )}
                      {comment.isFlagged && (
                        <Chip label="Flagged" color="error" size="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                        {comment.text || comment.comment}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.createdAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
            {displayComments.length === 0 && (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No comments yet. Be the first to comment!
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowComments(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share this Recipe</DialogTitle>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

// --- Helper Function for Profile Picture Path ---
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/default_avatar.jpg';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${process.env.REACT_APP_API_URL}${imagePath}`;
  if (imagePath.startsWith('uploads/')) return `${process.env.REACT_APP_API_URL}/${imagePath}`;
  return `${process.env.REACT_APP_API_URL}/uploads/${imagePath}`;
};

export default RecipeDetail;
