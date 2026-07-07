import { useState } from 'react';
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
} from '@mui/material';


export interface ProjectFormData {
  title: string;
  type: string;
  description: string;
  status: string;
  techStack: string[];
}

interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  isSubmitting?: boolean;
}

export const ProjectFormDialog = ({ open, onClose, onSubmit, isSubmitting }: ProjectFormDialogProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    type: 'Internal Product',
    description: '',
    status: 'In Development',
    techStack: [],
  });

  const [techInput, setTechInput] = useState('');

  const handleSubmit = () => {
    // Add pending tech stack if any
    let finalTech = formData.techStack;
    if (techInput.trim()) {
      finalTech = [...finalTech, techInput.trim()];
    }

    onSubmit({ ...formData, techStack: finalTech });

    // Reset form
    setFormData({
      title: '',
      type: 'Internal Product',
      description: '',
      status: 'In Development',
      techStack: [],
    });
    setTechInput('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: 'text.primary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, pb: 2, mb: 2 }}>
        New Project
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="Project Title"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            variant="outlined"
            size="small"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label="Type"
              fullWidth
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              variant="outlined"
              size="small"
            >
              <MenuItem value="Internal Product">Internal Product</MenuItem>
              <MenuItem value="Client">Client</MenuItem>
            </TextField>

            <TextField
              select
              label="Status"
              fullWidth
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              variant="outlined"
              size="small"
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="In Development">In Development</MenuItem>
              <MenuItem value="On Hold">On Hold</MenuItem>
            </TextField>
          </Box>

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            variant="outlined"
            size="small"
          />

          <Box>
            <TextField
              label="Tech Stack (Press Enter to add)"
              fullWidth
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && techInput.trim()) {
                  e.preventDefault();
                  setFormData({ ...formData, techStack: [...formData.techStack, techInput.trim()] });
                  setTechInput('');
                }
              }}
              variant="outlined"
              size="small"
            />
            {formData.techStack.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                {formData.techStack.map((tech, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 650 }}>{tech}</Typography>
                    <Box
                      component="span"
                      onClick={() => setFormData({ ...formData, techStack: formData.techStack.filter((_, i) => i !== idx) })}
                      sx={{ cursor: 'pointer', fontSize: '10px', color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                    >
                      ✕
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, pt: 2, mt: 1 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.title || isSubmitting}
          variant="contained"
          sx={{
            bgcolor: '#FF5733',
            color: '#fff',
            fontWeight: 700,
            borderRadius: '24px',
            '&:hover': { bgcolor: '#E04A2A' }
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
