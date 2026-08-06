import type { Message, MessageReplySnippet, User } from '@/types';

export type TickStatus = 'sent' | 'delivered' | 'seen';

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

export const normalizeMessageReceipts = (message: Message): Message => ({
  ...message,
  deliveredAt: serializeReceiptMap(message.deliveredAt as Record<string, unknown> | undefined),
  readAt: serializeReceiptMap(message.readAt as Record<string, unknown> | undefined),
});
