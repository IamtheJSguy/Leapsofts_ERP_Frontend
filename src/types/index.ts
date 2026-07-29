export type Role = 'admin' | 'manager' | 'user';

export type ConnectionStatus =
  | 'pending'
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

export type PipelineMetric = 'new_prospects' | 'follow_ups' | 'meetings_taken';

export type KpiPriority = 'low' | 'medium' | 'high' | 'urgent';

export type KpiChangeSource = 'assignment' | 'standalone';

export type KpiChangeType = 'modify' | 'add' | 'remove';

export type ChangeEffectiveWhen = 'immediate' | 'next_day';

export type NotificationType =
  | 'kpi_miss'
  | 'follow_up'
  | 'meeting_reminder'
  | 'future_lead_reminder'
  | 'data_sync'
  | 'approval_required'
  | 'system'
  | 'shift_reminder'
  | 'kpi_end_of_shift'
  | 'sheet_update_reminder'
  | 'kanban_comment_mention'
  | 'report_ready';

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
  jobTitle?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  phone?: string;
  connectionStatus?: ConnectionStatus;
  messageStatus?: MessageStatus;
  isQualified?: boolean;
  kanbanBoardId?: string;
  assignedTo?: string | User;
  sharedWith?: string[] | User[];
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
  futureLeadDate?: string;
  futureLeadRemindersSent?: Record<string, string>;
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
  /** Optional quantity target. Omitted for simple done/not-done task-style KPIs. */
  targetValue?: number;
  /** Optional deadline. Omitted for an open-ended KPI with no due date. */
  dueDate?: string;
  /** Optional live pipeline metric this KPI auto-tracks against (requires targetValue). */
  pipelineMetric?: PipelineMetric;
  priority?: KpiPriority;
  metricType?: 'count' | 'ratio' | 'time' | 'duration';
  assignedTo?: string[] | User[];
}

export interface KPIAssignmentItem {
  _id?: string;
  templateItemId?: string;
  name: string;
  description?: string;
  targetValue?: number;
  dueDate?: string;
  pipelineMetric?: PipelineMetric;
  priority?: KpiPriority;
}

export interface KPIChangeRequest {
  _id: string;
  sourceType: KpiChangeSource;
  userId: string | User;
  type: KpiChangeType;
  assignmentId?: string;
  templateId?: string | KPITemplate;
  assignmentItemId?: string;
  kpiId?: string | KPI;
  kpiName?: string;
  currentTargetValue?: number;
  currentDueDate?: string;
  currentPriority?: KpiPriority;
  requestedTargetValue?: number;
  requestedDueDate?: string;
  requestedPriority?: KpiPriority;
  proposedItem?: {
    name: string;
    description?: string;
    targetValue?: number;
    dueDate?: string;
    pipelineMetric?: PipelineMetric;
    priority?: KpiPriority;
  };
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  effectiveWhen?: ChangeEffectiveWhen;
  adminNote?: string;
  reviewedBy?: string | User;
  reviewedAt?: string;
  createdAt?: string;
}

export interface KPITemplateItem {
  _id?: string;
  name: string;
  description?: string;
  defaultTargetValue?: number;
  pipelineMetric?: PipelineMetric;
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
  requestedValue: number;
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
  dueDate?: string;
}

export interface Report {
  _id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  period?: string;
  generatedBy?: string | User;
  userId?: string | User;
  dateRange?: { start: string; end: string };
  comparisonDateRange?: { start: string; end: string };
  pdfUrl?: string;
  excelUrl?: string;
  metrics?: Record<string, unknown>;
  comparisonMetrics?: Record<string, unknown>;
  sections?: string[];
  error?: string;
  fileUrl?: string;
  filters?: Record<string, unknown>;
  createdAt: string;
}

/* ─── Report Metric Types ─── */

export interface AttendanceDayBreakdown {
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  checkIn: string | null;
  checkOut: string | null;
  totalMinutes: number;
  scheduledMinutes: number;
}

export interface AttendanceMetrics {
  daysPresent: number;
  daysAbsent: number;
  expectedDays: number;
  lateCheckins: number;
  earlyDepartures: number;
  totalMinutesWorked: number;
  averageMinutesPerDay: number;
  overtimeMinutes: number;
  attendanceRate: number;
  dailyBreakdown: AttendanceDayBreakdown[];
}

export interface KpiPriorityBreakdown {
  priority: string;
  total: number;
  completed: number;
  rate: number;
}

export interface KpiDailyTrend {
  date: string;
  total: number;
  completed: number;
}

export interface KpiTargetActualRow {
  kpiName: string;
  target: number;
  actual: number;
  attainmentRate: number;
  entriesTotal: number;
  entriesCompleted: number;
}

export interface KpiPerformanceMetrics {
  totalAssigned: number;
  completed: number;
  missed: number;
  pending: number;
  completionRate: number;
  totalTarget?: number;
  totalActual?: number;
  overallAttainmentRate?: number;
  byKpi?: KpiTargetActualRow[];
  byPriority: KpiPriorityBreakdown[];
  dailyTrend: KpiDailyTrend[];
}

export interface SalesMetrics {
  totalLeads: number;
  qualified: number;
  connectionsSent: number;
  connectionsAccepted: number;
  acceptanceRate: number;
  messagesSent: number;
  messagesReplied: number;
  replyRate: number;
  meetings: number;
}

export interface MeetingMetrics {
  scheduled: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

export interface EmployeeFullMetrics {
  user: { _id: string; name: string; email: string; jobTitle?: string };
  attendance: AttendanceMetrics;
  kpiPerformance: KpiPerformanceMetrics;
  sales: SalesMetrics;
  meetings: MeetingMetrics;
}

export interface TeamOverviewMetrics {
  teamSize: number;
  members: EmployeeFullMetrics[];
  topPerformers: { userId: string; name: string; completionRate: number }[];
  bottomPerformers: { userId: string; name: string; completionRate: number }[];
  avgAttendanceRate: number;
  avgKpiCompletionRate: number;
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
  leadId?: string | Lead;
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
  profileSections?: ProfileSection[];
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

export interface BoardMember {
  _id?: string;
  userId: string | User;
  role: 'admin' | 'member';
}

export interface KanbanBoard {
  _id: string;
  name: string;
  columns: KanbanColumn[];
  projectId: string;
  ownerId: string;
  members: BoardMember[];
  leadId?: string | Lead;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface KanbanBoardResponse {
  board: KanbanBoard;
  cards: KanbanCard[];
}

export type ProjectStatus = 'active' | 'on_hold' | 'in_development';

export interface ProjectMember {
  _id?: string;
  userId: string | User;
  role: 'owner' | 'admin' | 'member';
}

export interface Project {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status: ProjectStatus;
  tags: string[];
  ownerId: string;
  members: ProjectMember[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithBoards {
  project: Project;
  boards: KanbanBoard[];
}

export interface Conversation {
  _id: string;
  isGroup?: boolean;
  name?: string;
  description?: string;
  admin?: string | User;
  participants: User[];
  lastMessage?: Message;
  lastMessageAt?: string;
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

export interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId?: string | User;
  sender?: string | User;
  content: string;
  type: 'text' | 'file' | 'drive_file';
  fileUrl?: string;
  driveFileId?: string;
  driveFileName?: string;
  driveMimeType?: string;
  driveWebViewLink?: string;
  driveIconLink?: string;
  readBy?: string[];
  createdAt: string;
}

export interface DashboardDateMeta {
  period: 'today' | 'week' | 'month' | 'quarter' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface TeamConnectionRow {
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  totalLeads: number;
}

export interface TeamProgressRow {
  userId: string;
  name: string;
  totalLeads: number;
  meetingsBooked: number;
  dealsClosed: number;
}

export interface PipelineVelocityPoint {
  date: string;
  newLeads: number;
  completed: number;
}

export interface TeamTaskItem {
  id: string;
  title: string;
  date: string;
  boardId: string;
  boardName: string;
}

export interface TeamDeadlineItem {
  id: string;
  title: string;
  date: string;
  userName: string;
}

export interface TeamTasksOverview {
  boardId: string;
  boardName: string;
  total: number;
  items: TeamTaskItem[];
}

export interface TeamAnalysisData {
  tasks: TeamTasksOverview;
  deadlines: TeamDeadlineItem[];
}

export interface PipelineOverviewSummary {
  totalLeads: number;
  connectionsSent: number;
  connectionsAccepted: number;
  acceptanceRate: number;
  followUps: number;
  replied: number;
  positive: number;
  replyRate: number;
  notSent: number;
  awaitingReply: number;
  qualified: number;
  negative: number;
  futureLeads: number;
  assignedReps: number;
  messageStats: Record<string, number>;
}

export interface DashboardStats {
  connectionsSent?: number;
  connectionsAccepted?: number;
  acceptanceRate?: number;
  messagesSent?: number;
  meetingsScheduled?: number;
  leadsAdded?: number;
  weeklyActivity?: { date: string; connections: number; messages: number }[];
  connectionRatios?: { label: string; value: number }[];
  kpiSummary?: { name: string; current: number; target: number }[];
  metrics?: {
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completedKpis: number;
  };
  kpiChartData?: { name: string; Target: number; Achieved: number }[];
  dailyKpis?: any[];
  tasksList?: {
    id: string;
    title: string;
    boardId: string;
    boardName: string;
    columnName: string;
    dueDate: string;
    isDone: boolean;
    isOverdue: boolean;
  }[];
}

export interface IcpEntry {
  _id: string;
  name: string;
  addedBy?: string;
  createdAt?: string;
}

export interface ProfileEntry {
  _id: string;
  name: string;
  addedBy?: string;
  createdAt?: string;
}

export interface SystemSettings {
  referenceSheetUrl?: string;
  chatRetentionMonths?: number;
  notificationBroadcast?: boolean;
  automatedUserReportSchedule?: { daily: boolean; weekly: boolean };
  icps?: IcpEntry[];
  profiles?: ProfileEntry[];
}

export interface LeadValidationResult {
  new: Partial<Lead>[];
  modified: Partial<Lead>[];
  duplicates: { incoming: Partial<Lead>; existing: Partial<Lead> }[];
  errors: { row: number; message: string }[];
}

export interface LeadFilters {
  startDate?: string;
  endDate?: string;
  connectionStatus?: string;
  messageStatus?: string;
  /** When true, messageStatus is any of the messaged funnel statuses (not not_sent) */
  messaged?: boolean;
  futureLeadWindow?: 'upcoming' | 'due' | 'overdue' | 'due_soon';
  status?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  icp?: string;
  profile?: string;
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

export type BulkUploadRowStatus = 'inserted' | 'updated' | 'error';

export interface BulkUploadRowResult {
  row: number;
  firstName?: string;
  lastName?: string;
  icp?: string;
  status: BulkUploadRowStatus;
  message?: string;
  leadId?: string;
}

export interface BulkUploadSummary {
  total: number;
  inserted: number;
  updated: number;
  errors: number;
}

export interface BulkUploadResponse {
  summary: BulkUploadSummary;
  results: BulkUploadRowResult[];
}
