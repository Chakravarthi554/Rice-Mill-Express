// [AI: Refactored Admin Desktop Layout to a professional dark Left Sidebar]
import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Avatar, Tooltip } from '@mui/material';
import {
  Notifications as NotificationsIcon, Logout as LogoutIcon, Dashboard as DashboardIcon,
  Assessment as AssessmentIcon, LocalShipping as LocalShippingIcon, Forum as ForumIcon,
  Payments as PaymentsIcon, RestaurantMenu as RestaurantMenuIcon, Settings as SettingsIcon,
  Message as MessageIcon, Security as SecurityIcon, Report as ReportIcon, People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon, Search
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { getCurrentSocket } from '../../../utils/socket';
import NotificationBadge from '../../common/NotificationBadge';

const iconMap = {
  Dashboard: DashboardIcon, Assessment: AssessmentIcon, Payments: PaymentsIcon,
  LocalShipping: LocalShippingIcon, RestaurantMenu: RestaurantMenuIcon, Forum: ForumIcon,
  People: PeopleIcon, ShoppingCart: ShoppingCartIcon, Settings: SettingsIcon,
  Message: MessageIcon, Security: SecurityIcon, Report: ReportIcon,
};

const AdminLayout = ({ tabs, title }) => {
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = getCurrentSocket();
    if (socket) {
      socket.on('NEW_MESSAGE', (msg) => setNotifications(prev => [...prev.slice(-5), { ...msg, time: new Date() }]));
      socket.on('PAYMENT_ALERT', (alert) => setNotifications(prev => [...prev.slice(-5), { ...alert, time: new Date() }]));
    }
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const index = tabs.findIndex(t => t.label.toLowerCase().includes(hash.toLowerCase()));
        if (index !== -1) setTabValue(index);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => { if (socket) socket.off(); window.removeEventListener('hashchange', handleHashChange); };
  }, [tabs]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0B1120' }}>
      
      {/* ── Left Sidebar (Dark Slate Theme) ── */}
      <Box sx={{ width: 260, bgcolor: '#0F172A', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Brand */}
        <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Box sx={{ width: 32, height: 32, bgcolor: '#38BDF8', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SecurityIcon sx={{ color: '#0F172A', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="body1" fontWeight={800} color="#fff" lineHeight={1.2}>Rice Mill</Typography>
            <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 700, letterSpacing: 1 }}>ADMIN OS</Typography>
          </Box>
        </Box>

        {/* Navigation */}
        <Box sx={{ flex: 1, py: 2, overflowY: 'auto' }}>
          {tabs.map((tab, i) => {
            const Icon = iconMap[tab.icon];
            const isActive = tabValue === i;
            return (
              <Box key={i} onClick={() => { setTabValue(i); window.location.hash = tab.label.toLowerCase().replace(/\s+/g, '-'); }}
                sx={{ 
                  display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 1.5, cursor: 'pointer', mb: 0.5,
                  bgcolor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  borderRight: isActive ? '3px solid #38BDF8' : '3px solid transparent',
                  color: isActive ? '#38BDF8' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#fff' }
                }}>
                {Icon && <Icon fontSize="small" />}
                <Typography variant="body2" fontWeight={isActive ? 700 : 500}>{tab.label}</Typography>
              </Box>
            );
          })}
        </Box>

        {/* User Footer */}
        <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#38BDF8', color: '#0F172A', fontWeight: 800, fontSize: 14 }}>{user?.name?.[0] || 'A'}</Avatar>
            <Box>
              <Typography variant="body2" fontWeight={700} color="#fff" noWrap sx={{ maxWidth: 100 }}>{user?.name || 'Administrator'}</Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">System Admin</Typography>
            </Box>
          </Box>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={() => window.confirm('Logout from Admin OS?') && logout()} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)' } }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Main Content Area ── */}
      <Box sx={{ ml: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header */}
        <Box sx={{ height: 64, bgcolor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', px: 4, gap: 2, position: 'sticky', top: 0, zIndex: 99 }}>
          <Typography variant="h6" fontWeight={800} color="#fff" sx={{ flex: 1 }}>{title} / <Typography component="span" color="#38BDF8" fontWeight={700}>{tabs[tabValue]?.label}</Typography></Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, px: 2, py: 0.8, border: '1px solid rgba(255,255,255,0.1)', minWidth: 280 }}>
            <Search fontSize="small" sx={{ color: 'rgba(255,255,255,0.4)' }} />
            <input style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#fff', width: '100%' }} placeholder="Global search... (Ctrl+K)" />
          </Box>
          
          <NotificationBadge />
        </Box>

        {/* Tab Content Panel */}
        <Box sx={{ p: 4, flex: 1, overflowX: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tabValue}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {tabs[tabValue].component}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;