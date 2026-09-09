import { isPast } from 'date-fns';

import type { Meeting, User } from '@/types';

export const canEditOrDeleteMeeting = (
  meeting: Meeting,
  currentUser: User | null | undefined,
  options?: { isElevated?: boolean; allUsers?: User[] },
): boolean => {
  if (!currentUser || !meeting) return false;
  if (meeting.status === 'cancelled') return false;
  if (isPast(new Date(meeting.scheduledAt))) return false;
  if (options?.isElevated) return true;

  const creatorId =
    typeof meeting.createdBy === 'string' ? meeting.createdBy : meeting.createdBy?._id;

  if (typeof meeting.createdBy === 'object' && meeting.createdBy?.role === 'admin') {
    return false;
  }

  const creator = options?.allUsers?.find((user) => user._id === creatorId);
  if (creator?.role === 'admin') return false;

  return creatorId === currentUser._id;
};
