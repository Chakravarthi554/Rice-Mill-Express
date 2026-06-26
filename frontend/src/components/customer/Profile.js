import React, { useState } from 'react';
import { Typography, Paper, Box, Tabs, Tab } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { getUserDetails } from '../../redux/actions/userActions';
import {
  PersonOutline, LocationOnOutlined, TuneOutlined,
  LockOutlined, ShareOutlined,
} from '@mui/icons-material';
import AddressManager from './AddressManager';
import BasicInfo from './BasicInfo';
import SecuritySettings from './SecuritySettings';
import PreferencesSettings from './PreferencesSettings';
import ReferralKycSettings from './ReferralKycSettings';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ px: 3, py: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile = () => {
  const [value, setValue] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUserDetails());
  }, [dispatch]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const tabs = [
    { label: 'Basic Information', icon: <PersonOutline /> },
    { label: 'Address & Contact', icon: <LocationOnOutlined /> },
    { label: 'Preferences', icon: <TuneOutlined /> },
    { label: 'Security', icon: <LockOutlined /> },
    { label: 'Referrals & KYC', icon: <ShareOutlined /> },
  ];

  return (
    <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <Box sx={{
        px: 3, pt: 3, pb: 0,
        borderBottom: '1px solid #F3F4F6',
        bgcolor: '#FAFAFA',
      }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 2 }}>
          Profile Settings
        </Typography>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 14,
              minHeight: 48,
              px: 2.5,
              color: '#6B7280',
              '&.Mui-selected': { color: '#16A34A' },
            },
            '& .MuiTabs-indicator': { bgcolor: '#16A34A', height: 3, borderRadius: 3 },
          }}
        >
          {tabs.map((tab, i) => (
            <Tab key={i} icon={tab.icon} iconPosition="start" label={tab.label} />
          ))}
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}><BasicInfo /></TabPanel>
      <TabPanel value={value} index={1}><AddressManager elevation={0} /></TabPanel>
      <TabPanel value={value} index={2}><PreferencesSettings /></TabPanel>
      <TabPanel value={value} index={3}><SecuritySettings /></TabPanel>
      <TabPanel value={value} index={4}><ReferralKycSettings /></TabPanel>
    </Paper>
  );
};

export default Profile;
