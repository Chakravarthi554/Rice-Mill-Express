import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Stepper, Step, StepLabel,
  Button, TextField, Grid, Paper, Alert, CircularProgress,
  Link, Snackbar, Card, CardContent
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { submitKycApplication, getKycStatus } from '../../redux/actions/kycActions';
import FileUpload from '../../components/common/FileUpload';
import ChatWindow from '../../components/common/ChatWindow';

const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const steps = ['Business Details', 'Document Upload', 'Review & Submit'];

const SellerKycPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    businessAddress: { street: '', city: '', state: '', pinCode: '', country: 'India' },
  });
  const [files, setFiles] = useState({
    idProof: null,
    addressProof: null,
    businessProof: null,
    gstCertificate: null,
    panCard: null,
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [chatWithAdminOpen, setChatWithAdminOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo } = useSelector(state => state.userLogin || {});
  const { loading: submitLoading, error: submitError, success: submitSuccess } = useSelector(state => state.kycSubmit || {});
  const { status: kycStatus, kycApplication: kycData, loading: statusLoading } = useSelector(state => state.kycStatus || {});

  const fetchKyc = useCallback(() => {
    if (userInfo?.role === 'seller') {
      dispatch(getKycStatus());
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userInfo?.token) fetchKyc();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchKyc, userInfo]);

  useEffect(() => {
    if (!statusLoading && kycStatus) {
      if (kycStatus === 'approved') {
        navigate('/seller/dashboard', { replace: true });
      } else if (kycStatus === 'rejected' && kycData) {
        showSnackbar(`Rejected: ${kycData.reviewNotes || 'Please resubmit'}`, 'error');
        resetForm();
      } else if (kycStatus === 'under_review' && kycData) {
        showSnackbar('Your application is under review.', 'info');
        setActiveStep(2);
        populateFormFromKyc(kycData);
      }
    }
  }, [kycStatus, kycData, statusLoading, navigate]);

  useEffect(() => {
    if (submitSuccess) {
      showSnackbar('KYC submitted! Under review.', 'success');
      fetchKyc();
    } else if (submitError) {
      showSnackbar(submitError, 'error');
    }
  }, [submitSuccess, submitError, fetchKyc]);

  const showSnackbar = (msg, severity = 'success') => {
    setSnackbar({ open: true, message: msg, severity });
  };

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (file, field) => {
    setFiles(prev => ({ ...prev, [field]: file }));
    setErrors(prev => ({ ...prev, [field]: file ? '' : 'Required' }));
  };

  const validateStep = () => {
    const newErrors = {};

    if (activeStep === 0) {
      if (!formData.businessName) newErrors.businessName = 'Required';
      if (!formData.businessType) newErrors.businessType = 'Required';
      if (!formData.gstNumber) newErrors.gstNumber = 'Required';
      if (!formData.panNumber) newErrors.panNumber = 'Required';
      if (!formData.businessAddress.street) newErrors['businessAddress.street'] = 'Required';
      if (!formData.businessAddress.city) newErrors['businessAddress.city'] = 'Required';
      if (!formData.businessAddress.state) newErrors['businessAddress.state'] = 'Required';
      if (!formData.businessAddress.pinCode) newErrors['businessAddress.pinCode'] = 'Required';
    }

    if (activeStep === 1) {
      ['idProof', 'addressProof', 'businessProof', 'gstCertificate', 'panCard'].forEach(field => {
        if (!files[field]) newErrors[field] = 'Required';
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleSubmit = () => {
    const form = new FormData();
    form.append('businessName', formData.businessName);
    form.append('businessType', formData.businessType);
    form.append('gstNumber', formData.gstNumber);
    form.append('panNumber', formData.panNumber);
    form.append('businessAddress', JSON.stringify(formData.businessAddress));

    Object.entries(files).forEach(([key, file]) => {
      if (file) form.append(key, file);
    });

    dispatch(submitKycApplication(form, navigate));
  };

  const resetForm = () => {
    setFormData({
      businessName: '', businessType: '', gstNumber: '', panNumber: '',
      businessAddress: { street: '', city: '', state: '', pinCode: '', country: 'India' }
    });
    setFiles({ idProof: null, addressProof: null, businessProof: null, gstCertificate: null, panCard: null });
    setActiveStep(0);
    setErrors({});
  };

  const populateFormFromKyc = (data) => {
    setFormData({
      businessName: data.businessName || '',
      businessType: data.businessType || '',
      gstNumber: data.gstNumber || '',
      panNumber: data.panNumber || '',
      businessAddress: data.businessAddress || { street: '', city: '', state: '', pinCode: '', country: 'India' }
    });
    const docs = data.documents.reduce((acc, d) => ({ ...acc, [d.documentType]: d.documentUrl }), {});
    setFiles(docs);
  };

  const renderReview = (data) => (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Your Application is Under Review</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Your KYC is being reviewed. You will be notified once approved.
      </Alert>
      <Typography><strong>Name:</strong> {data.businessName}</Typography>
      <Typography><strong>GST:</strong> {data.gstNumber}</Typography>
      <Typography><strong>Documents:</strong></Typography>
      {data.documents.map((doc, i) => (
        <Typography key={i}>• {doc.documentType}: <Link href={doc.documentUrl} target="_blank">View</Link></Typography>
      ))}
      {data.reviewNotes && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography><strong>Admin Notes:</strong> {data.reviewNotes}</Typography>
        </Box>
      )}

      {/* Message Admin Button */}
      <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Need Help with KYC?
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          If you have questions about your KYC application or need assistance,
          you can message the admin directly.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setChatWithAdminOpen(true)}
          sx={{ mt: 1 }}
        >
          Message Admin about KYC
        </Button>
      </Box>
    </Paper>
  );

  if (statusLoading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography>Loading KYC status...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom>Seller KYC Verification</Typography>

      {/* Support Card */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💬 Need Help?
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Message our admin team directly for any KYC-related questions or assistance.
          </Typography>
          <Button
            variant="contained"
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            onClick={() => setChatWithAdminOpen(true)}
          >
            Message Admin
          </Button>
        </CardContent>
      </Card>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

      {kycStatus === 'under_review' && kycData ? (
        renderReview(kycData)
      ) : (
        <>
          <Grid container spacing={3}>
            {activeStep === 0 && (
              <>
                <Grid item xs={12}><TextField fullWidth label="Business Name *" name="businessName" value={formData.businessName} onChange={handleChange} error={!!errors.businessName} helperText={errors.businessName} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Business Type *" name="businessType" value={formData.businessType} onChange={handleChange} error={!!errors.businessType} helperText={errors.businessType} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="GST Number *" name="gstNumber" value={formData.gstNumber} onChange={handleChange} error={!!errors.gstNumber} helperText={errors.gstNumber} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="PAN Number *" name="panNumber" value={formData.panNumber} onChange={handleChange} error={!!errors.panNumber} helperText={errors.panNumber} /></Grid>
                <Grid item xs={12}><Typography variant="h6" sx={{ mt: 2 }}>Business Address</Typography></Grid>
                <Grid item xs={12}><TextField fullWidth label="Street *" name="businessAddress.street" value={formData.businessAddress.street} onChange={handleChange} error={!!errors['businessAddress.street']} helperText={errors['businessAddress.street']} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="City *" name="businessAddress.city" value={formData.businessAddress.city} onChange={handleChange} error={!!errors['businessAddress.city']} helperText={errors['businessAddress.city']} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="State *" name="businessAddress.state" value={formData.businessAddress.state} onChange={handleChange} error={!!errors['businessAddress.state']} helperText={errors['businessAddress.state']} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="PIN Code *" name="businessAddress.pinCode" value={formData.businessAddress.pinCode} onChange={handleChange} error={!!errors['businessAddress.pinCode']} helperText={errors['businessAddress.pinCode']} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Country" value="India" disabled /></Grid>
              </>
            )}

            {activeStep === 1 && (
              <>
                <Grid item xs={12}><FileUpload label="ID Proof" onUploadComplete={(f) => handleFileChange(f, 'idProof')} /></Grid>
                {errors.idProof && <Grid item xs={12}><Alert severity="error">{errors.idProof}</Alert></Grid>}
                <Grid item xs={12}><FileUpload label="Address Proof" onUploadComplete={(f) => handleFileChange(f, 'addressProof')} /></Grid>
                {errors.addressProof && <Grid item xs={12}><Alert severity="error">{errors.addressProof}</Alert></Grid>}
                <Grid item xs={12}><FileUpload label="Business Proof" onUploadComplete={(f) => handleFileChange(f, 'businessProof')} /></Grid>
                {errors.businessProof && <Grid item xs={12}><Alert severity="error">{errors.businessProof}</Alert></Grid>}
                <Grid item xs={12}><FileUpload label="GST Certificate" onUploadComplete={(f) => handleFileChange(f, 'gstCertificate')} /></Grid>
                {errors.gstCertificate && <Grid item xs={12}><Alert severity="error">{errors.gstCertificate}</Alert></Grid>}
                <Grid item xs={12}><FileUpload label="PAN Card" onUploadComplete={(f) => handleFileChange(f, 'panCard')} /></Grid>
                {errors.panCard && <Grid item xs={12}><Alert severity="error">{errors.panCard}</Alert></Grid>}
              </>
            )}

            {activeStep === 2 && (
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Review Your Application</Typography>
                  <Typography><strong>Business:</strong> {formData.businessName}</Typography>
                  <Typography><strong>GST:</strong> {formData.gstNumber}</Typography>
                  <Typography><strong>Address:</strong> {formData.businessAddress.street}, {formData.businessAddress.city}</Typography>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>Documents:</Typography>
                  {Object.entries(files).map(([k, f]) => (
                    <Typography key={k}>• {k}: {f ? (typeof f === 'string' ? f.split('/').pop() : f.name) : 'Not uploaded'}</Typography>
                  ))}
                </Paper>
              </Grid>
            )}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 1 }}>
            {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
            {activeStep === 2 ? (
              <Button variant="contained" onClick={handleSubmit} disabled={submitLoading}>
                {submitLoading ? <CircularProgress size={24} /> : 'Submit'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>Next</Button>
            )}
          </Box>
        </>
      )}

      {/* Chat Window for Admin */}
      {chatWithAdminOpen && (
        <ChatWindow
          receiverId={process.env.REACT_APP_ADMIN_USER_ID || 'admin'}
          receiverName="Admin"
          onClose={() => setChatWithAdminOpen(false)}
        />
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <AlertSnackbar onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </AlertSnackbar>
      </Snackbar>
    </Container>
  );
};

export default SellerKycPage;