export const CONNECTION_STATUS = {
  NOT_SENT: 'not_sent',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  NO_RESPONSE: 'no_response',
} as const;

export const MESSAGE_STATUS = {
  NOT_SENT: 'not_sent',
  SENT: 'sent',
  REPLIED: 'replied',
  FOLLOW_UP: 'follow_up',
  NEGATIVE: 'negative',
  POSITIVE: 'positive',
  FUTURE_LEAD: 'future_lead',
} as const;

export const KPI_TIMEFRAME = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export const NOTIFICATION_TYPE = {
  KPI_MISS: 'kpi_miss',
  FOLLOW_UP: 'follow_up',
  MEETING_REMINDER: 'meeting_reminder',
  DATA_SYNC: 'data_sync',
  APPROVAL_REQUIRED: 'approval_required',
  SYSTEM: 'system',
  SHIFT_REMINDER: 'shift_reminder',
  KPI_END_OF_SHIFT: 'kpi_end_of_shift',
  SHEET_UPDATE_REMINDER: 'sheet_update_reminder',
  KANBAN_COMMENT_MENTION: 'kanban_comment_mention',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const SOCKET_EVENTS = {
  MESSAGE_NEW: 'message:new',
  NOTIFICATION_NEW: 'notification:new',
  KANBAN_CARD_MOVED: 'kanban:card_moved',
  KANBAN_COMMENT_ADDED: 'kanban:comment_added',
  LEAD_STATUS_CHANGED: 'lead:status_changed',
  USER_ONLINE: 'user:online',
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
  SHIFT_UPDATED: 'shift:updated',
  CHAT_TYPING: 'chat:typing',
} as const;

export const CONNECTION_STATUS_OPTIONS = Object.values(CONNECTION_STATUS);
export const MESSAGE_STATUS_OPTIONS = Object.values(MESSAGE_STATUS);
export const KPI_TIMEFRAME_OPTIONS = Object.values(KPI_TIMEFRAME);

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'B2B Lead Gen';
