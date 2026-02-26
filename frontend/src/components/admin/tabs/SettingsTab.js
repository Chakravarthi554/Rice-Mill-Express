import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Divider,
  Alert,
  Snackbar,
  MenuItem,
  InputAdornment,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  LocalShipping as ShippingIcon,
  Festival as FestivalIcon,
  Restaurant as RecipeIcon,
  Build as MaintenanceIcon,
  Support as SupportIcon,
  Refresh as ResetIcon,
  Send as SendIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAdminSettings,
  updateAdminSettings,
  sendBulkNotification,
  getAvailableRecipes,
  resetAdminSettings
} from '../../../redux/actions/adminSettingsActions';

const SettingsTab = () => {
  const dispatch = useDispatch();
  const { settings, loading, error } = useSelector(state => state.adminSettings);
  const { recipes } = useSelector(state => state.adminSettings.availableRecipes || {});

  const [formData, setFormData] = useState({});
  const [notification, setNotification] = useState({ title: '', message: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [notificationDialog, setNotificationDialog] = useState(false);

  useEffect(() => {
    dispatch(getAdminSettings());
    dispatch(getAvailableRecipes());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (path, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSaveSettings = () => {
    dispatch(updateAdminSettings(formData))
      .then(() => {
        showSnackbar('Settings updated successfully!', 'success');
      })
      .catch(err => {
        showSnackbar(err.message || 'Failed to update settings', 'error');
      });
  };

  const handleSendNotification = () => {
    if (!notification.title || !notification.message) {
      showSnackbar('Title and message are required', 'error');
      return;
    }

    dispatch(sendBulkNotification(notification))
      .then(() => {
        setNotification({ title: '', message: '' });
        setNotificationDialog(false);
        showSnackbar('Notification sent to all users!', 'success');
      })
      .catch(err => {
        showSnackbar(err.message || 'Failed to send notification', 'error');
      });
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      dispatch(resetAdminSettings())
        .then(() => {
          showSnackbar('Settings reset to default!', 'success');
        })
        .catch(err => {
          showSnackbar(err.message || 'Failed to reset settings', 'error');
        });
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading && !settings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Platform Settings
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ResetIcon />}
          onClick={handleResetSettings}
          color="warning"
        >
          Reset to Default
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Commission & Payment Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                💰 Commission & Payments
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Platform Commission Rate"
                type="number"
                value={formData.platformCommissionRate || ''}
                onChange={(e) => handleInputChange('platformCommissionRate', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                margin="normal"
                helperText="Percentage taken by platform from each order (5-30%)"
              />

              <TextField
                fullWidth
                label="Seller Commission"
                type="number"
                value={formData.sellerCommission || ''}
                onChange={(e) => handleInputChange('sellerCommission', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                margin="normal"
                helperText="Percentage received by seller (70-95%)"
              />

              <TextField
                fullWidth
                label="COD Limit per Order"
                type="number"
                value={formData.codLimit || ''}
                onChange={(e) => handleInputChange('codLimit', Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                margin="normal"
                helperText="Maximum amount allowed for Cash on Delivery orders"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ShippingIcon sx={{ mr: 1 }} />
                Delivery Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Free Delivery Threshold"
                type="number"
                value={formData.freeDeliveryThreshold || ''}
                onChange={(e) => handleInputChange('freeDeliveryThreshold', Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                margin="normal"
                helperText="Order amount above which delivery is free"
              />

              <TextField
                fullWidth
                label="Delivery Fee"
                type="number"
                value={formData.deliveryFee || ''}
                onChange={(e) => handleInputChange('deliveryFee', Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                margin="normal"
                helperText="Standard delivery charge for orders below threshold"
              />

              <TextField
                fullWidth
                label="Minimum Order Value"
                type="number"
                value={formData.minOrderValue || ''}
                onChange={(e) => handleInputChange('minOrderValue', Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                margin="normal"
                helperText="Minimum amount required to place an order"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Festival Mode */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <FestivalIcon sx={{ mr: 1 }} />
                Festival Mode
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.festivalMode?.enabled || false}
                    onChange={(e) => handleInputChange('festivalMode.enabled', e.target.checked)}
                  />
                }
                label="Enable Festival Mode"
              />

              {formData.festivalMode?.enabled && (
                <>
                  <TextField
                    fullWidth
                    label="Festival Name"
                    value={formData.festivalMode?.name || ''}
                    onChange={(e) => handleInputChange('festivalMode.name', e.target.value)}
                    margin="normal"
                    placeholder="e.g., Diwali Sale, Pongal Special"
                  />

                  <TextField
                    fullWidth
                    label="Banner Text"
                    value={formData.festivalMode?.bannerText || ''}
                    onChange={(e) => handleInputChange('festivalMode.bannerText', e.target.value)}
                    margin="normal"
                    placeholder="Special festival message for users"
                  />

                  <TextField
                    fullWidth
                    label="Extra Discount"
                    type="number"
                    value={formData.festivalMode?.extraDiscount || ''}
                    onChange={(e) => handleInputChange('festivalMode.extraDiscount', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    margin="normal"
                    helperText="Additional discount applied during festival"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recipe of the Day */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <RecipeIcon sx={{ mr: 1 }} />
                Recipe of the Day
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                select
                label="Select Recipe of the Day"
                value={formData.recipeOfTheDay || ''}
                onChange={(e) => handleInputChange('recipeOfTheDay', e.target.value)}
                margin="normal"
                helperText="Featured recipe shown on home page"
              >
                <MenuItem value="">None</MenuItem>
                {recipes?.map(recipe => (
                  <MenuItem key={recipe._id} value={recipe._id}>
                    {recipe.title} ({recipe.riceType})
                  </MenuItem>
                ))}
              </TextField>

              {formData.recipeOfTheDay && recipes?.find(r => r._id === formData.recipeOfTheDay) && (
                <Box mt={1} p={1} bgcolor="success.light" borderRadius={1}>
                  <Typography variant="body2" color="success.dark">
                    Selected: {recipes.find(r => r._id === formData.recipeOfTheDay)?.title}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Mode */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <MaintenanceIcon sx={{ mr: 1 }} />
                Maintenance Mode
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.maintenanceMode?.enabled || false}
                    onChange={(e) => handleInputChange('maintenanceMode.enabled', e.target.checked)}
                  />
                }
                label="Enable Maintenance Mode"
              />

              {formData.maintenanceMode?.enabled && (
                <TextField
                  fullWidth
                  label="Maintenance Message"
                  multiline
                  rows={3}
                  value={formData.maintenanceMode?.message || ''}
                  onChange={(e) => handleInputChange('maintenanceMode.message', e.target.value)}
                  margin="normal"
                  helperText="Message shown to users when app is in maintenance"
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Support Contact */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SupportIcon sx={{ mr: 1 }} />
                Support Contact
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Support Email"
                type="email"
                value={formData.supportContact?.email || ''}
                onChange={(e) => handleInputChange('supportContact.email', e.target.value)}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Support Phone"
                value={formData.supportContact?.phone || ''}
                onChange={(e) => handleInputChange('supportContact.phone', e.target.value)}
                margin="normal"
              />

              <TextField
                fullWidth
                label="WhatsApp Number"
                value={formData.supportContact?.whatsapp || ''}
                onChange={(e) => handleInputChange('supportContact.whatsapp', e.target.value)}
                margin="normal"
                helperText="Numbers shown in customer help section"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Auto-Approval Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ Auto-Approval Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoApproveRecipes || false}
                    onChange={(e) => handleInputChange('autoApproveRecipes', e.target.checked)}
                  />
                }
                label="Auto-approve Recipes"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                When enabled, new recipes are automatically approved without manual review
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoApproveForumPosts || false}
                    onChange={(e) => handleInputChange('autoApproveForumPosts', e.target.checked)}
                  />
                }
                label="Auto-approve Forum Posts"
              />
              <Typography variant="body2" color="text.secondary">
                When enabled, new forum posts are automatically approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Push Notification */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                Push Notification
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setNotificationDialog(true)}
                fullWidth
              >
                Send Notification to All Users
              </Button>

              {formData.pushNotification?.title && (
                <Box mt={2} p={1} bgcolor="info.light" borderRadius={1}>
                  <Typography variant="body2">
                    <strong>Last Sent:</strong> {formData.pushNotification?.title}
                  </Typography>
                  <Typography variant="caption">
                    {formData.pushNotification?.message}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Referral & Rewards Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CardGiftcard sx={{ mr: 1 }} />
                Referral & Rewards
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.referralCampaignEnabled !== false}
                    onChange={(e) => handleInputChange('referralCampaignEnabled', e.target.checked)}
                  />
                }
                label="Enable Referral Program"
                sx={{ mb: 1 }}
              />

              <TextField
                fullWidth
                label="Referrer Reward"
                type="number"
                value={formData.referralRewardReferrer || ''}
                onChange={(e) => handleInputChange('referralRewardReferrer', Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                margin="normal"
                helperText="Amount credited to the person who refers a new user"
                disabled={formData.referralCampaignEnabled === false}
              />

              <TextField
                fullWidth
                label="Referee Reward"
                type="number"
                value={formData.referralRewardReferee || ''}
                onChange={(e) => handleInputChange('referralRewardReferee', Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                margin="normal"
                helperText="Welcome bonus for the user who signs up using a code"
                disabled={formData.referralCampaignEnabled === false}
              />

              <TextField
                fullWidth
                label="Minimum Withdrawal Amount"
                type="number"
                value={formData.minWithdrawalAmount || ''}
                onChange={(e) => handleInputChange('minWithdrawalAmount', Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                margin="normal"
                helperText="Minimum wallet balance required to request a withdrawal"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveSettings}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Notification Dialog */}
      <Dialog
        open={notificationDialog}
        onClose={() => setNotificationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Send Push Notification
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This notification will be sent to all active users of the app.
          </Typography>

          <TextField
            fullWidth
            label="Notification Title"
            value={notification.title}
            onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
            margin="normal"
            placeholder="e.g., Diwali Sale Started!"
          />

          <TextField
            fullWidth
            label="Notification Message"
            multiline
            rows={3}
            value={notification.message}
            onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
            margin="normal"
            placeholder="e.g., Get 20% off on all rice varieties. Limited time offer!"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSendNotification}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!notification.title || !notification.message}
          >
            Send to All Users
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsTab;