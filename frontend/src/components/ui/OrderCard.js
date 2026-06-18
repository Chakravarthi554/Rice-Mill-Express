// OrderCard — Amazon-style order summary card with status + actions.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, AvatarGroup, Avatar, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import StatusChip from './StatusChip';
import Price from '../common/Price';
import { radius, shadows } from '../../theme/designTokens';

const MotionBox = motion(Box);

const OrderCard = ({
  orderId,
  date,
  status,
  total,
  items = [],
  onViewDetails,
  onReorder,
  onTrack,
  onSupport,
}) => (
  <MotionBox
    whileHover={{ y: -3, boxShadow: shadows.md }}
    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    sx={{ bgcolor: 'background.paper', borderRadius: `${radius.lg}px`, border: '1px solid', borderColor: 'divider', p: 2 }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Order #{orderId}</Typography>
        {date && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{date}</Typography>}
      </Box>
      {status && <StatusChip status={status} />}
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
      <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 44, height: 44, borderRadius: `${radius.sm}px` } }}>
        {items.map((it, i) => (
          <Avatar key={i} variant="rounded" src={it.image} alt={it.name || 'item'} sx={{ borderRadius: `${radius.sm}px` }} />
        ))}
      </AvatarGroup>
      {total != null && (
        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}><Price amount={Number(total)} /></Typography>
      )}
    </Box>

    <Divider sx={{ mb: 1.5 }} />

    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {onViewDetails && <Button size="small" variant="contained" color="primary" onClick={onViewDetails}>View Details</Button>}
      {onTrack && <Button size="small" variant="outlined" color="primary" onClick={onTrack}>Track</Button>}
      {onReorder && <Button size="small" variant="text" color="primary" onClick={onReorder}>Reorder</Button>}
      {onSupport && <Button size="small" variant="text" onClick={onSupport}>Support</Button>}
    </Box>
  </MotionBox>
);

OrderCard.propTypes = {
  orderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  date: PropTypes.string,
  status: PropTypes.string,
  total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  items: PropTypes.array,
  onViewDetails: PropTypes.func,
  onReorder: PropTypes.func,
  onTrack: PropTypes.func,
  onSupport: PropTypes.func,
};

export default OrderCard;
