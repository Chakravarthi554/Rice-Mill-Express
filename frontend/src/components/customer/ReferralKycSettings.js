import React, { useState, useEffect } from 'react';
import {
  Paper, Box, Typography, TextField, Button, Grid,
  CircularProgress, Alert, Card, CardContent, Divider,
  Avatar, List, ListItem, ListItemIcon, ListItemText,
  Chip, IconButton, Tooltip
} from '@mui/material';
import {
  Share, ContentCopy, CardGiftcard, People,
  CheckCircle, Pending, Info, Forward
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { getReferrals, getReferralCode } from '../../redux/actions/rewardsActions';

const ReferralKycSettings = () => {
  const { t, user } = useAuth();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const referralCodeState = useSelector((state) => state.rewards?.referralCode || { code: null });
  const { code } = referralCodeState;

  const referralState = useSelector((state) => state.rewards?.referrals || { referrals: [] });
  const { referrals } = referralState;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        dispatch(getReferralCode());
        dispatch(getReferrals());
      } catch (err) {
        setError("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const referralCode = (typeof code === 'object' ? code?.code : code) || user?.referralCode || 'NOTSET';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    // You could add a snackbar here
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Join Rice Mill',
        text: `Join Rice Mill and get rewards! Use my referral code: ${referralCode}`,
        url: referralLink,
      });
    } catch (err) {
      // Fallback or ignore
    }
  };

  const steps = [
    { text: 'Share your code with friends', icon: <Share color="primary" /> },
    { text: 'They make their first purchase', icon: <CardGiftcard color="secondary" /> },
    { text: 'You both get reward points!', icon: <CheckCircle color="success" /> }
  ];

  if (loading && !code) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <People color="success" /> Refer & Earn
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Left Side: Code & Info */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
            color: 'white',
            borderRadius: 3,
            mb: 3
          }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <CardGiftcard sx={{ fontSize: 60, mb: 1, opacity: 0.9 }} />
              <Typography variant="h5" fontWeight="bold">Invite & Earn</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>
                Share your code and earn points for every friend who joins and shops.
              </Typography>

              <Box sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                p: 2,
                borderRadius: 2,
                border: '1px dashed rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                mb: 3
              }}>
                <Typography variant="h4" fontWeight="bold" sx={{ letterSpacing: 4 }}>
                  {referralCode}
                </Typography>
                <Tooltip title="Copy Link">
                  <IconButton onClick={copyToClipboard} sx={{ color: 'white' }}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Box>

              <Button
                variant="contained"
                color="inherit"
                fullWidth
                startIcon={<Share />}
                onClick={handleShare}
                sx={{
                  bgcolor: 'white',
                  color: '#2e7d32',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                Share Now
              </Button>
            </CardContent>
          </Card>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              How it works?
            </Typography>
            <List>
              {steps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <ListItem sx={{ px: 0 }}>
                    <Avatar sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', mr: 2 }}>
                      <Typography color="success.main" fontWeight="bold">{idx + 1}</Typography>
                    </Avatar>
                    <ListItemText primary={step.text} />
                  </ListItem>
                  {idx < steps.length - 1 && <Divider component="li" variant="inset" sx={{ ml: 7 }} />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Right Side: Referrals List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ borderRadius: 3, p: 0, overflow: 'hidden', height: '100%' }} variant="outlined">
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
              <Typography variant="h6" fontWeight="bold">
                My Referrals ({referrals?.length || 0})
              </Typography>
            </Box>
            <List sx={{ pb: 0 }}>
              {referrals && referrals.length > 0 ? referrals.map((ref, idx) => (
                <React.Fragment key={idx}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: '#eee' }}><People sx={{ color: '#666' }} /></Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={ref.referredUser?.name || 'User'}
                      secondary={`Joined on ${new Date(ref.createdAt).toLocaleDateString()}`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <Chip
                      label={ref.status === 'completed' ? 'Rewarded' : 'Pending'}
                      size="small"
                      icon={ref.status === 'completed' ? <CheckCircle /> : <Pending />}
                      color={ref.status === 'completed' ? 'success' : 'default'}
                    />
                  </ListItem>
                  {idx < referrals.length - 1 && <Divider component="li" variant="inset" />}
                </React.Fragment>
              )) : (
                <Box sx={{ p: 10, textAlign: 'center' }}>
                  <People sx={{ fontSize: 64, color: '#eee', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No referrals yet.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Invite your friends to start earning!
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReferralKycSettings;
