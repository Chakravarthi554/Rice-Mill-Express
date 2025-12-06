import React, { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip, Button,
  Collapse, Box, Grid, Typography, IconButton, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { ExpandMore, ExpandLess, ZoomIn, Close } from '@mui/icons-material';

const StatusChip = ({ status }) => {
  const colors = { approved: '#4caf50', rejected: '#f44336', under_review: '#ff9800' };
  return (
    <Chip label={status.replace('_', ' ').toUpperCase()} size="small"
      sx={{ backgroundColor: colors[status] || '#ff9800', color: 'white', fontWeight: 600 }} />
  );
};

const KycTable = ({ data, title, onReview }) => {
  const [expanded, setExpanded] = useState({});
  const [previewUrl, setPreviewUrl] = useState('');
  const [openPreview, setOpenPreview] = useState(false);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>{title} ({data.length})</Typography>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#1976d2' }}>
          <TableRow>
            {['Name', 'Phone', 'Role', 'Submitted', 'Documents', 'Status', 'Action'].map(h => (
              <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(k => (
            <React.Fragment key={k._id}>
              <TableRow hover>
                <TableCell>{k.user?.name || k.businessName || '—'}</TableCell>
                <TableCell>{k.user?.phone || '—'}</TableCell>
                <TableCell>{k.role || 'Seller'}</TableCell>
                <TableCell>{formatDate(k.createdAt)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {k.documents.length} doc{k.documents.length !== 1 ? 's' : ''}
                    </Typography>
                    <IconButton size="small" onClick={() => setExpanded(prev => ({ ...prev, [k._id]: !prev[k._id] }))}>
                      {expanded[k._id] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell><StatusChip status={k.status} /></TableCell>
                <TableCell>
                  {k.status === 'under_review' ? (
                    <Button size="small" variant="contained" onClick={() => onReview(k)}>Review</Button>
                  ) : (
                    <Chip label="Done" color="success" size="small" />
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 0 }}>
                  <Collapse in={expanded[k._id]} timeout="auto">
                    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>All Documents</Typography>
                      <Grid container spacing={2}>
                        {k.documents.map((d, i) => (
                          <Grid item xs={12} sm={6} md={3} key={i}>
                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Typography variant="caption" display="block" gutterBottom>{d.documentType}</Typography>
                              <Button size="small" variant="outlined" startIcon={<ZoomIn />}
                                onClick={() => { setPreviewUrl(d.documentUrl); setOpenPreview(true); }} fullWidth>
                                View
                              </Button>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Document Preview
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setOpenPreview(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center">
            <img src={previewUrl} alt="doc" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }} />
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default KycTable;