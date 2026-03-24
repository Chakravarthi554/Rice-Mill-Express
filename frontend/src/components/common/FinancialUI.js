import React from 'react';
import { Box, Chip, Typography, Divider } from '@mui/material';

export const PaymentStatusChip = ({ status }) => {
  const statusConfig = {
    completed: { color: 'success', label: 'Completed' },
    paid: { color: 'success', label: 'Paid' },
    pending: { color: 'warning', label: 'Pending' },
    failed: { color: 'error', label: 'Failed' },
    refunded: { color: 'info', label: 'Refunded' },
    partially_refunded: { color: 'info', label: 'Partial Refund' },
    unpaid: { color: 'warning', label: 'Unpaid' },
  };

  const normalized = String(status || '').toLowerCase();
  const config = statusConfig[normalized] || { color: 'default', label: status || 'Unknown' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

export const PayoutStatusChip = ({ status }) => {
  const statusConfig = {
    completed: { color: 'success', label: 'Paid' },
    pending: { color: 'warning', label: 'Pending' },
    processing: { color: 'info', label: 'Processing' },
    failed: { color: 'error', label: 'Failed' },
    rejected: { color: 'error', label: 'Rejected' },
  };

  const normalized = String(status || '').toLowerCase();
  const config = statusConfig[normalized] || { color: 'default', label: status || 'Unknown' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

export const PriceBreakdown = ({
  rows = [],
  totalLabel = 'Total',
  totalValue = 0,
  dense = false,
}) => (
  <Box sx={{ p: dense ? 1.5 : 2, bgcolor: 'grey.50', borderRadius: 1.5 }}>
    {rows.map((row) => (
      <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="body2" color={row.color || 'text.secondary'}>
          {row.label}
        </Typography>
        <Typography variant="body2" color={row.color || 'text.primary'} fontWeight={row.bold ? 600 : 400}>
          {typeof row.value === 'number' ? `₹${row.value.toLocaleString('en-IN')}` : row.value}
        </Typography>
      </Box>
    ))}
    <Divider sx={{ my: 1 }} />
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="subtitle2" fontWeight={700}>{totalLabel}</Typography>
      <Typography variant="subtitle2" fontWeight={700}>
        ₹{Number(totalValue || 0).toLocaleString('en-IN')}
      </Typography>
    </Box>
  </Box>
);
