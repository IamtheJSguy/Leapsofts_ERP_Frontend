export type Role = 'admin' | 'user';

export type ConnectionStatus =
  | 'not_sent'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'no_response';

export type MessageStatus =
  | 'not_sent'
  | 'sent'
  | 'replied'
  | 'follow_up'
  | 'negative'
  | 'positive'
  | 'future_lead';

export type KpiTimeframe = 'daily' | 'weekly' | 'monthly';

export type NotificationType =
  | 'kpi_miss'
  | 'follow_up'
  | 'meeting_reminder'
  | 'data_sync'
  | 'approval_required'
  | 'system';

export interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  isActive?: boolean;
  phone?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  notificationPreferences?: {
    email: boolean;
    portal: boolean;
    kpiAlerts: boolean;
    meetingReminders: boolean;
  };
  googleSheetId?: string;
  shiftStart?: string;
  shiftEnd?: string;
  createdAt?: string;
}

export interface Lead {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  linkedInUrl?: string;
  salesNavigatorUrl?: string;
  company?: string;
  title?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  phone?: string;
  connectionStatus?: ConnectionStatus;
  messageStatus?: MessageStatus;
  isQualified?: boolean;
  assignedTo?: string | User;
  profileSections?: ProfileSection[];
  versionHistory?: VersionHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
  prospectName?: string;
  profile?: string;
  icp?: string;
  leadStatus?: string;
  date?: string;
  linkedinMsg?: string;
  followUp?: string;
  commentsAfterCall?: string;
  notes?: string;
}

export interface ProfileSection {
  title: string;
  content: string;
}

export interface VersionHistoryEntry {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string | User;
  changedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta?: { page: number; limit: number; total: number };
}

export interface LeadsListResponse {
  data: Lead[];
  meta: { page: number; limit: number; total: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface KPI {
  _id: string;
  name: string;
  description?: string;
  targetValue: number;
  timeFrame: KpiTimeframe;
  metricType?: 'count' | 'ratio' | 'time' | 'duration';
  assignedTo?: string[] | User[];
  changeRequests?: ChangeRequest[];
}

export interface KPITemplateItem {
  _id?: string;
  name: string;
  description?: string;
  defaultTargetValue: number;
  timeFrame: string;
  assignedTo?: string[];
}

export interface KPITemplate {
  _id: string;
  name: string;
  description?: string;
  items: KPITemplateItem[];
  createdBy?: string | { _id: string; email: string; firstName?: string; lastName?: string };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChangeRequest {
  _id: string;
  userId: string | User;
  proposedTarget: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface KPIRecord {
  _id: string;
  kpiId: string | KPI;
  userId: string | User;
  actualValue: number;
  targetValue: number;
  status: 'met' | 'missed' | 'pending';
  periodStart: string;
  periodEnd: string;
}

export interface Report {
  _id: string;
  type: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  fileUrl?: string;
  filters?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Meeting {
  _id: string;
  title: string;
  description?: string;
  meetingLink?: string;
  link?: string; // legacy alias
  scheduledAt: string;
  participants: string[] | User[];
  status?: 'scheduled' | 'completed' | 'cancelled';
  createdBy?: string | User; // the user who created this meeting
}

export interface KanbanColumn {
  _id: string;
  name: string;
  position: number;
  cards: KanbanCard[];
}

export interface KanbanCard {
  _id: string;
  leadId: string | Lead;
  columnId: string;
  position: number;
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  members?: string[] | User[];
  comments?: KanbanComment[];
  activityLog?: ActivityLogEntry[];
  enrichment?: ProfileSection[];
}

export interface KanbanComment {
  _id: string;
  text: string;
  author: string | User;
  mentions?: string[];
  createdAt: string;
}

export interface ActivityLogEntry {
  action: string;
  user: string | User;
  timestamp: string;
}

export interface KanbanBoard {
  _id: string;
  name: string;
  columns: KanbanColumn[];
}

export interface Conversation {
  _id: string;
  isGroup?: boolean;
  name?: string;
  description?: string;
  admin?: string | User;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
}

export interface Shift {
  _id: string;
  userId: string | User;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  totalMinutes: number;
  status: 'not_started' | 'checked_in' | 'checked_out';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: string | User;
  content: string;
  type: 'text' | 'file' | 'drive_link';
  fileUrl?: string;
  driveFileId?: string;
  createdAt: string;
}

export interface DashboardStats {
  connectionsSent: number;
  connectionsAccepted: number;
  acceptanceRate?: number;
  messagesSent: number;
  meetingsScheduled: number;
  leadsAdded?: number;
  weeklyActivity: { date: string; connections: number; messages: number }[];
  connectionRatios: { label: string; value: number }[];
  kpiSummary: { name: string; current: number; target: number }[];
}

export interface SystemSettings {
  referenceSheetUrl?: string;
  chatRetentionMonths?: number;
  notificationBroadcast?: boolean;
}

export interface LeadValidationResult {
  new: Partial<Lead>[];
  modified: Partial<Lead>[];
  duplicates: { incoming: Partial<Lead>; existing: Partial<Lead> }[];
  errors: { row: number; message: string }[];
}

export interface LeadFilters {
  connectionStatus?: string;
  messageStatus?: string;
  status?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  assignedTo?: string;
  isQualified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface ValidationResult {
  newLeads: Lead[];
  modifiedLeads: Lead[];
  duplicates: { incoming: Lead; existing: Lead }[];
  errors: { row: number; message: string }[];
}
