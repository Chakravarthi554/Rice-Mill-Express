import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Avatar,
    IconButton,
    TextField,
    Button,
    Stack,
    Collapse,
    Chip
} from '@mui/material';
import {
    Favorite,
    FavoriteBorder,
    Reply,
    MoreVert,
    Flag
} from '@mui/icons-material';
import { likeComment, replyToComment } from '../../redux/actions/socialActions';
import { formatDistanceToNow } from 'date-fns';

const CommentItem = ({ comment, recipeId, depth = 0 }) => {
    const dispatch = useDispatch();
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyText, setReplyText] = useState('');

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const handleLike = () => {
        if (!userInfo) return;
        dispatch(likeComment('recipes', recipeId, comment._id));
    };

    const handleReply = () => {
        if (!replyText.trim()) return;
        dispatch(replyToComment('recipes', recipeId, comment._id, replyText));
        setReplyText('');
        setReplyOpen(false);
    };

    const isLiked = comment.likes && userInfo && comment.likes.includes(userInfo._id);
    const likeCount = comment.likes ? comment.likes.length : 0;

    // Recursive rendering for nested replies
    // Note: The backend returns a flat list of comments with parentComment field.
    // We need to filter replies from the main list in the parent component, 
    // OR we can fetch replies for this comment if they are not loaded.
    // For now, let's assume the parent component passes `replies` prop if we want to render them here,
    // but typically with a flat list, we render them in the main list.
    // However, the requirement is "Reply threads - nested replies".
    // If the backend returns a flat list, we need to organize them into a tree in the parent component.

    // Let's assume `comment` object has a `replies` array if we organize them in the parent.
    // Or we can fetch them.

    // For this implementation, I'll assume the parent component (RecipeDetail) organizes the comments into a tree structure
    // and passes the `replies` array in the `comment` object.

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/default_avatar.jpg';
        if (imagePath.startsWith('http')) return imagePath;
        return `${process.env.REACT_APP_API_URL}/uploads/${imagePath}`;
    };

    return (
        <Box sx={{ mb: 2, ml: depth * 4 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                    src={getImageUrl(comment.user?.profilePic || comment.userId?.profilePic)}
                    alt={comment.user?.name || comment.userId?.name}
                    sx={{ width: 32, height: 32 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" fontWeight="bold">
                                {comment.user?.name || comment.userId?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                            </Typography>
                        </Stack>

                        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                            {/* Highlight mentions */}
                            {comment.text?.split(/(@\w+)/g).map((part, i) => (
                                part.startsWith('@') ? (
                                    <Typography component="span" key={i} color="primary" fontWeight="bold">
                                        {part}
                                    </Typography>
                                ) : part
                            ))}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5, ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton size="small" onClick={handleLike} color={isLiked ? 'error' : 'default'}>
                                {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                            </IconButton>
                            {likeCount > 0 && (
                                <Typography variant="caption" fontWeight="bold">
                                    {likeCount}
                                </Typography>
                            )}
                        </Box>

                        <Button
                            size="small"
                            startIcon={<Reply fontSize="small" />}
                            onClick={() => setReplyOpen(!replyOpen)}
                            sx={{ textTransform: 'none', color: 'text.secondary' }}
                        >
                            Reply
                        </Button>
                    </Stack>

                    <Collapse in={replyOpen}>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={`Reply to ${comment.user?.name || comment.userId?.name}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                multiline
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleReply}
                                disabled={!replyText.trim()}
                            >
                                Send
                            </Button>
                        </Box>
                    </Collapse>

                    {/* Render nested replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply._id}
                                    comment={reply}
                                    recipeId={recipeId}
                                    depth={depth + 1}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            </Stack>
        </Box>
    );
};

export default CommentItem;
