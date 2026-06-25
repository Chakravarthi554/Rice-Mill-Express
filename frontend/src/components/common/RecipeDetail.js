import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Grid,
  List, ListItem, ListItemText, Divider, Avatar, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, Alert,
  Stack, Tooltip, Snackbar, Container
} from '@mui/material';
import {
  Favorite, FavoriteBorder, Comment as CommentIcon, Share as ShareIcon,
  AccessTime, LocalDining, PeopleAlt, ShoppingCart
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { getRecipeDetails, rateRecipe } from '../../redux/actions/recipeActions';
import { addToCart } from '../../redux/actions/cartActions';
import {
  likeItem, trackShare
} from '../../redux/actions/socialActions';
import { getCurrentSocket } from '../../utils/socket';

import CommentSystem from '../social/CommentSystem';
import RatingSystem from '../social/RatingSystem';
import Loader from './Loader';
import Message from './Message';

const RecipeDetail = () => {
  const { id: recipeId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const commentInputRef = useRef(null);

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const recipeDetails = useSelector((state) => state.recipeDetails);
  const { loading, error, recipe } = recipeDetails || { recipe: {} };

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const socialCommentsList = useSelector((state) => state.socialCommentsList);

  useEffect(() => {
    if (recipeId) {
      dispatch(getRecipeDetails(recipeId));
    }
  }, [dispatch, recipeId]);

  useEffect(() => {
    const socket = getCurrentSocket();
    if (!socket) return;

    const handleSocialUpdate = (data) => {
      if (data.itemId === recipeId) {
        dispatch(getRecipeDetails(recipeId));
      }
    };

    socket.on('SOCIAL_UPDATE', handleSocialUpdate);
    socket.on('ENGAGEMENT_UPDATE', handleSocialUpdate);

    return () => {
      socket.off('SOCIAL_UPDATE', handleSocialUpdate);
      socket.off('ENGAGEMENT_UPDATE', handleSocialUpdate);
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

  const hasLiked = recipe.userLiked || false;
  const prepTime = recipe.prepTime || recipe.cookTime || '30 min';
  const servings = recipe.servings || 4;

  if (loading) return <Loader />;
  if (error) return <Message severity="error">{error}</Message>;
  if (!recipe || !recipe.title) return <Typography>Recipe not found.</Typography>;

  return (
    <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
              <Box sx={{ position: 'relative' }}>
                {recipe.video ? (
                  <video
                    src={recipe.video}
                    controls
                    style={{ width: '100%', display: 'block', maxHeight: '480px', objectFit: 'cover', backgroundColor: '#000' }}
                  />
                ) : (
                  <img
                    src={recipe.images?.length > 0 ? recipe.images[0] : (recipe.image || '/images/default-image.jpg')}
                    alt={recipe.title}
                    style={{ width: '100%', display: 'block', maxHeight: '480px', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/default-image.jpg'; }}
                  />
                )}
                <Box sx={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                  p: 4, pt: 10,
                }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                    {recipe.title}
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip label={recipe.riceType || 'Rice'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, backdropFilter: 'blur(4px)' }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                      By {recipe.sellerId?.name || 'Rice Mill Kitchen'}
                    </Typography>
                  </Stack>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 2.5, px: 3, borderBottom: '1px solid #F3F4F6' }}>
                {[
                  { icon: <AccessTime sx={{ fontSize: 20 }} />, label: 'Prep Time', value: prepTime },
                  { icon: <LocalDining sx={{ fontSize: 20 }} />, label: 'Rice Type', value: recipe.riceType || 'Mixed' },
                  { icon: <PeopleAlt sx={{ fontSize: 20 }} />, label: 'Servings', value: `${servings}` },
                ].map((item, i) => (
                  <Box key={i} sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: '#16A34A', mb: 0.5 }}>{item.icon}</Box>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ px: 3, py: 3 }}>
                {recipe.description && (
                  <Typography sx={{ color: '#6B7280', lineHeight: 1.8, mb: 3, fontSize: 15 }}>
                    {recipe.description}
                  </Typography>
                )}

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#111827' }}>
                  Ingredients
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 4 }}>
                  {recipe.ingredients?.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.8, px: 1.5, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: 3, bgcolor: '#16A34A', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 14, color: '#374151' }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#111827' }}>
                  Steps
                </Typography>
                <List dense>
                  {recipe.steps?.map((step, idx) => (
                    <ListItem key={idx} disablePadding sx={{ mb: 1.5, alignItems: 'flex-start' }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: 14, bgcolor: '#16A34A', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, flexShrink: 0, mr: 2, mt: 0.3,
                      }}>
                        {idx + 1}
                      </Box>
                      <ListItemText
                        primary={step}
                        primaryTypographyProps={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>

            {recipe.linkedProducts?.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#111827' }}>
                  Shop Ingredients
                </Typography>
                <Grid container spacing={2}>
                  {recipe.linkedProducts.map(product => (
                    <Grid item xs={12} sm={6} key={product._id}>
                      <Paper sx={{ display: 'flex', p: 1.5, borderRadius: 3, border: '1px solid #F3F4F6' }}>
                        <Avatar src={getImageUrl(product.image)} variant="rounded" sx={{ width: 60, height: 60 }} />
                        <Box sx={{ ml: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="subtitle2" fontWeight={700}>{product.name}</Typography>
                          <Typography variant="body2" color="#16A34A" fontWeight={700}>₹{product.price}</Typography>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<ShoppingCart />}
                            onClick={() => handleAddToCart(product._id)}
                            sx={{ mt: 0.5, borderRadius: 2, fontSize: 11, py: 0.3 }}
                          >
                            Add to Cart
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', position: 'sticky', top: 24 }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2,
                borderBottom: '1px solid #F3F4F6', bgcolor: '#FAFAFA',
              }}>
                <Tooltip title={hasLiked ? "Unlike" : "Like"}>
                  <IconButton onClick={handleLike} color={hasLiked ? 'error' : 'default'} sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#FEE2E2' } }}>
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
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{recipe.likesCount || 0}</Typography>

                <Tooltip title="Comment">
                  <IconButton onClick={() => commentInputRef.current?.focus()} sx={{ bgcolor: '#fff' }}>
                    <CommentIcon />
                  </IconButton>
                </Tooltip>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{socialCommentsList.total || 0}</Typography>

                <Tooltip title="Share">
                  <IconButton onClick={() => setShowShareDialog(true)} sx={{ bgcolor: '#fff' }}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{recipe.sharesCount || 0}</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', opacity: 0.6 }}>
                  <Typography sx={{ fontSize: 13 }}>👁</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{recipe.viewCount || 0}</Typography>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                <RatingSystem
                  type="recipes"
                  itemId={recipeId}
                  onRate={(val) => dispatch(rateRecipe(recipeId, val))}
                />
              </Box>

              <Divider />

              <CommentSystem type="recipes" itemId={recipeId} />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Share Recipe</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button variant="contained" color={copySuccess ? 'success' : 'primary'} onClick={handleCopyLink} sx={{ borderRadius: 3, py: 1.2 }}>
              {copySuccess ? '✓ Link Copied!' : '🔗 Copy Link'}
            </Button>
            <Divider sx={{ color: '#9CA3AF', fontSize: 12 }}>OR</Divider>
            <Button variant="outlined" startIcon={<span>📱</span>} onClick={() => handleShare('whatsapp')} sx={{ borderRadius: 3, py: 1.2, justifyContent: 'flex-start' }}>WhatsApp</Button>
            <Button variant="outlined" startIcon={<span>🐦</span>} onClick={() => handleShare('twitter')} sx={{ borderRadius: 3, py: 1.2, justifyContent: 'flex-start' }}>Twitter</Button>
            <Button variant="outlined" startIcon={<span>📘</span>} onClick={() => handleShare('facebook')} sx={{ borderRadius: 3, py: 1.2, justifyContent: 'flex-start' }}>Facebook</Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
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
