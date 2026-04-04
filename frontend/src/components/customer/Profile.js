// frontend/src/components/customer/Profile.js
import React, { useState } from 'react';
import { Typography, Paper, Box, Tabs, Tab } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { getUserDetails } from '../../redux/actions/userActions';
import {
  PersonOutline,
  LocationOnOutlined,
  TuneOutlined,
  LockOutlined,
  Gavel as GavelIcon,
  GavelOutlined,
  PaletteOutlined,
  ShareOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext'; // FIXED: Added missing import
import AddressManager from './AddressManager';
import BasicInfo from './BasicInfo';
import SecuritySettings from './SecuritySettings';
import PreferencesSettings from './PreferencesSettings';

import ReferralKycSettings from './ReferralKycSettings';
import SettingsPlaceholder from './SettingsPlaceholder';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile = () => {
  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <Paper sx={{ p: 0, overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" aria-label="Profile Settings Tabs">
          <Tab icon={<PersonOutline />} iconPosition="start" label="Basic Information" />
          <Tab icon={<LocationOnOutlined />} iconPosition="start" label="Address & Contact" />
          <Tab icon={<TuneOutlined />} iconPosition="start" label="Preferences" />
          <Tab icon={<LockOutlined />} iconPosition="start" label="Security" />

          <Tab icon={<ShareOutlined />} iconPosition="start" label="Referrals & KYC" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <BasicInfo />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <AddressManager elevation={0} />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <PreferencesSettings />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <SecuritySettings />
      </TabPanel>

      <TabPanel value={value} index={5}>
        <ReferralKycSettings />
      </TabPanel>
    </Paper>
  );
};

export default Profile;