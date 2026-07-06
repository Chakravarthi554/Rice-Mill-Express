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

import { getCurrentSocket } from '../../utils/socket';

const RatingSystem = ({ type = 'recipes', itemId, currentUserRating, onRate }) => {
    const [distribution, setDistribution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRating, setUserRating] = useState(currentUserRating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);

    const fetchRatingDistribution = React.useCallback(async () => {
        try {
            const response = await fetch(`/api/v1/social/${type}/${itemId}/rating-distribution`);
            const data = await response.json();
            setDistribution(data);
        } catch (error) {
            console.error('Error fetching rating distribution:', error);
        } finally {
            setLoading(false);
        }
    }, [itemId, type]);

    useEffect(() => {
        fetchRatingDistribution();
    }, [fetchRatingDistribution]);

    useEffect(() => {
        const socket = getCurrentSocket();
        if (!socket) return;

        const handleRatingUpdate = (data) => {
            if (data.itemId === itemId && data.type === 'RATING_UPDATED') {
                setDistribution({
                    averageRating: data.rating,
                    totalRatings: data.numReviews,
                    distribution: data.distribution,
                    percentages: Object.keys(data.distribution).reduce((acc, star) => {
                        acc[star] = Math.round((data.distribution[star] / data.numReviews) * 100) || 0;
                        return acc;
                    }, {})
                });
            }
        };

        socket.on('SOCIAL_UPDATE', handleRatingUpdate);
        return () => socket.off('SOCIAL_UPDATE', handleRatingUpdate);
    }, [itemId]);

    const handleRatingChange = async (newValue) => {
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

    const averageRating = distribution.averageRating || 0;
    const totalRatings = distribution.totalRatings || 0;
    const dist = distribution.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const percentages = distribution.percentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
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
                            {(averageRating || 0).toFixed(1)}
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
