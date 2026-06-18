// RecipeCard — social-commerce recipe card with engagement stats.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton, Avatar } from '@mui/material';
import {
  FavoriteBorder, Favorite, ChatBubbleOutline, BookmarkBorder, Bookmark,
  PlayCircleOutline, AccessTime,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { radius, shadows, colors } from '../../theme/designTokens';

const MotionBox = motion(Box);

const Stat = ({ icon, value }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, color: 'text.secondary' }}>
    {icon}
    <Typography sx={{ fontSize: '0.74rem', fontWeight: 600 }}>{value}</Typography>
  </Box>
);
Stat.propTypes = { icon: PropTypes.node, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) };

const RecipeCard = ({
  title, image, author, authorAvatar, cookTime, hasVideo = false,
  likes = 0, comments = 0, liked = false, saved = false,
  onClick, onLike, onComment, onSave,
}) => (
  <MotionBox
    whileHover={{ y: -5, boxShadow: shadows.xl }}
    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    sx={{ bgcolor: 'background.paper', borderRadius: `${radius.lg}px`, border: '1px solid', borderColor: 'divider', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', height: '100%' }}
    onClick={onClick}
    role="group"
    aria-label={title}
  >
    <Box sx={{ position: 'relative', pt: '62%', bgcolor: '#F9FAFB' }}>
      {image && <Box component="img" src={image} alt={title} loading="lazy" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      {hasVideo && (
        <PlayCircleOutline sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 52, color: '#fff', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
      )}
      {cookTime && (
        <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', px: 1, py: 0.4, borderRadius: `${radius.pill}px` }}>
          <AccessTime sx={{ fontSize: 14 }} />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>{cookTime}</Typography>
        </Box>
      )}
    </Box>

    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {title}
      </Typography>
      {author && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Avatar src={authorAvatar} alt={author} sx={{ width: 24, height: 24 }} />
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600 }} noWrap>{author}</Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <IconButton size="small" aria-label={liked ? 'Unlike' : 'Like'} onClick={(e) => { e.stopPropagation(); onLike && onLike(); }}>
            {liked ? <Favorite sx={{ fontSize: 18, color: colors.error }} /> : <FavoriteBorder sx={{ fontSize: 18 }} />}
          </IconButton>
          <Stat icon={null} value={likes} />
          <IconButton size="small" aria-label="Comments" onClick={(e) => { e.stopPropagation(); onComment && onComment(); }}>
            <ChatBubbleOutline sx={{ fontSize: 18 }} />
          </IconButton>
          <Stat icon={null} value={comments} />
        </Box>
        <IconButton size="small" aria-label={saved ? 'Unsave' : 'Save'} onClick={(e) => { e.stopPropagation(); onSave && onSave(); }}>
          {saved ? <Bookmark sx={{ fontSize: 18, color: colors.primary.main }} /> : <BookmarkBorder sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>
    </Box>
  </MotionBox>
);

RecipeCard.propTypes = {
  title: PropTypes.string.isRequired,
  image: PropTypes.string,
  author: PropTypes.string,
  authorAvatar: PropTypes.string,
  cookTime: PropTypes.string,
  hasVideo: PropTypes.bool,
  likes: PropTypes.number,
  comments: PropTypes.number,
  liked: PropTypes.bool,
  saved: PropTypes.bool,
  onClick: PropTypes.func,
  onLike: PropTypes.func,
  onComment: PropTypes.func,
  onSave: PropTypes.func,
};

export default RecipeCard;
