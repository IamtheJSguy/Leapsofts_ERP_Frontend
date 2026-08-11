import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { leadSchema, type LeadFormData } from '@/utils/validators';
import type { Lead } from '@/types';
import { useIcps, useProfiles } from '@/hooks/api/useSettings';
import { composeProspectName, splitProspectName } from '@/utils/formatters';

interface LeadFormProps {
  open: boolean;
  lead?: Lead | null;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => void;
  isPending?: boolean;
}

export const LeadForm = ({ open, lead, onClose, onSubmit, isPending }: LeadFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: lead
      ? {
          ...lead,
          prospectName: composeProspectName(lead),
        }
      : {},
  });
  const { data: icps } = useIcps();
  const { data: profiles } = useProfiles();
  const prospectNameValue = watch('prospectName') || '';

  const handleFormSubmit = (data: LeadFormData) => {
    const nameParts = splitProspectName(data.prospectName || '');
    onSubmit({
      ...data,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      prospectName: nameParts.prospectName.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{lead ? 'Edit Lead' : 'Create Lead'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prospect Name"
                fullWidth
                value={prospectNameValue}
                onChange={(e) => {
                  const parts = splitProspectName(e.target.value);
                  setValue('prospectName', parts.prospectName, { shouldDirty: true });
                  setValue('firstName', parts.firstName, { shouldDirty: true });
                  setValue('lastName', parts.lastName, { shouldDirty: true });
                }}
                error={!!errors.prospectName}
                helperText={errors.prospectName?.message}
              />
            </Grid>
            {(
              [
                ['email', 'Email'],
                ['linkedInUrl', 'LinkedIn URL'],
                ['salesNavigatorUrl', 'Sales Navigator URL'],
                ['company', 'Company'],
                ['title', 'Title'],
                ['industry', 'Industry'],
                ['companySize', 'Company Size'],
                ['location', 'Location'],
                ['phone', 'Phone'],
                ['leadStatus', 'Lead Status'],
                ['date', 'Date'],
                ['linkedinMsg', 'LinkedIn Msg'],
                ['commentsAfterCall', 'Comments after Call'],
                ['notes', 'Notes'],
              ] as const
            ).map(([field, label]) => (
              <Grid item xs={12} sm={6} key={field}>
                <TextField
                  {...register(field)}
                  label={label}
                  fullWidth
                  error={!!errors[field]}
                  helperText={errors[field]?.message}
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6}>
              <Controller
                name="icp"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    select
                    label="ICP"
                    fullWidth
                    error={!!errors.icp}
                    helperText={errors.icp?.message}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {(icps || []).map((icp) => (
                      <MenuItem key={icp._id} value={icp.name}>
                        {icp.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="profile"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    select
                    label="Profile"
                    fullWidth
                    error={!!errors.profile}
                    helperText={errors.profile?.message}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {(profiles || []).map((p) => (
                      <MenuItem key={p._id} value={p.name}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
