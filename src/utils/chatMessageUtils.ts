import { format, isSameDay, isToday, isYesterday, parseISO } from 'date-fns';
import type { Message, MessageReplySnippet, User } from '@/types';

export type TickStatus = 'sent' | 'delivered' | 'seen';

/** Calendar-day key for grouping messages (local timezone). */
export const getMessageDayKey = (date: string | Date | undefined): string | null => {
  if (!date) return null;
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return format(d, 'yyyy-MM-dd');
};

/** Chat day separator label: Today / Yesterday / weekday or full date. */
export const formatChatDayLabel = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  const now = new Date();
  if (d.getFullYear() === now.getFullYear()) {
    return format(d, 'EEEE, MMM d');
  }
  return format(d, 'EEE, MMM d, yyyy');
};

export const isSameMessageDay = (
  a: string | Date | undefined,
  b: string | Date | undefined,
): boolean => {
  if (!a || !b) return false;
  const da = typeof a === 'string' ? parseISO(a) : a;
  const db = typeof b === 'string' ? parseISO(b) : b;
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return isSameDay(da, db);
};

export const normalizeIdList = (ids?: Array<string | User | { _id: string }> | null): string[] => {
  if (!ids?.length) return [];
  return ids
    .map((id) => {
      if (typeof id === 'string') return id;
      if (id && typeof id === 'object' && '_id' in id) return String(id._id);
      return '';
    })
    .filter(Boolean);
};

export const getTickStatus = (
  message: Message,
  otherParticipantIds: string[],
): TickStatus => {
  if (!otherParticipantIds.length) return 'sent';

  const readBy = new Set(normalizeIdList(message.readBy));
  if (otherParticipantIds.every((id) => readBy.has(id))) return 'seen';

  const deliveredTo = new Set(normalizeIdList(message.deliveredTo));
  if (otherParticipantIds.every((id) => deliveredTo.has(id))) return 'delivered';

  return 'sent';
};

export const resolveReplySnippet = (
  replyTo?: Message['replyTo'],
): MessageReplySnippet | null => {
  if (!replyTo) return null;
  if (typeof replyTo === 'string') return null;
  return replyTo;
};

export const getReplyPreviewText = (message: Pick<Message, 'content' | 'type' | 'driveFileName'>): string => {
  if (message.type === 'drive_file') {
    return message.driveFileName || 'Drive file';
  }
  if (message.type === 'file') {
    return 'Attachment';
  }
  const text = (message.content || '').trim();
  if (!text) return 'Message';
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
};

export const addUserToIdList = (
  ids: Array<string | User | { _id: string }> | undefined,
  userId: string,
): string[] => {
  const next = new Set(normalizeIdList(ids));
  next.add(userId);
  return Array.from(next);
};

/** Normalize per-user receipt maps from API/socket (string keys → ISO datetimes). */
export const serializeReceiptMap = (
  map?: Record<string, unknown> | null,
): Record<string, string> => {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(map)) {
    if (value == null) continue;
    out[String(key)] =
      typeof value === 'string' ? value : value instanceof Date ? value.toISOString() : String(value);
  }
  return out;
};

/** Resolve a receipt timestamp for a participant id (handles string/ObjectId key mismatches). */
export const getReceiptTime = (
  map: Record<string, string> | undefined,
  userId: string,
): string | undefined => {
  if (!map || !userId) return undefined;
  const direct = map[userId];
  if (direct) return direct;
  const target = userId.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
};

export type TextSegment = { type: 'text'; value: string } | { type: 'url'; value: string; href: string };

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi;
const TRAILING_PUNCTUATION = /[),.;:!?]+$/;

const toHref = (rawUrl: string): string =>
  /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

/** Split message text into plain segments and auto-detected URLs. */
export const splitTextWithUrls = (text: string): TextSegment[] => {
  if (!text) return [];
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  const regex = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const trailing = raw.match(TRAILING_PUNCTUATION)?.[0] ?? '';
    const url = trailing ? raw.slice(0, -trailing.length) : raw;
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (url) {
      segments.push({ type: 'url', value: url, href: toHref(url) });
    }
    if (trailing) {
      segments.push({ type: 'text', value: trailing });
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: 'text', value: text }];
};

export const normalizeMessageReceipts = (message: Message): Message => ({
  ...message,
  deliveredAt: serializeReceiptMap(message.deliveredAt as Record<string, unknown> | undefined),
  readAt: serializeReceiptMap(message.readAt as Record<string, unknown> | undefined),
});
