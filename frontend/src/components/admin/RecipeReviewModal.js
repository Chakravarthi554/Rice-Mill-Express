import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, Chip, Divider, Grid, Card, CardMedia,
  List, ListItem, ListItemText, CircularProgress, Alert,
  Rating, Avatar
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Person as PersonIcon,
  ShoppingBag as ProductIcon
} from '@mui/icons-material';
import { getRecipeDetails } from '../../redux/actions/recipeActions';
import Loader from '../common/Loader';

const RecipeReviewModal = ({ open, onClose, recipeId, onApprove, onReject }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const recipeDetails = useSelector((state) => state.recipeDetails);
  const { recipe, error } = recipeDetails;

  useEffect(() => {
    if (open && recipeId) {
      setLoading(true);
      dispatch(getRecipeDetails(recipeId))
        .finally(() => setLoading(false));
    }
  }, [dispatch, open, recipeId]);

  const handleApprove = () => {
    onApprove(recipeId);
    onClose();
  };

  const handleReject = () => {
    onReject(recipeId);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Recipe Review</Typography>
          {recipe && (
            <Chip 
              label={recipe.status} 
              color={
                recipe.status === 'approved' ? 'success' : 
                recipe.status === 'rejected' ? 'error' : 'warning'
              } 
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && <Loader />}
        {error && <Alert severity="error">{error}</Alert>}
        
        {recipe && !loading && (
          <Box sx={{ mt: 1 }}>
            {/* Recipe Header */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {recipe.image ? (
                  <CardMedia
                    component="img"
                    height="250"
                    image={recipe.image.startsWith('http') ? recipe.image : `${process.env.REACT_APP_API_URL}${recipe.image}`}
                    alt={recipe.title}
                    sx={{ borderRadius: 1, objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 250,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1
                    }}
                  >
                    <Typography color="text.secondary">No Image</Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h4" gutterBottom>
                  {recipe.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip label={recipe.riceType} color="primary" />
                  <Rating value={recipe.averageRating || 0} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({recipe.numReviews || 0} reviews)
                  </Typography>
                </Box>

                {/* Seller Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {recipe.sellerId?.name || 'Unknown Seller'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recipe.sellerId?.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Ingredients */}
            <Typography variant="h6" gutterBottom>Ingredients</Typography>
            <List dense sx={{ mb: 3 }}>
              {recipe.ingredients?.map((ingredient, index) => (
                <ListItem key={index}>
                  <ListItemText primary={`• ${ingredient}`} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 3 }} />

            {/* Steps */}
            <Typography variant="h6" gutterBottom>Cooking Steps</Typography>
            <List sx={{ mb: 3 }}>
              {recipe.steps?.map((step, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={`${index + 1}. ${step}`}
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6 
                      } 
                    }}
                  />
                </ListItem>
              ))}
            </List>

            {/* Linked Products */}
            {recipe.linkedProducts && recipe.linkedProducts.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>Linked Products</Typography>
                <Grid container spacing={2}>
                  {recipe.linkedProducts.map((product) => (
                    <Grid item xs={12} sm={6} key={product._id}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <ProductIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1">{product.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              ₹{product.price} • {product.weight || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* Stats */}
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {recipe.likes?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Likes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {recipe.comments?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {recipe.shares || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Shares
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {recipe.linkedProducts?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Products
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button 
          onClick={handleReject}
          variant="outlined"
          color="error"
          startIcon={<RejectIcon />}
          disabled={loading}
        >
          Reject
        </Button>
        <Button 
          onClick={handleApprove}
          variant="contained"
          color="success"
          startIcon={<ApproveIcon />}
          disabled={loading}
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecipeReviewModal;