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

export const PIPELINE_METRIC = {
  NEW_PROSPECTS: 'new_prospects',
  FOLLOW_UPS: 'follow_ups',
  MEETINGS_TAKEN: 'meetings_taken',
} as const;

export const SALES_KPI_METRIC = {
  NEW_PROSPECTS: 'new_prospects',
  MESSAGES_SENT: 'messages_sent',
  FOLLOW_UPS: 'follow_ups',
} as const;

export const SALES_KPI_SCHEDULE_MODE = { PER_DAY: 'per_day', SPAN: 'span' } as const;

export const SALES_KPI_TARGET_MODE = { MANUAL: 'manual', AUTO_SNAPSHOT: 'auto_snapshot' } as const;

export const SALES_KPI_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED_ON_TIME: 'completed_on_time',
  COMPLETED_LATE: 'completed_late',
  MISSED: 'missed',
  PARTIAL: 'partial',
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
  KANBAN_UNASSIGNED_CARDS: 'kanban_unassigned_cards',
  REPORT_READY: 'report_ready',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

export const DEPARTMENT = {
  LEADERSHIP: 'Leadership',
  ENGINEERING: 'Engineering',
  PRODUCT: 'Product',
  QUALITY: 'Quality',
  MARKETING: 'Marketing',
  SALES: 'Sales',
  DESIGN: 'Design',
} as const;

export const DEPARTMENT_OPTIONS = Object.values(DEPARTMENT);

/** Departments included in sales-team dashboard metrics (connections / progress). */
export const SALES_DASHBOARD_DEPARTMENTS = [
  DEPARTMENT.MARKETING,
  DEPARTMENT.SALES,
] as const;

export const SOCKET_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_REACTION: 'message:reaction',
  NOTIFICATION_NEW: 'notification:new',
  KANBAN_CARD_MOVED: 'kanban:card_moved',
  KANBAN_COMMENT_ADDED: 'kanban:comment_added',
  LEAD_STATUS_CHANGED: 'lead:status_changed',
  USER_ONLINE: 'user:online',
  USER_PRESENCE: 'user:presence',
  PRESENCE_ACTIVITY: 'presence:activity',
  PRESENCE_SUBSCRIBE: 'presence:subscribe',
  CONVERSATION_NEW: 'conversation:new',
  CONVERSATION_UPDATED: 'conversation:updated',
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
  SHIFT_UPDATED: 'shift:updated',
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  CHAT_TYPING: 'chat:typing',
} as const;

/** Quick-bar emojis shown on message hover (full picker via +). */
export const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

export const PRESENCE_COLORS = {
  online: '#2D8A5E',
  away: '#F59E0B',
  offline: '#9CA3AF',
} as const;

export const MESSAGE_SEEN_TICK_COLOR = '#53bdeb';

export const CONNECTION_STATUS_OPTIONS = Object.values(CONNECTION_STATUS);
export const MESSAGE_STATUS_OPTIONS = Object.values(MESSAGE_STATUS);
export const PIPELINE_METRIC_OPTIONS = Object.values(PIPELINE_METRIC);

export const PIPELINE_METRIC_LABELS: Record<string, string> = {
  new_prospects: 'New Prospects',
  follow_ups: 'Follow-Ups',
  meetings_taken: 'Meetings Taken',
};

export const SALES_KPI_METRIC_OPTIONS = Object.values(SALES_KPI_METRIC);

export const SALES_KPI_METRIC_LABELS: Record<string, string> = {
  new_prospects: 'New Prospects',
  messages_sent: 'Messages Sent',
  follow_ups: 'Follow-Ups',
};

/** Only these metrics take an admin-entered target; the rest are snapshotted from the pipeline. */
export const SALES_KPI_MANUAL_TARGET_METRICS: string[] = [SALES_KPI_METRIC.NEW_PROSPECTS];

export const SALES_KPI_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed_on_time: 'On time',
  completed_late: 'Late',
  missed: 'Missed',
  partial: 'Partial',
};

/** Index matches the daysOfWeek convention: 0 = Sunday … 6 = Saturday. */
export const WEEKDAY_SHORT_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'B2B Lead Gen';

/** Fixed Trello-like board label palette (5×6 grid) */
export const KANBAN_LABEL_COLORS = [
  '#b7ddb0', '#f5ea92', '#fad29c', '#efb3ab', '#dfc0eb',
  '#7bc86c', '#f5dd29', '#ffaf3f', '#ef7564', '#cd8de5',
  '#5aac44', '#e6c60d', '#e79217', '#cf513d', '#a86cc1',
  '#8bbdd9', '#8fdfeb', '#b3f1d0', '#ea94bb', '#505f79',
  '#5ba4cf', '#29cce5', '#6deca9', '#ff8ed4', '#344563',
  '#026aa7', '#00aecc', '#4ed583', '#e568af', '#091e42',
] as const;
