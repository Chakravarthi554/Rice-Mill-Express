import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Paper,
    Avatar,
    IconButton,
    Divider,
    Alert,
    CircularProgress,
    Badge,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextareaAutosize
} from '@mui/material';
import {
    Report,
    Visibility,
    FilterList,
    Refresh,
    Warning,
    CheckCircle,
    Block,
    Delete,
    NotificationsActive
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AdminReportsPanel = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.userLogin);

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        status: 'pending',
        severity: 'all',
        category: 'all',
        page: 1,
        limit: 20
    });
    const [selectedReport, setSelectedReport] = useState(null);
    const [actionDialog, setActionDialog] = useState(false);
    const [actionType, setActionType] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [banDuration, setBanDuration] = useState(7);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (userInfo?.role === 'admin') {
            fetchReports();
            fetchStats();
        }
    }, [filters, userInfo]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`/api/admin/forum/reports?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });
            const data = await response.json();
            setReports(data.reports || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/forum/reports/stats', {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleViewReport = async (reportId) => {
        try {
            const response = await fetch(`/api/admin/forum/reports/${reportId}`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });
            const data = await response.json();
            setSelectedReport(data);
        } catch (error) {
            console.error('Error fetching report details:', error);
        }
    };

    const handleTakeAction = async () => {
        if (!actionType || !selectedReport) return;

        setSubmitting(true);
        try {
            const response = await fetch(`/api/admin/forum/reports/${selectedReport.report._id}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    action: actionType,
                    adminNotes,
                    banDuration: actionType.includes('banned') ? banDuration : undefined
                })
            });

            if (response.ok) {
                alert('Action completed successfully!');
                setActionDialog(false);
                setSelectedReport(null);
                setActionType('');
                setAdminNotes('');
                fetchReports();
                fetchStats();
            } else {
                alert('Failed to take action');
            }
        } catch (error) {
            console.error('Error taking action:', error);
            alert('Error taking action');
        } finally {
            setSubmitting(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'info';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'under_review': return 'info';
            case 'resolved': return 'success';
            case 'dismissed': return 'default';
            default: return 'default';
        }
    };

    if (userInfo?.role !== 'admin') {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">Access denied. Admin privileges required.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Report sx={{ fontSize: 40, color: 'error.main' }} />
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Reports Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Review and moderate reported forum posts
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => { fetchReports(); fetchStats(); }}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            {/* Statistics Cards */}
            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                            <Typography variant="h4" fontWeight="bold">
                                {stats.pendingReports?.[0]?.count || 0}
                            </Typography>
                            <Typography variant="body2">Pending Reports</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                            <Typography variant="h4" fontWeight="bold">
                                {stats.highSeverityPending?.[0]?.count || 0}
                            </Typography>
                            <Typography variant="body2">High Severity</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                            <Typography variant="h4" fontWeight="bold">
                                {stats.totalReports?.[0]?.total || 0}
                            </Typography>
                            <Typography variant="body2">Total Reports</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                            <Typography variant="h4" fontWeight="bold">
                                {stats.byStatus?.find(s => s._id === 'resolved')?.count || 0}
                            </Typography>
                            <Typography variant="body2">Resolved</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="under_review">Under Review</MenuItem>
                                <MenuItem value="resolved">Resolved</MenuItem>
                                <MenuItem value="dismissed">Dismissed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Severity</InputLabel>
                            <Select
                                value={filters.severity}
                                label="Severity"
                                onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="low">Low</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filters.category}
                                label="Category"
                                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="spam">Spam</MenuItem>
                                <MenuItem value="inappropriate_content">Inappropriate</MenuItem>
                                <MenuItem value="intellectual_property">IP Violation</MenuItem>
                                <MenuItem value="false_information">False Info</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Reports List */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : reports.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        No reports found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        All clear! No reports match your current filters.
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {reports.map((report) => (
                        <Grid item xs={12} key={report._id}>
                            <Card sx={{
                                border: 2,
                                borderColor: report.severity === 'high' ? 'error.main' : 'divider',
                                '&:hover': { boxShadow: 6 }
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={report.severity?.toUpperCase()}
                                                    color={getSeverityColor(report.severity)}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={report.status}
                                                    color={getStatusColor(report.status)}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={report.reportCategory}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                            <Typography variant="h6" gutterBottom>
                                                {report.postId?.title || 'Post Deleted'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                <strong>Reason:</strong> {report.reportReason}
                                            </Typography>
                                            {report.additionalDetails && (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    "{report.additionalDetails}"
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<Visibility />}
                                                onClick={() => handleViewReport(report._id)}
                                            >
                                                Review
                                            </Button>
                                        </Box>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Avatar
                                                    src={report.reportedBy?.profilePic}
                                                    sx={{ width: 24, height: 24 }}
                                                >
                                                    {report.reportedBy?.name?.[0]}
                                                </Avatar>
                                                <Typography variant="caption">
                                                    {report.isAnonymous ? 'Anonymous' : report.reportedBy?.name}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(report.createdAt).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Report Detail Dialog */}
            <Dialog
                open={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                maxWidth="md"
                fullWidth
            >
                {selectedReport && (
                    <>
                        <DialogTitle sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Report />
                                <Typography variant="h6">Report Details</Typography>
                            </Box>
                        </DialogTitle>
                        <DialogContent sx={{ mt: 2 }}>
                            {/* Report Info */}
                            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" gutterBottom>Report Information</Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Severity:</Typography>
                                        <Chip label={selectedReport.report.severity} color={getSeverityColor(selectedReport.report.severity)} size="small" sx={{ ml: 1 }} />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Status:</Typography>
                                        <Chip label={selectedReport.report.status} color={getStatusColor(selectedReport.report.status)} size="small" sx={{ ml: 1 }} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">Reason:</Typography>
                                        <Typography variant="body2">{selectedReport.report.reportReason}</Typography>
                                    </Grid>
                                    {selectedReport.report.additionalDetails && (
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">Details:</Typography>
                                            <Typography variant="body2">{selectedReport.report.additionalDetails}</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>

                            {/* Post Info */}
                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Reported Post</Typography>
                                <Typography variant="h6">{selectedReport.report.postId?.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {selectedReport.report.postId?.content?.substring(0, 200)}...
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Author: {selectedReport.report.postId?.userId?.name}
                                    </Typography>
                                </Box>
                            </Paper>

                            {/* Other Reports */}
                            {selectedReport.otherReportsOnPost?.length > 0 && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                        {selectedReport.otherReportsOnPost.length} other report(s) on this post
                                    </Typography>
                                </Alert>
                            )}

                            {/* Actions */}
                            <Typography variant="subtitle2" gutterBottom>Take Action</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="warning"
                                        onClick={() => { setActionType('warning_sent'); setActionDialog(true); }}
                                    >
                                        Send Warning
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="error"
                                        onClick={() => { setActionType('post_removed'); setActionDialog(true); }}
                                    >
                                        Remove Post
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="error"
                                        onClick={() => { setActionType('user_banned_temp'); setActionDialog(true); }}
                                    >
                                        Ban User (Temp)
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => { setActionType('dismissed'); setActionDialog(true); }}
                                    >
                                        Dismiss Report
                                    </Button>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedReport(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Action Confirmation Dialog */}
            <Dialog open={actionDialog} onClose={() => setActionDialog(false)}>
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Are you sure you want to <strong>{actionType.replace(/_/g, ' ')}</strong>?
                    </Typography>

                    {actionType.includes('banned') && (
                        <TextField
                            fullWidth
                            type="number"
                            label="Ban Duration (days)"
                            value={banDuration}
                            onChange={(e) => setBanDuration(parseInt(e.target.value))}
                            sx={{ mt: 2 }}
                            helperText="0 for permanent ban"
                        />
                    )}

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Admin Notes (optional)"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        sx={{ mt: 2 }}
                        placeholder="Add internal notes about this action..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTakeAction}
                        variant="contained"
                        color="error"
                        disabled={submitting}
                    >
                        {submitting ? 'Processing...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminReportsPanel;
