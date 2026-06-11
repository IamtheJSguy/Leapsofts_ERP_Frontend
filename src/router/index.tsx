import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageLoader } from '@/components/common/PageLoader';
import { ROLES } from '@/lib/constants';
import {
  LoginPage,
  DashboardPage,
  TasksPage,
  LeadsPage,
  KanbanPage,
  KPIPage,
  ReportsPage,
  MeetingsPage,
  ChatPage,
  AdminPage,
  TeamPage,
  SalesPage,
  NotFoundPage,
  ProfilePage,
  TeamInsightsPage,
} from './lazy-pages';

const wrap = (element: React.ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>{element}</Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: wrap(<LoginPage />),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: wrap(<DashboardPage />) },
      {
        path: 'tasks',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <TasksPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'leads',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <LeadsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'kanban',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <KanbanPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'kpis',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <KPIPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'reports',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <ReportsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'meetings',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <MeetingsPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'chat',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <ChatPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'admin',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'team',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <TeamPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'sales',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <SalesPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'profile',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
            <ProfilePage />
          </ProtectedRoute>,
        ),
      },
      {
        path: 'team/insights',
        element: wrap(
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <TeamInsightsPage />
          </ProtectedRoute>,
        ),
      },
    ],
  },
  { path: '*', element: wrap(<NotFoundPage />) },
  { path: '/404', element: wrap(<NotFoundPage />) },
]);
