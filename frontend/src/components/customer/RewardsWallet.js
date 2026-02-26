import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button,
  Tabs, Tab, List, ListItem, ListItemText, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, CircularProgress, IconButton, Tooltip,
  Avatar, Chip, Stack
} from '@mui/material';
import {
  CardGiftcard, AccountBalanceWallet, Group,
  History, Payment, Share, ContentCopy,
  TrendingUp, TrendingDown, CheckCircle, Pending
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  getRewards,
  getRewardTransactions,
  getWalletData,
  requestWithdrawal,
  getWithdrawalHistory,
  getReferralCode,
  getReferrals
} from '../../redux/actions/rewardsActions';
import { getPublicSettings } from '../../redux/actions/adminSettingsActions';
import { WITHDRAW_RESET } from '../../redux/constants/rewardsConstants';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const RewardsWallet = () => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  const { rewards, loading: rewardsLoading } = useSelector(state => state.rewards || {});
  const { transactions, loading: transLoading } = useSelector(state => state.rewardTransactions || {});
  const { walletData, loading: walletLoading } = useSelector(state => state.wallet || {});
  const { success: withdrawSuccess, error: withdrawError, loading: withdrawLoading } = useSelector(state => state.withdrawal || {});
  const { withdrawals, loading: historyLoading } = useSelector(state => state.withdrawalHistory || {});
  const { code: referralCodeObj, loading: codeLoading } = useSelector(state => state.rewards?.referralCode || {});
  const { referrals } = useSelector(state => state.rewards?.referrals || {});
  const { publicSettings } = useSelector(state => state.adminSettings || {});

  const referralSettings = publicSettings?.referralSettings || {};
  const minWithdrawal = referralSettings.minWithdrawalAmount || 300;
  const campaignEnabled = referralSettings.referralCampaignEnabled !== false;

  useEffect(() => {
    dispatch(getRewards());
    dispatch(getRewardTransactions());
    dispatch(getWalletData());
    dispatch(getWithdrawalHistory());
    dispatch(getReferralCode());
    dispatch(getReferrals());
    dispatch(getPublicSettings());
  }, [dispatch]);

  useEffect(() => {
    if (withdrawSuccess) {
      setOpenWithdraw(false);
      setWithdrawalAmount('');
      dispatch({ type: WITHDRAW_RESET });
      dispatch(getWalletData());
      dispatch(getWithdrawalHistory());
    }
  }, [withdrawSuccess, dispatch]);

  const handleWithdrawalSubmit = () => {
    dispatch(requestWithdrawal({
      amount: Number(withdrawalAmount),
      bankDetails
    }));
  };

  const copyReferralCode = () => {
    const codeToCopy = referralCodeObj?.code || rewards?.referralCode;
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Rewards & Wallet
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="overline">Reward Points</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {rewards?.rewardsBalance || rewards?.balance || 0}
                  </Typography>
                </Box>
                <CardGiftcard sx={{ fontSize: 48, opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="overline">Wallet Balance</Typography>
                  <Typography variant="h3" fontWeight="bold">
                    ₹{walletData?.balance || 0}
                  </Typography>
                </Box>
                <AccountBalanceWallet sx={{ fontSize: 48, opacity: 0.8 }} />
              </Stack>
              <Button
                variant="contained"
                onClick={() => setOpenWithdraw(true)}
                disabled={Number(walletData?.balance) < minWithdrawal}
                sx={{ mt: 1, bgcolor: 'white', color: 'secondary.main', '&:hover': { bgcolor: '#eee' } }}
              >
                Withdraw Cash
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: campaignEnabled ? 'info.main' : 'grey.500', color: 'white' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="overline">Referral Code</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ letterSpacing: 2 }}>
                    {campaignEnabled ? (referralCodeObj?.code || rewards?.referralCode || (codeLoading ? 'LOADING...' : '...')) : 'DISABLED'}
                  </Typography>
                </Box>
                {campaignEnabled && (
                  <IconButton onClick={copyReferralCode} sx={{ color: 'white' }}>
                    <ContentCopy />
                  </IconButton>
                )}
              </Stack>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {campaignEnabled ? 'Share with friends to earn more!' : 'The referral program is currently inactive.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab icon={<History />} label="Points History" />
          <Tab icon={<Payment />} label="Withdrawals" />
          <Tab icon={<Group />} label="My Referrals" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {transLoading ? <CircularProgress /> : (
            <List>
              {transactions?.length > 0 ? transactions.map((t, i) => (
                <React.Fragment key={i}>
                  <ListItem>
                    <ListItemText
                      primary={t.description}
                      secondary={new Date(t.createdAt).toLocaleDateString()}
                    />
                    <Typography color={t.points > 0 ? 'success.main' : 'error.main'} fontWeight="bold">
                      {t.points > 0 ? '+' : ''}{t.points} pts
                    </Typography>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              )) : <Typography align="center" sx={{ py: 3 }}>No transactions found</Typography>}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {historyLoading ? <CircularProgress /> : (
            <List>
              {withdrawals?.length > 0 ? withdrawals.map((w, i) => (
                <React.Fragment key={i}>
                  <ListItem>
                    <ListItemText
                      primary={`₹${w.amount}`}
                      secondary={`${new Date(w.createdAt).toLocaleDateString()} - ${w.bankDetails?.bankName}`}
                    />
                    <Chip
                      label={w.status.toUpperCase()}
                      color={w.status === 'completed' ? 'success' : w.status === 'pending' ? 'warning' : 'error'}
                      size="small"
                      icon={w.status === 'completed' ? <CheckCircle /> : w.status === 'pending' ? <Pending /> : null}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              )) : <Typography align="center" sx={{ py: 3 }}>No withdrawal history found</Typography>}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <List>
            {referrals?.length > 0 ? referrals.map((r, i) => (
              <React.Fragment key={i}>
                <ListItem>
                  <ListItemText
                    primary={r.referredUser?.name || 'User'}
                    secondary={`Joined on ${new Date(r.createdAt).toLocaleDateString()}`}
                  />
                  <Chip
                    label={r.status === 'completed' ? 'Rewarded' : 'Pending'}
                    color={r.status === 'completed' ? 'success' : 'default'}
                    size="small"
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            )) : <Typography align="center" sx={{ py: 3 }}>No referrals yet. Start inviting!</Typography>}
          </List>
        </TabPanel>
      </Paper>

      {/* Withdraw Dialog */}
      <Dialog open={openWithdraw} onClose={() => setOpenWithdraw(false)} fullWidth maxWidth="sm">
        <DialogTitle>Withdraw Funds</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Minimum withdrawal: ₹300. Processing time: 2-3 business days.
          </Alert>
          {withdrawError && <Alert severity="error" sx={{ mb: 2 }}>{withdrawError}</Alert>}
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Bank Name"
            value={bankDetails.bankName}
            onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Account Number"
            value={bankDetails.accountNumber}
            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="IFSC Code"
            value={bankDetails.ifscCode}
            onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Account Holder Name"
            value={bankDetails.accountHolderName}
            onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWithdraw(false)}>Cancel</Button>
          <Button
            onClick={handleWithdrawalSubmit}
            variant="contained"
            color="secondary"
            disabled={withdrawLoading || !withdrawalAmount || Number(withdrawalAmount) < 300}
          >
            {withdrawLoading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RewardsWallet;