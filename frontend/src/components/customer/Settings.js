import React from 'react';
import { Box, Paper, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  PersonOutline, LocationOnOutlined, ShieldOutlined, LockOutlined,
  HistoryOutlined, StarOutline, CardGiftcardOutlined,
  NotificationsOutlined, LanguageOutlined, Brightness4Outlined,
  HelpOutlineOutlined, DescriptionOutlined, LogoutOutlined
} from '@mui/icons-material';

const Settings = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();

  const settingsGroups = [
    {
      subheader: 'Account & Security',
      items: [
        { text: t('editProfile'), icon: <PersonOutline fontSize="small" />, path: 'profile', bg: '#EEF2FF', color: '#4F46E5' },
        { text: t('manageAddresses'), icon: <LocationOnOutlined fontSize="small" />, path: 'addresses', bg: '#F0FDF4', color: '#16A34A' },
        { text: 'Security Hub', icon: <ShieldOutlined fontSize="small" />, path: 'security', bg: '#FFF7ED', color: '#EA580C' },
        { text: 'Privacy Controls', icon: <LockOutlined fontSize="small" />, path: 'privacy', bg: '#FDF2F8', color: '#9333EA' },
      ],
    },
    {
      subheader: 'Orders & Activity',
      items: [
        { text: t('orderHistory'), icon: <HistoryOutlined fontSize="small" />, path: 'order-history', bg: '#F0FDF4', color: '#16A34A' },
        { text: t('myReviews'), icon: <StarOutline fontSize="small" />, path: 'reviews', bg: '#FEFCE8', color: '#CA8A04' },
        { text: 'Refer & Earn', icon: <CardGiftcardOutlined fontSize="small" />, path: 'rewards', bg: '#FFF7ED', color: '#F97316' },
      ],
    },
    {
      subheader: 'Preferences',
      items: [
        { text: t('notifications'), icon: <NotificationsOutlined fontSize="small" />, path: 'notifications', bg: '#FFF7ED', color: '#EA580C' },
        { text: t('languageRegion'), icon: <LanguageOutlined fontSize="small" />, path: 'language', bg: '#F5F3FF', color: '#7C3AED' },
        { text: t('themeMode'), icon: <Brightness4Outlined fontSize="small" />, path: 'theme', bg: '#F0FDFA', color: '#0D9488' },
      ],
    },
    {
      subheader: 'Support & Legal',
      items: [
        { text: t('helpCenter'), icon: <HelpOutlineOutlined fontSize="small" />, path: 'help-center', bg: '#F1F5F9', color: '#475569' },
        { text: t('legalPolicies'), icon: <DescriptionOutlined fontSize="small" />, path: 'legal', bg: '#F8FAFC', color: '#64748B' },
      ],
    }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 80px)', bgcolor: '#F9FAFB', p: { xs: 2, md: 4 }, gap: 4 }}>
      {/* Settings Navigation Sidebar */}
      <Paper elevation={0} sx={{ width: 320, borderRadius: 4, overflow: 'hidden', border: '1px solid #F3F4F6', bgcolor: '#fff', flexShrink: 0, height: 'fit-content' }} component="nav">
        
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h5" fontWeight={800} color="#111827">Settings</Typography>
          <Typography variant="body2" color="text.secondary">Manage your account preferences</Typography>
        </Box>

        <List sx={{ px: 2, pb: 3 }}>
          {settingsGroups.map((group, gIndex) => (
            <Box key={group.subheader} sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ display: 'block', px: 2, py: 1.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {group.subheader}
              </Typography>

              {group.items.map((item) => (
                <ListItemButton
                  key={item.text}
                  component={NavLink}
                  to={item.path}
                  sx={{
                    borderRadius: 3, mb: 0.5, py: 1.2, px: 2,
                    '&.active': { bgcolor: '#F3F4F6' },
                    '&:hover': { bgcolor: '#F9FAFB' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ fontSize: 15, fontWeight: 600, color: '#374151' }} 
                  />
                </ListItemButton>
              ))}
              {gIndex < settingsGroups.length - 1 && <Divider sx={{ my: 1, mx: 2, borderColor: '#F3F4F6' }} />}
            </Box>
          ))}

          <Divider sx={{ my: 2, mx: 2, borderColor: '#F3F4F6' }} />
          
          <ListItemButton onClick={logout} sx={{ borderRadius: 3, py: 1.2, px: 2, '&:hover': { bgcolor: '#FEF2F2' } }}>
            <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
               <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <LogoutOutlined fontSize="small" />
               </Box>
            </ListItemIcon>
            <ListItemText primary={t('logout')} primaryTypographyProps={{ fontSize: 15, fontWeight: 700, color: '#EF4444' }} />
          </ListItemButton>
        </List>
      </Paper>

      {/* Main Settings Content Area */}
      <Box component="main" sx={{ flexGrow: 1, maxWidth: 800 }}>
        <Paper elevation={0} sx={{ minHeight: 500, borderRadius: 4, border: '1px solid #F3F4F6', bgcolor: '#fff', p: { xs: 3, md: 5 } }}>
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
};

export default Settings;
