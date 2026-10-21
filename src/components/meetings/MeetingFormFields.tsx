import { format } from 'date-fns';
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
  Autocomplete,
  Chip,
  Avatar,
  Grid,
  FormControl,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import LabelIcon from '@mui/icons-material/Label';
import VideocamIcon from '@mui/icons-material/Videocam';
import GroupIcon from '@mui/icons-material/Group';
import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { ModernDatePicker } from '@/components/common/ModernDatePicker';
import { ModernTimePicker } from '@/components/common/ModernTimePicker';
import { GuestEmailChipInput } from '@/components/common/GuestEmailChipInput';
import type { MeetingFormData } from '@/utils/validators';
import type { User } from '@/types';
import { tokens } from '@/styles/tokens';
import { listCommonTimeZones } from '@/utils/meetingTimezone';
import { useMemo } from 'react';

const fieldCaptionSx = {
  display: 'block',
  mb: 0.75,
  fontWeight: 700,
  color: 'text.secondary',
} as const;

const modernSelectFieldSx = (isDarkMode: boolean, compact: boolean) => ({
  borderRadius: compact ? '10px' : '12px',
  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
  fontWeight: 600,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: tokens.brand.primaryMuted,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: tokens.brand.primary,
    borderWidth: 1,
  },
  '& .MuiSelect-select': {
    py: compact ? 1 : 1.25,
    px: 2,
    display: 'flex',
    alignItems: 'center',
  },
});

const inputRadius = (compact: boolean) => (compact ? '10px' : '16px');

export type MeetingFormFieldsProps = {
  control: Control<MeetingFormData>;
  register: UseFormRegister<MeetingFormData>;
  errors: FieldErrors<MeetingFormData>;
  calendarConnected: boolean;
  userOptions: User[];
  defaultTimeZone: string;
  density?: 'default' | 'compact';
  isCreate?: boolean;
  disabled?: boolean;
  guestEmailsHelperText?: string;
};

export const MeetingFormFields = ({
  control,
  register,
  errors,
  calendarConnected,
  userOptions,
  defaultTimeZone,
  density = 'default',
  isCreate = true,
  disabled = false,
  guestEmailsHelperText = 'Lead email is invited automatically when a lead is linked.',
}: MeetingFormFieldsProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const compact = density === 'compact';
  const size = compact ? 'small' : 'medium';
  const mb = compact ? 1.5 : 3;
  const timeZoneOptions = useMemo(() => listCommonTimeZones(), []);

  return (
    <>
      <TextField
        {...register('title')}
        label="Meeting Title *"
        placeholder="e.g. Sales Weekly Sync"
        fullWidth
        size={size}
        disabled={disabled}
        error={!!errors.title}
        helperText={errors.title?.message}
        sx={{
          mt: compact ? 0 : 1,
          mb: errors.title ? 1.5 : mb,
          '& .MuiOutlinedInput-root': { borderRadius: inputRadius(compact) },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LabelIcon sx={{ color: 'text.secondary', fontSize: compact ? '1rem' : '1.2rem' }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        {...register('description')}
        label="Description (optional)"
        placeholder="Agenda or notes..."
        fullWidth
        size={size}
        disabled={disabled}
        multiline
        minRows={compact ? 2 : 2}
        maxRows={4}
        sx={{
          mb,
          '& .MuiOutlinedInput-root': { borderRadius: inputRadius(compact) },
        }}
      />

      {!calendarConnected && (
        <TextField
          {...register('meetingLink')}
          label="Meeting Link (URL) *"
          placeholder="https://meet.google.com/..."
          fullWidth
          size={size}
          disabled={disabled}
          error={!!errors.meetingLink}
          helperText={errors.meetingLink?.message}
          sx={{
            mb: errors.meetingLink ? 1.5 : mb,
            '& .MuiOutlinedInput-root': { borderRadius: inputRadius(compact) },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <VideocamIcon sx={{ color: 'text.secondary', fontSize: compact ? '1rem' : '1.2rem' }} />
              </InputAdornment>
            ),
          }}
        />
      )}

      <Controller
        name="participants"
        control={control}
        render={({ field, fieldState }) => (
          <Autocomplete
            multiple
            disabled={disabled}
            size={size}
            options={userOptions}
            getOptionLabel={(option) => {
              const name = `${option.firstName || ''} ${option.lastName || ''}`.trim();
              return name || option.email;
            }}
            value={userOptions.filter((u) => field.value?.includes(u._id))}
            onChange={(_, newValue) => {
              field.onChange(newValue.map((u) => u._id));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Participants *"
                placeholder="Search team members..."
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{
                  mb: fieldState.error ? 1.5 : mb,
                  '& .MuiOutlinedInput-root': { borderRadius: inputRadius(compact) },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <GroupIcon sx={{ color: 'text.secondary', fontSize: compact ? '1rem' : '1.2rem' }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              const initials =
                `${option.firstName?.charAt(0) || ''}${option.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
              const name = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email;
              return (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <Avatar
                    src={option.avatarUrl || undefined}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                    }}
                  >
                    {initials}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 650 }}>{name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{option.email}</Typography>
                  </Box>
                </Box>
              );
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const name = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email;
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={option._id}
                    label={name}
                    size="small"
                    {...tagProps}
                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                  />
                );
              })
            }
          />
        )}
      />

      <Controller
        name="scheduledAt"
        control={control}
        render={({ field, fieldState }) => {
          let dateObj: Date | null = null;
          let time24 = '09:00';
          if (field.value) {
            const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(field.value);
            if (match) {
              dateObj = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
              time24 = `${match[4]}:${match[5]}`;
            }
          }

          const handleDateChange = (newDate: Date | null) => {
            if (!newDate) {
              field.onChange('');
              return;
            }
            const datePart = format(newDate, 'yyyy-MM-dd');
            field.onChange(`${datePart}T${time24}`);
          };

          const handleTimeChange = (newTime24: string) => {
            const currentDate = dateObj || new Date();
            const datePart = format(currentDate, 'yyyy-MM-dd');
            field.onChange(`${datePart}T${newTime24}`);
          };

          return (
            <Box sx={{ mb: fieldState.error ? 1.5 : compact ? 1.5 : 2 }}>
              <Grid container spacing={compact ? 1.25 : 2} alignItems="flex-start">
                <Grid item xs={12} sm={4}>
                  <ModernDatePicker
                    label="Meeting Date *"
                    value={dateObj}
                    onChange={handleDateChange}
                    minDate={isCreate ? new Date() : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <ModernTimePicker
                    label="Meeting Time *"
                    value={time24}
                    onChange={handleTimeChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="durationMinutes"
                    control={control}
                    render={({ field: durField }) => (
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="caption" sx={fieldCaptionSx}>Duration</Typography>
                        <FormControl fullWidth size={size}>
                          <Select
                            value={durField.value ?? 30}
                            onChange={(e) => durField.onChange(Number(e.target.value))}
                            disabled={disabled}
                            sx={modernSelectFieldSx(isDarkMode, compact)}
                          >
                            {[15, 30, 45, 60, 90, 120].map((mins) => (
                              <MenuItem key={mins} value={mins}>{mins} min</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  />
                </Grid>
              </Grid>
              {fieldState.error && (
                <Typography variant="caption" sx={{ color: 'error.main', mt: 0.75, display: 'block', fontWeight: 600 }}>
                  {fieldState.error.message}
                </Typography>
              )}
            </Box>
          );
        }}
      />

      <Controller
        name="timeZone"
        control={control}
        render={({ field }) => (
          <Box sx={{ width: '100%', mb }}>
            <Typography variant="caption" sx={fieldCaptionSx}>Timezone</Typography>
            <FormControl fullWidth size={size}>
              <Select
                value={field.value || defaultTimeZone}
                onChange={(e) => field.onChange(e.target.value)}
                disabled={disabled}
                sx={modernSelectFieldSx(isDarkMode, compact)}
              >
                {timeZoneOptions.map((tz) => (
                  <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      />

      <Controller
        name="guestEmails"
        control={control}
        render={({ field }) => (
          <GuestEmailChipInput
            value={field.value ?? []}
            onChange={field.onChange}
            disabled={disabled}
            helperText={guestEmailsHelperText}
            sx={{ mb }}
          />
        )}
      />
    </>
  );
};
