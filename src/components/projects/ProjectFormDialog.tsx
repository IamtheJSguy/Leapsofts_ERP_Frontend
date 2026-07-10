import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  useTheme,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import type { ProjectStatus } from '@/types';

export interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
  tags: string[];
}

interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  isSubmitting?: boolean;
  initialData?: {
    name: string;
    description: string;
    status: ProjectStatus;
    tags: string[];
  };
}

export const ProjectFormDialog = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}: ProjectFormDialogProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'in_development',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        status: initialData.status || 'in_development',
        tags: initialData.tags || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'in_development',
        tags: [],
      });
    }
    setTagInput('');
  }, [initialData, open]);

  const handleSubmit = () => {
    let finalTags = [...formData.tags];
    if (tagInput.trim() && !finalTags.includes(tagInput.trim())) {
      finalTags.push(tagInput.trim());
    }

    onSubmit({ ...formData, tags: finalTags });
    onClose();
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmed] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDarkMode ? '#1A1625' : '#fff',
          backgroundImage: 'none',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          color: 'text.primary',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          pb: 2,
          px: 3,
        }}
      >
        {initialData ? 'Edit Project' : 'New Project'}
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="Project Name"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            variant="outlined"
            size="small"
            InputProps={{
              sx: { borderRadius: '12px' },
            }}
          />

          <TextField
            select
            label="Status"
            fullWidth
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
            variant="outlined"
            size="small"
            InputProps={{
              sx: { borderRadius: '12px' },
            }}
          >
            <MenuItem value="in_development">In Development</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="on_hold">On Hold</MenuItem>
          </TextField>

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            variant="outlined"
            size="small"
            InputProps={{
              sx: { borderRadius: '12px' },
            }}
          />

          <Box>
            <TextField
              label="Tags (Press Enter to add)"
              fullWidth
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              variant="outlined"
              size="small"
              InputProps={{
                sx: { borderRadius: '12px' },
              }}
            />
            {formData.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                {formData.tags.map((tag, idx) => (
                  <Chip
                    key={idx}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      fontWeight: 650,
                      borderRadius: '8px',
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '24px',
            px: 2.5,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.name.trim() || isSubmitting}
          variant="contained"
          sx={{
            bgcolor: '#FF5733',
            color: '#fff',
            fontWeight: 700,
            borderRadius: '24px',
            textTransform: 'none',
            px: 3,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#E04A2A', boxShadow: 'none' },
            '&.Mui-disabled': {
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
              color: 'text.disabled',
            },
          }}
        >
          {isSubmitting
            ? 'Saving...'
            : initialData
            ? 'Save Changes'
            : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
