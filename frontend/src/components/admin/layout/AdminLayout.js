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
  Security as SecurityIcon, Report as ReportIcon,
  People as PeopleIcon, ShoppingCart as ShoppingCartIcon
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
  People: PeopleIcon,
  ShoppingCart: ShoppingCartIcon,
  Settings: SettingsIcon,
  Message: MessageIcon,
  Security: SecurityIcon,
  Report: ReportIcon,
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

    // ✅ FIXED: Handle hash-based navigation
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const index = tabs.findIndex(t => t.label.toLowerCase().includes(hash.toLowerCase()));
        if (index !== -1) setTabValue(index);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => {
      if (socket) socket.off();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [tabs]);

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <motion.div whileHover={{ scale: 1.1 }}>
              <DashboardIcon sx={{ fontSize: 32, color: '#38bdf8' }} />
            </motion.div>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>{title}</Typography>
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
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 600, borderRadius: '12px', minHeight: 44,
              margin: '0 6px', color: 'rgba(255,255,255,0.7)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              },
              '&:hover': {
                background: 'rgba(255,255,255,0.05)',
              }
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
            <Box sx={{ mt: 2 }}>
              {tabs[tabValue].component}
            </Box>
          </motion.div>
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default AdminLayout;