import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, Avatar, Chip, Button, LinearProgress, TextField, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    VerifiedUser as VerifiedIcon,
    Mail as MailIcon,
    Search as SearchIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { listUsers, deleteUser, updateUser } from '../../../redux/actions/adminActions';
import Loader from '../../common/Loader';
import Message from '../../common/Message';

const UsersTab = () => {
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const userList = useSelector((state) => state.userList);
    const { loading, error, users = [] } = userList;

    const userDelete = useSelector((state) => state.userDelete);
    const { loading: loadingDelete, success: successDelete, error: errorDelete } = userDelete || {};

    const userUpdate = useSelector((state) => state.userUpdate);
    const { loading: loadingUpdate, success: successUpdate, error: errorUpdate } = userUpdate || {};

    useEffect(() => {
        dispatch(listUsers());
    }, [dispatch]);

    useEffect(() => {
        if (successDelete) {
            setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        }
        if (errorDelete) {
            setSnackbar({ open: true, message: errorDelete, severity: 'error' });
        }
    }, [successDelete, errorDelete]);

    useEffect(() => {
        if (successUpdate) {
            setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
            setEditDialogOpen(false);
            setSelectedUser(null);
        }
        if (errorUpdate) {
            setSnackbar({ open: true, message: errorUpdate, severity: 'error' });
        }
    }, [successUpdate, errorUpdate]);

    const handleRefresh = () => {
        dispatch(listUsers());
        setSearchTerm(''); // Clear search on refresh
    };

    const handleEditOpen = (user) => {
        setSelectedUser(user);
        setEditForm({ name: user.name, email: user.email, role: user.role });
        setEditDialogOpen(true);
    };

    const handleDeleteOpen = (user) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleEditSave = () => {
        dispatch(updateUser({ _id: selectedUser._id, ...editForm }));
    };

    const handleDeleteConfirm = () => {
        dispatch(deleteUser(selectedUser._id));
    };

    const getRoleColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'error';
            case 'seller': return 'warning';
            case 'customer': return 'primary';
            default: return 'default';
        }
    };

    // Filter users based on search term
    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            user.name?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search) ||
            user.role?.toLowerCase().includes(search)
        );
    });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#111827' }}>
                        User Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        Manage platform access and roles for all users
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#6B7280' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 250 }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && <Message severity="error">{error}</Message>}

            {/* Search Results Info */}
            {searchTerm && (
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#374151' }}>
                        Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchTerm}"
                    </Typography>
                </Box>
            )}

            <TableContainer component={Paper} sx={{
                borderRadius: 4,
                border: '1px solid #E5E7EB',
                '& .MuiTableCell-root': { borderColor: '#E5E7EB', color: '#111827' },
                '& .MuiTableHead-root': { background: '#F9FAFB' }
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
                        {filteredUsers.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body1" color="#6B7280">
                                        {searchTerm ? 'No users match your search' : 'No users found'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user._id} sx={{ '&:hover': { background: '#F9FAFB' } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar src={user.profilePic} sx={{ bgcolor: '#38bdf8' }}>{user.name?.[0]}</Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{user.name}</Typography>
                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>ID: {user._id.substring(0, 8)}...</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MailIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
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
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#38bdf8', mr: 1 }}
                                                onClick={() => handleEditOpen(user)}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete User">
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#f87171' }}
                                                onClick={() => handleDeleteOpen(user)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                PaperProps={{
                    sx: {
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        borderRadius: 3,
                        minWidth: 400
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Edit User
                    <IconButton onClick={() => setEditDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Role</InputLabel>
                            <Select
                                value={editForm.role}
                                label="Role"
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                sx={{
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' }
                                }}
                                MenuProps={{
                                    PaperProps: { sx: { bgcolor: '#1e293b', color: 'white' } }
                                }}
                            >
                                <MenuItem value="customer">Customer</MenuItem>
                                <MenuItem value="seller">Seller</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setEditDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleEditSave}
                        disabled={loadingUpdate}
                        sx={{ background: '#38bdf8', '&:hover': { background: '#0ea5e9' } }}
                    >
                        {loadingUpdate ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                        borderRadius: 3
                    }
                }}
            >
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete user <strong>{selectedUser?.name}</strong>?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteConfirm}
                        disabled={loadingDelete}
                    >
                        {loadingDelete ? 'Deleting...' : 'Delete User'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UsersTab;
