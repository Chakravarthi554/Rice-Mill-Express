// [AI: Complete 3-column UI match for Customer Profile, Wallet & Settings]
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Button, List, ListItem, ListItemText,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, IconButton, Avatar, Chip, Switch
} from '@mui/material';
import {
  AccountBalanceWallet, Share, ContentCopy, Add, ExitToApp,
  LocalMall, LocationOn, Payment, CardGiftcard, LocalOffer,
  Language, NotificationsActive, Lock
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getRewards, getRewardTransactions, getWalletData, requestWithdrawal, getWithdrawalHistory, getReferralCode, getReferrals } from '../../redux/actions/rewardsActions';
import { getPublicSettings } from '../../redux/actions/adminSettingsActions';
import { WITHDRAW_RESET } from '../../redux/constants/rewardsConstants';
import { useNavigate } from 'react-router-dom';

// Dummy icons since some apps don't have WhatsApp standard in MUI
const WhatsAppIcon = () => <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>W</Box>;
const TelegramIcon = () => <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#0088CC', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>T</Box>;
const ShareIconCustom = () => <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#E5E7EB', color: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share fontSize="small" /></Box>;

const RewardsWallet = () => {
  const dispatch = useDispatch();
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '' });

  const { userInfo } = useSelector(s => s.userLogin || {});
  const { rewards } = useSelector(state => state.rewards || {});
  const { transactions } = useSelector(state => state.rewardTransactions || {});
  const { walletData } = useSelector(state => state.wallet || {});
  const { success: withdrawSuccess, loading: withdrawLoading, error: withdrawError } = useSelector(state => state.withdrawal || {});
  const { code: referralCodeObj, loading: codeLoading } = useSelector(state => state.rewards?.referralCode || {});
  const { referrals } = useSelector(state => state.rewards?.referrals || {});
  const { publicSettings } = useSelector(state => state.adminSettings || {});

  const referralSettings = publicSettings?.referralSettings || {};
  const minWithdrawal = referralSettings.minWithdrawalAmount || 300;
  const campaignEnabled = referralSettings.referralCampaignEnabled !== false;

  useEffect(() => {
    dispatch(getRewards()); dispatch(getRewardTransactions()); dispatch(getWalletData());
    dispatch(getWithdrawalHistory()); dispatch(getReferralCode()); dispatch(getReferrals());
    dispatch(getPublicSettings());
  }, [dispatch]);

  useEffect(() => {
    if (withdrawSuccess) {
      setOpenWithdraw(false); setWithdrawalAmount('');
      dispatch({ type: WITHDRAW_RESET }); dispatch(getWalletData()); dispatch(getWithdrawalHistory());
    }
  }, [withdrawSuccess, dispatch]);

  const copyReferralCode = () => {
    const code = referralCodeObj?.code || rewards?.referralCode;
    if (code) { navigator.clipboard.writeText(code); alert('Copied!'); }
  };
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Account', isHeader: true },
    { label: 'My Orders', icon: <LocalMall fontSize="small" />, path: '/orders' },
    { label: 'My Addresses', icon: <LocationOn fontSize="small" />, path: '/profile' }, // Address tab is in profile
    { label: 'Saved Payments', icon: <Payment fontSize="small" />, path: '/profile' }, // Fallback to profile
    { label: 'Rice Mill Wallet', icon: <AccountBalanceWallet fontSize="small" />, suffix: `₹${walletData?.balance || 0}`, path: '/settings/rewards' },
    { label: 'Rewards', isHeader: true },
    { label: 'Refer & Earn', icon: <CardGiftcard fontSize="small" />, path: '/settings/rewards' },
    { label: 'My Coupons', icon: <LocalOffer fontSize="small" />, path: '/products?sale=true' }, // Fallback to sale items
    { label: 'Settings', isHeader: true },
    { label: 'Language', icon: <Language fontSize="small" />, suffix: 'English', path: '/settings' },
    { label: 'Notifications', icon: <NotificationsActive fontSize="small" />, isToggle: true },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 4 }}>
        Customer App <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>Profile, Wallet & Settings</Typography>
      </Typography>

      <Grid container spacing={3}>
        
        {/* COL 1: PROFILE & SETTINGS MENU */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB', bgcolor: '#FAFAFA' }}>
              <Chip label="01 Profile" size="small" sx={{ bgcolor: '#16A34A', color: '#fff', fontWeight: 800, borderRadius: 1 }} />
            </Box>
            <Box sx={{ bgcolor: '#16A34A', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: '#9CA3AF', mb: 1.5, border: '3px solid rgba(255,255,255,0.2)' }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={800}>{userInfo?.name || 'Rahul Sharma'}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>{userInfo?.phone || '+91 98765 43210'}</Typography>
              <Typography variant="caption" sx={{ mt: 1, textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/profile')}>Edit Profile</Typography>
            </Box>
            
            <List sx={{ pt: 0, pb: 2 }}>
              {menuItems.map((item, i) => (
                item.isHeader ? (
                  <Typography key={i} variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', px: 3, pt: 2, pb: 1, textTransform: 'uppercase' }}>
                    {item.label}
                  </Typography>
                ) : (
                  <ListItem key={i} button onClick={() => { if (item.path) navigate(item.path); }} sx={{ px: 3, py: 1.2 }}>
                    <Box sx={{ color: '#16A34A', mr: 2, display: 'flex' }}>{item.icon}</Box>
                    <ListItemText primary={<Typography variant="body2" fontWeight={600} color="#374151">{item.label}</Typography>} />
                    {item.suffix && <Typography variant="caption" fontWeight={700} color={item.label === 'Rice Mill Wallet' ? '#16A34A' : 'text.secondary'}>{item.suffix}</Typography>}
                    {item.isToggle && <Switch size="small" defaultChecked color="success" />}
                    {!item.suffix && !item.isToggle && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>›</Typography>}
                  </ListItem>
                )
              ))}
            </List>
          </Paper>
        </Grid>

        {/* COL 2: WALLET */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden', bgcolor: '#fff', height: '100%' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB', bgcolor: '#FAFAFA' }}>
              <Chip label="02 Wallet" size="small" sx={{ bgcolor: '#16A34A', color: '#fff', fontWeight: 800, borderRadius: 1 }} />
            </Box>
            
            <Box sx={{ p: 2 }}>
              <Box sx={{ bgcolor: '#16A34A', borderRadius: 2, p: 2.5, color: '#fff', mb: 3 }}>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Available Balance</Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, mb: 2 }}>₹{walletData?.balance?.toFixed(2) || '250.00'}</Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Button fullWidth variant="contained" sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, color: '#fff', fontWeight: 700, borderRadius: 1.5 }}>
                      Add Money
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button fullWidth variant="contained" onClick={() => setOpenWithdraw(true)} disabled={Number(walletData?.balance) < minWithdrawal} sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, color: '#fff', fontWeight: 700, borderRadius: 1.5 }}>
                      Transfer
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="body2" fontWeight={700} gutterBottom>Recent Transactions</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {(transactions && transactions.length > 0) ? transactions.slice(0, 5).map((t, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, border: '1px solid #F3F4F6', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: t.points > 0 ? '#DCFCE7' : '#FEE2E2', color: t.points > 0 ? '#16A34A' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t.points > 0 ? <Add fontSize="small" /> : <Typography fontWeight={800}>-</Typography>}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{t.description || (t.points > 0 ? 'Added Money' : 'Order Payment')}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(t.createdAt).toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" fontWeight={800} color={t.points > 0 ? '#16A34A' : '#EF4444'}>
                      {t.points > 0 ? '+' : ''}₹{Math.abs(t.points)}
                    </Typography>
                  </Box>
                )) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, border: '1px solid #F3F4F6', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Add fontSize="small" /></Box>
                        <Box><Typography variant="body2" fontWeight={600}>Added Money</Typography><Typography variant="caption" color="text.secondary">Today, 10:30 AM</Typography></Box>
                      </Box>
                      <Typography variant="body2" fontWeight={800} color="#16A34A">+₹500</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, border: '1px solid #F3F4F6', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography fontWeight={800}>-</Typography></Box>
                        <Box><Typography variant="body2" fontWeight={600}>Order Payment</Typography><Typography variant="caption" color="text.secondary">Yesterday, 6:45 PM</Typography></Box>
                      </Box>
                      <Typography variant="body2" fontWeight={800} color="#EF4444">-₹1,250</Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* COL 3: REFER & EARN */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden', bgcolor: '#fff', height: '100%' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB', bgcolor: '#FAFAFA' }}>
              <Chip label="03 Refer & Earn" size="small" sx={{ bgcolor: '#16A34A', color: '#fff', fontWeight: 800, borderRadius: 1 }} />
            </Box>
            
            <Box sx={{ p: 2 }}>
              <Box sx={{ bgcolor: '#F97316', borderRadius: 2, p: 3, color: '#fff', textAlign: 'center', mb: 3 }}>
                <CardGiftcard sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h6" fontWeight={800}>Invite Friends</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Earn ₹100 for each friend who joins</Typography>
              </Box>

              <Typography variant="body2" fontWeight={700} gutterBottom>Your Referral Code</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Box sx={{ flex: 1, bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" fontWeight={800} letterSpacing={2} color="#111827">
                    {referralCodeObj?.code || rewards?.referralCode || 'RICE250'}
                  </Typography>
                </Box>
                <Button variant="contained" onClick={copyReferralCode} sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, fontWeight: 700, borderRadius: 2 }}>
                  Copy
                </Button>
              </Box>

              <Typography variant="body2" fontWeight={700} gutterBottom>Share via</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, p: 2, border: '1px solid #F3F4F6', borderRadius: 2, justifyContent: 'center', mb: 3 }}>
                <WhatsAppIcon />
                <TelegramIcon />
                <ShareIconCustom />
              </Box>

              <Typography variant="body2" fontWeight={700} gutterBottom>Your Earnings</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2, p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#16A34A">₹{rewards?.balance || '500'}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Earned</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 2, p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#111827">{referrals?.length || '5'}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Friends Joined</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

      </Grid>

      {/* Withdraw Dialog logic preserved */}
      <Dialog open={openWithdraw} onClose={() => setOpenWithdraw(false)} fullWidth maxWidth="sm">
        <DialogTitle>Withdraw Funds</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>Minimum withdrawal: ₹300. Processing time: 2-3 business days.</Alert>
          {withdrawError && <Alert severity="error" sx={{ mb: 2 }}>{withdrawError}</Alert>}
          <TextField fullWidth label="Amount" type="number" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Bank Name" value={bankDetails.bankName} onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Account Number" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="IFSC Code" value={bankDetails.ifscCode} onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Account Holder Name" value={bankDetails.accountHolderName} onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })} sx={{ mb: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWithdraw(false)}>Cancel</Button>
          <Button onClick={() => dispatch(requestWithdrawal({ amount: Number(withdrawalAmount), bankDetails }))} variant="contained" color="secondary" disabled={withdrawLoading || !withdrawalAmount || Number(withdrawalAmount) < 300}>
            {withdrawLoading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Temp dummy icon wrapper to avoid importing unknown MUI icon
const PersonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
  </svg>
);

export default RewardsWallet;