import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, TextField, Button, Avatar,
  Grid, Divider, Paper, Switch, FormControlLabel, CircularProgress,
  Card, CardContent, CardHeader, Chip, Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccountBalance as BankIcon,
  IntegrationInstructions as IntegrationIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { updateSellerProfile } from '../../redux/actions/userActions';
import FileUpload from '../common/FileUpload';
import Message from '../common/Message';

const SellerProfile = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const {
    loading: updateLoading,
    error: updateError,
    success: updateSuccess,
    userInfo: updatedUserInfo
  } = useSelector(state => state.userUpdateProfile || {});

  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    businessName: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    address: { street: '', city: '', state: '', pinCode: '' },
    phone: '',
    email: '',
    profileImage: null,
    productAvailability: true,
    notificationEnabled: true,
    bankAccount: { accountNumber: '', ifscCode: '', accountHolderName: '' },
    integrations: { amazon: '', zepto: '', flipkart: '' },
  });

  useEffect(() => {
    if (userInfo) {
      setProfileData({
        businessName: userInfo.businessDetails?.businessName || '',
        businessType: userInfo.businessDetails?.businessType || '',
        gstNumber: userInfo.businessDetails?.gstNumber || '',
        panNumber: userInfo.businessDetails?.panNumber || '',
        address: userInfo.businessDetails?.address || { street: '', city: '', state: '', pinCode: '' },
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        profileImage: userInfo.profileImage || '/uploads/default_avatar.jpg',
        productAvailability: userInfo.productAvailability !== false,
        notificationEnabled: userInfo.notificationEnabled !== false,
        bankAccount: userInfo.businessDetails?.bankAccount || { accountNumber: '', ifscCode: '', accountHolderName: '' },
        integrations: userInfo.integrations || { amazon: '', zepto: '', flipkart: '' },
      });
    }
  }, [userInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else if (name.startsWith('bankAccount.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        bankAccount: { ...prev.bankAccount, [field]: value },
      }));
    } else if (name.startsWith('integrations.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        integrations: { ...prev.integrations, [field]: value },
      }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggle = (name) => (e) => {
    setProfileData(prev => ({ ...prev, [name]: e.target.checked }));
  };

  const handleFileSelect = (file) => {
    setProfileData(prev => ({
      ...prev,
      profileImage: file || prev.profileImage,
      previewImage: file ? URL.createObjectURL(file) : prev.profileImage,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      if (key === 'address') {
        formData.append('businessDetails[address][street]', profileData.address.street);
        formData.append('businessDetails[address][city]', profileData.address.city);
        formData.append('businessDetails[address][state]', profileData.address.state);
        formData.append('businessDetails[address][pinCode]', profileData.address.pinCode);
      } else if (key === 'bankAccount') {
        formData.append('businessDetails[bankAccount][accountNumber]', profileData.bankAccount.accountNumber);
        formData.append('businessDetails[bankAccount][ifscCode]', profileData.bankAccount.ifscCode);
        formData.append('businessDetails[bankAccount][accountHolderName]', profileData.bankAccount.accountHolderName);
      } else if (key === 'integrations') {
        formData.append('integrations[amazon]', profileData.integrations.amazon);
        formData.append('integrations[zepto]', profileData.integrations.zepto);
        formData.append('integrations[flipkart]', profileData.integrations.flipkart);
      } else if (key === 'profileImage' && profileData.profileImage instanceof File) {
        formData.append('profileImage', profileData.profileImage);
      } else {
        formData.append(key, profileData[key]);
      }
    });
    dispatch(updateSellerProfile(formData));
    if (updateSuccess && updatedUserInfo) {
      setProfileData(prev => ({
        ...prev,
        ...updatedUserInfo,
        address: updatedUserInfo.businessDetails?.address || prev.address,
        bankAccount: updatedUserInfo.businessDetails?.bankAccount || prev.bankAccount,
        integrations: updatedUserInfo.integrations || prev.integrations,
        profileImage: updatedUserInfo.profileImage || prev.profileImage,
      }));
    }
    setEditMode(false);
  };

  const imageSrc = profileData.previewImage || (typeof profileData.profileImage === 'string'
    ? profileData.profileImage.startsWith('http') || profileData.profileImage.startsWith('/uploads')
      ? profileData.profileImage
      : `/uploads/${profileData.profileImage}`
    : '/uploads/default_avatar.jpg');

  // Color scheme
  const colors = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    info: '#0288d1',
    background: '#f8f9fa',
    cardHeader: '#f5f5f5'
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: 3
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2, #00bcd4)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Seller Profile
        </Typography>
        
        <Button
          onClick={() => setEditMode(!editMode)}
          variant={editMode ? "outlined" : "contained"}
          startIcon={editMode ? <CancelIcon /> : <EditIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 'bold',
            background: editMode ? 'transparent' : `linear-gradient(45deg, ${colors.primary}, ${colors.info})`,
            border: editMode ? `2px solid ${colors.warning}` : 'none',
            color: editMode ? colors.warning : 'white',
            '&:hover': {
              background: editMode ? `${colors.warning}15` : `linear-gradient(45deg, ${colors.info}, ${colors.primary})`,
            }
          }}
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </Button>
      </Box>

      {updateError && (
        <Message severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {updateError}
        </Message>
      )}
      {updateSuccess && (
        <Message severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          Profile updated successfully
        </Message>
      )}

      {/* Profile Image Section */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                alt="Profile Image"
                src={imageSrc}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  border: `4px solid ${colors.primary}`,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: colors.success,
                  color: 'white',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                ✓
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primary, mb: 1 }}>
                {profileData.businessName || 'Your Business Name'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {profileData.businessType || 'Business Type'}
              </Typography>
              <FileUpload 
                label="Upload Profile Image" 
                onFileSelect={handleFileSelect} 
                acceptedTypes="image/*" 
                existingFileName={userInfo?.profileImage?.split('/').pop()} 
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {!editMode ? (
        /* View Mode */
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', height: '100%' }}>
              <CardHeader
                avatar={<PersonIcon sx={{ color: colors.primary }} />}
                title="Basic Information"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                sx={{ 
                  backgroundColor: colors.cardHeader,
                  borderBottom: `1px solid #e0e0e0`
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ color: colors.primary, fontSize: 20 }} />
                    <Typography><strong>Business Name:</strong> {profileData.businessName}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ color: colors.info, fontSize: 20 }} />
                    <Typography><strong>Business Type:</strong> {profileData.businessType}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ color: colors.secondary, fontSize: 20 }} />
                    <Typography><strong>Email:</strong> {profileData.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ color: colors.success, fontSize: 20 }} />
                    <Typography><strong>Phone:</strong> {profileData.phone}</Typography>
                  </Box>
                  <Box>
                    <Chip 
                      label={`GST: ${profileData.gstNumber || 'Not provided'}`} 
                      size="small" 
                      color={profileData.gstNumber ? "primary" : "default"}
                      variant="outlined"
                    />
                    <Chip 
                      label={`PAN: ${profileData.panNumber || 'Not provided'}`} 
                      size="small" 
                      color={profileData.panNumber ? "secondary" : "default"}
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Address Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', height: '100%' }}>
              <CardHeader
                avatar={<LocationIcon sx={{ color: colors.warning }} />}
                title="Business Address"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                sx={{ 
                  backgroundColor: colors.cardHeader,
                  borderBottom: `1px solid #e0e0e0`
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationIcon sx={{ color: colors.warning, mt: 0.5, fontSize: 20 }} />
                  <Box>
                    <Typography><strong>Street:</strong> {profileData.address.street}</Typography>
                    <Typography><strong>City:</strong> {profileData.address.city}</Typography>
                    <Typography><strong>State:</strong> {profileData.address.state}</Typography>
                    <Typography><strong>PIN Code:</strong> {profileData.address.pinCode}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Integrations */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <CardHeader
                avatar={<IntegrationIcon sx={{ color: colors.info }} />}
                title="Platform Integrations"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                sx={{ 
                  backgroundColor: colors.cardHeader,
                  borderBottom: `1px solid #e0e0e0`
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography><strong>Amazon:</strong></Typography>
                    <Chip 
                      label={profileData.integrations.amazon || "Not connected"} 
                      color={profileData.integrations.amazon ? "primary" : "default"}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography><strong>Zepto:</strong></Typography>
                    <Chip 
                      label={profileData.integrations.zepto || "Not connected"} 
                      color={profileData.integrations.zepto ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography><strong>Flipkart:</strong></Typography>
                    <Chip 
                      label={profileData.integrations.flipkart || "Not connected"} 
                      color={profileData.integrations.flipkart ? "warning" : "default"}
                      size="small"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Bank & Settings */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <CardHeader
                avatar={<BankIcon sx={{ color: colors.success }} />}
                title="Bank Account & Settings"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                sx={{ 
                  backgroundColor: colors.cardHeader,
                  borderBottom: `1px solid #e0e0e0`
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography><strong>Account Number:</strong> {profileData.bankAccount.accountNumber || 'Not provided'}</Typography>
                    <Typography><strong>Account Holder:</strong> {profileData.bankAccount.accountHolderName || 'Not provided'}</Typography>
                    <Typography><strong>IFSC Code:</strong> {profileData.bankAccount.ifscCode || 'Not provided'}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography><strong>Product Availability:</strong></Typography>
                    <Chip 
                      label={profileData.productAvailability ? 'ACTIVE' : 'INACTIVE'} 
                      color={profileData.productAvailability ? "success" : "error"}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography><strong>Notifications:</strong></Typography>
                    <Chip 
                      label={profileData.notificationEnabled ? 'ENABLED' : 'DISABLED'} 
                      color={profileData.notificationEnabled ? "info" : "default"}
                      size="small"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        /* Edit Mode */
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <CardContent sx={{ p: 0 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3} sx={{ p: 3 }}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: colors.primary, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon /> Basic Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    name="businessName"
                    value={profileData.businessName}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Type"
                    name="businessType"
                    value={profileData.businessType}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleChange}
                    required
                    disabled={true}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GST Number"
                    name="gstNumber"
                    value={profileData.gstNumber}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="PAN Number"
                    name="panNumber"
                    value={profileData.panNumber}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Address Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ color: colors.warning, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon /> Business Address
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    name="address.street"
                    value={profileData.address.street}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    name="address.city"
                    value={profileData.address.city}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    name="address.state"
                    value={profileData.address.state}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="PIN Code"
                    name="address.pinCode"
                    value={profileData.address.pinCode}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Integrations */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ color: colors.info, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IntegrationIcon /> Platform Integrations
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Amazon Seller ID"
                    name="integrations.amazon"
                    value={profileData.integrations.amazon}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Zepto Partner ID"
                    name="integrations.zepto"
                    value={profileData.integrations.zepto}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Flipkart Seller ID"
                    name="integrations.flipkart"
                    value={profileData.integrations.flipkart}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Settings */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ color: colors.secondary, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon /> Business Settings
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profileData.productAvailability}
                        onChange={handleToggle('productAvailability')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="bold">Product Availability</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Show your products as available for sale
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={profileData.notificationEnabled}
                        onChange={handleToggle('notificationEnabled')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="bold">Enable Notifications</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Receive order and update notifications
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </Grid>

                {/* Bank Account */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ color: colors.success, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BankIcon /> Bank Account Details
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    name="bankAccount.accountNumber"
                    value={profileData.bankAccount.accountNumber}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Holder Name"
                    name="bankAccount.accountHolderName"
                    value={profileData.bankAccount.accountHolderName}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="IFSC Code"
                    name="bankAccount.ifscCode"
                    value={profileData.bankAccount.ifscCode}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={updateLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={updateLoading}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1,
                        fontWeight: 'bold',
                        background: `linear-gradient(45deg, ${colors.success}, #4caf50)`,
                        '&:hover': {
                          background: `linear-gradient(45deg, #4caf50, ${colors.success})`,
                        }
                      }}
                    >
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}
    </Paper>
  );
};

export default SellerProfile;