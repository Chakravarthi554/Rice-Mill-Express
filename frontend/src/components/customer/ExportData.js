import React from 'react';
import {
  Paper, Typography, Button, Alert, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { exportUserData } from '../../redux/actions/userActions';

const ExportData = () => {
  const dispatch = useDispatch();
  const { loading, error, success, data } = useSelector(state => state.userExportData || {});

  const handleExport = () => dispatch(exportUserData());

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Export Your Data</Typography>
      <Typography sx={{ mb: 2 }}>Download a JSON copy of all your account data.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Exported! Check your downloads.</Alert>}
      <Button variant="contained" onClick={handleExport} disabled={loading}>
        {loading ? <CircularProgress size={20} /> : 'Export Now'}
      </Button>
      {data && (
        <a
          href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`}
          download="my_data.json"
          style={{ display: 'block', marginTop: 16 }}
        >
          Download JSON
        </a>
      )}
    </Paper>
  );
};
export default ExportData;