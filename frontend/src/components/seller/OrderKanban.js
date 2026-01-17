import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    Chip,
    Avatar,
    IconButton,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    MoreVert as MoreIcon,
    LocalShipping as ShippingIcon,
    Person as PersonIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const COLUMNS = [
    { id: 'placed', title: 'New Orders', color: '#e3f2fd' },
    { id: 'processing', title: 'Processing', color: '#fff3e0' },
    { id: 'packed', title: 'Packed', color: '#f3e5f5' },
    { id: 'shipped', title: 'Shipped', color: '#e8f5e9' },
    { id: 'out_for_delivery', title: 'Out for Delivery', color: '#fce4ec' },
];

const OrderKanban = ({ orders = [], onUpdateStatus, onAssignPartner, onViewDetails }) => {
    const theme = useTheme();

    const getOrdersByStatus = (status) => {
        return orders.filter(order => {
            // Handle variations in status casing/string
            const s = order.orderStatus || order.status || 'placed';
            return s.toLowerCase() === status.toLowerCase();
        });
    };

    return (
        <Box sx={{ flexGrow: 1, overflowX: 'auto', py: 2 }}>
            <Grid container spacing={2} sx={{ minWidth: 1200 }}>
                {COLUMNS.map(column => (
                    <Grid item xs={2.4} key={column.id}>
                        <Paper
                            elevation={0}
                            sx={{
                                bgcolor: column.color,
                                p: 1.5,
                                borderRadius: 2,
                                minHeight: '70vh',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, px: 0.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                                    {column.title}
                                </Typography>
                                <Chip
                                    label={getOrdersByStatus(column.id).length}
                                    size="small"
                                    sx={{ fontWeight: 'bold', bgcolor: 'rgba(255,255,255,0.5)' }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {getOrdersByStatus(column.id).map(order => (
                                    <Card
                                        key={order._id}
                                        elevation={1}
                                        sx={{
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: theme.shadows[4]
                                            }
                                        }}
                                        onClick={() => onViewDetails(order)}
                                    >
                                        <CardContent sx={{ p: '12px !important' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                    #{order._id.slice(-6).toUpperCase()}
                                                </Typography>
                                                <IconButton size="small" onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Logic for quick actions menu could go here
                                                }}>
                                                    <MoreIcon fontSize="inherit" />
                                                </IconButton>
                                            </Box>

                                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }} noWrap>
                                                {order.user?.name || 'Guest User'}
                                            </Typography>

                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                                                <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDistanceToNow(new Date(order.createdAt))} ago
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                    ₹{order.totalPrice?.toFixed(2)}
                                                </Typography>

                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {order.deliveryPartner ? (
                                                        <Tooltip title={`Partner: ${order.deliveryPartner.name}`}>
                                                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main', fontSize: 12 }}>
                                                                {order.deliveryPartner.name?.[0]}
                                                            </Avatar>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title="Assign Partner">
                                                            <Avatar
                                                                sx={{ width: 24, height: 24, bgcolor: 'grey.300', cursor: 'pointer' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onAssignPartner(order);
                                                                }}
                                                            >
                                                                <PersonIcon sx={{ fontSize: 16 }} />
                                                            </Avatar>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default OrderKanban;
