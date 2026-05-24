// [Premium Figma-level Redesign — Customer Settings (Web)]
import React, { useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Divider, Avatar } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Person, LocationOn, Security, Lock, ShoppingBag,
    Star, CardGiftcard, Notifications, Language, Brightness4,
    HelpOutline, Description, Logout,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const NAV_GROUPS = [
    {
        title: 'Account',
        items: [
            { label: 'Personal Info', sub: 'Profile & contact', icon: Person, iconBg: '#EEF2FF', iconColor: '#4F46E5', path: '/settings/profile' },
            { label: 'Addresses', sub: 'Saved locations', icon: LocationOn, iconBg: '#F0FDF4', iconColor: '#16A34A', path: '/settings/addresses' },
            { label: 'Security', sub: '2FA & password', icon: Security, iconBg: '#FFF7ED', iconColor: '#EA580C', path: '/settings/security' },
            { label: 'Privacy', sub: 'Data preferences', icon: Lock, iconBg: '#F5F3FF', iconColor: '#7C3AED', path: '/settings/privacy' },
        ],
    },
    {
        title: 'Shopping',
        items: [
            { label: 'My Orders', sub: 'Track & manage', icon: ShoppingBag, iconBg: '#F0FDF4', iconColor: '#16A34A', path: '/settings/order-history' },
            { label: 'Rewards', sub: 'Points & wallet', icon: Star, iconBg: '#FEFCE8', iconColor: '#CA8A04', path: '/settings/rewards' },
            { label: 'Notifications', sub: 'Alerts & updates', icon: Notifications, iconBg: '#FFF7ED', iconColor: '#EA580C', path: '/settings/notifications' },
        ],
    },
    {
        title: 'Preferences',
        items: [
            { label: 'Language', sub: 'App language', icon: Language, iconBg: '#F5F3FF', iconColor: '#7C3AED', path: '/settings/language' },
            { label: 'Appearance', sub: 'Theme settings', icon: Brightness4, iconBg: '#F0FDFA', iconColor: '#0D9488', path: '/settings/theme' },
        ],
    },
    {
        title: 'Support',
        items: [
            { label: 'Help Center', sub: 'FAQs & support', icon: HelpOutline, iconBg: '#F1F5F9', iconColor: '#475569', path: '/settings/help-center' },
            { label: 'Legal', sub: 'Terms & privacy', icon: Description, iconBg: '#F8FAFC', iconColor: '#64748B', path: '/settings/legal' },
        ],
    },
];

const Settings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [hovered, setHovered] = useState(null);

    const initials = user?.name
        ? user.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : 'C';

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <Box sx={{ display: 'flex', gap: 3, minHeight: '70vh', fontFamily: "'Inter', sans-serif" }}>

            {/* ── SIDEBAR ── */}
            <Box sx={{
                width: 280, flexShrink: 0, background: '#fff', borderRadius: 4,
                border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden', height: 'fit-content', position: 'sticky', top: 24,
            }}>
                {/* User Card */}
                <Box sx={{ p: 3, background: 'linear-gradient(135deg, #16A34A15, #F0FDF4)', borderBottom: '1px solid #F3F4F6' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={user?.profileImage}
                                sx={{
                                    width: 64, height: 64, bgcolor: '#16A34A', fontSize: 24, fontWeight: 800,
                                    boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
                                }}
                            >
                                {initials}
                            </Avatar>
                            <Box sx={{
                                position: 'absolute', bottom: 0, right: 0, width: 20, height: 20,
                                borderRadius: 10, bgcolor: '#F97316', border: '2px solid #fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, color: '#fff',
                            }}>✏️</Box>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{user?.name || 'Customer'}</Box>
                            <Box sx={{ fontSize: 12, color: '#9CA3AF', mt: 0.3 }}>{user?.email || 'customer@ricemill.com'}</Box>
                        </Box>
                        <Box
                            component="button"
                            onClick={() => navigate('/settings/profile')}
                            sx={{
                                background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700,
                                py: 0.8, px: 2.5, borderRadius: 99, border: 'none', cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                                '&:hover': { background: '#15803D' },
                            }}
                        >
                            Edit Profile
                        </Box>
                    </Box>
                </Box>

                {/* Nav Groups */}
                {NAV_GROUPS.map((group, gi) => (
                    <Box key={gi}>
                        <Box sx={{ px: 3, pt: 2, pb: 0.5 }}>
                            <Box sx={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                {group.title}
                            </Box>
                        </Box>
                        {group.items.map((item, ii) => {
                            const IconComp = item.icon;
                            const active = isActive(item.path);
                            return (
                                <ListItemButton
                                    key={ii}
                                    onClick={() => navigate(item.path)}
                                    onMouseEnter={() => setHovered(`${gi}-${ii}`)}
                                    onMouseLeave={() => setHovered(null)}
                                    sx={{
                                        mx: 1.5, borderRadius: 3, mb: 0.3, px: 1.5,
                                        background: active ? '#F0FDF4' : hovered === `${gi}-${ii}` ? '#F9FAFB' : 'transparent',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 42 }}>
                                        <Box sx={{
                                            width: 34, height: 34, borderRadius: 2.5,
                                            bgcolor: active ? item.iconBg : '#F9FAFB',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s',
                                        }}>
                                            <IconComp sx={{ fontSize: 18, color: active ? item.iconColor : '#9CA3AF' }} />
                                        </Box>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        secondary={item.sub}
                                        primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 600, color: active ? '#111827' : '#374151' }}
                                        secondaryTypographyProps={{ fontSize: 11, color: '#9CA3AF', mt: 0.2 }}
                                    />
                                    {active && <Box sx={{ width: 3, height: 24, borderRadius: 2, bgcolor: item.iconColor, ml: 1 }} />}
                                </ListItemButton>
                            );
                        })}
                        {gi < NAV_GROUPS.length - 1 && <Divider sx={{ my: 1, borderColor: '#F9FAFB', mx: 2 }} />}
                    </Box>
                ))}

                {/* Logout */}
                <Box sx={{ p: 1.5, pt: 1, borderTop: '1px solid #F3F4F6', mt: 1 }}>
                    <ListItemButton
                        sx={{ borderRadius: 3, background: '#FEF2F2', '&:hover': { background: '#FEE2E2' } }}
                        onClick={() => navigate('/logout')}
                    >
                        <ListItemIcon sx={{ minWidth: 42 }}>
                            <Box sx={{ width: 34, height: 34, borderRadius: 2.5, bgcolor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Logout sx={{ fontSize: 18, color: '#EF4444' }} />
                            </Box>
                        </ListItemIcon>
                        <ListItemText
                            primary="Log Out"
                            primaryTypographyProps={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}
                        />
                    </ListItemButton>
                </Box>
            </Box>

            {/* ── CONTENT ── */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default Settings;
