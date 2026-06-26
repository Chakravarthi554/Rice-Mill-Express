import React, { useEffect } from 'react';
import {
  Typography, Paper, Box, Rating, CircularProgress,
  Alert, Card, CardContent, CardMedia, Grid, Chip
} from '@mui/material';
import { Star } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Reviews = () => {
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const { userInfo } = useSelector(state => state.userLogin);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        const { data } = await axios.get('/api/users/reviews', config);
        setReviews(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    if (userInfo?.token) {
      fetchReviews();
    }
  }, [userInfo]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Star sx={{ color: '#F59E0B', fontSize: 24 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
          My Reviews
        </Typography>
      </Box>

      {reviews.length === 0 ? (
        <Paper sx={{ p: 5, borderRadius: 4, textAlign: 'center', border: '1px dashed #E5E7EB', bgcolor: '#FFFBEB' }}>
          <Star sx={{ fontSize: 48, color: '#F59E0B', mb: 1 }} />
          <Typography sx={{ color: '#9CA3AF' }}>You haven't reviewed any products yet</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {reviews.map((review, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{
                display: 'flex', borderRadius: 4, overflow: 'hidden',
                border: '1px solid #F3F4F6', bgcolor: '#FFFFFE',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                '&:hover': { boxShadow: '0 8px 20px rgba(0,0,0,0.08)' },
              }}>
                {review.productImage && (
                  <CardMedia
                    component="img"
                    sx={{ width: 120, objectFit: 'cover', flexShrink: 0 }}
                    image={review.productImage}
                    alt={review.productName}
                  />
                )}
                <CardContent sx={{ flex: 1, py: 2.5, px: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                    {review.productName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={review.rating || 0} readOnly size="small" sx={{ color: '#F59E0B' }} />
                    <Typography variant="body2" sx={{ ml: 1, fontWeight: 600, color: '#6B7280' }}>
                      {review.rating}/5
                    </Typography>
                  </Box>
                  {review.comment && (
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 1, lineHeight: 1.6 }}>
                      {review.comment}
                    </Typography>
                  )}
                  {review.createdAt && (
                    <Chip
                      label={new Date(review.createdAt).toLocaleDateString()}
                      size="small"
                      sx={{ borderRadius: 2, bgcolor: '#F3F4F6', color: '#6B7280', fontWeight: 600, fontSize: 11 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Reviews;
