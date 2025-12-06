import React, { useEffect } from 'react';
import {
  Paper, Typography, List, ListItem, ListItemText,
  Button, Alert, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getRewards } from '../../redux/actions/userActions';

const RewardsWallet = () => {
  const dispatch = useDispatch();
  const { rewards, loading, error } = useSelector(state => state.userRewards || {});

  useEffect(() => {
    dispatch(getRewards());
  }, [dispatch]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Rewards Wallet</Typography>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {rewards?.balance ?? 0} Points
      </Typography>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <List>
        {(rewards?.history || []).map((h, i) => (
          <ListItem key={i}>
            <ListItemText
              primary={h.description}
              secondary={`${h.points > 0 ? '+' : ''}${h.points} pts – ${new Date(h.date).toLocaleDateString()}`}
            />
          </ListItem>
        ))}
      </List>
      <Button variant="contained" sx={{ mt: 2 }}>Redeem Points</Button>
    </Paper>
  );
};
export default RewardsWallet;