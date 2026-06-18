// NotificationCard — categorized notification row with unread indicator.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton, Avatar } from '@mui/material';
import {
  ShoppingBagOutlined, PaymentsOutlined, CardGiftcardOutlined,
  RestaurantMenuOutlined, ForumOutlined, LocalOfferOutlined, SettingsOutlined,
  Close,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { staggerItem } from '../../theme/animations';
import { tints, colors, radius } from '../../theme/designTokens';

const MotionBox = motion(Box);

const CATEGORY = {
  orders: { icon: ShoppingBagOutlined, color: colors.primary.main, tint: tints.green },
  payments: { icon: PaymentsOutlined, color: colors.info, tint: tints.blue },
  rewards: { icon: CardGiftcardOutlined, color: colors.accent.dark, tint: tints.amber },
  recipes: { icon: RestaurantMenuOutlined, color: '#7C3AED', tint: tints.purple },
  community: { icon: ForumOutlined, color: colors.info, tint: tints.blue },
  offers: { icon: LocalOfferOutlined, color: colors.error, tint: tints.red },
  system: { icon: SettingsOutlined, color: colors.neutral[700], tint: tints.green },
};

const NotificationCard = ({ category = 'system', title, message, time, unread = false, onClick, onDismiss }) => {
  const c = CATEGORY[category] || CATEGORY.system;
  const Icon = c.icon;
  return (
    <MotionBox
      variants={staggerItem}
      onClick={onClick}
      role="listitem"
      sx={{
        display: 'flex', gap: 1.5, p: 1.5, borderRadius: `${radius.md}px`, cursor: onClick ? 'pointer' : 'default',
        bgcolor: unread ? c.tint : 'background.paper', border: '1px solid', borderColor: unread ? `${c.color}22` : 'divider',
        transition: 'background 0.2s ease', '&:hover': { bgcolor: c.tint },
      }}
    >
      <Avatar sx={{ bgcolor: c.tint, color: c.color, width: 40, height: 40 }}>
        <Icon sx={{ fontSize: 20 }} />
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }} noWrap>{title}</Typography>
          {unread && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />}
        </Box>
        {message && (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {message}
          </Typography>
        )}
        {time && <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.25 }}>{time}</Typography>}
      </Box>
      {onDismiss && (
        <IconButton size="small" aria-label="Dismiss notification" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      )}
    </MotionBox>
  );
};

NotificationCard.propTypes = {
  category: PropTypes.oneOf(['orders', 'payments', 'rewards', 'recipes', 'community', 'offers', 'system']),
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  time: PropTypes.string,
  unread: PropTypes.bool,
  onClick: PropTypes.func,
  onDismiss: PropTypes.func,
};

export default NotificationCard;
