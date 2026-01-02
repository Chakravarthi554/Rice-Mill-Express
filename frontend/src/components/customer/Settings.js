// src/components/customer/Settings.js
import React from 'react';
import {
  Box,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider,
} from '@mui/material';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  PersonOutline, LocationOnOutlined, LockOutlined,
  LanguageOutlined, Brightness4Outlined, AccessibilityNewOutlined,
  HistoryOutlined, CachedOutlined,
  GetAppOutlined, CardGiftcardOutlined, StarOutline, NotificationsOutlined,
  RecommendOutlined, PrivacyTipOutlined,
  HelpOutlineOutlined, GavelOutlined,
  DeleteSweepOutlined,
  LogoutOutlined, DeleteForeverOutlined,
} from '@mui/icons-material';

const settingsGroups = [
  {
    subheader: 'Account & Profile',
    items: [
      { text: 'Edit Profile', icon: <PersonOutline />, path: 'profile' },
      { text: 'Manage Addresses', icon: <LocationOnOutlined />, path: 'addresses' },
      { text: 'Login & Security', icon: <LockOutlined />, path: 'security' },
      { text: 'Language & Region', icon: <LanguageOutlined />, path: 'language' },
      { text: 'Theme Mode', icon: <Brightness4Outlined />, path: 'theme' },
      { text: 'Accessibility', icon: <AccessibilityNewOutlined />, path: 'accessibility' },
    ],
  },
  {
    subheader: 'Orders & Payments',
    items: [
      { text: 'Order History', icon: <HistoryOutlined />, path: 'order-history' },
      { text: 'Refunds & Returns', icon: <CachedOutlined />, path: 'refunds' },
      { text: 'Download Invoices', icon: <GetAppOutlined />, path: 'invoices' },
      { text: 'Rewards Wallet', icon: <CardGiftcardOutlined />, path: 'rewards' },
      { text: 'Subscription', icon: <StarOutline />, path: 'subscription' },
    ],
  },
  {
    subheader: 'Notifications & Privacy',
    items: [
      { text: 'Notifications', icon: <NotificationsOutlined />, path: 'notifications' },
      { text: 'Recommendations', icon: <RecommendOutlined />, path: 'recommendations' },
      { text: 'Privacy Settings', icon: <PrivacyTipOutlined />, path: 'privacy' },
    ],
  },
  {
    subheader: 'Support & Legal',
    items: [
      { text: 'Help Center', icon: <HelpOutlineOutlined />, path: 'help-center' },
      { text: 'Legal Policies', icon: <GavelOutlined />, path: 'legal' },
    ],
  },
  {
    subheader: 'Account Management',
    items: [
      { text: 'Clear Cache', icon: <DeleteSweepOutlined />, path: 'clear-cache' },
      { text: 'Logout', icon: <LogoutOutlined />, path: 'logout' },
      { text: 'Delete Account', icon: <DeleteForeverOutlined />, path: 'delete-account' },
    ],
  },
];

const Settings = () => {
  const { logout } = useAuth();
  return (
    <Box sx={{ display: 'flex' }}>
      <Paper elevation={2} sx={{ width: 300, minHeight: 'calc(100vh - 64px)', overflow: 'auto' }} component="nav">
        <List>
          {settingsGroups.map((group) => (
            <React.Fragment key={group.subheader}>
              <ListSubheader>{group.subheader}</ListSubheader>
              {group.items.map((item) => (
                <ListItemButton
                  key={item.text}
                  component={NavLink}
                  to={item.path}
                  sx={{
                    '&.active': {
                      backgroundColor: 'rgba(46, 125, 50, 0.1)',
                      color: '#2e7d32',
                      borderRight: '3px solid #2e7d32',
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      '.active &': {
                        color: '#2e7d32',
                      }
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              ))}
              <Divider sx={{ my: 1 }} />
            </React.Fragment>
          ))}
        </List>
      </Paper>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};
export default Settings;