import React, { useEffect } from 'react';
import {
  Paper, Typography, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton, Button, Alert, CircularProgress
} from '@mui/material';
import { Google, Facebook, Twitter, Delete } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  linkAccount, unlinkAccount, getUserDetails
} from '../../redux/actions/userActions';

const LinkedAccounts = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const { loading, error, success } = useSelector(state => state.userLinkedAccounts || {});

  const linked = userInfo?.linkedAccounts || [];

  useEffect(() => {
    if (success) dispatch(getUserDetails('profile'));
  }, [success, dispatch]);

  const handleLink = (provider) => dispatch(linkAccount(provider));
  const handleUnlink = (provider) => {
    if (window.confirm(`Unlink ${provider}?`)) dispatch(unlinkAccount(provider));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Linked Accounts</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
      <List>
        {['google', 'facebook', 'twitter'].map(p => (
          <ListItem key={p}>
            <ListItemText primary={p.charAt(0).toUpperCase() + p.slice(1)} />
            <ListItemSecondaryAction>
              {linked.includes(p) ? (
                <IconButton color="error" onClick={() => handleUnlink(p)} disabled={loading}>
                  <Delete />
                </IconButton>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={p === 'google' ? <Google /> : p === 'facebook' ? <Facebook /> : <Twitter />}
                  onClick={() => handleLink(p)}
                  disabled={loading}
                >
                  Link
                </Button>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
export default LinkedAccounts;