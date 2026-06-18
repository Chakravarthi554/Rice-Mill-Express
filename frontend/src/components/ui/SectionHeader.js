// SectionHeader — consistent section title + optional subtitle and action link.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import { ArrowForwardIos } from '@mui/icons-material';

const SectionHeader = ({ title, subtitle, actionLabel, onAction, icon }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: { xs: 'flex-start', sm: 'center' },
      justifyContent: 'space-between',
      gap: 1,
      mb: 2,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      {icon && <Box sx={{ display: 'flex', color: 'primary.main' }}>{icon}</Box>}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {actionLabel && onAction && (
      <Button
        onClick={onAction}
        endIcon={<ArrowForwardIos sx={{ fontSize: '0.7rem !important' }} />}
        sx={{ flexShrink: 0, color: 'primary.main', fontWeight: 700 }}
      >
        {actionLabel}
      </Button>
    )}
  </Box>
);

SectionHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  icon: PropTypes.node,
};

export default SectionHeader;
