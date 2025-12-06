import React, { useState, useEffect } from 'react';
import {
  Tabs, Tab, Badge, Box, Button, CircularProgress,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getKycApplications, reviewKycApplication } from '../../../redux/actions/kycActions';
import KycTable from '../../common/KycTable';

const KycReviewTab = () => {
  const dispatch = useDispatch();
  const [kycTab, setKycTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState('');

  const { kycApplications = [], loading } = useSelector(state => state.kycApplications) || {};
  const { success: reviewSuccess } = useSelector(state => state.kycReview) || {};

  const filtered = kycApplications.filter(app => {
    const search = (app.user?.name || app.businessName || '').toLowerCase();
    const phone = (app.user?.phone || '').toLowerCase();
    return (search.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm.toLowerCase())) &&
           (filterRole === 'all' || app.role === filterRole);
  });

  const pending = filtered.filter(a => a.status === 'under_review');
  const approved = filtered.filter(a => a.status === 'approved');
  const rejected = filtered.filter(a => a.status === 'rejected');

  useEffect(() => {
    dispatch(getKycApplications());
  }, [dispatch]);

  useEffect(() => {
    if (reviewSuccess) {
      setOpenReviewDialog(false);
      setReviewNotes('');
      dispatch(getKycApplications());
    }
  }, [reviewSuccess, dispatch]);

  const handleReview = (kyc) => {
    setSelectedKyc(kyc);
    setOpenReviewDialog(true);
  };

  const confirmReview = () => {
    if (reviewDecision === 'rejected' && !reviewNotes.trim()) return;
    dispatch(reviewKycApplication(selectedKyc._id, {
      status: reviewDecision,
      reviewNotes: reviewDecision === 'rejected' ? reviewNotes : 'Approved by admin'
    }));
  };

  return (
    <>
      <Tabs value={kycTab} onChange={(_, v) => setKycTab(v)} centered sx={{ mb: 3 }}>
        <Tab label={<Badge badgeContent={pending.length} color="error"><Box sx={{ px: 2 }}>Pending</Box></Badge>} />
        <Tab label={<Badge badgeContent={approved.length} color="success"><Box sx={{ px: 2 }}>Approved</Box></Badge>} />
        <Tab label={<Badge badgeContent={rejected.length} color="secondary"><Box sx={{ px: 2 }}>Rejected</Box></Badge>} />
      </Tabs>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search name/phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Role</InputLabel>
          <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} label="Role">
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="seller">Seller</MenuItem>
            <MenuItem value="buyer">Buyer</MenuItem>
          </Select>
        </FormControl>
        <Button startIcon={<RefreshIcon />} onClick={() => dispatch(getKycApplications())} size="small">
          Refresh
        </Button>
      </Box>

      {loading ? <Box textAlign="center" p={4}><CircularProgress /></Box> : (
        <>
          {kycTab === 0 && <KycTable data={pending} title="Pending Review" onReview={handleReview} />}
          {kycTab === 1 && <KycTable data={approved} title="Approved Applications" onReview={handleReview} />}
          {kycTab === 2 && <KycTable data={rejected} title="Rejected Applications" onReview={handleReview} />}
        </>
      )}

      <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review KYC – {selectedKyc?.user?.name || selectedKyc?.businessName}</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Notes (required for rejection)"
            value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} sx={{ mt: 2 }}
            error={reviewDecision === 'rejected' && !reviewNotes.trim()} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success"
            onClick={() => { setReviewDecision('approved'); confirmReview(); }}>
            Approve
          </Button>
          <Button variant="contained" color="error"
            onClick={() => { setReviewDecision('rejected'); confirmReview(); }}
            disabled={!reviewNotes.trim()}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default KycReviewTab;