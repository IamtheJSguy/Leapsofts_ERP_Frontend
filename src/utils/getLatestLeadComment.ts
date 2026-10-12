import type { Lead, LeadComment, LeadCommentEntry } from '@/types';

const entryTime = (entry: LeadCommentEntry | LeadComment): number => {
  const raw = 'updatedAt' in entry && entry.updatedAt
    ? entry.updatedAt
    : 'createdAt' in entry
      ? entry.createdAt
      : undefined;
  if (!raw) return 0;
  return new Date(raw).getTime();
};

/** Prefer leadComments history; fall back to legacy leadComment mirror. */
export const getLatestLeadComment = (
  lead: Pick<Lead, 'leadComments' | 'leadComment'> | null | undefined,
): LeadCommentEntry | LeadComment | null => {
  if (!lead) return null;
  const entries = lead.leadComments ?? [];
  if (entries.length) {
    return [...entries].sort((a, b) => entryTime(b) - entryTime(a))[0];
  }
  if (lead.leadComment?.text?.trim()) return lead.leadComment;
  return null;
};

export const leadHasComment = (
  lead: Pick<Lead, 'leadComments' | 'leadComment'> | null | undefined,
): boolean => !!getLatestLeadComment(lead)?.text?.trim();
