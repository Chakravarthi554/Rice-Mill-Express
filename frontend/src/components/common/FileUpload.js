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
    <Box className="mb-4">
      <Typography variant="subtitle1" className="mb-2 text-gray-700">{label}</Typography>
      <input
        id={`file-upload-${label}`}
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
      <label htmlFor={`file-upload-${label}`}>
        <Button
          variant="contained"
          component="span"
          startIcon={<CloudUploadIcon />}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {fileNames.length ? `${fileNames.length} file(s)` : 'Upload File'}
        </Button>
      </label>
      {fileNames.length > 0 && (
        <Box className="mt-2">
          {fileNames.map((n, idx) => (
            <Typography key={idx} variant="body2" className="text-gray-600">• {n}</Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;