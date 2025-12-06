import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress } from '@mui/material';
import { getSearchLogs } from '../../redux/actions/adminActions';

const SearchLogs = () => {
  const dispatch = useDispatch();
  const { logs = [], loading, error } = useSelector((state) => state.searchLogs || {});

  useEffect(() => {
    dispatch(getSearchLogs());
  }, [dispatch]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '8px' }}>
      <Table>
        <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Query</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Results Count</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log._id}>
              <TableCell>{log.searchQuery}</TableCell>
              <TableCell>{log.resultsCount}</TableCell>
              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SearchLogs;