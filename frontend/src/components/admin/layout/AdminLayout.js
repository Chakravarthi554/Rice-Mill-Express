import React, { useState } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Badge, Menu, MenuItem,
  ListItemText, Tabs, Tab, Container
} from '@mui/material';
import {
  Notifications as NotificationsIcon, Logout as LogoutIcon,
  Dashboard as DashboardIcon, Assessment as AssessmentIcon,
  LocalShipping as LocalShippingIcon, Forum as ForumIcon,
  Payments as PaymentsIcon, RestaurantMenu as RestaurantMenuIcon,
  Settings as SettingsIcon, Message as MessageIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { getCurrentSocket } from '../../../utils/socket';
import NotificationBadge from '../../common/NotificationBadge';

const iconMap = {
  Dashboard: DashboardIcon,
  Assessment: AssessmentIcon,
  Payments: PaymentsIcon, // NEW PAYMENTS ICON
  LocalShipping: LocalShippingIcon,
  RestaurantMenu: RestaurantMenuIcon,
  Forum: ForumIcon,
  Settings: SettingsIcon,
  Message: MessageIcon,
  Security: SecurityIcon,
};

const AdminLayout = ({ tabs, title }) => {
  const { logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);

  React.useEffect(() => {
    const socket = getCurrentSocket();
    if (socket) {
      socket.on('NEW_MESSAGE', (msg) => setNotifications(prev => [...prev.slice(-5), { ...msg, time: new Date() }]));
      socket.on('PAYMENT_ALERT', (alert) => setNotifications(prev => [...prev.slice(-5), { ...alert, time: new Date() }]));
    }
    return () => socket && socket.off();
  }, []);

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <motion.div whileHover={{ scale: 1.1 }}>
              <DashboardIcon sx={{ fontSize: 32, color: '#667eea' }} />
            </motion.div>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>{title}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <NotificationBadge />
  <IconButton color="inherit" onClick={() => window.confirm('Logout?') && logout()}>
    <LogoutIcon />
  </IconButton>
</Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 600, borderRadius: '12px',
              margin: '0 4px', background: 'rgba(255,255,255,0.2)',
              '&.Mui-selected': { background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', color: 'white' }
            },
            '& .MuiTabs-indicator': { display: 'none' }
          }}>
          {tabs.map((tab, i) => {
            const Icon = iconMap[tab.icon];
            return <Tab key={i} label={tab.label} icon={Icon ? <Icon /> : null} />;
          })}
        </Tabs>

        <AnimatePresence mode="wait">
          <motion.div
            key={tabValue}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ mt: 3 }}>
              {tabs[tabValue].component}
            </Box>
          </motion.div>
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default AdminLayout;