// Enhanced Comment System with nested replies, mentions, and optimistic UI
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    TextField,
    Button,
    Avatar,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    Skeleton,
    Select,
    FormControl,
    InputLabel,
    Collapse,
    Divider,
} from '@mui/material';
import {
    Send as SendIcon,
    MoreVert as MoreVertIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Favorite as FavoriteIcon,
    Reply as ReplyIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentSocket } from '../../utils/socket';

const CommentSystem = ({ recipeId, type = 'recipes' }) => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.userLogin);

    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [editText, setEditText] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedComment, setSelectedComment] = useState(null);
    const [replies, setReplies] = useState({});

    const observerTarget = useRef(null);

    // Fetch comments
    const fetchComments = useCallback(async (pageNum = 1, sort = sortBy) => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/${type}/${recipeId}/comments/sorted?sortBy=${sort}&page=${pageNum}&limit=20`,
                {
                    headers: userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {}
                }
            );
            const data = await response.json();

            if (pageNum === 1) {
                setComments(data.comments || []);
            } else {
                setComments(prev => [...prev, ...(data.comments || [])]);
            }

            setHasMore(data.page < data.pages);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    }, [recipeId, type, sortBy, userInfo]);

    // Fetch replies for a comment
    const fetchReplies = async (commentId) => {
        try {
            const response = await fetch(`/api/${type}/${recipeId}/comments/${commentId}/replies`);
            const data = await response.json();
            setReplies(prev => ({ ...prev, [commentId]: data.replies || [] }));
        } catch (error) {
            console.error('Error fetching replies:', error);
        }
    };

    useEffect(() => {
        fetchComments(1, sortBy);
    }, [sortBy, fetchComments]);

    // WebSocket Listeners for Real-time Updates
    useEffect(() => {
        const socket = getCurrentSocket();
        if (!socket) return;

        const handleSocialUpdate = (data) => {
            if (data.itemId === recipeId && data.itemType === type.slice(0, -1)) {
                switch (data.type) {
                    case 'COMMENT':
                        if (data.comment && data.comment.approved) {
                            setComments(prev => {
                                // Don't add if already exists (optimistic UI might have added it)
                                if (prev.some(c => c._id === data.comment._id)) return prev;
                                return [data.comment, ...prev];
                            });
                        }
                        break;
                    case 'COMMENT_LIKE':
                        setComments(prev => prev.map(c =>
                            c._id === data.commentId ? { ...c, likes: data.likes } : c
                        ));
                        break;
                    case 'COMMENT_DELETED':
                        setComments(prev => prev.filter(c => c._id !== data.commentId));
                        break;
                    case 'COMMENT_MODERATED':
                        if (data.action === 'approve') {
                            // If it was already in list but not approved, update it
                            setComments(prev => prev.map(c =>
                                c._id === data.commentId ? { ...c, approved: true } : c
                            ));
                            // If it wasn't in list (for non-admins), we might need to fetch it or just let next refresh handle it
                            // For simplicity, let's refresh if it's an approval of a comment not in list
                            setComments(prev => {
                                if (!prev.some(c => c._id === data.commentId)) {
                                    fetchComments(1, sortBy);
                                }
                                return prev;
                            });
                        } else if (data.action === 'reject') {
                            setComments(prev => prev.filter(c => c._id !== data.commentId));
                        }
                        break;
                    default:
                        break;
                }
            }
        };

        socket.on('SOCIAL_UPDATE', handleSocialUpdate);

        return () => {
            socket.off('SOCIAL_UPDATE', handleSocialUpdate);
        };
    }, [recipeId, type, sortBy, fetchComments]);

    // Infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => prev + 1);
                    fetchComments(page + 1);
                }
            },
            { threshold: 1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, page, fetchComments]);

    // Add comment
    const handleAddComment = async () => {
        if (!commentText.trim() || !userInfo) return;

        // Optimistic UI update
        const tempComment = {
            _id: `temp-${Date.now()}`,
            userId: { _id: userInfo._id, name: userInfo.name, profilePic: userInfo.profilePic },
            text: commentText,
            likes: [],
            createdAt: new Date().toISOString(),
            approved: userInfo.role === 'admin',
            isTemp: true
        };

        setComments(prev => [tempComment, ...prev]);
        setCommentText('');

        try {
            const response = await fetch(`/api/${type}/${recipeId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ text: commentText })
            });

            const data = await response.json();

            // Replace temp comment with real one
            setComments(prev => prev.map(c => c._id === tempComment._id ? data.comment : c));
        } catch (error) {
            console.error('Error adding comment:', error);
            // Remove temp comment on error
            setComments(prev => prev.filter(c => c._id !== tempComment._id));
        }
    };

    // Edit comment
    const handleEditComment = async (commentId) => {
        if (!editText.trim()) return;

        try {
            const response = await fetch(`/api/${type}/${recipeId}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ text: editText })
            });

            const data = await response.json();

            setComments(prev => prev.map(c =>
                c._id === commentId ? { ...c, ...data.comment } : c
            ));

            setEditingComment(null);
            setEditText('');
        } catch (error) {
            console.error('Error editing comment:', error);
        }
    };

    // Delete comment
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        // Optimistic UI update
        setComments(prev => prev.filter(c => c._id !== commentId));

        try {
            await fetch(`/api/${type}/${recipeId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
        } catch (error) {
            console.error('Error deleting comment:', error);
            fetchComments(1, sortBy); // Refresh on error
        }
    };

    // Like comment
    const handleLikeComment = async (commentId) => {
        if (!userInfo) return;

        // Optimistic UI update
        setComments(prev => prev.map(c => {
            if (c._id === commentId) {
                const hasLiked = c.likes?.includes(userInfo._id);
                return {
                    ...c,
                    likes: hasLiked
                        ? c.likes.filter(id => id !== userInfo._id)
                        : [...(c.likes || []), userInfo._id]
                };
            }
            return c;
        }));

        try {
            await fetch(`/api/${type}/${recipeId}/comments/${commentId}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
        } catch (error) {
            console.error('Error liking comment:', error);
            // Revert on error
            fetchComments(1, sortBy);
        }
    };

    // Reply to comment
    const handleReplyToComment = async (parentCommentId, replyText) => {
        if (!replyText.trim() || !userInfo) return;

        try {
            const response = await fetch(`/api/${type}/${recipeId}/comments/${parentCommentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ text: replyText })
            });

            const data = await response.json();

            // Add reply to replies state
            setReplies(prev => ({
                ...prev,
                [parentCommentId]: [...(prev[parentCommentId] || []), data.reply]
            }));

            setReplyingTo(null);
        } catch (error) {
            console.error('Error replying to comment:', error);
        }
    };

    const handleMenuOpen = (event, comment) => {
        setAnchorEl(event.currentTarget);
        setSelectedComment(comment);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedComment(null);
    };

    const CommentItem = ({ comment, isReply = false }) => {
        const [showReplies, setShowReplies] = useState(false);
        const [replyText, setReplyText] = useState('');
        const isOwner = userInfo?._id === comment.userId?._id;
        const hasLiked = comment.likes?.includes(userInfo?._id);
        const commentReplies = replies[comment._id] || [];

        const handleToggleReplies = () => {
            if (!showReplies && commentReplies.length === 0) {
                fetchReplies(comment._id);
            }
            setShowReplies(!showReplies);
        };

        return (
            <Box sx={{ mb: 2, ml: isReply ? 6 : 0 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar src={comment.userId?.profilePic} sx={{ width: 40, height: 40 }}>
                        {comment.userId?.name?.charAt(0)}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {comment.userId?.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        {comment.isEdited && ' (edited)'}
                                    </Typography>
                                </Box>

                                {isOwner && (
                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, comment)}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>

                            {editingComment === comment._id ? (
                                <Box sx={{ mt: 1 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        maxRows={4}
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        inputProps={{ maxLength: 1000 }}
                                        helperText={`${editText.length}/1000`}
                                    />
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        <Button size="small" onClick={() => handleEditComment(comment._id)}>
                                            Save
                                        </Button>
                                        <Button size="small" onClick={() => setEditingComment(null)}>
                                            Cancel
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                    {comment.text || comment.comment}
                                </Typography>
                            )}

                            {!comment.approved && (
                                <Chip label="Pending Approval" size="small" color="warning" sx={{ mt: 1 }} />
                            )}
                        </Box>

                        {/* Action buttons */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, ml: 2 }}>
                            <Button
                                size="small"
                                startIcon={hasLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                onClick={() => handleLikeComment(comment._id)}
                                sx={{ color: hasLiked ? 'error.main' : 'text.secondary' }}
                            >
                                {comment.likes?.length || 0}
                            </Button>

                            {!isReply && (
                                <Button
                                    size="small"
                                    startIcon={<ReplyIcon />}
                                    onClick={() => setReplyingTo(comment._id)}
                                    sx={{ color: 'text.secondary' }}
                                >
                                    Reply
                                </Button>
                            )}

                            {!isReply && commentReplies.length > 0 && (
                                <Button
                                    size="small"
                                    onClick={handleToggleReplies}
                                    sx={{ color: 'primary.main' }}
                                >
                                    {showReplies ? 'Hide' : 'View'} {commentReplies.length} {commentReplies.length === 1 ? 'reply' : 'replies'}
                                </Button>
                            )}
                        </Box>

                        {/* Reply input */}
                        {replyingTo === comment._id && (
                            <Box sx={{ mt: 2, ml: 2, display: 'flex', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                    {userInfo?.name?.charAt(0)}
                                </Avatar>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Write a reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleReplyToComment(comment._id, replyText);
                                            setReplyText('');
                                        }
                                    }}
                                    inputProps={{ maxLength: 1000 }}
                                />
                                <IconButton
                                    color="primary"
                                    onClick={() => {
                                        handleReplyToComment(comment._id, replyText);
                                        setReplyText('');
                                    }}
                                    disabled={!replyText.trim()}
                                >
                                    <SendIcon />
                                </IconButton>
                            </Box>
                        )}

                        {/* Nested replies */}
                        <Collapse in={showReplies}>
                            <Box sx={{ mt: 2 }}>
                                {commentReplies.map(reply => (
                                    <CommentItem key={reply._id} comment={reply} isReply />
                                ))}
                            </Box>
                        </Collapse>
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <Box>
            {/* Sort and filter */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    Comments ({comments.length})
                </Typography>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Sort by</InputLabel>
                    <Select
                        value={sortBy}
                        label="Sort by"
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <MenuItem value="recent">Newest First</MenuItem>
                        <MenuItem value="top">Top Comments</MenuItem>
                        <MenuItem value="oldest">Oldest First</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Add comment */}
            {userInfo && (
                <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                    <Avatar src={userInfo.profilePic} sx={{ width: 40, height: 40 }}>
                        {userInfo.name?.charAt(0)}
                    </Avatar>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Share your thoughts about this recipe..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                            }
                        }}
                        inputProps={{ maxLength: 1000 }}
                        helperText={`${commentText.length}/1000`}
                    />
                    <IconButton
                        color="primary"
                        onClick={handleAddComment}
                        disabled={!commentText.trim()}
                        sx={{ alignSelf: 'flex-start' }}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* Comments list */}
            {loading && page === 1 ? (
                [...Array(3)].map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="30%" />
                            <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
                        </Box>
                    </Box>
                ))
            ) : comments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                        No comments yet. Be the first to comment!
                    </Typography>
                </Box>
            ) : (
                <>
                    {comments.map(comment => (
                        <CommentItem key={comment._id} comment={comment} />
                    ))}

                    {/* Infinite scroll trigger */}
                    <div ref={observerTarget} style={{ height: 20 }} />

                    {loading && page > 1 && (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Loading more comments...
                            </Typography>
                        </Box>
                    )}
                </>
            )}

            {/* Context menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    setEditingComment(selectedComment._id);
                    setEditText(selectedComment.text);
                    handleMenuClose();
                }}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={() => {
                    handleDeleteComment(selectedComment._id);
                    handleMenuClose();
                }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default CommentSystem;
