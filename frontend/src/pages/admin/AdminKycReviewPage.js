import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Card, CardContent, Tabs, Tab,
  Divider, Button, TextField, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Paper,
  IconButton, Tooltip, Chip
} from '@mui/material';
import {
  Visibility, Check, Close, ZoomIn, Description, ArrowBack
} from '@mui/icons-material';
import {
  getKycApplications,
  reviewKycApplication
} from '../../redux/actions/kycActions';

const AdminKycReviewPage = () => {
  const { id } = useParams();               // :id from route
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [reviewNotes, setReviewNotes] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [decision, setDecision] = useState('');
  const [zoomDoc, setZoomDoc] = useState(null);

  // ---- Redux state ----
  const kycList = useSelector(state => state.kycApplications) || {};
  const { kycApplications = [], loading, error } = kycList;

  const kycReview = useSelector(state => state.kycReview) || {};
  const { loading: reviewLoading, success: reviewSuccess, error: reviewError } = kycReview;

  // ---- Find current application ----
  const application = kycApplications.find(a => a._id === id);

  // ---- Load all applications (to have data) ----
  useEffect(() => {
    if (kycApplications.length === 0) {
      dispatch(getKycApplications());
    }
  }, [dispatch, kycApplications.length]);

  // ---- After successful review, go back to list ----
  useEffect(() => {
    if (reviewSuccess) {
      setReviewNotes('');
      navigate('/admin/dashboard');   // or stay on list page
    }
  }, [reviewSuccess, navigate]);

  // ---- Handlers ----
  const handleConfirm = () => {
    if (decision === 'rejected' && !reviewNotes.trim()) return;
    dispatch(reviewKycApplication(id, {
      status: decision,
      reviewNotes: decision === 'rejected' ? reviewNotes : 'Approved by admin'
    }));
    setOpenDialog(false);
  };

  const statusChip = (status) => {
    const map = {
      pending: 'warning',
      under_review: 'info',
      approved: 'success',
      rejected: 'error'
    };
    return <Chip label={status.replace('_', ' ')} color={map[status]} size="small" sx={{ textTransform: 'capitalize' }} />;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  if (!application) return <Alert severity="info">Application not found.</Alert>;

  const { user = {}, documents = [], role = 'Seller', reviewNotes: existingNotes } = application;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>KYC Review – {user.name}</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {reviewError && <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert>}
      {reviewSuccess && <Alert severity="success" sx={{ mb: 2 }}>Application updated successfully.</Alert>}

      <Grid container spacing={3}>
        {/* Left – Applicant Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Applicant</Typography>
              <Typography><strong>Name:</strong> {user.name}</Typography>
              <Typography><strong>Email:</strong> {user.email}</Typography>
              <Typography><strong>Phone:</strong> {user.phone}</Typography>
              <Typography><strong>Role:</strong> {role}</Typography>
              {statusChip(application.status)}
            </CardContent>
          </Card>
        </Grid>

        {/* Right – Details & Docs */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Business Details */}
              <Typography variant="h6" gutterBottom>Business Info</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}><Typography><strong>GST:</strong> {application.gstNumber || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>PAN:</strong> {application.panNumber || 'N/A'}</Typography></Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Address */}
              <Typography variant="subtitle1" gutterBottom>Address</Typography>
              {application.businessAddress ? (
                <>
                  <Typography>{application.businessAddress.street}</Typography>
                  <Typography>{application.businessAddress.city}, {application.businessAddress.state}</Typography>
                  <Typography>{application.businessAddress.pinCode}, {application.businessAddress.country}</Typography>
                </>
              ) : <Typography>—</Typography>}

              <Divider sx={{ my: 2 }} />

              {/* Documents */}
              <Typography variant="subtitle1" gutterBottom>Uploaded Documents</Typography>
              <Grid container spacing={2}>
                {documents.map((doc, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Description color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">{doc.documentType}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" href={doc.documentUrl} target="_blank"
                                startIcon={<Visibility />}>View</Button>
                        <Tooltip title="Zoom"><IconButton size="small" onClick={() => setZoomDoc(doc.documentUrl)}><ZoomIn /></IconButton></Tooltip>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Action Buttons (only for pending/under_review) */}
              {['pending', 'under_review'].includes(application.status) && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <TextField fullWidth multiline rows={3} label="Review Notes (required: required for rejection)" 
                             value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="success" startIcon={<Check />}
                            onClick={() => { setDecision('approved'); setOpenDialog(true); }}
                            disabled={reviewLoading}>Approve</Button>
                    <Button variant="outlined" color="error" startIcon={<Close />}
                            onClick={() => { setDecision('rejected'); setOpenDialog(true); }}
                            disabled={reviewLoading}>Reject</Button>
                  </Box>
                </>
              )}

              {/* Existing notes */}
              {existingNotes && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Admin Notes:</Typography>
                  <Typography>{existingNotes}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirm Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm {decision === 'approved' ? 'Approval' : 'Rejection'}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {decision} this application?</Typography>
          {decision === 'rejected' && !reviewNotes.trim() && (
            <Alert severity="warning" sx={{ mt: 2 }}>Please add rejection notes.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained"
                  color={decision === 'approved' ? 'success' : 'error'}
                  disabled={decision === 'rejected' && !reviewNotes.trim()}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Zoom Dialog */}
      <Dialog open={!!zoomDoc} onClose={() => setZoomDoc(null)} maxWidth="md" fullWidth>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <img src={zoomDoc} alt="doc" style={{ maxWidth: '100%', height: 'auto' }} />
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setZoomDoc(null)}>Close</Button></DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminKycReviewPage;