import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, Avatar, Chip, Button, LinearProgress
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    VerifiedUser as VerifiedIcon,
    Mail as MailIcon
} from '@mui/icons-material';
import { listUsers } from '../../../redux/actions/adminActions';
import Loader from '../../common/Loader';
import Message from '../../common/Message';

const UsersTab = () => {
    const dispatch = useDispatch();

    const userList = useSelector((state) => state.userList);
    const { loading, error, users = [] } = userList;

    useEffect(() => {
        dispatch(listUsers());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(listUsers());
    };

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'error';
            case 'seller': return 'warning';
            case 'customer': return 'primary';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                        User Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Manage platform access and roles for all users
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading}
                    sx={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        '&:hover': { background: 'rgba(56, 189, 248, 0.3)' }
                    }}
                >
                    Refresh
                </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && <Message severity="error">{error}</Message>}

            <TableContainer component={Paper} sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', color: 'white' },
                '& .MuiTableHead-root': { background: 'rgba(255, 255, 255, 0.03)' }
            }}>
                <Table sx={{ minWidth: 650 }} size="medium">
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>User</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Role</strong></TableCell>
                            <TableCell><strong>Joined</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body1" color="rgba(255,255,255,0.4)">No users found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user._id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar src={user.profilePic} sx={{ bgcolor: '#38bdf8' }}>{user.name?.[0]}</Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{user.name}</Typography>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>ID: {user._id.substring(0, 8)}...</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MailIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
                                            <Typography variant="body2">{user.email}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role}
                                            size="small"
                                            color={getRoleColor(user.role)}
                                            sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit User">
                                            <IconButton size="small" sx={{ color: '#38bdf8', mr: 1 }}><EditIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete User">
                                            <IconButton size="small" sx={{ color: '#f87171' }}><DeleteIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default UsersTab;
