import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid, Typography, TextField, Box, Avatar, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress
} from '@mui/material';
import { PhotoCamera, Person } from '@mui/icons-material';
import { updateUserProfile } from '../../redux/actions/userActions';
import { USER_UPDATE_PROFILE_RESET } from '../../redux/constants/userConstants';

const BasicInfo = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const { user: userDetails } = useSelector(state => state.userDetails || {});
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
    const currentUser = userDetails && userDetails._id ? userDetails : userInfo;
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setGender(currentUser.gender || '');
      setDob(currentUser.dob ? new Date(currentUser.dob).toISOString().split('T')[0] : '');
      setPreviewImage(currentUser.profileImage);
    }
  }, [userInfo, userDetails]);

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
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 700 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 3 }}>
        Basic Information
      </Typography>

      {message && <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, p: 3, bgcolor: '#F0FDF4', borderRadius: 3, border: '1px solid #BBF7D0' }}>
        <Avatar
          src={previewImage}
          sx={{ width: 80, height: 80, border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          <Person />
        </Avatar>
        <Button
          variant="outlined"
          component="label"
          startIcon={<PhotoCamera />}
          sx={{ borderRadius: 3, fontWeight: 700, borderColor: '#16A34A', color: '#16A34A' }}
        >
          Upload Photo
          <input type="file" hidden accept="image/*" onChange={handleImageChange} />
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Full Name" value={name} onChange={e => setName(e.target.value)} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Phone" value={phone} onChange={e => setPhone(e.target.value)} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Gender</InputLabel>
            <Select value={gender} onChange={e => setGender(e.target.value)} label="Gender" sx={{ borderRadius: 3, bgcolor: '#F9FAFB' }}>
              <MenuItem value=""><em>Prefer not to say</em></MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Date of Birth" type="date" value={dob} onChange={e => setDob(e.target.value)} InputLabelProps={{ shrink: true }} InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2.5, borderTop: '1px solid #F3F4F6' }}>
        <Button type="submit" variant="contained" color="success" disabled={loading} startIcon={!loading && <Person />} sx={{ borderRadius: 3, px: 5, py: 1.2, fontWeight: 700 }}>
          {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default BasicInfo;
