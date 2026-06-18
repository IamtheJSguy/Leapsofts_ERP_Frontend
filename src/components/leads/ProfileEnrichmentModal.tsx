import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { enrichmentSchema } from '@/utils/validators';
import { useQualifyLead } from '@/hooks/api/useLeads';
import { useUIStore } from '@/store/useUIStore';
import type { Lead } from '@/types';

interface ProfileEnrichmentModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

export const ProfileEnrichmentModal = ({ lead, open, onClose }: ProfileEnrichmentModalProps) => {
  const navigate = useNavigate();
  const qualifyLead = useQualifyLead();
  const addToast = useUIStore((s) => s.addToast);

  const { register, control, handleSubmit } = useForm({
    resolver: zodResolver(enrichmentSchema),
    defaultValues: {
      sections: [
        { title: 'Pain Points', content: '' },
        { title: 'Budget', content: '' },
        { title: 'Decision Timeline', content: '' },
        { title: 'Notes', content: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'sections' });

  const onSubmit = () => {
    if (!lead) return;
    qualifyLead.mutate(
      { id: lead._id },
      {
        onSuccess: () => {
          addToast({ message: 'Lead qualified', severity: 'success' });
          onClose();
          navigate('/kanban');
        },
        onError: () => addToast({ message: 'Qualification failed', severity: 'error' }),
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Qualify Lead — Enrichment</DialogTitle>
        <DialogContent>
          {fields.map((field, index) => (
            <Box key={field.id} sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                {...register(`sections.${index}.title`)}
                label="Section"
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                {...register(`sections.${index}.content`)}
                label="Content"
                multiline
                rows={2}
                fullWidth
              />
              <IconButton onClick={() => remove(index)} aria-label="Remove section">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={() => append({ title: '', content: '' })}>
            Add Section
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={qualifyLead.isPending}>
            {qualifyLead.isPending ? <CircularProgress size={20} /> : 'Qualify & Push to Kanban'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
