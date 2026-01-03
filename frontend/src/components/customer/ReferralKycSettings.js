// frontend/src/components/customer/ReferralKycSettings.js
import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, TextField, Button, Grid, CircularProgress, Alert } from '@mui/material';
import { Share, ContentCopy } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { getReferrals } from '../../redux/actions/userActions';

const ReferralKycSettings = () => {
  const { t, user } = useAuth();
  const dispatch = useDispatch();
  const [stats, setStats] = useState({ referredUsers: 0, earnedCredits: 0 });

  const [referralCode, setReferralCode] = useState(user?.referralCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIXED: Fetch referrals on mount with proper error handling
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dispatch(getReferrals());
        if (data) {
          if (data.stats) setStats(data.stats);
          if (data.referralCode) setReferralCode(data.referralCode);
          else if (user?.referralCode) setReferralCode(user.referralCode);
        }
      } catch (err) {
        console.error('Failed to fetch referrals:', err);
        setError(err.message || 'Failed to load referral data');
        // Fallback to user data if available
        if (user?.referralCode) setReferralCode(user.referralCode);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [dispatch, user]);
  const referralLink = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : 'Loading...';

  const copy = () => {
    navigator.clipboard.writeText(referralLink);
    alert(t('copied') || 'Copied!');
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t('referralProgram') || 'Referral Program'}</Typography>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1">{t('yourLink') || 'Your Referral Link'}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField 
            fullWidth 
            value={referralLink} 
            size="small" 
            InputProps={{ readOnly: true }} 
            disabled={loading}
          />
          <Button 
            variant="outlined" 
            startIcon={<ContentCopy />} 
            onClick={copy}
            disabled={loading || !referralCode}
          >
            {t('copy') || 'Copy'}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Share />} 
            onClick={() => navigator.share?.({ url: referralLink })}
            disabled={loading || !referralCode}
          >
            {t('share') || 'Share'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h5">{stats.referredUsers || 0}</Typography>
            <Typography variant="body2">{t('referred') || 'Referred'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
            <Typography variant="h5">{stats.earnedCredits || 0}</Typography>
            <Typography variant="body2">{t('credits') || 'Credits'}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ReferralKycSettings;