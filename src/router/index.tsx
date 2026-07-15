import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageLoader } from '@/components/common/PageLoader';
import { ROLES } from '@/lib/constants';
import {
  LoginPage,
  DashboardPage,
  TasksPage,
  ReportsPage,
  MeetingsPage,
  ChatPage,
  AdminPage,
  TeamPage,
  SalesPage,
  NotFoundPage,
  ProfilePage,
  TeamInsightsPage,
  ProjectsPage,
  ProjectDetailsPage,
  KanbanBoardPage,
  AttendancePage,
  MemberProgressPage,
  LeadDetailsPage,
} from './lazy-pages';

const ALL_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER] as const;
const ELEVATED_ROLES = [ROLES.ADMIN, ROLES.MANAGER] as const;

const wrap = (element: React.ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>{element}</Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: wrap(
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: wrap(<DashboardPage />) },
      {
        path: 'tasks',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <TasksPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'projects',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <ProjectsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'projects/:id',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <ProjectDetailsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'projects/:id/boards/:boardId',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <KanbanBoardPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'reports',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ELEVATED_ROLES]}>
            <ReportsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'meetings',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <MeetingsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'chat',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <ChatPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'chat/:conversationId',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <ChatPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'admin',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ELEVATED_ROLES]}>
            <AdminPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'team',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ELEVATED_ROLES]}>
            <TeamPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'attendance',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <AttendancePage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'sales',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <SalesPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'sales/leads/:id',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <LeadDetailsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'profile',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ALL_ROLES]}>
            <ProfilePage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'team/insights',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ELEVATED_ROLES]}>
            <TeamInsightsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'team/member/:userId',
        element: wrap(
          <ProtectedRoute allowedRoles={[...ELEVATED_ROLES]}>
            <MemberProgressPage />
          </ProtectedRoute>,
        ),
      },
    ],
  },
  { path: '*', element: wrap(<NotFoundPage />) },
  { path: '/404', element: wrap(<NotFoundPage />) },
]);
