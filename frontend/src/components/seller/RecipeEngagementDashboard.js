import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Grid, Card, CardContent, Avatar, Badge,
    List, ListItem, ListItemAvatar, ListItemText, Divider,
    Chip, Button, IconButton, Tab, Tabs, LinearProgress,
    Tooltip, Paper, useTheme, Alert, Stack
} from '@mui/material';
import {
    Favorite as LikeIcon,
    Comment as CommentIcon,
    Share as ShareIcon,
    Star as StarIcon,
    TrendingUp as TrendIcon,
    AccessTime as TimeIcon,
    MoreVert as MoreIcon,
    ArrowForward as DetailsIcon,
    ThumbUp as PositiveIcon,
    ThumbDown as NegativeIcon,
    Help as NeutralIcon,
    Refresh as RefreshIcon,
    CheckCircle as OnlineIcon,
    Error as OfflineIcon,
    Add as AddIcon
} from '@mui/icons-material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import SubmitRecipeDialog from './SubmitRecipeDialog';

const COLORS = ['#4caf50', '#ff9800', '#f44336']; // Positive, Neutral, Negative

const RecipeEngagementDashboard = ({ sellerId, recipes = [] }) => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0); // 0: Activity, 1: Trends, 2: Recipes
    const [overview, setOverview] = useState(null);
    const [trends, setTrends] = useState({ likes: [], comments: [], shares: [] });
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecipeDetails, setSelectedRecipeDetails] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

    const { userInfo } = useSelector((state) => state.userLogin);

    const fetchData = useCallback(async () => {
        if (!userInfo) return;

        try {
            setLoading(true);
            setError(null);

            const [ov, tr, ac] = await Promise.all([
                api.get('/api/seller/engagement/overview'),
                api.get('/api/seller/engagement/trends?period=7days'),
                api.get('/api/seller/engagement/activity')
            ]);

            setOverview(ov.data);
            setTrends(tr.data);
            setActivities(ac.data);
            setIsOnline(true);
        } catch (err) {
            console.error('Failed to fetch engagement data:', err);
            setError(err.response?.data?.message || 'Failed to connect to engagement services');
            setIsOnline(false);
        } finally {
            setLoading(false);
        }
    }, [userInfo]);

    useEffect(() => {
        fetchData();

        const handleNewEngagement = (event) => {
            const data = event.detail;
            console.log('Real-time Engagement payload:', data);

            // Safer recipe title lookup
            const recipeIdStr = data.itemId?.toString();
            const targetRecipe = recipes.find(r => r._id?.toString() === recipeIdStr);
            const recipeTitle = targetRecipe?.title || 'Selected Recipe';

            // 1. Update activity feed
            setActivities(prev => [
                {
                    type: data.engagementType,
                    id: Date.now(),
                    content: data.comment?.content || (data.engagementType === 'comment' ? data.content : ''),
                    user: {
                        name: data.userName || 'Customer',
                        profilePic: data.userProfilePic
                    },
                    targetId: data.itemId,
                    recipeTitle: recipeTitle,
                    createdAt: data.createdAt || new Date(),
                    sentiment: data.sentiment || (data.engagementType === 'comment' ? 'neutral' : undefined)
                },
                ...prev.slice(0, 19)
            ]);

            // 2. Update overview metrics
            setOverview(prev => {
                if (!prev) return prev;
                const newMetrics = { ...prev.metrics };

                if (data.counts) {
                    if (data.counts.likes !== undefined) newMetrics.likes = data.counts.likes;
                    if (data.counts.comments !== undefined) newMetrics.comments = data.counts.comments;
                    if (data.counts.shares !== undefined) newMetrics.shares = data.counts.shares;
                    if (data.counts.rating !== undefined) newMetrics.averageRating = data.counts.rating;
                } else {
                    if (data.engagementType === 'like') newMetrics.likes++;
                    if (data.engagementType === 'comment') newMetrics.comments++;
                    if (data.engagementType === 'share') newMetrics.shares++;
                    if (data.engagementType === 'rating') {
                        // Incremental rating update is hard without full data, but we can increment count if we had it
                        newMetrics.numReviews = (newMetrics.numReviews || 0) + 1;
                    }
                }
                return { ...prev, metrics: newMetrics };
            });
        };

        window.addEventListener('ENGAGEMENT_UPDATE', handleNewEngagement);
        window.addEventListener('socialUpdate', handleNewEngagement); // Compatibility

        return () => {
            window.removeEventListener('ENGAGEMENT_UPDATE', handleNewEngagement);
            window.removeEventListener('socialUpdate', handleNewEngagement);
        };
    }, [recipes, fetchData]);

    const formatTrendData = () => {
        const dates = [...new Set([
            ...(trends.likes || []).map(d => d._id),
            ...(trends.comments || []).map(d => d._id),
            ...(trends.shares || []).map(d => d._id)
        ])].sort();

        if (dates.length === 0) return [];

        return dates.map(date => ({
            date: date.split('-').slice(1).join('/'),
            likes: trends.likes?.find(d => d._id === date)?.count || 0,
            comments: trends.comments?.find(d => d._id === date)?.count || 0,
            shares: trends.shares?.find(d => d._id === date)?.count || 0
        }));
    };

    const getStatusChip = () => (
        <Chip
            icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
            label={isOnline ? "Services Online" : "Services Offline"}
            color={isOnline ? "success" : "error"}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
        />
    );

    if (loading && !overview) {
        return (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <LinearProgress />
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Loading real-time engagement data...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 3 }}>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6">Engagement Dashboard</Typography>
                    {getStatusChip()}
                </Stack>
                <Stack direction="row" spacing={1}>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={fetchData}
                        disabled={loading}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                    >
                        Sync
                    </Button>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setSubmitDialogOpen(true)}
                        size="small"
                        variant="contained"
                        sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, fontWeight: 700, borderRadius: 2 }}
                    >
                        Submit Recipe
                    </Button>
                </Stack>
            </Box>

            <SubmitRecipeDialog
                open={submitDialogOpen}
                onClose={() => setSubmitDialogOpen(false)}
                onSuccess={() => {
                    fetchData();
                    // Optionally notify parent SellerDashboard too if needed
                }}
            />

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }} action={
                    <Button color="inherit" size="small" onClick={fetchData}>Retry</Button>
                }>
                    {error}
                </Alert>
            )}

            {/* Header Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : '#f0f4ff', borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LikeIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                                <Typography variant="subtitle2" color="textSecondary">Total Likes</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">{overview?.metrics?.likes || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : '#fff8f0', borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CommentIcon color="secondary" sx={{ mr: 1, fontSize: 20 }} />
                                <Typography variant="subtitle2" color="textSecondary">Total Comments</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">{overview?.metrics?.comments || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : '#f6fff6', borderLeft: `4px solid ${theme.palette.success.main}` }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <StarIcon sx={{ color: '#ffc107', mr: 1, fontSize: 20 }} />
                                <Typography variant="subtitle2" color="textSecondary">Average Rating</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography variant="h4" fontWeight="bold">{overview?.metrics?.averageRating?.toFixed(1) || '0.0'}</Typography>
                                <Typography variant="caption" color="textSecondary">/ 5.0</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : '#f0faff', borderLeft: `4px solid ${theme.palette.info.main}` }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ShareIcon color="info" sx={{ mr: 1, fontSize: 20 }} />
                                <Typography variant="subtitle2" color="textSecondary">Total Shares</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">{overview?.metrics?.shares || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Tabs */}
            <Paper sx={{ mb: 4, borderRadius: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth" textColor="primary" indicatorColor="primary">
                    <Tab label="Activity Feed" icon={<TimeIcon />} iconPosition="start" />
                    <Tab label="Trends" icon={<TrendIcon />} iconPosition="start" />
                    <Tab label="All Recipes" icon={<DetailsIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Tab Panels */}
            {tabValue === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <OnlineIcon color="success" sx={{ fontSize: 18 }} />
                                Real-time Interaction Feed
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                                {activities.length === 0 && !loading && (
                                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                        <Typography variant="body1">No interactions yet.</Typography>
                                        <Typography variant="caption">Grow your audience by sharing more amazing recipes!</Typography>
                                    </Box>
                                )}
                                {activities.map((activity, idx) => (
                                    <React.Fragment key={activity.id || idx}>
                                        <ListItem alignItems="flex-start" sx={{
                                            borderLeft: idx === 0 ? `4px solid ${theme.palette.primary.main}` : 'none',
                                            bgcolor: idx === 0 ? 'rgba(33, 150, 243, 0.03)' : 'inherit',
                                            transition: 'background 0.3s'
                                        }}>
                                            <ListItemAvatar>
                                                <Avatar src={activity.user?.profilePic} alt={activity.user?.name}>
                                                    {activity.user?.name?.charAt(0)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="subtitle2" component="div">
                                                            <strong>{activity.user?.name}</strong>
                                                            {activity.type === 'like' && ' liked '}
                                                            {activity.type === 'comment' && ' commented on '}
                                                            {activity.type === 'rating' && ` rated ${activity.rating} stars on `}
                                                            {activity.type === 'share' && ' shared '}
                                                            <Typography component="span" color="primary.main" fontWeight="bold"> {activity.recipeTitle}</Typography>
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 1 }}>
                                                        {activity.content && (
                                                            <Typography variant="body2" sx={{
                                                                color: 'text.secondary',
                                                                borderLeft: '3px solid #eee',
                                                                pl: 1.5,
                                                                py: 0.5,
                                                                mb: 1,
                                                                bgcolor: '#fafafa'
                                                            }}>
                                                                {activity.content}
                                                            </Typography>
                                                        )}
                                                        {activity.sentiment && (
                                                            <Chip
                                                                size="small"
                                                                icon={activity.sentiment === 'positive' ? <PositiveIcon /> : activity.sentiment === 'negative' ? <NegativeIcon /> : <NeutralIcon />}
                                                                label={activity.sentiment.toUpperCase()}
                                                                color={activity.sentiment === 'positive' ? 'success' : activity.sentiment === 'negative' ? 'error' : 'default'}
                                                                sx={{ height: 18, fontSize: '0.6rem' }}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        <Divider variant="inset" component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Popular Recipes</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {recipes.length === 0 ? <Typography variant="caption">Submit recipes to see analytics.</Typography> :
                                recipes.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0)).slice(0, 6).map((recipe, idx) => (
                                    <Box key={recipe._id} sx={{ mb: 2.5, p: 1.5, borderRadius: 2, border: '1px solid #f0f0f0', transition: 'all 0.2s', '&:hover': { transform: 'translateX(5px)', borderColor: 'primary.light', bgcolor: 'rgba(33, 150, 243, 0.02)' } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>{recipe.title}</Typography>
                                            <Badge badgeContent={`#${idx + 1}`} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }} />
                                        </Box>
                                        <Stack direction="row" spacing={2}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LikeIcon sx={{ fontSize: 14, mr: 0.5, color: '#f44336' }} />
                                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{recipe.likesCount || 0}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <StarIcon sx={{ fontSize: 14, mr: 0.5, color: '#ffc107' }} />
                                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{recipe.averageRating?.toFixed(1) || '0.0'}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CommentIcon sx={{ fontSize: 14, mr: 0.5, color: '#2196f3' }} />
                                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{recipe.commentsCount || 0}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                ))}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {tabValue === 1 && (
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">Engagement Trends (Last 7 Days)</Typography>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ w: 10, h: 10, borderRadius: '50%', bgcolor: '#4caf50' }} /><Typography variant="caption">Likes</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ w: 10, h: 10, borderRadius: '50%', bgcolor: '#ff9800' }} /><Typography variant="caption">Comments</Typography></Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ w: 10, h: 10, borderRadius: '50%', bgcolor: '#2196f3' }} /><Typography variant="caption">Shares</Typography></Box>
                        </Stack>
                    </Box>
                    <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={formatTrendData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <ChartTooltip
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="likes" stroke="#4caf50" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="comments" stroke="#ff9800" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="shares" stroke="#2196f3" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            )}

            {tabValue === 2 && (
                <Grid container spacing={2}>
                    {recipes.length === 0 ? (
                        <Grid item xs={12}>
                            <Alert severity="info">You haven't submitted any approved recipes yet. Engagement data will appear here once your recipes are live.</Alert>
                        </Grid>
                    ) : recipes.map(recipe => (
                        <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                            <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }, borderRadius: 3, border: '1px solid #F3F4F6' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                                {recipe.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Submitted: {new Date(recipe.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Typography>
                                        </Box>
                                        <Tooltip title="Detailed Analytics">
                                            <IconButton size="small" color="primary" sx={{ bgcolor: 'rgba(59, 130, 246, 0.05)' }}>
                                                <DetailsIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                    <Divider sx={{ my: 1.5, opacity: 0.6 }} />
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.3, fontWeight: 600 }}>Rating</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <StarIcon sx={{ fontSize: 16, color: '#ffc107' }} />
                                                <Typography variant="body2" fontWeight={700}>
                                                    {recipe.averageRating?.toFixed(1) || '0.0'}
                                                    <Typography component="span" variant="caption" color="textSecondary" sx={{ fontWeight: 'normal', ml: 0.5 }}>
                                                        ({recipe.numReviews || 0})
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.3, fontWeight: 600 }}>Likes</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <LikeIcon sx={{ fontSize: 16, color: '#f44336' }} />
                                                <Typography variant="body2" fontWeight={700}>{recipe.likesCount || 0}</Typography>
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.3, fontWeight: 600 }}>Comments</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CommentIcon sx={{ fontSize: 16, color: '#8B5CF6' }} />
                                                <Typography variant="body2" fontWeight={700}>{recipe.commentsCount || 0}</Typography>
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.3, fontWeight: 600 }}>Shares</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <ShareIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
                                                <Typography variant="body2" fontWeight={700}>{recipe.sharesCount || 0}</Typography>
                                            </Box>
                                        </Box>
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

export default RecipeEngagementDashboard;
