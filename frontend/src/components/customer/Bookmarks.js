import React, { useState, useEffect } from 'react';
import {
    Typography, Paper, Box, Grid, Card, CardContent,
    IconButton, CircularProgress, Alert, Divider, Button
} from '@mui/material';
import { BookmarkRemove, Forum, OpenInNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Bookmarks = () => {
    const navigate = useNavigate();
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userInfo } = useSelector(state => state.userLogin);

    const fetchBookmarks = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            };
            const { data } = await axios.get('/api/v1/users/bookmarks', config);
            setBookmarks(data.posts || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch bookmarks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo?.token) {
            fetchBookmarks();
        }
    }, [userInfo]);

    const handleRemoveBookmark = async (postId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            };
            await axios.delete(`/api/v1/users/bookmarks/${postId}`, config);
            setBookmarks(prev => prev.filter(post => post._id !== postId));
        } catch (err) {
            alert('Failed to remove bookmark');
        }
    };

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
                My Bookmarks
            </Typography>

            {bookmarks.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        You haven't bookmarked any forum posts yet
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/forum')}
                    >
                        Explore Forum
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {bookmarks.map((post) => (
                        <Grid item xs={12} key={post._id}>
                            <Card sx={{ display: 'flex', flexDirection: 'column' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Forum color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="h6" component="div">
                                                {post.title}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleRemoveBookmark(post._id)}
                                            title="Remove Bookmark"
                                        >
                                            <BookmarkRemove />
                                        </IconButton>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {post.content}
                                    </Typography>
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            By {post.userId?.name || 'Unknown User'}
                                        </Typography>
                                        <Button
                                            size="small"
                                            onClick={() => navigate(`/forum/post/${post._id}`)}
                                            startIcon={<OpenInNew />}
                                        >
                                            View Full Post
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default Bookmarks;
