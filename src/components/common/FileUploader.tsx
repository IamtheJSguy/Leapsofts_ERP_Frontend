import { useCallback, useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileUploaderProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  progress?: number;
}

export const FileUploader = ({
  accept = '.csv,.xlsx,.xls',
  maxSizeMB = 10,
  onFileSelect,
  isUploading = false,
  progress = 0,
}: FileUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const validateAndSelect = useCallback(
    (file: File) => {
      setError('');
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be under ${maxSizeMB}MB`);
        return;
      }
      onFileSelect(file);
    },
    [maxSizeMB, onFileSelect],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 4,
        textAlign: 'center',
        borderStyle: 'dashed',
        bgcolor: dragOver ? 'action.hover' : 'background.paper',
        cursor: 'pointer',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
      <Typography variant="body1" gutterBottom>
        Drag & drop CSV or Excel file here
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Max {maxSizeMB}MB — .csv, .xlsx, .xls
      </Typography>
      <Button variant="outlined" component="label" disabled={isUploading}>
        Browse Files
        <input
          type="file"
          hidden
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateAndSelect(file);
          }}
        />
      </Button>
      {error && (
        <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption">{progress}%</Typography>
        </Box>
      )}
    </Paper>
  );
};
