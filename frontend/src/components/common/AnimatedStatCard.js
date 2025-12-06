import React from 'react';
import { Card, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.25)',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  transition: 'all 0.3s',
  '&:hover': { transform: 'translateY(-5px) scale(1.02)', boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.5)' },
}));

const AnimatedStatCard = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
    <StyledCard sx={{ p: 3, textAlign: 'center' }}>
      <Icon sx={{ fontSize: 48, color, mb: 2 }} />
      <Typography variant="h4" sx={{ color, fontWeight: 'bold', mb: 1 }}>{value}</Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>{title}</Typography>
      {trend !== undefined && (
        <Typography variant="body2" sx={{ color: trend > 0 ? '#4caf50' : '#f44336' }}>
          {trend > 0 ? `+${trend}%` : `${trend}%`} from last month
        </Typography>
      )}
    </StyledCard>
  </motion.div>
);

export default AnimatedStatCard;