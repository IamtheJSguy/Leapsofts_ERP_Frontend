import type { CreateMeetingPayload } from '@/types';
import type { MeetingFormData } from '@/utils/validators';
import { wallClockToUtcIso } from '@/utils/meetingTimezone';
import { getDefaultMeetingTimeZone } from '@/utils/meetingTimezone';
import type { User } from '@/types';

export const normalizeMeetingLink = (link?: string): string | undefined => {
  const trimmed = link?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export type MeetingSubmitExtras = {
  leadId?: string;
  allowSchedulingConflict?: boolean;
};

export const buildMeetingSubmitPayload = (
  data: MeetingFormData,
  calendarConnected: boolean,
  extras?: MeetingSubmitExtras,
): CreateMeetingPayload => {
  const meetingLink = calendarConnected ? undefined : normalizeMeetingLink(data.meetingLink);

  return {
    title: data.title,
    description: data.description?.trim() || undefined,
    scheduledAt: wallClockToUtcIso(data.scheduledAt, data.timeZone),
    timeZone: data.timeZone,
    durationMinutes: data.durationMinutes ?? 30,
    guestEmails: data.guestEmails ?? [],
    participants: data.participants ?? [],
    sendGoogleInvite: calendarConnected,
    ...(meetingLink ? { meetingLink } : {}),
    ...extras,
  };
};

export const defaultMeetingFormValues = (
  user?: User | null,
  calendarConnected = false,
): Partial<MeetingFormData> => ({
  title: '',
  description: '',
  meetingLink: '',
  scheduledAt: '',
  timeZone: getDefaultMeetingTimeZone(user ?? undefined),
  durationMinutes: 30,
  guestEmails: [],
  sendGoogleInvite: calendarConnected,
  participants: user?._id ? [user._id] : [],
});
