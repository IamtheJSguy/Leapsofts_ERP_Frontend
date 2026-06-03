# B2B LinkedIn Lead Generation - Frontend Context

## Project Overview
React 18 SPA for B2B lead generation workflow automation. Built on MERN stack frontend with real-time features, Kanban boards, data tables, and chat. Uses TanStack React Query for server state management.

## Tech Stack
- **Framework**: React 18+ (Vite as build tool)
- **Server State**: TanStack React Query v5 (formerly React Query)
- **Client State**: Zustand (lightweight, no boilerplate)
- **UI Library**: Material-UI (MUI) v5 + Tailwind CSS
- **Routing**: React Router v6
- **Data Tables**: AG Grid Community
- **Kanban**: @dnd-kit/core + @dnd-kit/sortable
- **Charts**: Recharts
- **Calendar**: react-big-calendar
- **Spreadsheet**: SheetJS (xlsx)
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form + Zod resolver
- **Date**: date-fns
- **HTTP**: Axios (with interceptors for auth, file uploads, error handling)
- **Auth**: JWT access token in memory, refresh token in httpOnly cookie

## Project Structure
```
frontend/
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── router/
│   │   ├── index.jsx                 # Route definitions with lazy loading
│   │   ├── ProtectedRoute.jsx        # RBAC route guard
│   │   └── route-config.js           # Route permissions map
│   ├── store/                        # Zustand stores (client state only)
│   │   ├── useAuthStore.js           # Auth state + user
│   │   ├── useUIStore.js             # Theme, sidebar, modal, toast
│   │   ├── useKanbanStore.js         # Drag-drop state + optimistic updates
│   │   └── useChatStore.js           # Active conversation, unread counts
│   ├── lib/
│   │   ├── axios.js                  # Axios instance with interceptors
│   │   ├── queryClient.js            # TanStack Query client config
│   │   ├── socket.js                 # Socket.io singleton
│   │   └── constants.js              # App enums, status maps, colors
│   ├── hooks/
│   │   ├── api/                      # TANSTACK REACT QUERY HOOKS
│   │   │   ├── useAuth.js            # login, register, logout, refresh
│   │   │   ├── useLeads.js           # leads CRUD, bulk upload, validation
│   │   │   ├── useConnections.js     # connection stats, ratios, filters
│   │   │   ├── useKPIs.js            # KPIs, records, change requests
│   │   │   ├── useReports.js         # report generation, export, admin summary
│   │   │   ├── useNotifications.js   # notifications, mark read, preferences
│   │   │   ├── useMeetings.js        # meetings, reminders
│   │   │   ├── useKanban.js          # boards, cards, columns, comments
│   │   │   ├── useChat.js            # conversations, messages, send
│   │   │   ├── useDrive.js           # Google Drive auth, files, share
│   │   │   └── useUsers.js           # user management (admin)
│   │   ├── useAuth.js                # Current user + role checks (from store)
│   │   ├── usePermissions.js         # CASL-style ability checks
│   │   ├── useSocket.js              # Socket connection + room management
│   │   ├── useDebounce.js            # Search/filter debounce
│   │   ├── useLocalStorage.js
│   │   └── useDashboardStats.js      # KPI + weekly stats aggregation
│   ├── components/
│   │   ├── common/                   # Reusable atomic components
│   │   │   ├── DataTable.jsx         # AG Grid wrapper with filters
│   │   │   ├── ConfirmDialog.jsx     # Reusable confirmation modal
│   │   │   ├── FileUploader.jsx      # Drag-drop with progress
│   │   │   ├── StatusBadge.jsx       # Color-coded status chips
│   │   │   ├── KPIIndicator.jsx      # Green/yellow/red metric card
│   │   │   ├── DateRangePicker.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx         # Sidebar + Header + Content
│   │   │   ├── Sidebar.jsx           # Navigation with role-based items
│   │   │   ├── Header.jsx            # User menu, notifications bell
│   │   │   └── NotificationPanel.jsx # Slide-out notification drawer
│   │   ├── leads/
│   │   │   ├── LeadList.jsx          # Main lead table view
│   │   │   ├── LeadForm.jsx          # Create/edit lead (all fields optional)
│   │   │   ├── BulkUploadModal.jsx   # CSV/Excel upload + preview
│   │   │   ├── ValidationGate.jsx    # Preview + diff + confirmation
│   │   │   ├── LeadDetailDrawer.jsx  # Side panel for lead details
│   │   │   ├── ConnectionStatusCell.jsx
│   │   │   ├── MessageStatusCell.jsx
│   │   │   └── ProfileEnrichmentModal.jsx
│   │   ├── dashboard/
│   │   │   ├── UserDashboard.jsx     # Last 7 days activity
│   │   │   ├── AdminDashboard.jsx    # Team metrics + system health
│   │   │   ├── KPISummaryCards.jsx
│   │   │   ├── WeeklyActivityChart.jsx
│   │   │   └── ConnectionRatioChart.jsx
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.jsx       # DnD board wrapper
│   │   │   ├── KanbanColumn.jsx      # Droppable column
│   │   │   ├── KanbanCard.jsx        # Draggable card with lead info
│   │   │   ├── CardDetailModal.jsx   # Comments, members, activity log
│   │   │   ├── AddColumnButton.jsx
│   │   │   └── ColumnSettingsModal.jsx
│   │   ├── reports/
│   │   │   ├── ReportBuilder.jsx     # Filter + generate UI
│   │   │   ├── ReportTable.jsx
│   │   │   ├── ReportExportButton.jsx # PDF/Excel download
│   │   │   └── ReportChartView.jsx
│   │   ├── chat/
│   │   │   ├── ChatSidebar.jsx       # Conversation list
│   │   │   ├── ChatWindow.jsx        # Message thread + input
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── FileMessage.jsx
│   │   │   ├── DriveFilePicker.jsx   # Google Drive file selector
│   │   │   └── ChatSearchModal.jsx
│   │   ├── meetings/
│   │   │   ├── MeetingScheduler.jsx
│   │   │   ├── MeetingList.jsx
│   │   │   └── MeetingReminderBadge.jsx
│   │   ├── kpi/
│   │   │   ├── KPIManager.jsx        # Admin KPI config
│   │   │   ├── KPIRequestModal.jsx   # User request change
│   │   │   ├── KPIApprovalQueue.jsx  # Admin approval list
│   │   │   └── MyKPIs.jsx            # User KPI view
│   │   └── admin/
│   │       ├── UserManagementTable.jsx
│   │       ├── RoleAssignmentModal.jsx
│   │       └── SystemSettingsPanel.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── LeadsPage.jsx
│   │   ├── KanbanPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── MeetingsPage.jsx
│   │   ├── KPIPage.jsx
│   │   ├── AdminPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── utils/
│   │   ├── formatters.js             # Date, number, currency formatters
│   │   ├── validators.js             # Zod schemas for forms
│   │   ├── exportHelpers.js          # PDF/Excel generation helpers
│   │   ├── colorUtils.js             # Status color mapping
│   │   └── socketEventHandlers.js    # Centralized socket event dispatch
│   ├── styles/
│   │   ├── theme.js                  # MUI theme (light/dark)
│   │   ├── tailwind.config.js
│   │   └── global.css
│   └── assets/
└── package.json
```

---

## TanStack React Query Setup

### Query Client Configuration (lib/queryClient.js)
```js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      gcTime: 1000 * 60 * 30,        // 30 minutes (cacheTime renamed in v5)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Axios Instance with Interceptors (lib/axios.js)
```js
import axios from 'axios';
import { queryClient } from './queryClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends httpOnly refresh token cookie
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 + refresh
let isRefreshing = false;
let refreshSubscribers = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.data.accessToken);
        refreshSubscribers.forEach((cb) => cb(data.data.accessToken));
        refreshSubscribers = [];
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        queryClient.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## API Hooks (TanStack React Query)

All hooks live in `hooks/api/`. Each hook file exports `useQuery` and `useMutation` hooks for a domain.

### 1. useAuth.js
```js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      setAuth(res.data.data.user);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      clearAuth();
      queryClient.clear(); // clear all cache
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then((r) => r.data.data),
    staleTime: Infinity, // only refetch on explicit invalidation
  });
};
```

### 2. useLeads.js
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const leadApi = {
  getLeads: (params) => api.get('/leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  createLead: (data) => api.post('/leads', data),
  updateLead: ({ id, data }) => api.put(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  bulkUpload: (formData) => api.post('/leads/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      // emit progress via callback or zustand store
    },
  }),
  validateLeads: (data) => api.post('/leads/validate', data),
  qualifyLead: ({ id, enrichment }) => api.post(`/leads/${id}/qualify`, enrichment),
  getLeadHistory: (id) => api.get(`/leads/${id}/history`),
};

export const useLeads = (filters = {}) => {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadApi.getLeads(filters).then((r) => r.data),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useLead = (id) => {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadApi.getLead(id).then((r) => r.data.data),
    enabled: !!id,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.updateLead,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useBulkUpload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.bulkUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useValidateLeads = () => {
  return useMutation({
    mutationFn: leadApi.validateLeads,
  });
};

export const useQualifyLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.qualifyLead,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useLeadHistory = (id) => {
  return useQuery({
    queryKey: ['leadHistory', id],
    queryFn: () => leadApi.getLeadHistory(id).then((r) => r.data.data),
    enabled: !!id,
  });
};
```

### 3. useConnections.js
```js
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const connectionApi = {
  getStats: (params) => api.get('/connections/stats', { params }),
  getRatios: (params) => api.get('/connections/ratios', { params }),
  updateStatus: ({ leadId, status }) => api.put(`/connections/${leadId}/status`, { status }),
};

export const useConnectionStats = (filters = {}) => {
  return useQuery({
    queryKey: ['connectionStats', filters],
    queryFn: () => connectionApi.getStats(filters).then((r) => r.data.data),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useConnectionRatios = (filters = {}) => {
  return useQuery({
    queryKey: ['connectionRatios', filters],
    queryFn: () => connectionApi.getRatios(filters).then((r) => r.data.data),
  });
};

export const useUpdateConnectionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectionApi.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectionStats'] });
      queryClient.invalidateQueries({ queryKey: ['connectionRatios'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
```

### 4. useKPIs.js
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const kpiApi = {
  getKPIs: () => api.get('/kpis'),
  getMyKPIs: () => api.get('/kpis/my'),
  getKPIRecords: (params) => api.get('/kpis/records', { params }),
  createKPI: (data) => api.post('/kpis', data),
  updateKPI: ({ id, data }) => api.put(`/kpis/${id}`, data),
  requestChange: ({ id, data }) => api.post(`/kpis/${id}/request-change`, data),
  approveChange: ({ id, requestId, decision }) => api.post(`/kpis/${id}/approve-change`, { requestId, decision }),
  getChangeRequests: () => api.get('/kpis/change-requests'),
};

export const useKPIs = () => {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: () => kpiApi.getKPIs().then((r) => r.data.data),
  });
};

export const useMyKPIs = () => {
  return useQuery({
    queryKey: ['myKpis'],
    queryFn: () => kpiApi.getMyKPIs().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
};

export const useKPIRecords = (params) => {
  return useQuery({
    queryKey: ['kpiRecords', params],
    queryFn: () => kpiApi.getKPIRecords(params).then((r) => r.data.data),
  });
};

export const useCreateKPI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiApi.createKPI,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kpis'] }),
  });
};

export const useRequestKPIChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiApi.requestChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['myKpis'] });
    },
  });
};

export const useApproveKPIChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kpiApi.approveChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['changeRequests'] });
    },
  });
};

export const useChangeRequests = () => {
  return useQuery({
    queryKey: ['changeRequests'],
    queryFn: () => kpiApi.getChangeRequests().then((r) => r.data.data),
  });
};
```

### 5. useReports.js
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const reportApi = {
  getReports: (params) => api.get('/reports', { params }),
  generateReport: (data) => api.post('/reports/generate', data),
  getReport: (id) => api.get(`/reports/${id}`),
  exportReport: ({ id, format }) => api.get(`/reports/${id}/export?format=${format}`, { responseType: 'blob' }),
  getAdminSummary: (params) => api.get('/reports/admin/summary', { params }),
};

export const useReports = (filters = {}) => {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportApi.getReports(filters).then((r) => r.data.data),
  });
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reportApi.generateReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
};

export const useReport = (id) => {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => reportApi.getReport(id).then((r) => r.data.data),
    enabled: !!id,
  });
};

export const useExportReport = () => {
  return useMutation({
    mutationFn: reportApi.exportReport,
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${variables.id}.${variables.format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
};

export const useAdminSummary = (params) => {
  return useQuery({
    queryKey: ['adminSummary', params],
    queryFn: () => reportApi.getAdminSummary(params).then((r) => r.data.data),
    enabled: !!params?.startDate && !!params?.endDate,
  });
};
```

### 6. useNotifications.js
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const notificationApi = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  updatePreferences: (data) => api.put('/notifications/preferences', data),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const useNotifications = (params = {}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationApi.getNotifications(params).then((r) => r.data.data),
    refetchInterval: 30000, // poll every 30s as fallback
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data.data),
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.updatePreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
```

### 7. useMeetings.js
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const meetingApi = {
  getMeetings: (params) => api.get('/meetings', { params }),
  getMeeting: (id) => api.get(`/meetings/${id}`),
  createMeeting: (data) => api.post('/meetings', data),
  updateMeeting: ({ id, data }) => api.put(`/meetings/${id}`, data),
  deleteMeeting: (id) => api.delete(`/meetings/${id}`),
};

export const useMeetings = (filters = {}) => {
  return useQuery({
    queryKey: ['meetings', filters],
    queryFn: () => meetingApi.getMeetings(filters).then((r) => r.data.data),
  });
};

export const useMeeting = (id) => {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: () => meetingApi.getMeeting(id).then((r) => r.data.data),
    enabled: !!id,
  });
};

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingApi.createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingApi.updateMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingApi.deleteMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};
```

### 8. useKanban.js
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const kanbanApi = {
  getBoards: () => api.get('/kanban/boards'),
  getBoard: (id) => api.get(`/kanban/boards/${id}`),
  createBoard: (data) => api.post('/kanban/boards', data),
  updateBoard: ({ id, data }) => api.put(`/kanban/boards/${id}`, data),
  moveCard: ({ cardId, data }) => api.put(`/kanban/cards/${cardId}/move`, data),
  addComment: ({ cardId, data }) => api.post(`/kanban/cards/${cardId}/comments`, data),
  updateCardMembers: ({ cardId, data }) => api.put(`/kanban/cards/${cardId}/members`, data),
  getCard: (id) => api.get(`/kanban/cards/${id}`),
};

export const useKanbanBoards = () => {
  return useQuery({
    queryKey: ['kanbanBoards'],
    queryFn: () => kanbanApi.getBoards().then((r) => r.data.data),
  });
};

export const useKanbanBoard = (id) => {
  return useQuery({
    queryKey: ['kanbanBoard', id],
    queryFn: () => kanbanApi.getBoard(id).then((r) => r.data.data),
    enabled: !!id,
  });
};

export const useCreateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.createBoard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanbanBoards'] }),
  });
};

export const useMoveCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.moveCard,
    onMutate: async ({ cardId, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['kanbanBoard'] });
      const previousBoard = queryClient.getQueryData(['kanbanBoard']);
      queryClient.setQueryData(['kanbanBoard'], (old) => {
        // Move card in cached data
        return optimisticMoveCard(old, cardId, data);
      });
      return { previousBoard };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['kanbanBoard'], context.previousBoard);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.addComment,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
      queryClient.invalidateQueries({ queryKey: ['card', variables.cardId] });
    },
  });
};

export const useUpdateCardMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.updateCardMembers,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] }),
  });
};

export const useCard = (id) => {
  return useQuery({
    queryKey: ['card', id],
    queryFn: () => kanbanApi.getCard(id).then((r) => r.data.data),
    enabled: !!id,
  });
};
```

### 9. useChat.js
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId, params) => api.get(`/chat/messages/${conversationId}`, { params }),
  sendMessage: (data) => api.post('/chat/messages', data),
  createConversation: (data) => api.post('/chat/conversations', data),
  searchMessages: (query) => api.get('/chat/search', { params: { q: query } }),
};

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations().then((r) => r.data.data),
  });
};

export const useMessages = (conversationId, params = {}) => {
  return useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () => chatApi.getMessages(conversationId, params).then((r) => r.data.data),
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
};

export const useSearchMessages = (query) => {
  return useQuery({
    queryKey: ['messageSearch', query],
    queryFn: () => chatApi.searchMessages(query).then((r) => r.data.data),
    enabled: query.length > 2,
  });
};
```

### 10. useDrive.js
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const driveApi = {
  getAuthUrl: () => api.get('/drive/auth'),
  getFiles: () => api.get('/drive/files'),
  shareFile: (data) => api.post('/drive/share', data),
  getStatus: () => api.get('/drive/status'),
};

export const useDriveStatus = () => {
  return useQuery({
    queryKey: ['driveStatus'],
    queryFn: () => driveApi.getStatus().then((r) => r.data.data),
  });
};

export const useDriveFiles = () => {
  return useQuery({
    queryKey: ['driveFiles'],
    queryFn: () => driveApi.getFiles().then((r) => r.data.data),
    enabled: false, // manual fetch when picker opens
  });
};

export const useShareDriveFile = () => {
  return useMutation({
    mutationFn: driveApi.shareFile,
  });
};
```

### 11. useUsers.js (Admin)
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const userApi = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: ({ id, data }) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateRole: ({ id, role }) => api.put(`/users/${id}/role`, { role }),
};

export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => userApi.getUsers(filters).then((r) => r.data.data),
  });
};

export const useUser = (id) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getUser(id).then((r) => r.data.data),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};
```

---

## Zustand Store Patterns (Client State)

### useAuthStore.js
```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    { name: 'auth-storage', partialize: (state) => ({ user: state.user }) }
  )
);
```

### useUIStore.js
```js
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'light',
  activeModal: null,
  toastQueue: [],
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  addToast: (toast) => set((s) => ({ toastQueue: [...s.toastQueue, toast] })),
  removeToast: (id) => set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),
}));
```

### useKanbanStore.js (Optimistic Drag State)
```js
import { create } from 'zustand';

export const useKanbanStore = create((set) => ({
  activeDragId: null,
  overColumnId: null,
  setActiveDrag: (id) => set({ activeDragId: id }),
  setOverColumn: (id) => set({ overColumnId: id }),
  clearDrag: () => set({ activeDragId: null, overColumnId: null }),
}));
```

---

## Key Implementation Patterns

### 1. RBAC Route Guard
```jsx
// router/ProtectedRoute.jsx
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/unauthorized" />;
  return children;
};
```

### 2. Socket.io Event Constants
All socket events must use constants from `lib/constants.js`. NEVER use string literals.
```js
export const SOCKET_EVENTS = {
  MESSAGE_NEW: 'message:new',
  NOTIFICATION_NEW: 'notification:new',
  KANBAN_CARD_MOVED: 'kanban:card_moved',
  KANBAN_COMMENT_ADDED: 'kanban:comment_added',
  LEAD_STATUS_CHANGED: 'lead:status_changed',
  USER_ONLINE: 'user:online',
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
};
```

### 3. Form Validation (Zod) - ALL FIELDS OPTIONAL
```js
const leadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  linkedInUrl: z.string().url().optional().or(z.literal('')),
  salesNavigatorUrl: z.string().url().optional().or(z.literal('')),
  company: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  // ALL fields optional per FR-01.4
});
```

### 4. AG Grid Configuration
- Use `serverSide` row model for large datasets (10k+ leads)
- Custom cell renderers for `StatusBadge` in connection/message columns
- Enable CSV export via AG Grid's built-in `csvExport`
- Row selection: multi-select for bulk actions

### 5. Kanban DnD Pattern
- Use `@dnd-kit/core` sensors with `useSensor(MouseSensor, { activationConstraint: { distance: 5 } })` to prevent accidental drags
- Optimistic update via `useMoveCard` hook (onMutate/onError/onSettled pattern)
- Each column is a `Droppable`, each card is a `Draggable` with `useSortable`

### 6. File Upload Pattern
```jsx
// FileUploader.jsx
// - Accept: .csv, .xlsx, .xls (max 10MB)
// - Show progress bar using Axios onUploadProgress
// - Parse preview with SheetJS BEFORE uploading
// - Highlight error rows in preview table
// - Use useBulkUpload() mutation
```

### 7. Notification System
- Use `NotificationPanel` slide-out drawer (MUI Drawer)
- Real-time via Socket.io `notification:new` -> invalidate `useNotifications` query
- Polling fallback: `refetchInterval: 30000` in `useNotifications`
- Mark as read via `useMarkAsRead()` mutation

### 8. Dashboard KPI Cards
```jsx
<KPIIndicator 
  title="Connections Sent Today"
  current={45}
  target={50}
  unit=""
  // Green if >= 90%, Yellow 70-89%, Red < 70%
/>
```

### 9. Google Drive Integration
- OAuth 2.0 popup flow via `window.open()` to backend `/api/v1/drive/auth`
- Store connection status in `useAuthStore`
- `DriveFilePicker` opens modal, calls `useDriveFiles().refetch()`
- Share generates a `drive_link` message type in chat

### 10. Query Invalidation Strategy
```js
// After any mutation that affects leads, ALWAYS invalidate:
queryClient.invalidateQueries({ queryKey: ['leads'] });
queryClient.invalidateQueries({ queryKey: ['dashboard'] });

// After Kanban mutations:
queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
queryClient.invalidateQueries({ queryKey: ['kanbanBoards'] });

// After KPI changes:
queryClient.invalidateQueries({ queryKey: ['kpis'] });
queryClient.invalidateQueries({ queryKey: ['myKpis'] });
queryClient.invalidateQueries({ queryKey: ['kpiRecords'] });

// After report generation:
queryClient.invalidateQueries({ queryKey: ['reports'] });
```

---

## State Management Rules
1. **Server state** (leads, reports, users) -> TanStack React Query (caching, invalidation, background refetch)
2. **Client state** (UI, auth, modals) -> Zustand (lightweight, no Redux boilerplate)
3. **Real-time state** (chat messages, notifications) -> Socket.io events update React Query cache via `queryClient.setQueryData()` + Zustand for unread counts
4. **Form state** -> React Hook Form (local, never in Zustand/Query)
5. **Kanban drag state** -> `@dnd-kit` internal state + Zustand for active drag tracking

## Component Rules
- All page components must be lazy-loaded: `lazy(() => import('./pages/LeadsPage.jsx'))`
- All API calls must go through TanStack Query hooks in `hooks/api/` (no raw fetch/axios in components except file upload progress)
- All status colors centralized in `utils/colorUtils.js`:
  - `connectionStatus`: not_sent=#9e9e9e, sent=#2196f3, accepted=#4caf50, declined=#f44336
  - `messageStatus`: not_sent=#9e9e9e, sent=#2196f3, replied=#ff9800, follow_up=#ff5722, negative=#f44336, positive=#4caf50, future_lead=#9c27b0
- All dates displayed with `date-fns format()` in user's timezone
- Error boundaries wrap every page route
- Loading states: use `isPending` (React Query v5) or `isLoading` for initial load

## Environment Variables
```
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=xxx
VITE_APP_NAME=B2B Lead Gen
```

## Performance Requirements
- Code split by route (React.lazy + Suspense)
- AG Grid virtual scrolling for lead tables
- Memoize Kanban cards with React.memo
- Debounce search inputs (300ms)
- React Query staleTime: 60s for leads, 300s for reports, Infinity for auth user
- Image optimization: lazy load avatars, compress uploads

## Accessibility
- MUI components used for native a11y
- All icons have `aria-label`
- Color-blind friendly: use icons + text for status, not color alone
- Keyboard navigation for Kanban (Tab + Enter to move)
