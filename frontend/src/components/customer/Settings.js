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
  BookmarkBorderOutlined,
  DeleteSweepOutlined,
  LogoutOutlined, DeleteForeverOutlined,
  GroupOutlined
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();

  const settingsGroups = [
    {
      subheader: t('accountProfile'),
      items: [
        { text: t('editProfile'), icon: <PersonOutline />, path: 'profile' },
        { text: t('manageAddresses'), icon: <LocationOnOutlined />, path: 'addresses' },
        { text: t('loginSecurity'), icon: <LockOutlined />, path: 'security' },
        { text: t('languageRegion'), icon: <LanguageOutlined />, path: 'language' },
        { text: t('themeMode'), icon: <Brightness4Outlined />, path: 'theme' },
        { text: t('accessibility'), icon: <AccessibilityNewOutlined />, path: 'accessibility' },
      ],
    },
    {
      subheader: t('ordersPayments'),
      items: [
        { text: t('orderHistory'), icon: <HistoryOutlined />, path: 'order-history' },
        { text: t('refundsReturns'), icon: <CachedOutlined />, path: 'refunds' },
        { text: t('myReviews'), icon: <StarOutline />, path: 'reviews' },
        { text: t('myBookmarks'), icon: <BookmarkBorderOutlined />, path: 'bookmarks' },
        { text: t('downloadInvoices'), icon: <GetAppOutlined />, path: 'invoices' },
        { text: t('rewardsWallet'), icon: <CardGiftcardOutlined />, path: 'rewards' },
      ],
    },
    {
      subheader: t('notificationsPrivacy'),
      items: [
        { text: t('notifications'), icon: <NotificationsOutlined />, path: 'notifications' },
        { text: t('recommendations'), icon: <RecommendOutlined />, path: 'recommendations' },
        { text: t('privacySettings'), icon: <PrivacyTipOutlined />, path: 'privacy' },
      ],
    },
    {
      subheader: t('supportLegal'),
      items: [
        { text: t('helpCenter'), icon: <HelpOutlineOutlined />, path: 'help-center' },
        { text: t('legalPolicies'), icon: <GavelOutlined />, path: 'legal' },
        { text: t('about'), icon: <HelpOutlineOutlined />, path: 'about' },
      ],
    },
    {
      subheader: t('accountManagement'),
      items: [
        { text: t('clearCache'), icon: <DeleteSweepOutlined />, path: 'clear-cache' },
        { text: t('logout'), icon: <LogoutOutlined />, path: 'logout' },
        { text: t('deleteAccount'), icon: <DeleteForeverOutlined />, path: 'delete-account' },
      ],
    },
  ];

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
