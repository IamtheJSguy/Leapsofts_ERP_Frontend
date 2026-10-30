import type { ComponentType } from 'react';
import { lazyRetry } from '@/utils/lazyRetry';

type PageLoader = () => Promise<{ default: ComponentType<any> }>;

export const loadDashboardPage = () => import('@/pages/DashboardPage');
export const loadTasksPage = () => import('@/pages/TasksPage');
export const loadReportsPage = () => import('@/pages/ReportsPage');
export const loadMeetingsPage = () => import('@/pages/MeetingsPage');
export const loadChatPage = () => import('@/pages/ChatPage');
export const loadAdminPage = () => import('@/pages/AdminPage');
export const loadSalesPage = () => import('@/pages/SalesPage');
export const loadProjectsPage = () => import('@/pages/projects/ProjectsPage');
export const loadInvoicesPage = () => import('@/pages/invoices/InvoicesPage');

/** Sidebar paths whose chunk should warm on hover. Keys match nav `path`. */
export const routeLoaders: Record<string, PageLoader> = {
  '/dashboard': loadDashboardPage,
  '/tasks': loadTasksPage,
  '/projects': loadProjectsPage,
  '/sales': loadSalesPage,
  '/invoices': loadInvoicesPage,
  '/meetings': loadMeetingsPage,
  '/chat': loadChatPage,
  '/reports': loadReportsPage,
  '/admin': loadAdminPage,
};

export const ImpersonatePage = lazyRetry(() => import('@/pages/ImpersonatePage'));
export const LoginPage = lazyRetry(() => import('@/pages/LoginPage'));
export const TwoFactorVerifyPage = lazyRetry(() => import('@/pages/TwoFactorVerifyPage'));
export const TwoFactorSetupPage = lazyRetry(() => import('@/pages/TwoFactorSetupPage'));
export const DashboardPage = lazyRetry(loadDashboardPage);
export const TasksPage = lazyRetry(loadTasksPage);
export const ReportsPage = lazyRetry(loadReportsPage);
export const MeetingsPage = lazyRetry(loadMeetingsPage);
export const ChatPage = lazyRetry(loadChatPage);
export const AdminPage = lazyRetry(loadAdminPage);
export const TeamPage = lazyRetry(() => import('@/pages/TeamPage'));
export const SalesPage = lazyRetry(loadSalesPage);
export const SalesSettingsPage = lazyRetry(() => import('@/pages/SalesSettingsPage'));
export const NotFoundPage = lazyRetry(() => import('@/pages/NotFoundPage'));
export const ProfilePage = lazyRetry(() => import('@/pages/ProfilePage'));
export const TeamInsightsPage = lazyRetry(() => import('@/pages/TeamInsightsPage'));
export const ProjectsPage = lazyRetry(loadProjectsPage);
export const ProjectDetailsPage = lazyRetry(() => import('@/pages/projects/ProjectDetailsPage'));
export const KanbanBoardPage = lazyRetry(() => import('@/pages/projects/KanbanBoardPage'));
export const AttendancePage = lazyRetry(() => import('@/pages/AttendancePage'));
export const AttendanceActivityPage = lazyRetry(() => import('@/pages/AttendanceActivityPage'));
export const MemberProgressPage = lazyRetry(() => import('@/pages/MemberProgressPage'));
export const MemberKpiDetailPage = lazyRetry(() => import('@/pages/MemberKpiDetailPage'));
export const LeadDetailsPage = lazyRetry(() => import('@/pages/leads/LeadDetailsPage'));
export const BulkAddLeadsPage = lazyRetry(() => import('@/pages/BulkAddLeadsPage'));
export const DriveConnectedPage = lazyRetry(() => import('@/pages/DriveConnectedPage'));
export const CalendarConnectedPage = lazyRetry(() => import('@/pages/CalendarConnectedPage'));
export const CrmConnectedPage = lazyRetry(() => import('@/pages/CrmConnectedPage'));
export const InvoicesPage = lazyRetry(loadInvoicesPage);
export const InvoiceEditorPage = lazyRetry(() => import('@/pages/invoices/InvoiceEditorPage'));
export const InvoiceClientDetailPage = lazyRetry(() => import('@/pages/invoices/InvoiceClientDetailPage'));
export const InvoiceSettingsPage = lazyRetry(() => import('@/pages/invoices/InvoiceSettingsPage'));
export const HomePage = lazyRetry(() => import('@/pages/public/HomePage'));
export const PrivacyPage = lazyRetry(() => import('@/pages/public/PrivacyPage'));
export const TermsPage = lazyRetry(() => import('@/pages/public/TermsPage'));
export const SecurityPolicyPage = lazyRetry(() => import('@/pages/public/SecurityPolicyPage'));
export const AiAssistantPage = lazyRetry(() => import('@/pages/AiAssistantPage'));

