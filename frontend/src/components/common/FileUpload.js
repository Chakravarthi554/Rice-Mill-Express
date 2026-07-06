import React, { useState, useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FileUpload = ({ label, onUploadComplete, acceptedTypes = 'image/jpeg,image/png,application/pdf', multiple = false, existingFiles = [] }) => {
  const [fileNames, setFileNames] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const newFileNames = (existingFiles || []).map((f) =>
      typeof f === 'string' ? f.split('/').pop() : f.name
    );
    const changed = newFileNames.length !== fileNames.length || newFileNames.some((name, i) => name !== fileNames[i]);
    if (changed) setFileNames(newFileNames);
  }, [JSON.stringify(existingFiles)]);

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) {
      setFileNames([]);
      setFiles([]);
      if (onUploadComplete) onUploadComplete(multiple ? [] : null);
      return;
    }
    setFiles(multiple ? chosen : [chosen[0]]);
    setFileNames(chosen.map((f) => f.name));
    if (onUploadComplete) onUploadComplete(multiple ? chosen : chosen[0]);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, color: 'text.secondary' }}>{label}</Typography>
      <input
        id={`file-upload-${label}`}
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <label htmlFor={`file-upload-${label}`}>
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUploadIcon />}
          sx={{ bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } }}
        >
          {fileNames.length ? `${fileNames.length} file(s)` : 'Upload File'}
        </Button>
      </label>
      {fileNames.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {fileNames.map((n, idx) => (
            <Typography key={idx} variant="body2" sx={{ color: 'text.secondary' }}>• {n}</Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;