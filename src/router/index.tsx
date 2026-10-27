import { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageLoader } from '@/components/common/PageLoader';
import { RoutePageSkeleton } from '@/components/page-skeletons/PageSkeletons';
import { ROLES } from '@/lib/constants';
import {
  ImpersonatePage,
  LoginPage,
  TwoFactorVerifyPage,
  TwoFactorSetupPage,
  DashboardPage,
  TasksPage,
  ReportsPage,
  MeetingsPage,
  ChatPage,
  AdminPage,
  TeamPage,
  SalesPage,
  SalesSettingsPage,
  NotFoundPage,
  ProfilePage,
  TeamInsightsPage,
  ProjectsPage,
  ProjectDetailsPage,
  KanbanBoardPage,
  AttendancePage,
  AttendanceActivityPage,
  MemberProgressPage,
  MemberKpiDetailPage,
  LeadDetailsPage,
  BulkAddLeadsPage,
  DriveConnectedPage,
  CalendarConnectedPage,
  CrmConnectedPage,
  InvoicesPage,
  InvoiceEditorPage,
  InvoiceClientDetailPage,
  InvoiceSettingsPage,
  HomePage,
  PrivacyPage,
  TermsPage,
  SecurityPolicyPage,
  AiAssistantPage,
} from './lazy-pages';

const ALL_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER] as const;
const ELEVATED_ROLES = [ROLES.ADMIN, ROLES.MANAGER] as const;

const wrap = (element: React.ReactNode, fallback: React.ReactNode = <PageLoader />) => (
  <ErrorBoundary>
    <Suspense fallback={fallback}>{element}</Suspense>
  </ErrorBoundary>
);

const wrapApp = (element: React.ReactNode) => wrap(element, <RoutePageSkeleton />);

export const router = createBrowserRouter([
  {
    path: '/',
    element: wrap(<HomePage />),
  },
  {
    path: '/terms',
    element: wrap(<TermsPage />),
  },
  {
    path: '/privacy',
    element: wrap(<PrivacyPage />),
  },
  {
    path: '/security',
    element: wrap(<SecurityPolicyPage />),
  },
  {
    path: '/impersonate',
    element: wrap(<ImpersonatePage />),
  },
  {
    path: '/drive/connected',
    element: wrap(<DriveConnectedPage />),
  },
  {
    path: '/calendar/connected',
    element: wrap(<CalendarConnectedPage />),
  },
  {
    path: '/crm/connected',
    element: wrap(<CrmConnectedPage />),
  },
  {
    path: '/login',
    element: wrap(
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/login/2fa',
    element: wrap(
      <GuestRoute>
        <TwoFactorVerifyPage />
      </GuestRoute>
    ),
  },
  {
    path: '/login/2fa-setup',
    element: wrap(
      <GuestRoute>
        <TwoFactorSetupPage />
      </GuestRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: wrapApp(<DashboardPage />) },
      { path: 'app', element: wrapApp(<DashboardPage />) },
      {
        path: 'tasks',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <TasksPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'tasks/member/:userId',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ELEVATED_ROLES]}>
            <MemberKpiDetailPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'projects',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requireEntitlement="projectsAndBoards">
            <ProjectsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'projects/:id',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requireEntitlement="projectsAndBoards">
            <ProjectDetailsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'projects/:id/boards/:boardId',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requireEntitlement="projectsAndBoards">
            <KanbanBoardPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'reports',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ELEVATED_ROLES]} requireEntitlement="scheduledReports">
            <ReportsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'meetings',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <MeetingsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'chat/:conversationId?',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requireEntitlement="chat">
            <ChatPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'ai/:conversationId?',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <AiAssistantPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'admin',
        element: wrapApp(
          <ProtectedRoute
            allowedRoles={[...ALL_ROLES]}
            requirePermission={['manageSystemSettings', 'manageSalesSettings']}
          >
            <AdminPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'team',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="accessTeam">
            <TeamPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'attendance',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <AttendancePage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'attendance/:userId',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <AttendanceActivityPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'sales',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="viewSalesPage" requireEntitlement="salesModule">
            <SalesPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'sales/settings',
        element: wrapApp(
          <ProtectedRoute
            allowedRoles={[...ELEVATED_ROLES]}
            requirePermission="viewSalesPage"
            requireEntitlement="salesModule"
          >
            <SalesSettingsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'sales/add-leads',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="viewSalesPage" requireEntitlement="salesModule">
            <BulkAddLeadsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'sales/leads/:id',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="viewSalesPage" requireEntitlement="salesModule">
            <LeadDetailsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'invoices',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="accessInvoicing" requireEntitlement="invoicingModule">
            <InvoicesPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'invoices/new',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="accessInvoicing" requireEntitlement="invoicingModule">
            <InvoiceEditorPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'invoices/clients',
        element: <Navigate to="/invoices" replace />,
      },
      {
        path: 'invoices/clients/:clientId',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="accessInvoicing" requireEntitlement="invoicingModule">
            <InvoiceClientDetailPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'invoices/settings',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]} requirePermission="accessInvoicing" requireEntitlement="invoicingModule">
            <InvoiceSettingsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'invoices/:id',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="accessInvoicing" requireEntitlement="invoicingModule">
            <InvoiceEditorPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'profile',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <ProfilePage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'team/insights',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="accessTeam">
            <TeamInsightsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'team/member/:userId',
        element: wrapApp(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]} requirePermission="accessTeam">
            <MemberProgressPage />
          </ProtectedRoute>,
        ),
      },
    ],
  },
  { path: '*', element: wrap(<NotFoundPage />) },
  { path: '/404', element: wrap(<NotFoundPage />) },
]);
