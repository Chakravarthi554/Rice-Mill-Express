// Instagram-style Like Button with animation
import React, { useState } from 'react';
import { IconButton, Typography, Box, Tooltip } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { keyframes } from '@mui/system';

const heartBeat = keyframes`
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(1.1); }
  75% { transform: scale(1.25); }
  100% { transform: scale(1); }
`;

const LikeButton = ({
    itemId,
    initialLikes = 0,
    initialHasLiked = false,
    onLike,
    size = 'medium',
    showCount = true
}) => {
    const [likes, setLikes] = useState(initialLikes);
    const [hasLiked, setHasLiked] = useState(initialHasLiked);
    const [isAnimating, setIsAnimating] = useState(false);

    const formatLikeCount = (count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    const handleLike = async () => {
        // Optimistic UI update
        const newHasLiked = !hasLiked;
        const newLikes = newHasLiked ? likes + 1 : likes - 1;

        setHasLiked(newHasLiked);
        setLikes(newLikes);
        setIsAnimating(true);

        setTimeout(() => setIsAnimating(false), 600);

        // Call parent callback
        if (onLike) {
            try {
                await onLike(itemId, newHasLiked);
            } catch (error) {
                // Revert on error
                setHasLiked(!newHasLiked);
                setLikes(newHasLiked ? newLikes - 1 : newLikes + 1);
            }
        }
    };

    const getLikeTooltip = () => {
        if (likes === 0) return 'Be the first to like';
        if (hasLiked && likes === 1) return 'You liked this';
        if (hasLiked) return `You and ${likes - 1} ${likes - 1 === 1 ? 'other' : 'others'}`;
        return `${likes} ${likes === 1 ? 'like' : 'likes'}`;
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={getLikeTooltip()} arrow>
                <IconButton
                    onClick={handleLike}
                    size={size}
                    sx={{
                        color: hasLiked ? 'error.main' : 'action.active',
                        animation: isAnimating ? `${heartBeat} 0.6s ease-in-out` : 'none',
                        transition: 'color 0.2s',
                        '&:hover': {
                            bgcolor: hasLiked ? 'error.light' : 'action.hover',
                            color: hasLiked ? 'error.dark' : 'error.main',
                        },
                    }}
                >
                    {hasLiked ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
            </Tooltip>

            {showCount && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        fontWeight: hasLiked ? 600 : 400,
                        minWidth: 30,
                    }}
                >
                    {formatLikeCount(likes)}
                </Typography>
            )}
        </Box>
    );
};

export default LikeButton;
