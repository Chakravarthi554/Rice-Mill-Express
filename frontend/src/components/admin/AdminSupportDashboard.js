import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    CircularProgress,
    Tooltip
} from '@mui/material';
import { Chat, CheckCircle, HourglassEmpty, Refresh } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const AdminSupportDashboard = () => {
    const { userInfo } = useSelector(state => state.userLogin);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            };
            const url = statusFilter
                ? `/api/support/admin/tickets?status=${statusFilter}`
                : '/api/support/admin/tickets';
            const { data } = await axios.get(url, config);
            setTickets(data.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo && userInfo.role === 'admin') {
            fetchTickets();
        }
    }, [userInfo, statusFilter]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            };
            await axios.put(`/api/support/admin/tickets/${id}`, { status: newStatus }, config);
            fetchTickets();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'open': return <Chip label="Open" color="error" size="small" />;
            case 'in-progress': return <Chip label="In Progress" color="warning" size="small" />;
            case 'resolved': return <Chip label="Resolved" color="success" size="small" />;
            case 'closed': return <Chip label="Closed" color="default" size="small" />;
            default: return <Chip label={status} size="small" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'low': return '#4caf50';
            case 'medium': return '#ff9800';
            case 'high': return '#f44336';
            case 'urgent': return '#d32f2f';
            default: return '#757575';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Support Ticket Management
                </Typography>
                <IconButton onClick={fetchTickets} disabled={loading}>
                    <Refresh />
                </IconButton>
            </Box>

            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status Filter"
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="">All Tickets</MenuItem>
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                    Total Tickets: {tickets.length}
                </Typography>
            </Paper>

            <TableContainer component={Paper}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell>Subject</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Priority</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Last Updated</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">No tickets found</TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((ticket) => (
                                    <TableRow key={ticket._id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {ticket.user?.name}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {ticket.user?.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{ticket.subject}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                {ticket.category}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: getPriorityColor(ticket.priority)
                                                }} />
                                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                    {ticket.priority}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{getStatusChip(ticket.status)}</TableCell>
                                        <TableCell>
                                            {new Date(ticket.updatedAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                {ticket.status !== 'resolved' && (
                                                    <Tooltip title="Mark Resolved">
                                                        <IconButton
                                                            color="success"
                                                            onClick={() => handleUpdateStatus(ticket._id, 'resolved')}
                                                            size="small"
                                                        >
                                                            <CheckCircle fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {ticket.status === 'open' && (
                                                    <Tooltip title="Start Working">
                                                        <IconButton
                                                            color="warning"
                                                            onClick={() => handleUpdateStatus(ticket._id, 'in-progress')}
                                                            size="small"
                                                        >
                                                            <HourglassEmpty fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>
        </Container>
    );
};

export default AdminSupportDashboard;
