import React, { useState } from 'react';
import {
  Paper, Typography, TextField, Button,
  Alert, CircularProgress, Box
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { reportProblem } from '../../redux/actions/userActions';

const ReportProblem = () => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(state => state.userReportProblem || {});
  const [desc, setDesc] = useState('');

  const submit = (e) => {
    e.preventDefault();
    dispatch(reportProblem({ description: desc }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Report a Problem</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Thank you! We’ll review it soon.</Alert>}
      <Box component="form" onSubmit={submit}>
        <TextField
          fullWidth multiline rows={5}
          label="Describe the issue"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Submit'}
        </Button>
      </Box>
    </Paper>
  );
};
export default ReportProblem;