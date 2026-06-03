import { lazy } from 'react';

export const LoginPage = lazy(() => import('@/pages/LoginPage'));
export const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
export const LeadsPage = lazy(() => import('@/pages/LeadsPage'));
export const KanbanPage = lazy(() => import('@/pages/KanbanPage'));
export const KPIPage = lazy(() => import('@/pages/KPIPage'));
export const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
export const MeetingsPage = lazy(() => import('@/pages/MeetingsPage'));
export const ChatPage = lazy(() => import('@/pages/ChatPage'));
export const AdminPage = lazy(() => import('@/pages/AdminPage'));
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
