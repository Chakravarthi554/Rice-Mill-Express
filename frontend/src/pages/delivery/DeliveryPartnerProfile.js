import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    IconButton,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Avatar,
    Chip,
} from '@mui/material';
import {
    ArrowBack,
    Person,
    Language,
    Notifications,
    DarkMode,
    Devices,
    Logout,
    Phone,
    Email,
    DirectionsCar,
    Star,
    CheckCircle,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const PageContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));

const InfoCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    borderRadius: 16,
    marginBottom: theme.spacing(2),
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}));

const DeliveryPartnerProfile = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.user);

    const [profile, setProfile] = useState(null);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [updating, setUpdating] = useState(false);

    // Settings
    const [language, setLanguage] = useState('en');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchDevices();
    }, []);

    const fetchProfile = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/dp/profile`,
                config
            );

            setProfile(data.profile);
            setLanguage(data.profile.language || 'en');
            setNotificationsEnabled(data.profile.notificationsEnabled !== false);
            setDarkMode(data.profile.darkMode || false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchDevices = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/dp/devices`,
                config
            );

            setDevices(data.devices || []);
        } catch (err) {
            console.error('Failed to fetch devices:', err);
        }
    };

    const handleUpdateSettings = async () => {
        try {
            setUpdating(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json',
                },
            };

            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/dp/profile`,
                {
                    language,
                    notificationsEnabled,
                    darkMode,
                },
                config
            );

            setSuccess('Settings updated successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setUpdating(false);
        }
    };

    const handleLogoutAllDevices = async () => {
        if (!window.confirm('Are you sure you want to logout from all devices?')) {
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/dp/logout-all`,
                {},
                config
            );

            setSuccess('Logged out from all devices successfully!');
            setDevices([]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to logout from all devices');
        }
    };

    if (loading) {
        return (
            <PageContainer>
                <Container maxWidth="lg">
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                        <CircularProgress sx={{ color: '#ffffff' }} />
                    </Box>
                </Container>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <Container maxWidth="lg">
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton
                        onClick={() => navigate('/delivery-partner/dashboard')}
                        sx={{ color: '#ffffff', mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight="700" color="#ffffff">
                        👤 My Profile
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Profile Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={3}>
                                    <Avatar
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            mr: 2,
                                        }}
                                    >
                                        <Person sx={{ fontSize: 48 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h5" fontWeight="700">
                                            {profile?.name}
                                        </Typography>
                                        <Chip
                                            label={profile?.kycStatus === 'approved' ? 'Verified' : 'Pending'}
                                            size="small"
                                            color={profile?.kycStatus === 'approved' ? 'success' : 'warning'}
                                            icon={profile?.kycStatus === 'approved' ? <CheckCircle /> : undefined}
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Phone color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Phone" secondary={profile?.phone} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Email color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Email" secondary={profile?.email || 'Not provided'} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <DirectionsCar color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Vehicle"
                                            secondary={`${profile?.vehicle_type} - ${profile?.vehicle_number}`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Star color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Rating"
                                            secondary={`${profile?.rating?.toFixed(1) || '5.0'} ⭐ (${profile?.totalDeliveries || 0} deliveries)`}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </InfoCard>
                    </Grid>

                    {/* Settings */}
                    <Grid item xs={12} md={6}>
                        <InfoCard>
                            <CardContent>
                                <Typography variant="h6" fontWeight="700" mb={3}>
                                    ⚙️ Settings
                                </Typography>

                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel>Language</InputLabel>
                                    <Select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        label="Language"
                                        startAdornment={<Language sx={{ mr: 1 }} />}
                                    >
                                        <MenuItem value="en">English</MenuItem>
                                        <MenuItem value="hi">हिंदी (Hindi)</MenuItem>
                                        <MenuItem value="te">తెలుగు (Telugu)</MenuItem>
                                        <MenuItem value="ta">தமிழ் (Tamil)</MenuItem>
                                        <MenuItem value="kn">ಕನ್ನಡ (Kannada)</MenuItem>
                                        <MenuItem value="ml">മലയാളം (Malayalam)</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={notificationsEnabled}
                                            onChange={(e) => setNotificationsEnabled(e.target.checked)}
                                        />
                                    }
                                    label="Enable Notifications"
                                    sx={{ mb: 2 }}
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={darkMode}
                                            onChange={(e) => setDarkMode(e.target.checked)}
                                        />
                                    }
                                    label="Dark Mode"
                                    sx={{ mb: 3 }}
                                />

                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleUpdateSettings}
                                    disabled={updating}
                                    sx={{ mb: 2 }}
                                >
                                    {updating ? <CircularProgress size={24} /> : 'Save Settings'}
                                </Button>
                            </CardContent>
                        </InfoCard>

                        {/* Device Management */}
                        <InfoCard>
                            <CardContent>
                                <Typography variant="h6" fontWeight="700" mb={2}>
                                    📱 Logged-in Devices
                                </Typography>
                                {devices.length === 0 ? (
                                    <Typography variant="body2" color="textSecondary">
                                        No devices found
                                    </Typography>
                                ) : (
                                    <List>
                                        {devices.slice(0, 3).map((device, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon>
                                                    <Devices color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={device.deviceName || 'Unknown Device'}
                                                    secondary={`Last login: ${new Date(device.lastLogin).toLocaleDateString()}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    startIcon={<Logout />}
                                    onClick={handleLogoutAllDevices}
                                    sx={{ mt: 2 }}
                                >
                                    Logout from All Devices
                                </Button>
                            </CardContent>
                        </InfoCard>
                    </Grid>
                </Grid>
            </Container>
        </PageContainer>
    );
};

export default DeliveryPartnerProfile;
