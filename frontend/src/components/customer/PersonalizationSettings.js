// frontend/src/components/customer/PersonalizationSettings.js - Updated
import React, { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Typography, Paper, Box, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { updateUserProfile } from '../../redux/actions/userActions';
import { USER_UPDATE_PROFILE_RESET } from '../../redux/constants/userConstants';
import { AuthContext } from '../../context/AuthContext';

const PersonalizationSettings = () => {
  const dispatch = useDispatch();
  const { t } = useContext(AuthContext);
  
  const { userInfo } = useSelector((state) => state.userLogin);
  const { loading, error, success } = useSelector((state) => state.userUpdateProfile);

  // Local state for form fields
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [message, setMessage] = useState(null);

  // Populate local state when userInfo loads/changes
  useEffect(() => {
    if (userInfo?.personalization) {
      setBio(userInfo.personalization.bio || '');
      setTagline(userInfo.personalization.tagline || '');
    }
    dispatch({ type: USER_UPDATE_PROFILE_RESET });
  }, [userInfo, dispatch]);

  // Handle success message & reset
  useEffect(() => {
    if (success) {
      setMessage(t('personalizationUpdated'));
      const timer = setTimeout(() => {
        setMessage(null);
        dispatch({ type: USER_UPDATE_PROFILE_RESET });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch, t]);

   // Cleanup reset on unmount
   useEffect(() => {
       return () => { dispatch({ type: USER_UPDATE_PROFILE_RESET }); }
   }, [dispatch]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);
    dispatch(
        updateUserProfile({
            personalization: {
                bio: bio,
                tagline: tagline,
            }
        })
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, boxShadow: 'none' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}> 
              {t('personalization')} 
            </Typography>

            {/* Feedback Alerts */}
            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

             {/* Bio / About Me */}
             <Box sx={{ mb: 3 }}>
                 <Typography variant="subtitle1" gutterBottom> 
                   {t('bio')} 
                 </Typography>
                 <TextField
                     fullWidth multiline rows={4}
                     label={t('bioPlaceholder') || "Tell us a bit about yourself (optional)"}
                     value={bio} onChange={(e) => setBio(e.target.value)}
                     variant="outlined" inputProps={{ maxLength: 250 }}
                     helperText={`${bio.length}/250 characters`}
                 />
             </Box>

             {/* Profile Tagline / Status */}
             <Box sx={{ mb: 3 }}>
                 <Typography variant="subtitle1" gutterBottom> 
                   {t('tagline')} 
                 </Typography>
                 <TextField
                     fullWidth
                     label={t('taglinePlaceholder') || "Short tagline or status (optional)"}
                     value={tagline} onChange={(e) => setTagline(e.target.value)}
                     variant="outlined" inputProps={{ maxLength: 100 }}
                     helperText={`${tagline.length}/100 characters`}
                 />
             </Box>

             {/* Save Button */}
             <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                <Button type="submit" variant="contained" disabled={loading}>
                    {t('save')}
                </Button>
                {loading && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }} />}
             </Box>
        </Paper>
     </Box>
  );
};

export default PersonalizationSettings;