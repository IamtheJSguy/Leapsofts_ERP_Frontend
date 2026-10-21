import { useEffect } from 'react';
import { Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { meetingSchema, type MeetingFormData } from '@/utils/validators';
import { MeetingFormFields } from '@/components/meetings/MeetingFormFields';
import { buildMeetingSubmitPayload, defaultMeetingFormValues } from '@/utils/meetingForm';
import { getDefaultMeetingTimeZone } from '@/utils/meetingTimezone';
import type { CreateMeetingPayload, User } from '@/types';
import { tokens } from '@/styles/tokens';

type MeetingCreateFormBlockProps = {
  calendarConnected: boolean;
  userOptions: User[];
  currentUser?: User | null;
  onSubmit: (payload: CreateMeetingPayload) => void | Promise<void>;
  isPending?: boolean;
  submitLabel?: string;
  resetKey?: string | number;
  density?: 'default' | 'compact';
  guestEmailsHelperText?: string;
};

export const MeetingCreateFormBlock = ({
  calendarConnected,
  userOptions,
  currentUser,
  onSubmit,
  isPending = false,
  submitLabel = 'Create Meeting',
  resetKey,
  density = 'compact',
  guestEmailsHelperText,
}: MeetingCreateFormBlockProps) => {
  const defaultTimeZone = getDefaultMeetingTimeZone(currentUser ?? undefined);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      ...defaultMeetingFormValues(currentUser, calendarConnected),
      timeZone: defaultTimeZone,
    } as MeetingFormData,
  });

  useEffect(() => {
    reset({
      ...defaultMeetingFormValues(currentUser, calendarConnected),
      timeZone: defaultTimeZone,
    } as MeetingFormData);
  }, [resetKey, calendarConnected, currentUser?._id, defaultTimeZone, reset]);

  useEffect(() => {
    setValue('sendGoogleInvite', calendarConnected);
  }, [calendarConnected, setValue]);

  const compact = density === 'compact';

  return (
    <form
      onSubmit={handleSubmit((data) => {
        void onSubmit(buildMeetingSubmitPayload(data, calendarConnected));
      })}
      style={{ display: 'flex', flexDirection: 'column', gap: compact ? 0 : undefined }}
    >
      <MeetingFormFields
        control={control}
        register={register}
        errors={errors}
        calendarConnected={calendarConnected}
        userOptions={userOptions}
        defaultTimeZone={defaultTimeZone}
        density={density}
        isCreate
        disabled={isPending}
        guestEmailsHelperText={guestEmailsHelperText}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isPending}
        sx={{
          alignSelf: 'flex-end',
          mt: compact ? 1 : 0,
          textTransform: 'none',
          fontWeight: 750,
          borderRadius: compact ? '10px' : '14px',
          ...(compact
            ? {}
            : {
                bgcolor: tokens.brand.primary,
                '&:hover': { bgcolor: tokens.brand.primaryDark },
              }),
        }}
      >
        {isPending ? 'Creating...' : submitLabel}
      </Button>
    </form>
  );
};
