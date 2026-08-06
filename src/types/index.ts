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
  | 'kanban_unassigned_cards'
  | 'report_ready';

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  status: PresenceStatus;
  lastSeenAt?: string;
}

export interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  isActive?: boolean;
  isOnline?: boolean;
  presenceStatus?: PresenceStatus;
  lastSeenAt?: string;
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
  /** @deprecated Legacy sheet free-text */
  followUp?: string;
  followUps?: FollowUpEntry[];
  followUpCount?: number;
  commentsAfterCall?: string;
  notes?: string;
  futureLeadDate?: string;
  futureLeadRemindersSent?: Record<string, string>;
}

export interface FollowUpEntry {
  number: number;
  note?: string;
  loggedAt: string;
  loggedBy: string | User;
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

/** Sales KPI subsystem — day-of-week scheduled, auto-generated, auto-progressed. */
export type SalesKpiMetric = 'new_prospects' | 'messages_sent' | 'responses' | 'follow_ups';

export type SalesKpiScheduleMode = 'per_day' | 'span';

export type SalesKpiTargetMode = 'manual' | 'auto_snapshot';

export type SalesKpiStatus =
  | 'pending'
  | 'in_progress'
  | 'completed_on_time'
  | 'completed_late'
  | 'missed'
  | 'partial';

export interface SalesKpiTemplateItem {
  _id?: string;
  name: string;
  description?: string;
  metric: SalesKpiMetric;
  /** 0 = Sunday … 6 = Saturday. */
  daysOfWeek: number[];
  scheduleMode: SalesKpiScheduleMode;
  targetMode: SalesKpiTargetMode;
  /** Only meaningful when targetMode is 'manual'; otherwise snapshotted from the pipeline. */
  targetValue?: number;
  priority: KpiPriority;
}

export interface SalesKpiTemplate {
  _id: string;
  name: string;
  description?: string;
  items: SalesKpiTemplateItem[];
  createdBy?: string | { _id: string; email: string; firstName?: string; lastName?: string };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Per-user copy of a template item; days/target/priority are editable at any time (holidays). */
export interface SalesKpiAssignmentItem extends SalesKpiTemplateItem {
  /** Subdocument id — used as the key for PUT assignment item updates. */
  _id: string;
  /** Original template item this was copied from (read-only lineage). */
  templateItemId: string;
  isActive?: boolean;
}

export interface SalesKpiAssignment {
  _id: string;
  templateId?: string | SalesKpiTemplate;
  userId: string | User;
  assignedBy?: string | User;
  isActive?: boolean;
  items: SalesKpiAssignmentItem[];
  createdAt?: string;
  updatedAt?: string;
}

/** GET /sales-kpi-templates/:id */
export interface SalesKpiTemplateDetail {
  template: SalesKpiTemplate;
  assignments: SalesKpiAssignment[];
}

/**
 * Payload for editing a single assignment item (PUT /sales-kpi-templates/assignments/:id).
 * Items are keyed by assignment item `_id`, not `templateItemId`.
 */
export interface SalesKpiAssignmentItemUpdate {
  _id: string;
  daysOfWeek?: number[];
  scheduleMode?: SalesKpiScheduleMode;
  targetMode?: SalesKpiTargetMode;
  targetValue?: number;
  priority?: KpiPriority;
  isActive?: boolean;
}

export interface SalesKpiAssignmentUpdatePayload {
  isActive?: boolean;
  items?: SalesKpiAssignmentItemUpdate[];
}

/** Per-user overrides applied at assign time, keyed by the item's position in the template. */
export interface SalesKpiItemOverride {
  itemIndex: number;
  daysOfWeek?: number[];
  scheduleMode?: SalesKpiScheduleMode;
  targetMode?: SalesKpiTargetMode;
  targetValue?: number;
  priority?: KpiPriority;
  isActive?: boolean;
}

export interface SalesKpiAssignResult {
  templateId: string;
  templateName: string;
  results: { userId: string; status: 'created' | 'already_assigned' }[];
}

/** A generated sales KPI task. Read-only for the user — progress comes from pipeline hooks. */
export interface SalesKpiEntry {
  _id: string;
  assignmentId?: string;
  assignmentItemId?: string;
  /** Populated on elevated team endpoints. */
  userId: string | User;
  metric: SalesKpiMetric;
  kpiName: string;
  description?: string;
  scheduleMode: SalesKpiScheduleMode;
  priority: KpiPriority;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  currentValue: number;
  status: SalesKpiStatus;
  completedAt?: string | null;
  /** Set once the deadline passed; frozen entries never increment again. */
  frozenAt?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupedSalesKpis {
  active: SalesKpiEntry[];
  overdue: SalesKpiEntry[];
  incomplete: SalesKpiEntry[];
  done: SalesKpiEntry[];
  counts: {
    active: number;
    overdue: number;
    incomplete: number;
    done: number;
  };
}

export interface SalesKpiSummary {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  incomplete: number;
  totalTarget: number;
  totalCurrent: number;
  attainmentRate: number;
  counts: GroupedSalesKpis['counts'];
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

export interface KanbanLabel {
  _id: string;
  name: string;
  color: string;
}

export interface KanbanCardLink {
  _id?: string;
  title?: string;
  url: string;
}

export interface KanbanColumn {
  _id: string;
  name: string;
  position?: number;
  order?: number;
  isActive?: boolean;
  cards?: KanbanCard[];
  /** Active card count for this column (from project board listing) */
  totalCards?: number;
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
  /** Explicit done status on the card (independent of column) */
  isDone?: boolean;
  completedAt?: string | null;
  members?: string[] | User[];
  comments?: KanbanComment[];
  activityLog?: ActivityLogEntry[];
  profileSections?: ProfileSection[];
  enrichment?: ProfileSection[];
  /** Board label ids applied to this card */
  labelIds?: string[];
  /** External URL links on the card */
  links?: KanbanCardLink[];
  /** Linked meetings (ids or populated Meeting objects) */
  meetingIds?: string[] | Meeting[];
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
  labels?: KanbanLabel[];
  leadId?: string | Lead;
  isDefault: boolean;
  isActive: boolean;
  /** Active card count across all columns (from project board listing) */
  totalCards?: number;
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

export interface MessageReplySnippet {
  _id: string;
  content: string;
  type: 'text' | 'file' | 'drive_file';
  senderId?: string | User;
  sender?: string | User;
  driveFileName?: string;
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
  deliveredTo?: string[];
  /** Per-recipient first delivery time (userId → ISO datetime). */
  deliveredAt?: Record<string, string>;
  /** Per-recipient first read time (userId → ISO datetime). */
  readAt?: Record<string, string>;
  replyTo?: string | MessageReplySnippet;
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
  doneTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface TeamProgressRow {
  userId: string;
  name: string;
  doneTasks: number;
  pendingTasks: number;
  overdueTasks: number;
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

export interface BulkCreateResponse {
  created: number;
  updated: number;
  duplicates: number;
  skipped: number;
}

/** Work Monitor assistant AI provider identifiers */
export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'grok' | 'kimi';

/** GET /users/me/ai-keys — presence flags only (never plaintext secrets) */
export interface AiProviderKeysStatus {
  gemini: boolean;
  openai: boolean;
  anthropic: boolean;
  grok: boolean;
  kimi: boolean;
  preferredAiProvider: AiProvider | null;
}

/** PUT /users/me/ai-keys — empty string clears a key */
export interface UpdateAiProviderKeysPayload {
  gemini?: string;
  openai?: string;
  anthropic?: string;
  grok?: string;
  kimi?: string;
  preferredAiProvider?: AiProvider | null;
}

export type AssistantEntityType = 'lead' | 'meeting' | 'task';

export interface AssistantEntity {
  type: AssistantEntityType;
  id: string;
  title: string;
  route: string;
}

export interface AssistantMessage {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  entities?: AssistantEntity[];
  provider?: AiProvider;
  createdAt: string;
  updatedAt?: string;
}

export interface AssistantConversation {
  _id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantConversationDetail {
  conversation: AssistantConversation;
  messages: AssistantMessage[];
}

/** POST /assistant/chat response payload */
export interface AssistantChatResponse {
  conversationId: string;
  message: string;
  provider: AiProvider;
  entities: AssistantEntity[];
}
