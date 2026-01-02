import React, { useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Rating,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
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
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        My Reviews
      </Typography>

      {reviews.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            You haven't reviewed any products yet
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {reviews.map((review, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ display: 'flex', height: '100%' }}>
                {review.productImage && (
                  <CardMedia
                    component="img"
                    sx={{ width: 120, objectFit: 'cover' }}
                    image={review.productImage}
                    alt={review.productName}
                  />
                )}
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {review.productName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={review.rating || 0} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {review.rating}/5
                    </Typography>
                  </Box>
                  {review.comment && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {review.comment}
                    </Typography>
                  )}
                  {review.createdAt && (
                    <Chip
                      label={new Date(review.createdAt).toLocaleDateString()}
                      size="small"
                      variant="outlined"
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