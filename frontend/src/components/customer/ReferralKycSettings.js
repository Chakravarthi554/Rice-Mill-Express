// frontend/src/components/customer/ReferralKycSettings.js
import React from 'react';
import { Paper, Box, Typography, TextField, Button, Grid } from '@mui/material';
import { Share, ContentCopy } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const ReferralKycSettings = () => {
  const { t, user } = useAuth();
  const referralLink = user?.referralCode ? `${window.location.origin}/register?ref=${user.referralCode}` : '';

  const copy = () => {
    navigator.clipboard.writeText(referralLink);
    alert(t('copied') || 'Copied!');
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t('referralProgram') || 'Referral Program'}</Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1">{t('yourLink') || 'Your Referral Link'}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField fullWidth value={referralLink} size="small" InputProps={{ readOnly: true }} />
          <Button variant="outlined" startIcon={<ContentCopy />} onClick={copy}>{t('copy') || 'Copy'}</Button>
          <Button variant="contained" startIcon={<Share />} onClick={() => navigator.share?.({ url: referralLink })}>
            {t('share') || 'Share'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h5">{user?.referralStats?.referredUsers || 0}</Typography>
            <Typography variant="body2">{t('referred') || 'Referred'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
            <Typography variant="h5">{user?.referralStats?.earnedCredits || 0}</Typography>
            <Typography variant="body2">{t('credits') || 'Credits'}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ReferralKycSettings;