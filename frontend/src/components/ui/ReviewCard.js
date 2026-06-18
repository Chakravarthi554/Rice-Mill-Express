// ReviewCard — customer review with rating, verified badge, and content.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Avatar, Rating as MuiRating } from '@mui/material';
import { Verified } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { staggerItem } from '../../theme/animations';
import { radius, colors } from '../../theme/designTokens';

const MotionBox = motion(Box);

const ReviewCard = ({ name, avatar, rating = 0, date, title, comment, verified = false }) => (
  <MotionBox
    variants={staggerItem}
    sx={{ bgcolor: 'background.paper', borderRadius: `${radius.md}px`, border: '1px solid', borderColor: 'divider', p: 2 }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
      <Avatar src={avatar} alt={name}>{!avatar && name ? name.charAt(0) : null}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }} noWrap>{name}</Typography>
          {verified && <Verified sx={{ fontSize: 15, color: colors.success }} aria-label="Verified purchase" />}
        </Box>
        {date && <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>{date}</Typography>}
      </Box>
    </Box>
    <MuiRating value={Number(rating)} precision={0.5} size="small" readOnly sx={{ mb: 0.5 }} />
    {title && <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.25 }}>{title}</Typography>}
    {comment && <Typography sx={{ fontSize: '0.83rem', color: 'text.secondary', lineHeight: 1.5 }}>{comment}</Typography>}
  </MotionBox>
);

ReviewCard.propTypes = {
  name: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  rating: PropTypes.number,
  date: PropTypes.string,
  title: PropTypes.string,
  comment: PropTypes.string,
  verified: PropTypes.bool,
};

export default ReviewCard;
