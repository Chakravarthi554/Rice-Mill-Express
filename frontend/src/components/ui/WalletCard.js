// WalletCard — premium balance card with gradient + optional reward/referral stats.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import { AccountBalanceWalletOutlined } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Price from '../common/Price';
import { fadeInUp, tap } from '../../theme/animations';
import { radius, shadows } from '../../theme/designTokens';

const MotionBox = motion(Box);

const WalletCard = ({
  balance = 0,
  rewardPoints,
  referralEarnings,
  actionLabel = 'Add Money',
  onAction,
  gradient = 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #4CAF50 100%)',
}) => (
  <MotionBox
    variants={fadeInUp}
    initial="hidden"
    animate="visible"
    sx={{ position: 'relative', borderRadius: `${radius.xl}px`, p: { xs: 2.5, sm: 3 }, color: '#fff', background: gradient, boxShadow: shadows.lg, overflow: 'hidden' }}
  >
    <Box sx={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, position: 'relative' }}>
      <AccountBalanceWalletOutlined />
      <Typography sx={{ fontWeight: 700, opacity: 0.9 }}>Wallet Balance</Typography>
    </Box>
    <Typography sx={{ fontSize: { xs: '2rem', sm: '2.4rem' }, fontWeight: 800, lineHeight: 1, mb: 2, position: 'relative' }}>
      <Price amount={Number(balance)} />
    </Typography>

    {(rewardPoints != null || referralEarnings != null) && (
      <Box sx={{ display: 'flex', gap: 3, mb: 2, position: 'relative' }}>
        {rewardPoints != null && (
          <Box>
            <Typography sx={{ fontSize: '0.72rem', opacity: 0.8 }}>Reward Points</Typography>
            <Typography sx={{ fontWeight: 800 }}>{rewardPoints}</Typography>
          </Box>
        )}
        {referralEarnings != null && (
          <Box>
            <Typography sx={{ fontSize: '0.72rem', opacity: 0.8 }}>Referral Earnings</Typography>
            <Typography sx={{ fontWeight: 800 }}><Price amount={Number(referralEarnings)} /></Typography>
          </Box>
        )}
      </Box>
    )}

    {actionLabel && onAction && (
      <Button
        component={motion.button}
        whileTap={tap}
        onClick={onAction}
        sx={{ bgcolor: '#fff', color: '#1B5E20', fontWeight: 800, position: 'relative', '&:hover': { bgcolor: '#F9FAFB' } }}
      >
        {actionLabel}
      </Button>
    )}
  </MotionBox>
);

WalletCard.propTypes = {
  balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rewardPoints: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  referralEarnings: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  gradient: PropTypes.string,
};

export default WalletCard;
