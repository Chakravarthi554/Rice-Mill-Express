// Rating System with distribution chart and interactive rating
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Rating,
    LinearProgress,
    Button,
    Paper,
    Grid,
    Skeleton,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';

const RatingSystem = ({ recipeId, currentUserRating, onRate }) => {
    const [distribution, setDistribution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRating, setUserRating] = useState(currentUserRating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);

    useEffect(() => {
        fetchRatingDistribution();
    }, [recipeId]);

    const fetchRatingDistribution = async () => {
        try {
            const response = await fetch(`/api/recipes/${recipeId}/rating-distribution`);
            const data = await response.json();
            setDistribution(data);
        } catch (error) {
            console.error('Error fetching rating distribution:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (newValue) => {
        setUserRating(newValue);
        if (onRate) {
            onRate(newValue);
        }
    };

    if (loading) {
        return (
            <Box>
                <Skeleton variant="rectangular" height={200} />
            </Box>
        );
    }

    if (!distribution) return null;

    const { averageRating, totalRatings, distribution: dist, percentages } = distribution;

    return (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Ratings & Reviews
            </Typography>

            <Grid container spacing={3}>
                {/* Overall Rating */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h2" fontWeight="bold" color="primary.main">
                            {averageRating.toFixed(1)}
                        </Typography>
                        <Rating
                            value={averageRating}
                            precision={0.1}
                            readOnly
                            size="large"
                            sx={{ my: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
                        </Typography>
                    </Box>
                </Grid>

                {/* Rating Distribution */}
                <Grid item xs={12} md={8}>
                    <Box>
                        {[5, 4, 3, 2, 1].map((star) => (
                            <Box
                                key={star}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    mb: 1.5,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 60 }}>
                                    <Typography variant="body2" sx={{ mr: 0.5 }}>
                                        {star}
                                    </Typography>
                                    <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                </Box>

                                <Box sx={{ flex: 1, position: 'relative' }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={percentages[star] || 0}
                                        sx={{
                                            height: 8,
                                            borderRadius: 1,
                                            bgcolor: 'grey.200',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: 'warning.main',
                                                borderRadius: 1,
                                            },
                                        }}
                                    />
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ minWidth: 60, textAlign: 'right' }}
                                >
                                    {percentages[star]}% ({dist[star]})
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Grid>

                {/* User Rating Input */}
                <Grid item xs={12}>
                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: 'background.default',
                            borderRadius: 2,
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Rate This Recipe
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                            <Rating
                                value={userRating}
                                onChange={(event, newValue) => handleRatingChange(newValue)}
                                onChangeActive={(event, newHover) => setHoveredRating(newHover)}
                                size="large"
                                sx={{
                                    fontSize: '3rem',
                                    '& .MuiRating-iconEmpty': {
                                        color: 'action.disabled',
                                    },
                                }}
                            />
                            <Typography variant="h6" color="text.secondary">
                                {hoveredRating || userRating || 0}/5
                            </Typography>
                        </Box>
                        {userRating > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {currentUserRating ? 'Update your rating' : 'Your rating will be submitted'}
                            </Typography>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default RatingSystem;
