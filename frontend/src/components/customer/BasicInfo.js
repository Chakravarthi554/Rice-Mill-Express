// frontend/src/components/customer/BasicInfo.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Typography, TextField, Box, Avatar, Button, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { updateUserProfile } from '../../redux/actions/userActions';
import { USER_UPDATE_PROFILE_RESET } from '../../redux/constants/userConstants';

const BasicInfo = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const { loading, error, success } = useSelector(state => state.userUpdateProfile);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || '');
      setEmail(userInfo.email || '');
      setPhone(userInfo.phone || '');
      setGender(userInfo.gender || '');
      setDob(userInfo.dob ? new Date(userInfo.dob).toISOString().split('T')[0] : '');
      setPreviewImage(userInfo.profileImage);
    }
  }, [userInfo]);

  useEffect(() => {
    if (success) {
      setMessage('Profile Updated Successfully!');
      setTimeout(() => { setMessage(null); dispatch({ type: USER_UPDATE_PROFILE_RESET }); }, 3000);
    }
  }, [success, dispatch]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({ name, email, phone, gender, dob: dob || null, profileImage }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>Basic Information</Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar src={previewImage} sx={{ width: 100, height: 100, mr: 2 }} />
        <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
          Upload Photo
          <input type="file" hidden accept="image/*" onChange={handleImageChange} />
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}><TextField fullWidth label="Full Name" value={name} onChange={e => setName(e.target.value)} required /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Phone" value={phone} onChange={e => setPhone(e.target.value)} required /></Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth><InputLabel>Gender</InputLabel>
            <Select value={gender} onChange={e => setGender(e.target.value)} label="Gender">
              <MenuItem value=""><em>Prefer not to say</em></MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}><TextField fullWidth label="Date of Birth" type="date" value={dob} onChange={e => setDob(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
        <Button type="submit" variant="contained" disabled={loading}>Save Changes</Button>
        {loading && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px' }} />}
      </Box>
    </Box>
  );
};

export default BasicInfo;