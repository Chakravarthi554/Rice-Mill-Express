import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Link,
  Snackbar,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { submitKycApplication, getKycStatus } from '../../redux/actions/kycActions';
import FileUpload from '../components/common/FileUpload';

// Custom Alert component for Snackbar
const AlertSnackbar = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const steps = ['Business Details', 'Document Upload', 'Review & Submit'];

const SellerKycPage = React.memo(() => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      pinCode: '',
      country: 'India',
    },
  });
  const [files, setFiles] = useState({
    idProof: null,
    addressProof: null,
    businessProof: null,
    gstCertificate: null,
    panCard: null,
  });
  const [errors, setErrors] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo, loading: userLoginLoading } = useSelector((state) => state.userLogin || { userInfo: null, loading: true });
  const { loading: kycSubmitLoading, error: kycSubmitError, success: kycSubmitSuccess } = useSelector((state) => state.kycSubmit || {});
  const { status: kycStatusFromRedux, kycApplication: kycApplicationData, loading: kycStatusLoading, error: kycStatusError } = useSelector(
    (state) => state.kycStatus || { status: 'not_submitted', kycApplication: null }
  );

  const fetchKycData = useCallback(() => {
    if (userInfo && userInfo.role === 'seller' && !userLoginLoading && userInfo.token) {
      console.log('SellerKycPage: Attempting to fetch KYC status for seller:', userInfo.email);
      dispatch(getKycStatus());
    } else {
      console.log('SellerKycPage: Skip fetching KYC status. userInfo:', userInfo, 'userLoginLoading:', userLoginLoading, 'Token:', userInfo?.token);
    }
  }, [dispatch, userInfo, userLoginLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!userLoginLoading && userInfo?.token) {
        fetchKycData();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchKycData, userLoginLoading, userInfo?.token]);

  useEffect(() => {
    console.log('User info on mount:', userInfo);
  }, [userInfo]);

  useEffect(() => {
    if (!kycStatusLoading && userInfo && !userLoginLoading) {
      console.log('SellerKycPage: KYC Status effect triggered. Status:', kycStatusFromRedux, 'KYC App Data:', !!kycApplicationData, 'Error:', kycStatusError);

      if (kycStatusFromRedux === 'approved') {
        console.log('SellerKycPage: Detected KYC Approved, navigating to dashboard.');
        navigate('/seller/dashboard', { replace: true });
        return;
      } else if (kycStatusFromRedux === 'rejected') {
        console.log('SellerKycPage: Detected KYC Rejected, showing Snackbar and resetting form.');
        setSnackbarMessage(`Your KYC application was rejected. Reason: ${kycApplicationData?.reviewNotes || 'No reason provided'}. Please resubmit.`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setActiveStep(0);
        setFormData({
          businessName: '',
          businessType: '',
          gstNumber: '',
          panNumber: '',
          businessAddress: { street: '', city: '', state: '', pinCode: '', country: 'India' },
        });
        setFiles({
          idProof: null,
          addressProof: null,
          businessProof: null,
          gstCertificate: null,
          panCard: null,
        });
        setErrors({});
        return;
      } else if (kycStatusFromRedux === 'under_review' && kycApplicationData) {
        console.log('SellerKycPage: Detected KYC Under Review with data, setting activeStep to 2.');
        setSnackbarMessage('Your KYC application is under review.');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        setActiveStep(2);
        if (kycApplicationData && activeStep !== 2) {
          setFormData({
            businessName: kycApplicationData.businessName || '',
            businessType: kycApplicationData.businessType || '',
            gstNumber: kycApplicationData.gstNumber || '',
            panNumber: kycApplicationData.panNumber || '',
            businessAddress: kycApplicationData.businessAddress || {
              street: '',
              city: '',
              state: '',
              pinCode: '',
              country: 'India',
            },
          });
          const existingDocs = kycApplicationData.documents.reduce((acc, doc) => ({
            ...acc,
            [doc.documentType]: doc.documentUrl,
          }), {});
          setFiles(existingDocs);
        }
        return;
      } else if (kycStatusError && kycStatusError.response?.status === 401) {
        console.error('SellerKycPage: KYC status fetch failed due to 401, triggering logout:', kycStatusError);
        setSnackbarMessage('Session expired. Please log in again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } else if (kycStatusError) {
        console.error('SellerKycPage: KYC status fetch failed:', kycStatusError);
        setSnackbarMessage(`Failed to fetch KYC status: ${kycStatusError.message || 'Unauthorized. Please log in again.'}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  }, [kycStatusFromRedux, kycStatusLoading, kycApplicationData, kycStatusError, navigate, userInfo, userLoginLoading, activeStep]);

  useEffect(() => {
    if (kycSubmitSuccess) {
      console.log('SellerKycPage: KYC submission success detected by submit effect.');
      setSnackbarMessage('KYC Application successfully submitted! Review pending.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchKycData();
    } else if (kycSubmitError) {
      console.log('SellerKycPage: KYC submission error detected by submit effect:', kycSubmitError);
      setSnackbarMessage(kycSubmitError);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [kycSubmitSuccess, kycSubmitError, fetchKycData]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (file, field) => {
    console.log('SellerKycPage: handleFileChange triggered for', field, 'File received:', file?.name);
    setFiles((prev) => ({ ...prev, [field]: file }));
    setErrors((prev) => ({ ...prev, [field]: file ? '' : 'Required' }));
  };

  const handleNext = () => {
    console.log('handleNext called, activeStep:', activeStep, 'files:', files, 'errors:', errors);
    if (activeStep === 0) {
      const newErrors = {};
      if (!formData.businessName) newErrors.businessName = 'Required';
      if (!formData.businessType) newErrors.businessType = 'Required';
      if (!formData.gstNumber) newErrors.gstNumber = 'Required';
      if (!formData.panNumber) newErrors.panNumber = 'Required';
      if (!formData.businessAddress.street) newErrors['businessAddress.street'] = 'Required';
      if (!formData.businessAddress.city) newErrors['businessAddress.city'] = 'Required';
      if (!formData.businessAddress.state) newErrors['businessAddress.state'] = 'Required';
      if (!formData.businessAddress.pinCode) newErrors['businessAddress.pinCode'] = 'Required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    } else if (activeStep === 1) {
      const newErrors = {};
      const requiredFiles = ['idProof', 'addressProof', 'businessProof', 'gstCertificate', 'panCard'];
      requiredFiles.forEach((field) => {
        if (!files[field]) newErrors[field] = 'Required';
      });

      console.log('Validation result, newErrors:', newErrors);
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
    setErrors({});
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    const formDataToSend = new FormData();
    formDataToSend.append('businessName', formData.businessName);
    formDataToSend.append('businessType', formData.businessType);
    formDataToSend.append('gstNumber', formData.gstNumber);
    formDataToSend.append('panNumber', formData.panNumber);
    formDataToSend.append('businessAddress', JSON.stringify(formData.businessAddress));

    // Append all files in a single request
    Object.entries(files).forEach(([key, file]) => {
      if (file) formDataToSend.append(key, file);
    });

    console.log('SellerKycPage: Submitting application with formData:', Object.fromEntries(formDataToSend));
    dispatch(submitKycApplication(formDataToSend, navigate));
  };

  const renderKycForm = () => (
    <Grid container spacing={3}>
      {activeStep === 0 && (
        <>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Business Name"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              error={!!errors.businessName}
              helperText={errors.businessName}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Business Type"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              error={!!errors.businessType}
              helperText={errors.businessType}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="GST Number"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              error={!!errors.gstNumber}
              helperText={errors.gstNumber}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="PAN Number"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              error={!!errors.panNumber}
              helperText={errors.panNumber}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Business Address</Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              name="businessAddress.street"
              value={formData.businessAddress.street}
              onChange={handleChange}
              required
              error={!!errors['businessAddress.street']}
              helperText={errors['businessAddress.street']}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              name="businessAddress.city"
              value={formData.businessAddress.city}
              onChange={handleChange}
              required
              error={!!errors['businessAddress.city']}
              helperText={errors['businessAddress.city']}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State"
              name="businessAddress.state"
              value={formData.businessAddress.state}
              onChange={handleChange}
              required
              error={!!errors['businessAddress.state']}
              helperText={errors['businessAddress.state']}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="PIN Code"
              name="businessAddress.pinCode"
              value={formData.businessAddress.pinCode}
              onChange={handleChange}
              required
              error={!!errors['businessAddress.pinCode']}
              helperText={errors['businessAddress.pinCode']}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Country"
              name="businessAddress.country"
              value={formData.businessAddress.country}
              onChange={handleChange}
              disabled
            />
          </Grid>
        </>
      )}
      {activeStep === 1 && (
        <>
          <Grid item xs={12}>
            <FileUpload
              label="ID Proof"
              onFileSelect={(file) => handleFileChange(file, 'idProof')}
              acceptedTypes="image/*,.pdf"
            />
            {errors.idProof && <Alert severity="error">{errors.idProof}</Alert>}
          </Grid>
          <Grid item xs={12}>
            <FileUpload
              label="Address Proof"
              onFileSelect={(file) => handleFileChange(file, 'addressProof')}
              acceptedTypes="image/*,.pdf"
            />
            {errors.addressProof && <Alert severity="error">{errors.addressProof}</Alert>}
          </Grid>
          <Grid item xs={12}>
            <FileUpload
              label="Business Proof"
              onFileSelect={(file) => handleFileChange(file, 'businessProof')}
              acceptedTypes="image/*,.pdf"
            />
            {errors.businessProof && <Alert severity="error">{errors.businessProof}</Alert>}
          </Grid>
          <Grid item xs={12}>
            <FileUpload
              label="GST Certificate"
              onFileSelect={(file) => handleFileChange(file, 'gstCertificate')}
              acceptedTypes="image/*,.pdf"
            />
            {errors.gstCertificate && <Alert severity="error">{errors.gstCertificate}</Alert>}
          </Grid>
          <Grid item xs={12}>
            <FileUpload
              label="PAN Card"
              onFileSelect={(file) => handleFileChange(file, 'panCard')}
              acceptedTypes="image/*,.pdf"
            />
            {errors.panCard && <Alert severity="error">{errors.panCard}</Alert>}
          </Grid>
        </>
      )}
      {activeStep === 2 && (
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Review Your Application</Typography>
            <Typography variant="subtitle1" gutterBottom>Business Details</Typography>
            <Typography>Name: {formData.businessName}</Typography>
            <Typography>Type: {formData.businessType}</Typography>
            <Typography>GST: {formData.gstNumber}</Typography>
            <Typography>PAN: {formData.panNumber}</Typography>
            <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>Address</Typography>
            <Typography>{formData.businessAddress.street}</Typography>
            <Typography>
              {formData.businessAddress.city}, {formData.businessAddress.state}
            </Typography>
            <Typography>
              {formData.businessAddress.pinCode}, {formData.businessAddress.country}
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>Documents</Typography>
            {Object.entries(files).map(([key, file]) => (
              <Typography key={key}>
                {key}: {file ? file.name : 'Not uploaded'}
              </Typography>
            ))}
          </Paper>
        </Grid>
      )}
    </Grid>
  );

  const renderSubmittedReview = (data) => (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Your Application is Under Review</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Your KYC application has been submitted and is currently being reviewed by the admin.
      </Alert>
      <Typography variant="subtitle1" gutterBottom>Business Details</Typography>
      <Typography>Name: {data.businessName || 'N/A'}</Typography>
      <Typography>Type: {data.businessType || 'N/A'}</Typography>
      <Typography>GST: {data.gstNumber || 'N/A'}</Typography>
      <Typography>PAN: {data.panNumber || 'N/A'}</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2}} gutterBottom>Address</Typography>
      <Typography>{data.businessAddress?.street || 'N/A'}</Typography>
      <Typography>
        {data.businessAddress?.city || 'N/A'}, {data.businessAddress?.state || 'N/A'}
      </Typography>
      <Typography>
        {data.businessAddress?.pinCode || 'N/A'}, {data.businessAddress?.country || 'N/A'}
      </Typography>
      <Typography variant="subtitle1" sx={{ mt: 2}} gutterBottom>Documents</Typography>
      {data.documents &&
        data.documents.map((doc, index) => (
          <Typography key={index}>
            {doc.documentType}: <Link href={doc.documentUrl} target="_blank" rel="noopener noreferrer">View Document</Link>
          </Typography>
        ))}

      {data.reviewNotes && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2">Admin Notes:</Typography>
          <Typography>{data.reviewNotes}</Typography>
        </Box>
      )}
    </Paper>
  );

  if (kycStatusLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading KYC status...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Seller KYC Verification</Typography>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {kycSubmitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {kycSubmitError}
        </Alert>
      )}
      {kycStatusError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {kycStatusError.message || 'Failed to fetch KYC status. Please try again or log in.'}
        </Alert>
      )}
      {kycStatusFromRedux === 'under_review' && kycApplicationData ? (
        renderSubmittedReview(kycApplicationData)
      ) : (
        renderKycForm()
      )}
      {!(kycStatusFromRedux === 'under_review' && kycApplicationData) && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {activeStep !== 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
          )}
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit} disabled={kycSubmitLoading}>
              {kycSubmitLoading ? <CircularProgress size={24} /> : 'Submit Application'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      )}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <AlertSnackbar onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </AlertSnackbar>
      </Snackbar>
    </Container>
  );
});

export default SellerKycPage;