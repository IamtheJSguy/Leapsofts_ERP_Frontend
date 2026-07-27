import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
  TextField,
  Autocomplete,
  InputAdornment,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Card,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  LinearProgress,
  IconButton,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ShieldIcon from '@mui/icons-material/Shield';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';

import { tokens } from '@/styles/tokens';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/store/useUIStore';
import { useUsers } from '@/hooks/api/useUsers';
import { useKPITemplates, useCreateKPITemplate, useUpdateKPITemplate, useDeleteKPITemplate, useAssignKPITemplate, useMyAssignments, useKPITemplateAssignments, useUnassignKPITemplate, useRemoveAssignmentItem } from '@/hooks/api/usekpiTemplate';
import { UserDailyKpisView } from '@/components/dashboard/UserDailyKpisView';
import { DailyTeamProgress } from '@/components/admin/DailyTeamProgress';
import { PriorityBadge } from '@/components/kpi/PriorityBadge';
import { KPIChangeRequestModal, type ChangeRequestModalMode } from '@/components/kpi/KPIChangeRequestModal';
import { ChangeRequestQueue } from '@/components/kpi/ChangeRequestQueue';
import { MyChangeRequestsPanel } from '@/components/kpi/MyChangeRequestsPanel';
import { StandaloneKPIForm } from '@/components/kpi/StandaloneKPIForm';
import { useKPIs, useDeleteKPI } from '@/hooks/api/useKPIs';
import { usePendingKPIChangeRequests, useMyKPIChangeRequests } from '@/hooks/api/useKPIChangeRequests';
import { KPI_PRIORITY_OPTIONS } from '@/lib/priorityConfig';
import { PIPELINE_METRIC_LABELS, PIPELINE_METRIC_OPTIONS } from '@/lib/constants';
import type { KpiPriority, KPI, PipelineMetric } from '@/types';
import api from '@/lib/axios';
import type { User } from '@/types';

// Interfaces for templates and assignments matching the exact structure
interface UIKPITemplateItem {
  name: string;
  description: string;
  targetValue?: number;
  pipelineMetric?: PipelineMetric | '';
  assignedTo: string[];
}

interface UIKPITemplate {
  _id: string;
  name: string;
  description?: string;
  kpis: UIKPITemplateItem[];
}

interface ActiveAssignmentItem {
  _id?: string;
  itemId?: string;
  name: string;
  description: string;
  targetValue?: number;
  dueDate?: string;
  pipelineMetric?: PipelineMetric;
  priority?: KpiPriority;
  assignedTo: string[];
  completed: boolean;
}

interface ActiveAssignment {
  _id: string;
  templateId: string;
  templateName: string;
  assignedTo: string[]; // user IDs
  assignedBy?: string; // user ID who assigned
  deadlineDate: string;
  deadlineTime: string;
  kpis: ActiveAssignmentItem[];
}


const TasksPage = () => {
  const { user } = useAuth();
  const { isElevated } = usePermissions();
  const addToast = useUIStore((s) => s.addToast);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Fetch actual employees/users from the API
  const { data: dbUsers = [] } = useUsers();

  // Fetch actual templates from the API
  const { data: apiTemplates = [], isLoading: isTemplatesLoading } = useKPITemplates({ enabled: isElevated });
  const createTemplateMutation = useCreateKPITemplate();
  const updateTemplateMutation = useUpdateKPITemplate();
  const deleteTemplateMutation = useDeleteKPITemplate();
  const assignTemplateMutation = useAssignKPITemplate();
  const unassignTemplateMutation = useUnassignKPITemplate();
  const removeAssignmentItemMutation = useRemoveAssignmentItem();
  const { data: standaloneKpis = [] } = useKPIs({ enabled: isElevated });
  const deleteKpiMutation = useDeleteKPI();
  const { data: pendingChangeRequests = [] } = usePendingKPIChangeRequests({ enabled: isElevated });
  const { data: myChangeRequests = [] } = useMyKPIChangeRequests();

  // State to track if we are editing an existing template
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Map API templates (with backend schema: items, defaultTargetValue) to the UI schema
  const templates = useMemo((): UIKPITemplate[] => {
    return apiTemplates.map((t) => ({
      _id: t._id,
      name: t.name,
      description: t.description || '',
      kpis: (t.items || []).map((item) => ({
        name: item.name,
        description: item.description || '',
        targetValue: item.defaultTargetValue,
        pipelineMetric: item.pipelineMetric || '',
        assignedTo: item.assignedTo || [],
      })),
    }));
  }, [apiTemplates]);

  // Fetch assignments conditionally: admin sees all assignments, agent sees their own assignments
  const { data: adminAssignments = [] } = useKPITemplateAssignments({ enabled: isElevated });
  const { data: userAssignments = [] } = useMyAssignments({ enabled: !isElevated });
  const apiAssignments = isElevated ? adminAssignments : userAssignments;

  // Map API assignments to UI assignments
  const mappedAssignments = useMemo((): ActiveAssignment[] => {
    return apiAssignments.map((a) => {
      const templateName = typeof a.templateId === 'object' && a.templateId ? a.templateId.name : (a.templateName || 'KPI Template');
      const templateId = typeof a.templateId === 'object' && a.templateId ? a.templateId._id : (a.templateId || '');
      
      // Support both string IDs (for user-level assignments) and populated objects (for admin-level assignments)
      const assignedTo = a.userId
        ? (typeof a.userId === 'object' && a.userId ? [a.userId._id] : [a.userId])
        : (a.userIds || a.assignedTo || []);
      const assignedBy = a.assignedBy
        ? (typeof a.assignedBy === 'object' && a.assignedBy ? a.assignedBy._id : a.assignedBy)
        : '';

      // Mapped KPIs
      const kpis = (a.kpis || a.items || []).map((k: any) => ({
        _id: k._id,
        itemId: k._id || k.templateItemId,
        name: k.name,
        description: k.description || '',
        targetValue: k.targetValue ?? k.defaultTargetValue,
        dueDate: k.dueDate,
        pipelineMetric: k.pipelineMetric,
        priority: k.priority || 'medium',
        assignedTo: k.assignedTo || assignedTo,
        completed: k.completed || false,
      }));

      return {
        _id: a._id,
        templateId,
        templateName,
        assignedTo,
        assignedBy,
        deadlineDate: a.deadlineDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        deadlineTime: a.deadlineTime || '18:00',
        kpis,
      };
    });
  }, [apiAssignments]);

  // Active assignments state — populated exclusively from the API
  const [activeAssignments, setActiveAssignments] = useState<ActiveAssignment[]>([]);

  // Sync API assignments to local state — always mirror the API (handles empty results too)
  useEffect(() => {
    setActiveAssignments(mappedAssignments);
  }, [mappedAssignments]);

  // State to store resolved assigner names fetched directly from DB by ID (or resolved from populated api response)
  const [assignerNames, setAssignerNames] = useState<Record<string, { name: string; email: string; initial: string; jobTitle?: string }>>({});

  // Pre-populate assigner details from already-populated nested user objects returned by the API
  useEffect(() => {
    if (!apiAssignments || apiAssignments.length === 0) return;
    
    apiAssignments.forEach((a) => {
      [a.assignedBy, a.userId].forEach((u) => {
        if (u && typeof u === 'object' && u._id) {
          const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Admin';
          const initial = name.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A';
          const jobTitle = u.jobTitle || (u.role === 'admin' ? 'Administrator' : 'Agent');
          setAssignerNames((prev) => {
            if (prev[u._id]) return prev;
            return {
              ...prev,
              [u._id]: { name, email: u.email || 'N/A', initial, jobTitle },
            };
          });
        }
      });
    });
  }, [apiAssignments]);

  useEffect(() => {
    const assignerIds = Array.from(
      new Set(
        activeAssignments
          .map((a) => a.assignedBy)
          .filter((id): id is string => !!id && typeof id === 'string')
      )
    );

    const fetchAssigners = async () => {
      for (const id of assignerIds) {
        if (assignerNames[id] || dbUsers.some((u) => u._id === id)) continue;

        try {
          // Pre-populate with a temporary state so we don't fetch it again
          setAssignerNames((prev) => ({
            ...prev,
            [id]: { name: 'Loading...', email: 'N/A', initial: '...' },
          }));

          const response = await api.get<{ data: User }>(`/users/${id}`);
          if (response.data?.data) {
            const u = response.data.data;
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Admin';
            const initial = name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'A';
            const jobTitle = u.jobTitle || (u.role === 'admin' ? 'Administrator' : 'Agent');
            setAssignerNames((prev) => ({
              ...prev,
              [id]: { name, email: u.email, initial, jobTitle },
            }));
          } else {
            setAssignerNames((prev) => ({
              ...prev,
              [id]: { name: 'Admin', email: 'N/A', initial: 'A', jobTitle: 'Administrator' },
            }));
          }
        } catch (err) {
          console.error('Failed to fetch assigner details', err);
          setAssignerNames((prev) => ({
            ...prev,
            [id]: { name: 'Admin', email: 'N/A', initial: 'A', jobTitle: 'Administrator' },
          }));
        }
      }
    };

    if (assignerIds.length > 0) {
      fetchAssigners();
    }
  }, [activeAssignments, dbUsers]);

  // Tabs navigation
  type DashboardTab = 'templates' | 'assignments' | 'standalone_kpis' | 'change_requests' | 'daily_progress';
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('templates');

  // Set default tab to assignments for non-admin users
  useEffect(() => {
    if (!isElevated) {
      setDashboardTab('assignments');
    }
  }, [isElevated]);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'change_requests' && isElevated) setDashboardTab('change_requests');
  }, [isElevated]);

  // Active assignment sub-filtering for agents/users
  const [taskCategory, setTaskCategory] = useState<'active' | 'overdue' | 'high' | 'done'>('active');

  const categoryCounts = useMemo(() => {
    let active = 0;
    let overdue = 0;
    let high = 0;
    let done = 0;

    const now = new Date();

    // Make sure we only count assignments relevant to the current user (if they are agent)
    const relevantAssignments = activeAssignments.filter((assign) => {
      if (!isElevated && user) {
        return assign.assignedTo.some((id) => id === user._id || (id === 'user-1' && user.email === 'alex@leapsofts.com'));
      }
      return true;
    });

    relevantAssignments.forEach((assign) => {
      const isCompleted = assign.kpis.every((k) => k.completed);
      if (isCompleted) {
        done++;
        return;
      }

      const deadline = new Date(`${assign.deadlineDate}T${assign.deadlineTime || '23:59'}:00`);
      const isPast = isNaN(deadline.getTime())
        ? new Date(assign.deadlineDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
        : deadline.getTime() < now.getTime();

      if (isPast) {
        overdue++;
        high++; // Overdue is always high priority!
      } else {
        active++;
        const timeDiff = deadline.getTime() - now.getTime();
        if (timeDiff <= 172800000) {
          high++; // Due within 48 hours is high priority!
        }
      }
    });

    return { active, overdue, high, done };
  }, [activeAssignments, isElevated, user]);

  // Navigation View modes: 'list', 'create', or 'details'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'details'>('list');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Selected entities for details page
  const [selectedTemplate, setSelectedTemplate] = useState<UIKPITemplate | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<ActiveAssignment | null>(null);

  // Creator wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newKpis, setNewKpis] = useState<UIKPITemplateItem[]>([{ name: '', description: '', targetValue: undefined, pipelineMetric: '', assignedTo: [] }]);

  // Assignment dialog state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningTemplate, setAssigningTemplate] = useState<UIKPITemplate | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Confirm dialog state for unassign
  const [confirmUnassignOpen, setConfirmUnassignOpen] = useState(false);
  const [pendingUnassign, setPendingUnassign] = useState<ActiveAssignment | null>(null);

  // Confirm dialog state for delete template
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Confirm dialog state for assign template
  const [confirmAssignOpen, setConfirmAssignOpen] = useState(false);
  const [assignItemOverrides, setAssignItemOverrides] = useState<Record<number, { targetValue?: number; priority?: KpiPriority; dueDate?: string; pipelineMetric?: PipelineMetric }>>({});
  const [changeModal, setChangeModal] = useState<ChangeRequestModalMode | null>(null);
  const [standaloneFormOpen, setStandaloneFormOpen] = useState(false);
  const [editingStandaloneKpi, setEditingStandaloneKpi] = useState<KPI | null>(null);
  const [confirmDeleteStandaloneOpen, setConfirmDeleteStandaloneOpen] = useState(false);
  const [standaloneKpiToDelete, setStandaloneKpiToDelete] = useState<string | null>(null);

  const pendingItemKeys = useMemo(() => {
    const keys = new Set<string>();
    myChangeRequests.filter((r) => r.status === 'pending').forEach((r) => {
      if (r.assignmentId && r.assignmentItemId) keys.add(`${r.assignmentId}:${r.assignmentItemId}`);
    });
    return keys;
  }, [myChangeRequests]);

  const handleOpenAssignModal = (template: UIKPITemplate) => {
    setAssigningTemplate(template);
    setSelectedUserId(null);
    setAssignItemOverrides({});
    setIsAssignOpen(true);
  };

  // Dynamic KPI Builder handlers
  const handleAddKpiField = () => {
    setNewKpis((prev) => [...prev, { name: '', description: '', targetValue: undefined, pipelineMetric: '', assignedTo: [] }]);
  };

  const handleRemoveKpiField = (index: number) => {
    setNewKpis((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleKpiFieldChange = (index: number, field: keyof UIKPITemplateItem, value: any) => {
    setNewKpis((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleResetWizard = () => {
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewKpis([{ name: '', description: '', targetValue: undefined, pipelineMetric: '', assignedTo: [] }]);
    setWizardStep(0);
    setEditingTemplateId(null);
  };

  const handlePublishTemplate = () => {
    if (!newTemplateName.trim()) {
      addToast({ message: 'Template name is required.', severity: 'error' });
      return;
    }

    const validKpis = newKpis.filter((k) => k.name.trim());
    if (validKpis.length === 0) {
      addToast({ message: 'Please add at least one KPI with a name.', severity: 'error' });
      return;
    }

    const payloadItems = validKpis.map((k) => ({
      name: k.name.trim(),
      description: k.description.trim() || 'No description provided.',
      defaultTargetValue: k.targetValue != null && k.targetValue !== ('' as any) ? Number(k.targetValue) : undefined,
      pipelineMetric: k.pipelineMetric || undefined,
    }));

    if (editingTemplateId) {
      updateTemplateMutation.mutate(
        {
          id: editingTemplateId,
          data: {
            name: newTemplateName.trim(),
            description: newTemplateDesc.trim() || 'No description provided.',
            items: payloadItems,
          },
        },
        {
          onSuccess: () => {
            addToast({ message: 'KPI Template updated successfully!', severity: 'success' });
            setSelectedTemplate({
              _id: editingTemplateId,
              name: newTemplateName.trim(),
              description: newTemplateDesc.trim() || 'No description provided.',
              kpis: validKpis.map((k) => ({
                name: k.name.trim(),
                description: k.description.trim() || 'No description provided.',
                targetValue: k.targetValue,
                pipelineMetric: k.pipelineMetric || undefined,
                assignedTo: [],
              })),
            });
            setViewMode('details');
            handleResetWizard();
          },
          onError: (err: any) => {
            addToast({
              message: err?.response?.data?.message || 'Failed to update KPI Template.',
              severity: 'error',
            });
          },
        }
      );
    } else {
      createTemplateMutation.mutate(
        {
          name: newTemplateName.trim(),
          description: newTemplateDesc.trim() || 'No description provided.',
          items: payloadItems,
        },
        {
          onSuccess: () => {
            addToast({ message: 'KPI Template created successfully!', severity: 'success' });
            setViewMode('list');
            setDashboardTab('templates');
            handleResetWizard();
          },
          onError: (err: any) => {
            addToast({
              message: err?.response?.data?.message || 'Failed to create KPI Template.',
              severity: 'error',
            });
          },
        }
      );
    }
  };

  // Delete a KPI template from the database
  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedTemplate) return;
    deleteTemplateMutation.mutate(selectedTemplate._id, {
      onSuccess: () => {
        addToast({ message: 'KPI Template deleted successfully!', severity: 'success' });
        setConfirmDeleteOpen(false);
        setSelectedTemplate(null);
        setViewMode('list');
      },
      onError: (err: any) => {
        addToast({
          message: err?.response?.data?.message || 'Failed to delete KPI Template.',
          severity: 'error',
        });
        setConfirmDeleteOpen(false);
      },
    });
  };

  // Unassign a KPI template from a team member
  const handleUnassign = (assign: ActiveAssignment) => {
    if (!assign.assignedTo || assign.assignedTo.length === 0) {
      addToast({ message: 'No assignee found for this target.', severity: 'error' });
      return;
    }
    setPendingUnassign(assign);
    setConfirmUnassignOpen(true);
  };

  const handleConfirmUnassign = () => {
    if (!pendingUnassign) return;
    unassignTemplateMutation.mutate(
      {
        id: pendingUnassign.templateId,
        userId: pendingUnassign.assignedTo[0],
      },
      {
        onSuccess: () => {
          // Immediately remove the card from local state — don't wait for refetch
          setActiveAssignments((prev) =>
            prev.filter((a) => a._id !== pendingUnassign._id)
          );
          addToast({ message: 'Target unassigned successfully!', severity: 'success' });
          setConfirmUnassignOpen(false);
          if (viewMode === 'details' && selectedAssignment?._id === pendingUnassign._id) {
            setViewMode('list');
            setSelectedAssignment(null);
          }
          setPendingUnassign(null);
        },
        onError: (err: any) => {
          addToast({
            message: err?.response?.data?.message || 'Failed to unassign target.',
            severity: 'error',
          });
          setConfirmUnassignOpen(false);
          setPendingUnassign(null);
        },
      }
    );
  };

  // Assign template to team members
  const handleAssignTemplate = () => {
    if (!assigningTemplate) return;

    if (!selectedUserId) {
      addToast({ message: 'Please select a team member to assign this template.', severity: 'error' });
      return;
    }

    setConfirmAssignOpen(true);
  };

  const handleConfirmAssign = () => {
    if (!assigningTemplate || !selectedUserId) return;

    const overridesList = assigningTemplate.kpis.map((k, itemIndex) => ({
      itemIndex,
      targetValue: assignItemOverrides[itemIndex]?.targetValue ?? k.targetValue,
      priority: assignItemOverrides[itemIndex]?.priority ?? ('medium' as KpiPriority),
      dueDate: assignItemOverrides[itemIndex]?.dueDate,
      pipelineMetric: assignItemOverrides[itemIndex]?.pipelineMetric ?? (k.pipelineMetric || undefined),
    }));

    assignTemplateMutation.mutate(
      {
        id: assigningTemplate._id,
        userIds: [selectedUserId],
        overrides: { [selectedUserId]: overridesList },
      },
      {
        onSuccess: () => {
          const activeKpis: ActiveAssignmentItem[] = assigningTemplate.kpis.map((k) => ({
            name: k.name,
            description: k.description,
            targetValue: k.targetValue,
            pipelineMetric: k.pipelineMetric || undefined,
            assignedTo: [selectedUserId],
            completed: false,
          }));

          const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

          const newAssignment: ActiveAssignment = {
            _id: `assign-${Date.now()}`,
            templateId: assigningTemplate._id,
            templateName: assigningTemplate.name,
            assignedTo: [selectedUserId],
            deadlineDate: tomorrowDate,
            deadlineTime: '18:00',
            kpis: activeKpis,
          };

          setActiveAssignments((prev) => [newAssignment, ...prev]);
          addToast({
            message: 'KPI Template successfully assigned to the user.',
            severity: 'success',
          });
          setIsAssignOpen(false);
          setConfirmAssignOpen(false);
          if (!isElevated) {
            setDashboardTab('assignments');
          }
        },
        onError: (err: any) => {
          setConfirmAssignOpen(false);
          addToast({
            message: err?.response?.data?.message || 'Failed to assign KPI Template.',
            severity: 'error',
          });
        },
      }
    );
  };

  // Toggle KPI milestone checkmark on active assignment details view
  const handleToggleKpiCompletion = (assignmentId: string, kpiName: string) => {
    setActiveAssignments((prev) =>
      prev.map((assign) => {
        if (assign._id === assignmentId) {
          const nextKpis = assign.kpis.map((k) => {
            if (k.name === kpiName) {
              return { ...k, completed: !k.completed };
            }
            return k;
          });
          return { ...assign, kpis: nextKpis };
        }
        return assign;
      })
    );

    setSelectedAssignment((prev) => {
      if (prev && prev._id === assignmentId) {
        const nextKpis = prev.kpis.map((k) => {
          if (k.name === kpiName) {
            return { ...k, completed: !k.completed };
          }
          return k;
        });
        return { ...prev, kpis: nextKpis };
      }
      return prev;
    });
  };

  // Autocomplete / user lookup helpers
  const getUserDetails = (id: string | any) => {
    if (!id) return { name: 'Admin', email: 'N/A', jobTitle: 'Administrator', initial: 'A' };

    // If id is already a populated user object
    if (typeof id === 'object') {
      const name = `${id.firstName || ''} ${id.lastName || ''}`.trim() || id.email || 'Admin';
      return {
        name,
        email: id.email || 'N/A',
        jobTitle: id.jobTitle || (id.role === 'admin' ? 'Administrator' : 'Agent'),
        initial: name.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A',
      };
    }

    // Check if it matches currently logged in user
    if (user && user._id === id) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      return {
        name,
        email: user.email,
        jobTitle: user.role === 'admin' ? 'Administrator' : (user.jobTitle || 'Agent'),
        initial: name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U',
      };
    }

    // Check if it's already resolved in our custom assignerNames store
    if (typeof id === 'string' && assignerNames[id]) {
      const resolved = assignerNames[id];
      return {
        name: resolved.name,
        email: resolved.email,
        jobTitle: resolved.jobTitle || 'Administrator',
        initial: resolved.initial,
      };
    }

    const matched = dbUsers.find((u) => u._id === id);
    if (matched) {
      const name = `${matched.firstName || ''} ${matched.lastName || ''}`.trim() || matched.email;
      return {
        name,
        email: matched.email,
        jobTitle: matched.jobTitle || 'Agent',
        initial: name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U',
      };
    }

    // Fallback for known admin/creator ID
    if (id === '6a21b8069e41b1e95e7ec222') {
      return { name: 'Admin', email: 'admin@leapsofts.com', jobTitle: 'Administrator', initial: 'A' };
    }

    return { name: 'Admin', email: 'N/A', jobTitle: 'Administrator', initial: 'A' };
  };

  // Filter templates list based on search
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [templates, searchQuery]);

  // Filter assignments list based on search, user permissions, and category tabs (for non-admins)
  const filteredAssignments = useMemo(() => {
    return activeAssignments.filter((assign) => {
      // 1. User role assignment filter
      if (!isElevated && user) {
        const isAssigned = assign.assignedTo.some((id) => {
          return id === user._id || (id === 'user-1' && user.email === 'alex@leapsofts.com');
        });
        if (!isAssigned) return false;
      }

      // 2. Search query filter
      const matchesSearch =
        assign.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assign.kpis.some((k) => k.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      // 3. Category tab filter (only applied for agents/users, keep admin same)
      if (!isElevated) {
        const isCompleted = assign.kpis.every((k) => k.completed);
        
        if (taskCategory === 'done') {
          return isCompleted;
        }

        // If completed but tab is not 'done', hide it
        if (isCompleted) return false;

        const deadline = new Date(`${assign.deadlineDate}T${assign.deadlineTime || '23:59'}:00`);
        const now = new Date();
        const isPast = isNaN(deadline.getTime())
          ? new Date(assign.deadlineDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
          : deadline.getTime() < now.getTime();

        if (taskCategory === 'overdue') {
          return isPast;
        }

        if (taskCategory === 'high') {
          // Overdue or due in <= 48 hours
          return isPast || (deadline.getTime() - now.getTime() <= 172800000);
        }

        if (taskCategory === 'active') {
          // Active means not overdue (future deadline)
          return !isPast;
        }
      }

      return true;
    });
  }, [activeAssignments, searchQuery, taskCategory, isElevated, user]);

  // Combined statistics based on state databases
  const stats = useMemo(() => {
    const activeTemplatesCount = templates.length;
    const userAssignments = activeAssignments.filter((assign) => {
      if (!isElevated && user) {
        return assign.assignedTo.some((id) => id === user._id || (id === 'user-1' && user.email === 'alex@leapsofts.com'));
      }
      return true;
    });
    const activeAssignmentsCount = userAssignments.length;
    const completedAssignmentsCount = userAssignments.filter((assign) =>
      assign.kpis.every((k) => k.completed)
    ).length;

    return {
      activeTemplatesCount,
      activeAssignmentsCount,
      completedAssignmentsCount,
    };
  }, [templates, activeAssignments, isElevated, user]);

  const handleLayoutChange = (_event: React.MouseEvent<HTMLElement>, newLayout: 'grid' | 'list' | null) => {
    if (newLayout !== null) {
      setViewLayout(newLayout);
    }
  };

  // FULL PAGE KPI TEMPLATE CREATION WIZARD RENDERING
  const renderMainContent = () => {
    if (viewMode === 'create') {
      return (
        <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
        {/* Back navigation header toolbar */}
        <Box sx={{ mb: 4.5, display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => {
              if (editingTemplateId) {
                setViewMode('details');
              } else {
                setViewMode('list');
              }
              handleResetWizard();
            }}
            startIcon={<ArrowBackIcon />}
            sx={{
              borderRadius: '24px',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.08)',
              color: isDarkMode ? 'rgba(255,255,255,0.8)' : tokens.text.secondary,
              textTransform: 'none',
              px: 2.75,
              py: 0.75,
              fontWeight: 700,
              fontSize: '0.84rem',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderColor: tokens.brand.primary,
              },
            }}
          >
            Back to Templates
          </Button>
        </Box>

        <Box sx={{ maxWidth: 800, mx: 'auto', mb: 5 }}>
          {/* Custom Connecting Line Stepper */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5, px: 6, position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '48px',
                right: '48px',
                height: '2px',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                zIndex: 0,
                transform: 'translateY(-50%)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '48px',
                width: `${(wizardStep / 2) * 88}%`,
                height: '2px',
                bgcolor: tokens.brand.primary,
                zIndex: 0,
                transform: 'translateY(-50%)',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            {['General Info', 'Build KPIs', 'Review & Publish'].map((label, idx) => {
              const isCompleted = idx < wizardStep;
              const isActive = idx === wizardStep;
              return (
                <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: isActive
                        ? tokens.brand.primary
                        : isCompleted
                          ? tokens.brand.primary
                          : isDarkMode
                            ? '#24202e'
                            : '#fff',
                      border: `2px solid ${isActive || isCompleted ? tokens.brand.primary : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      color: isActive || isCompleted ? '#fff' : 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      fontWeight: isActive || isCompleted ? 700 : 500,
                      color: isActive ? tokens.brand.primary : 'text.secondary',
                      fontSize: '0.72rem',
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Stepper Card Panel - 100% Flat & Clean */}
          <Card
            sx={{
              p: 4.5,
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Step 0: General Info */}
            {wizardStep === 0 && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em' }}>
                  {editingTemplateId ? 'Edit General Info' : 'General Template Info'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontWeight: 500 }}>
                  Enter a name and description to represent this grouped KPI routine. (e.g. Outbound Sales Flow)
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  <TextField
                    label="KPI Template Name"
                    placeholder="e.g. Lead Sourcing & Outreach Routine"
                    required
                    fullWidth
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                      },
                    }}
                  />

                  <TextField
                    label="Description"
                    placeholder="Describe the purpose of this KPI collection..."
                    fullWidth
                    multiline
                    rows={3}
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                      },
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Step 1: KPI Group Builder */}
            {wizardStep === 1 && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em' }}>
                  Define Grouped KPIs
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontWeight: 500 }}>
                  Add multiple KPI targets inside this template. These will track daily activity goals.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, maxHeight: '420px', overflowY: 'auto', pr: 1, mb: 3 }}>
                  {newKpis.map((kpi, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 3,
                        borderRadius: '16px',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5,
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tokens.brand.primary, fontSize: '0.84rem' }}>
                          KPI Target #{idx + 1}
                        </Typography>
                        {newKpis.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveKpiField(idx)}
                            sx={{ color: tokens.semantic.error }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            label={`KPI #${idx + 1} Name`}
                            placeholder="e.g. Connection Requests"
                            required
                            fullWidth
                            value={kpi.name}
                            onChange={(e) => handleKpiFieldChange(idx, 'name', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Target (optional)"
                            type="number"
                            placeholder="e.g. 50"
                            fullWidth
                            value={kpi.targetValue ?? ''}
                            onChange={(e) => handleKpiFieldChange(idx, 'targetValue', e.target.value === '' ? undefined : Number(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            select
                            label="Pipeline Metric (optional)"
                            fullWidth
                            value={kpi.pipelineMetric || ''}
                            onChange={(e) => handleKpiFieldChange(idx, 'pipelineMetric', e.target.value)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                              },
                            }}
                          >
                            <MenuItem value="">None</MenuItem>
                            {PIPELINE_METRIC_OPTIONS.map((m) => (
                              <MenuItem key={m} value={m}>{PIPELINE_METRIC_LABELS[m]}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      </Grid>

                      <TextField
                        label={`KPI #${idx + 1} Target Description`}
                        placeholder="e.g. Send at least 50 connection requests per day"
                        fullWidth
                        multiline
                        rows={2}
                        value={kpi.description}
                        onChange={(e) => handleKpiFieldChange(idx, 'description', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddKpiField}
                  sx={{
                    borderRadius: '16px',
                    borderColor: tokens.brand.primary,
                    color: tokens.brand.primary,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    py: 1,
                    width: '100%',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.1)' : 'rgba(93, 26, 137, 0.03)',
                      borderColor: tokens.brand.primaryLight,
                    },
                  }}
                >
                  Add Another KPI
                </Button>
              </Box>
            )}

            {/* Step 2: Review & Submit */}
            {wizardStep === 2 && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em' }}>
                  {editingTemplateId ? 'Review Template Updates' : 'Review Template Setup'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontWeight: 500 }}>
                  Review all KPIs grouped inside this template before saving.
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    p: 3.5,
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                    borderRadius: '18px',
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, display: 'block', fontSize: '0.62rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      TEMPLATE NAME
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                      {newTemplateName}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, display: 'block', fontSize: '0.62rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      DESCRIPTION
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
                      {newTemplateDesc || 'No description provided.'}
                    </Typography>
                  </Box>

                  <Divider sx={{ opacity: 0.3 }} />

                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, display: 'block', mb: 2, fontSize: '0.62rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      KPI TARGETS LIST
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {newKpis.map((kpi, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <Chip
                            label={`KPI #${idx + 1}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              bgcolor: tokens.brand.primary100,
                              color: tokens.brand.primary,
                              borderRadius: '4px',
                            }}
                          />
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 750, fontSize: '0.84rem' }}>
                              {kpi.name || '(Empty Name)'}
                              {kpi.targetValue != null ? ` — Target: ${kpi.targetValue}` : ' — Simple task'}
                              {kpi.pipelineMetric ? ` (Auto: ${PIPELINE_METRIC_LABELS[kpi.pipelineMetric] || kpi.pipelineMetric})` : ''}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem', mt: 0.25 }}>
                              {kpi.description || '(Empty Description)'}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Stepper Wizard Navigation Controls */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 4.5,
                pt: 3,
                borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <Button
                onClick={() => {
                  if (wizardStep > 0) {
                    setWizardStep(wizardStep - 1);
                  } else {
                    if (editingTemplateId) {
                      setViewMode('details');
                    } else {
                      setViewMode('list');
                    }
                    handleResetWizard();
                  }
                }}
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  borderRadius: '20px',
                  px: 3,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                }}
              >
                {wizardStep === 0 ? 'Cancel' : 'Back'}
              </Button>

              <Button
                variant="contained"
                disabled={wizardStep === 2 && (createTemplateMutation.isPending || updateTemplateMutation.isPending)}
                onClick={() => {
                  if (wizardStep < 2) {
                    if (wizardStep === 0 && !newTemplateName.trim()) {
                      addToast({ message: 'Template name is required.', severity: 'error' });
                      return;
                    }
                    if (wizardStep === 1) {
                      const hasEmpty = newKpis.some((k) => !k.name.trim());
                      if (hasEmpty) {
                        addToast({ message: 'Please enter a name for all KPIs.', severity: 'error' });
                        return;
                      }
                    }
                    setWizardStep(wizardStep + 1);
                  } else {
                    handlePublishTemplate();
                  }
                }}
                sx={{
                  bgcolor: wizardStep === 2 ? '#FFA08A' : tokens.brand.primary,
                  color: '#fff',
                  textTransform: 'none',
                  borderRadius: '20px',
                  px: 3.5,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: wizardStep === 2 ? '#FF8A6F' : tokens.brand.primaryLight,
                    boxShadow: 'none',
                  },
                }}
              >
                {wizardStep === 2 ? ((createTemplateMutation.isPending || updateTemplateMutation.isPending) ? 'Saving...' : 'Confirm & Save Template') : 'Next'}
              </Button>
            </Box>
          </Card>
        </Box>
      </Box>
    );
  }

  // FULL PAGE DETAILS VIEW RENDERING (TEMPLATES OR ASSIGNMENTS)
  if (viewMode === 'details') {
    // Template details layout
    if (selectedTemplate) {
      return (
        <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
          {/* Back toolbar */}
          <Box sx={{ mb: 4.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setViewMode('list');
                setSelectedTemplate(null);
              }}
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: '24px',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.08)',
                color: isDarkMode ? 'rgba(255,255,255,0.8)' : tokens.text.secondary,
                textTransform: 'none',
                px: 2.75,
                py: 0.75,
                fontWeight: 700,
                fontSize: '0.84rem',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderColor: tokens.brand.primary,
                },
              }}
            >
              Back to Targets
            </Button>

            {isElevated && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setNewTemplateName(selectedTemplate.name);
                    setNewTemplateDesc(selectedTemplate.description || '');
                    setNewKpis(
                      selectedTemplate.kpis.map((k) => ({
                        name: k.name,
                        description: k.description || '',
                        targetValue: k.targetValue,
                        pipelineMetric: k.pipelineMetric || '',
                        assignedTo: k.assignedTo,
                      }))
                    );
                    setEditingTemplateId(selectedTemplate._id);
                    setWizardStep(0);
                    setViewMode('create');
                  }}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.08)' : 'rgba(93, 26, 137, 0.05)',
                    color: isDarkMode ? '#dcb6f2' : tokens.brand.primary,
                    borderRadius: '12px',
                    px: 3.5,
                    py: 1.25,
                    fontWeight: 700,
                    textTransform: 'none',
                    border: `1px solid ${isDarkMode ? 'rgba(155, 107, 184, 0.2)' : 'rgba(93, 26, 137, 0.12)'}`,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.15)' : 'rgba(93, 26, 137, 0.1)',
                      borderColor: isDarkMode ? 'rgba(155, 107, 184, 0.3)' : 'rgba(93, 26, 137, 0.25)',
                    },
                  }}
                >
                  Update Template
                </Button>

                <Button
                  variant="outlined"
                  disabled={deleteTemplateMutation.isPending}
                  onClick={handleDeleteTemplate}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(196, 69, 69, 0.05)',
                    color: tokens.semantic.error,
                    borderRadius: '12px',
                    px: 3.5,
                    py: 1.25,
                    fontWeight: 700,
                    textTransform: 'none',
                    border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(196, 69, 69, 0.12)'}`,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(196, 69, 69, 0.1)',
                      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(196, 69, 69, 0.25)',
                    },
                  }}
                >
                  {deleteTemplateMutation.isPending ? 'Deleting...' : 'Delete Template'}
                </Button>

                <Button
                  variant="contained"
                  onClick={() => handleOpenAssignModal(selectedTemplate)}
                  sx={{
                    bgcolor: '#d95236',
                    color: '#fff',
                    borderRadius: '12px',
                    px: 3.5,
                    py: 1.25,
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(217, 82, 54, 0.15)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      bgcolor: '#c7452b',
                      boxShadow: '0 6px 20px rgba(217, 82, 54, 0.25)',
                    },
                  }}
                >
                  Assign Template to Agents
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={4.5}>
            {/* Left Column: Template Summary and KPIs */}
            <Grid item xs={12} md={8}>
              {/* Header Box */}
              <Card sx={{ p: 4, borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`, mb: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <ShieldIcon sx={{ color: tokens.brand.primary, fontSize: 24 }} />
                  <Chip
                    label="KPI Template"
                    size="small"
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.12)' : 'rgba(93, 26, 137, 0.05)',
                      color: tokens.brand.primary,
                      border: `1px solid ${isDarkMode ? 'rgba(155, 107, 184, 0.25)' : 'rgba(93, 26, 137, 0.15)'}`,
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      height: 22,
                      borderRadius: '4px',
                    }}
                  />
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.025em', mb: 2 }}>
                  {selectedTemplate.name}
                </Typography>

                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6, fontWeight: 500, fontSize: '0.94rem' }}>
                  {selectedTemplate.description || 'No description provided.'}
                </Typography>
              </Card>

              {/* Grouped KPIs List */}
              <Card sx={{ p: 4, borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3.5, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.015em' }}>
                  Grouped KPI Targets
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {selectedTemplate.kpis.map((kpi, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 3,
                        borderRadius: '16px',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.008)',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Chip
                          label={`KPI #${idx + 1}`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.58rem',
                            fontWeight: 800,
                            bgcolor: tokens.brand.primary100,
                            color: tokens.brand.primary,
                            borderRadius: '4px',
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '0.9rem' }}>
                          {kpi.name}
                          {kpi.targetValue != null ? ` — Target: ${kpi.targetValue}` : ' — Simple task'}
                          {kpi.pipelineMetric ? ` (Auto: ${PIPELINE_METRIC_LABELS[kpi.pipelineMetric] || kpi.pipelineMetric})` : ''}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, fontWeight: 500, fontSize: '0.84rem', pl: 0.5 }}>
                        {kpi.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>

            {/* Right Column: Template Info Panel */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 4, borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3.5, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.015em' }}>
                  Template Properties
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, fontSize: '0.84rem' }}>Total KPIs</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>{selectedTemplate.kpis.length} KPIs</Typography>
                  </Box>
                  <Divider sx={{ opacity: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, fontSize: '0.84rem' }}>Status</Typography>
                    <Chip label="Reusable Template" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Box>
                </Box>
              </Card>

              {isElevated && (() => {
                const templateAssignments = activeAssignments.filter(
                  (a) => a.templateId === selectedTemplate._id
                );
                return (
                  <Card
                    sx={{
                      p: 4,
                      mt: 3.5,
                      borderRadius: '24px',
                      bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        mb: 3,
                        color: isDarkMode ? '#fff' : tokens.text.primary,
                        letterSpacing: '-0.015em',
                      }}
                    >
                      Assigned Agents
                    </Typography>

                    {templateAssignments.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        This template has not been assigned to any agents.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {templateAssignments.map((assign) => {
                          const userId = assign.assignedTo[0];
                          const userObj = dbUsers.find((u) => u._id === userId);
                          const fullName = userObj
                            ? `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim()
                            : (assignerNames[userId]?.name || 'Unknown Agent');
                          const email = userObj ? userObj.email : (assignerNames[userId]?.email || 'N/A');
                          const initial = fullName.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';

                          return (
                            <Box
                              key={assign._id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1.5,
                                borderRadius: '16px',
                                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.75rem',
                                    bgcolor: tokens.brand.primary,
                                    color: '#fff',
                                    fontWeight: 700,
                                  }}
                                >
                                  {initial}
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.84rem' }}
                                  >
                                    {fullName}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}
                                  >
                                    {email}
                                  </Typography>
                                </Box>
                              </Box>

                              <IconButton
                                size="small"
                                onClick={() => handleUnassign(assign)}
                                disabled={unassignTemplateMutation.isPending}
                                sx={{
                                  color: 'text.secondary',
                                  '&:hover': {
                                    color: 'error.main',
                                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Card>
                );
              })()}
            </Grid>
          </Grid>
        </Box>
      );
    }

    // Active assignment details layout
    if (selectedAssignment) {
      const visibleKpis = selectedAssignment.kpis.filter((k) => {
        if (isElevated) return true;
        if (!user) return false;
        return k.assignedTo.some((id) => id === user._id || (id === 'user-1' && user.email === 'alex@leapsofts.com'));
      });
      const completedCount = visibleKpis.filter((k) => k.completed).length;
      const totalCount = visibleKpis.length;
      const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return (
        <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
          {/* Back toolbar */}
          <Box sx={{ mb: 4.5 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setViewMode('list');
                setSelectedAssignment(null);
              }}
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: '24px',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.08)',
                color: isDarkMode ? 'rgba(255,255,255,0.8)' : tokens.text.secondary,
                textTransform: 'none',
                px: 2.75,
                py: 0.75,
                fontWeight: 700,
                fontSize: '0.84rem',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderColor: tokens.brand.primary,
                },
              }}
            >
              Back to Targets
            </Button>
          </Box>

          <Grid container spacing={4.5}>
            {/* Left Column: Progress summary & Checklist */}
            <Grid item xs={12} md={8}>
              {/* Header Box with Progress Status */}
              <Card sx={{ p: 4, borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`, mb: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <ShieldIcon sx={{ color: tokens.brand.accent, fontSize: 24 }} />
                  <Chip
                    label="Active Target"
                    size="small"
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(255, 127, 17, 0.12)' : 'rgba(255, 127, 17, 0.05)',
                      color: tokens.brand.accent,
                      border: `1px solid ${isDarkMode ? 'rgba(255, 127, 17, 0.25)' : 'rgba(255, 127, 17, 0.15)'}`,
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      height: 22,
                      borderRadius: '4px',
                    }}
                  />
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.025em', mb: 2 }}>
                  {selectedAssignment.templateName}
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                      Objective Target Progress
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tokens.brand.primary }}>
                      {progressPercent}% ({completedCount}/{totalCount} Completed)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: tokens.brand.primary,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, pt: 3, borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
                  <Avatar sx={{ bgcolor: isDarkMode ? 'rgba(255, 127, 17, 0.1)' : 'rgba(255, 127, 17, 0.05)', color: tokens.brand.accent, width: 38, height: 38 }}>
                    <EventIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.04em' }}>
                      Target Completion Deadline
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                      {selectedAssignment.deadlineDate} at {selectedAssignment.deadlineTime}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* Checklist Cards */}
              <Card sx={{ p: 4, borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.015em' }}>
                    KPI Goals Checklist
                  </Typography>
                  {!isElevated && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setChangeModal({ sourceType: 'assignment', type: 'add', assignmentId: selectedAssignment._id })}
                      sx={{ textTransform: 'none', borderRadius: '10px' }}
                    >
                      Request Add KPI
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {visibleKpis.map((kpi, idx) => {
                    const isChecked = kpi.completed;
                    const itemKey = kpi.itemId || kpi._id;
                    const isPending = itemKey ? pendingItemKeys.has(`${selectedAssignment._id}:${itemKey}`) : false;
                    return (
                      <Box
                        key={kpi.itemId || kpi._id || idx}
                        onClick={isElevated ? undefined : () => handleToggleKpiCompletion(selectedAssignment._id, kpi.name)}
                        sx={{
                          p: 3,
                          borderRadius: '18px',
                          cursor: isElevated ? 'default' : 'pointer',
                          bgcolor: isChecked
                            ? isDarkMode ? 'rgba(45, 138, 94, 0.06)' : 'rgba(45, 138, 94, 0.02)'
                            : isDarkMode ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0,0,0,0.005)',
                          border: `1px solid ${
                            isChecked
                              ? tokens.semantic.success
                              : isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)'
                          }`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: isElevated
                              ? (isChecked ? tokens.semantic.success : (isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)'))
                              : (isChecked ? tokens.semantic.success : tokens.brand.primary),
                            transform: isElevated ? 'none' : 'translateX(2px)',
                          },
                        }}
                      >
                        <Checkbox
                          checked={isChecked}
                          disabled={isElevated}
                          color="success"
                          sx={{
                            p: 0,
                            mt: 0.25,
                            '&.Mui-disabled': {
                              color: isChecked
                                ? tokens.semantic.success
                                : isDarkMode
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'rgba(0, 0, 0, 0.15)',
                            },
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={isElevated ? undefined : () => handleToggleKpiCompletion(selectedAssignment._id, kpi.name)}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 800,
                                color: isChecked ? tokens.semantic.success : isDarkMode ? '#fff' : tokens.text.primary,
                                fontSize: '0.9rem',
                                textDecoration: isChecked ? 'line-through' : 'none',
                              }}
                            >
                              {kpi.name}
                              {kpi.targetValue != null ? ` — Target: ${kpi.targetValue}` : ' — Simple task'}
                              {kpi.dueDate ? ` · Due ${new Date(kpi.dueDate).toLocaleString()}` : ''}
                            </Typography>
                            <PriorityBadge priority={kpi.priority} />
                            {kpi.pipelineMetric && (
                              <Chip label={`Auto: ${PIPELINE_METRIC_LABELS[kpi.pipelineMetric] || kpi.pipelineMetric}`} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20, bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary }} />
                            )}
                            {isPending && <Chip label="Pending review" size="small" color="warning" />}
                          </Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.84rem', mt: 0.5, opacity: isChecked ? 0.72 : 1 }}>
                            {kpi.description}
                          </Typography>
                        </Box>
                        {!isElevated && (kpi.itemId || kpi._id) && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="small"
                              variant="text"
                              sx={{ textTransform: 'none', fontSize: '0.72rem' }}
                              onClick={() => setChangeModal({
                                sourceType: 'assignment',
                                type: 'modify',
                                assignmentId: selectedAssignment._id,
                                assignmentItemId: (kpi.itemId || kpi._id)!,
                                kpiName: kpi.name,
                                currentTargetValue: kpi.targetValue,
                                currentDueDate: kpi.dueDate,
                                currentPriority: kpi.priority,
                              })}
                            >
                              Request Change
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              sx={{ textTransform: 'none', fontSize: '0.72rem' }}
                              onClick={() => setChangeModal({
                                sourceType: 'assignment',
                                type: 'remove',
                                assignmentId: selectedAssignment._id,
                                assignmentItemId: (kpi.itemId || kpi._id)!,
                                kpiName: kpi.name,
                              })}
                            >
                              Request Remove
                            </Button>
                          </Box>
                        )}
                        {isElevated && (kpi.itemId || kpi._id) && selectedAssignment.assignedTo[0] && (
                          <Button
                            size="small"
                            variant="text"
                            color="error"
                            sx={{ textTransform: 'none', fontSize: '0.72rem' }}
                            disabled={removeAssignmentItemMutation.isPending || visibleKpis.length <= 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAssignmentItemMutation.mutate({
                                templateId: selectedAssignment.templateId,
                                userId: selectedAssignment.assignedTo[0],
                                assignmentItemId: (kpi.itemId || kpi._id)!,
                              }, {
                                onSuccess: () => {
                                  addToast({ message: 'KPI removed from assignment.', severity: 'success' });
                                  setSelectedAssignment((prev) => prev ? {
                                    ...prev,
                                    kpis: prev.kpis.filter((k) => (k.itemId || k._id) !== (kpi.itemId || kpi._id)),
                                  } : null);
                                },
                                onError: (err: any) => {
                                  addToast({ message: err?.response?.data?.message || 'Failed to remove KPI.', severity: 'error' });
                                },
                              });
                            }}
                          >
                            Remove KPI
                          </Button>
                        )}
                      </Box>
                    );
                  })}
                </Box>
                {!isElevated && <MyChangeRequestsPanel assignmentId={selectedAssignment._id} />}
              </Card>
            </Grid>

            {/* Right Column: Assignees list */}
            <Grid item xs={12} md={4}>
              {/* Assigned Team Card */}
              <Card sx={{ p: 4, borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`, mb: 3.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3.5, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.015em' }}>
                  Assigned Team
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {selectedAssignment.assignedTo.map((id) => {
                    const details = getUserDetails(id);
                    return (
                      <Box
                        key={id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.75,
                          p: 2,
                          borderRadius: '16px',
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                        }}
                      >
                        <Avatar sx={{ bgcolor: tokens.brand.primary, width: 34, height: 34, fontSize: '0.85rem', fontWeight: 700 }}>
                          {details.initial}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '0.86rem', lineHeight: 1.2 }} noWrap>
                            {details.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 0.72 }} noWrap>
                            {details.email}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Card>

              {/* Assignment details card */}
              <Card sx={{ p: 4, borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3.5, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.015em' }}>
                  Target Properties
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, fontSize: '0.84rem' }}>Total KPIs</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>{selectedAssignment.kpis.length} KPIs</Typography>
                  </Box>
                  <Divider sx={{ opacity: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, fontSize: '0.84rem' }}>Assigned Agents</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>{selectedAssignment.assignedTo.length} Members</Typography>
                  </Box>
                  {selectedAssignment.assignedBy && (
                    <>
                      <Divider sx={{ opacity: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, fontSize: '0.84rem' }}>Assigned By</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>{getUserDetails(selectedAssignment.assignedBy).name}</Typography>
                      </Box>
                    </>
                  )}
                  {/* Unassign Target Button (Only visible for Admins) */}
                  {isElevated && (
                    <Box sx={{ mt: 2.5 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleUnassign(selectedAssignment)}
                        disabled={unassignTemplateMutation.isPending}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 750,
                          fontSize: '0.82rem',
                          py: 1,
                          color: tokens.semantic.error,
                          borderColor: `color-mix(in srgb, ${tokens.semantic.error} 20%, transparent)`,
                          '&:hover': {
                            borderColor: tokens.semantic.error,
                            bgcolor: `color-mix(in srgb, ${tokens.semantic.error} 5%, transparent)`,
                          },
                        }}
                      >
                        {unassignTemplateMutation.isPending ? 'Unassigning...' : 'Unassign Target'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      );
    }
  }

    // STANDARD GOALS LIST DASHBOARD RENDERING
    if (!isElevated) {
      return <UserDailyKpisView />;
    }

    return (
      <>
      {/* Page Title Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          position: 'relative',
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.025em',
              mb: 0.5,
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }}
          >
            Performance Targets
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.92rem',
            }}
          >
            {isElevated
              ? 'Manage reusable templates, allocate targets, and monitor agent performance.'
              : 'Review your active objective targets and complete daily checklist milestones.'}
          </Typography>
        </Box>

        {isElevated && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setViewMode('create');
              setWizardStep(0);
            }}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              px: 3.5,
              py: 1,
              borderRadius: '24px',
              boxShadow: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: tokens.brand.primary, 
                transform: 'translateY(-1px)',
                boxShadow: 'none',
              },
            }}
          >
            Create Template
          </Button>
        )}
      </Box>

      {/* Mini stats counters grid */}
      <Grid container spacing={3.5} sx={{ mb: 4.5 }}>
        {isElevated && (
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                borderRadius: '24px',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: tokens.shadow.cardHover,
                  borderColor: tokens.brand.primary,
                },
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '16px',
                  bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.15)' : 'rgba(93, 26, 137, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tokens.brand.primary,
                }}
              >
                <AssignmentIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.68rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  KPI Templates
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.brand.primary, mt: 0.5 }}>
                  {stats.activeTemplatesCount}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}

        <Grid item xs={12} sm={isElevated ? 4 : 6}>
          <Box
            sx={{
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
              borderRadius: '24px',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: tokens.shadow.cardHover,
                borderColor: tokens.brand.accent,
              },
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '16px',
                bgcolor: isDarkMode ? 'rgba(255, 127, 17, 0.15)' : 'rgba(255, 127, 17, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.brand.accent,
              }}
            >
              <TrackChangesIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.68rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Active Assignments
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.brand.accent, mt: 0.5 }}>
                {stats.activeAssignmentsCount}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={isElevated ? 4 : 6}>
          <Box
            sx={{
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
              borderRadius: '24px',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: tokens.shadow.cardHover,
                borderColor: tokens.semantic.success,
              },
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '16px',
                bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.15)' : 'rgba(45, 138, 94, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.semantic.success,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.68rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Completed Assignments
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.semantic.success, mt: 0.5 }}>
                {stats.completedAssignmentsCount}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Navigation Sub-Tabs */}
      {isElevated && viewMode === 'list' && (
        <Box sx={{ display: 'flex', gap: 1, mb: 4, bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', p: 0.5, borderRadius: '20px', width: 'fit-content', flexWrap: 'wrap' }}>
          <Button onClick={() => setDashboardTab('templates')} sx={{ textTransform: 'none', borderRadius: '16px', px: 3, bgcolor: dashboardTab === 'templates' ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent', color: dashboardTab === 'templates' ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary', fontWeight: 700 }}>KPI Templates</Button>
          <Button onClick={() => setDashboardTab('standalone_kpis')} sx={{ textTransform: 'none', borderRadius: '16px', px: 3, bgcolor: dashboardTab === 'standalone_kpis' ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent', color: dashboardTab === 'standalone_kpis' ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary', fontWeight: 700 }}>Standalone KPIs</Button>
          <Button onClick={() => setDashboardTab('change_requests')} sx={{ textTransform: 'none', borderRadius: '16px', px: 3, bgcolor: dashboardTab === 'change_requests' ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent', color: dashboardTab === 'change_requests' ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary', fontWeight: 700 }}>
            Change Requests{pendingChangeRequests.length > 0 ? ` (${pendingChangeRequests.length})` : ''}
          </Button>
          <Button onClick={() => setDashboardTab('daily_progress')} sx={{ textTransform: 'none', borderRadius: '16px', px: 3, bgcolor: dashboardTab === 'daily_progress' ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent', color: dashboardTab === 'daily_progress' ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary', fontWeight: 700 }}>Daily Progress</Button>
        </Box>
      )}

      {dashboardTab === 'daily_progress' && isElevated && viewMode === 'list' && (
        <DailyTeamProgress />
      )}

      {dashboardTab === 'change_requests' && isElevated && viewMode === 'list' && (
        <ChangeRequestQueue />
      )}

      {dashboardTab === 'standalone_kpis' && isElevated && viewMode === 'list' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingStandaloneKpi(null); setStandaloneFormOpen(true); }} sx={{ textTransform: 'none', borderRadius: '12px' }}>
              Create KPI
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {standaloneKpis.map((kpi) => (
              <Card 
                key={kpi._id} 
                sx={{ 
                  p: 2.5, 
                  borderRadius: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: 2,
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.04)',
                    borderColor: tokens.brand.primary
                  }
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>{kpi.name}</Typography>
                    <PriorityBadge priority={kpi.priority} />
                    {kpi.pipelineMetric && (
                      <Chip label={`Auto: ${PIPELINE_METRIC_LABELS[kpi.pipelineMetric] || kpi.pipelineMetric}`} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20, bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary }} />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : tokens.text.secondary, fontWeight: 500 }}>
                    {kpi.targetValue != null ? `Target: ${kpi.targetValue}` : 'Simple task'}
                    {kpi.dueDate ? ` · Due ${new Date(kpi.dueDate).toLocaleString()}` : ' · No due date'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => { setEditingStandaloneKpi(kpi); setStandaloneFormOpen(true); }} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', color: tokens.text.secondary, '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: tokens.text.primary } }}>Edit</Button>
                  <Button size="small" color="error" onClick={() => { setStandaloneKpiToDelete(kpi._id); setConfirmDeleteStandaloneOpen(true); }} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', '&:hover': { bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)' } }}>Delete</Button>
                </Box>
              </Card>
            ))}
            {standaloneKpis.length === 0 && (
              <Box sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, py: 8 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.disabled' }}>No standalone KPIs yet.</Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Control filters bar */}
      {(['templates', 'assignments'] as DashboardTab[]).includes(dashboardTab) && (
        <Box
          sx={{
            mb: 4,
            p: 2,
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.45)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
            borderRadius: '24px',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <TextField
          size="small"
          placeholder="Search performance targets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: { sm: 280 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              height: 42,
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
              fontSize: '0.84rem',
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              },
              '&:hover fieldset': {
                borderColor: tokens.brand.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: tokens.brand.primary,
              },
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: 1.5, ml: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' }, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewLayout}
            exclusive
            onChange={handleLayoutChange}
            size="small"
            sx={{
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
              p: 0.5,
              borderRadius: '24px',
              border: 'none',
              height: 42,
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
                borderRadius: '20px !important',
                px: 2,
              },
            }}
          >
            <ToggleButton
              value="grid"
              sx={{
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff',
                  color: tokens.brand.primary,
                  boxShadow: 'none',
                  fontWeight: 700,
                },
              }}
            >
              <GridViewIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 'inherit', display: { xs: 'none', md: 'inline' } }}>Grid</Typography>
            </ToggleButton>
            <ToggleButton
              value="list"
              sx={{
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff',
                  color: tokens.brand.primary,
                  boxShadow: 'none',
                  fontWeight: 700,
                },
              }}
            >
              <ViewListIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 'inherit', display: { xs: 'none', md: 'inline' } }}>List</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      )}

      {/* SUB-TAB 1: TEMPLATE CARDS LIST */}
      {dashboardTab === 'templates' && (
        <>
          {isTemplatesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: tokens.brand.primary }} />
            </Box>
          ) : filteredTemplates.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                No KPI Templates found matching your search.
              </Typography>
            </Box>
          ) : viewLayout === 'grid' ? (
            <Grid container spacing={3.5}>
              {filteredTemplates.map((tpl) => (
                <Grid item xs={12} md={6} key={tpl._id}>
                  <Card
                    sx={{
                      height: '100%',
                      bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                      borderRadius: '24px',
                      boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: tokens.brand.primary,
                      },
                    }}
                  >
                    <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Chip
                          label="DAILY"
                          size="small"
                          sx={{
                            bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.12)' : 'rgba(93, 26, 137, 0.05)',
                            color: tokens.brand.primary,
                            border: `1px solid ${isDarkMode ? 'rgba(155, 107, 184, 0.25)' : 'rgba(93, 26, 137, 0.15)'}`,
                            fontWeight: 800,
                            fontSize: '0.62rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            height: 22,
                            borderRadius: '4px',
                          }}
                        />
                        <Chip
                          label={`${tpl.kpis.length} KPIs`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            height: 20,
                            borderRadius: '4px',
                          }}
                        />
                      </Box>

                      <Typography
                        variant="h6"
                        onClick={() => {
                          setSelectedTemplate(tpl);
                          setViewMode('details');
                        }}
                        sx={{
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          letterSpacing: '-0.015em',
                          color: isDarkMode ? '#fff' : tokens.text.primary,
                          lineHeight: 1.3,
                          mb: 1.5,
                          cursor: 'pointer',
                          '&:hover': {
                            color: tokens.brand.primary,
                          },
                        }}
                      >
                        {tpl.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.5,
                          mb: 3,
                          fontWeight: 500,
                        }}
                      >
                        {tpl.description || 'No description provided.'}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1.5,
                          pt: 2.5,
                          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                          mt: 'auto',
                        }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setSelectedTemplate(tpl);
                            setViewMode('details');
                          }}
                          sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            color: 'text.secondary',
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            '&:hover': {
                              borderColor: tokens.brand.primary,
                              color: tokens.brand.primary,
                            },
                          }}
                        >
                          View KPIs
                        </Button>
                        {isElevated && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenAssignModal(tpl)}
                            sx={{
                              bgcolor: tokens.brand.primary,
                              color: '#fff',
                              borderRadius: '20px',
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              boxShadow: 'none',
                              ml: { xs: 0, sm: 'auto' },
                              width: { xs: '100%', sm: 'auto' },
                              '&:hover': {
                                bgcolor: tokens.brand.primary,
                                boxShadow: 'none',
                              },
                            }}
                          >
                            Assign to Agent
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              {filteredTemplates.map((tpl) => (
                <Box
                  key={tpl._id}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                    borderRadius: '16px',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    p: '16px 24px',
                    '&:hover': {
                      borderColor: tokens.brand.primary,
                    },
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={7}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography
                          variant="subtitle2"
                          onClick={() => {
                            setSelectedTemplate(tpl);
                            setViewMode('details');
                          }}
                          sx={{
                            fontWeight: 800,
                            color: isDarkMode ? '#fff' : tokens.text.primary,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            '&:hover': { color: tokens.brand.primary },
                          }}
                        >
                          {tpl.name}
                        </Typography>
                        <Chip
                          label="DAILY"
                          size="small"
                          sx={{
                            bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.12)' : 'rgba(93, 26, 137, 0.05)',
                            color: tokens.brand.primary,
                            border: `1px solid ${isDarkMode ? 'rgba(155, 107, 184, 0.25)' : 'rgba(93, 26, 137, 0.15)'}`,
                            fontWeight: 800,
                            fontSize: '0.58rem',
                            height: 18,
                            borderRadius: '4px',
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 0.5 }} noWrap>
                        {tpl.description || 'No description.'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setSelectedTemplate(tpl);
                          setViewMode('details');
                        }}
                        sx={{
                          borderRadius: '16px',
                          textTransform: 'none',
                          fontSize: '0.72rem',
                          height: 30,
                          fontWeight: 700,
                          color: 'text.secondary',
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        }}
                      >
                        View KPIs ({tpl.kpis.length})
                      </Button>
                      {isElevated && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenAssignModal(tpl)}
                          sx={{
                            bgcolor: '#FFA08A',
                            color: '#fff',
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontSize: '0.72rem',
                            height: 30,
                            fontWeight: 700,
                            boxShadow: 'none',
                            '&:hover': { bgcolor: '#FF8A6F', boxShadow: 'none' },
                          }}
                        >
                          Assign Template
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {/* SUB-TAB 2: ACTIVE ASSIGNMENT CARDS LIST (Users only) */}
      {dashboardTab === 'assignments' && !isElevated && (
        <>
          {!isElevated && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 4,
                p: 0.5,
              }}
            >
              {[
                { key: 'active', label: 'Active', count: categoryCounts.active, color: { light: '#4F46E5', dark: '#a5b4fc', bgLight: 'rgba(79, 70, 229, 0.08)', bgDark: 'rgba(165, 180, 252, 0.12)', borderLight: 'rgba(79, 70, 229, 0.25)', borderDark: 'rgba(165, 180, 252, 0.3)' } },
                { key: 'overdue', label: 'Overdue', count: categoryCounts.overdue, color: { light: '#D97706', dark: '#fbbf24', bgLight: 'rgba(217, 119, 6, 0.08)', bgDark: 'rgba(251, 191, 36, 0.12)', borderLight: 'rgba(217, 119, 6, 0.25)', borderDark: 'rgba(251, 191, 36, 0.3)' } },
                { key: 'high', label: 'High priority', count: categoryCounts.high, color: { light: '#DC2626', dark: '#fca5a5', bgLight: 'rgba(220, 38, 38, 0.08)', bgDark: 'rgba(252, 165, 165, 0.12)', borderLight: 'rgba(220, 38, 38, 0.25)', borderDark: 'rgba(252, 165, 165, 0.3)' } },
                { key: 'done', label: 'Done', count: categoryCounts.done, color: { light: '#059669', dark: '#34d399', bgLight: 'rgba(5, 150, 105, 0.08)', bgDark: 'rgba(52, 211, 153, 0.12)', borderLight: 'rgba(5, 150, 105, 0.25)', borderDark: 'rgba(52, 211, 153, 0.3)' } },
              ].map((pill) => {
                const isSelected = taskCategory === pill.key;
                const activeColor = isDarkMode ? pill.color.dark : pill.color.light;
                const activeBg = isDarkMode ? pill.color.bgDark : pill.color.bgLight;
                const activeBorder = isDarkMode ? pill.color.borderDark : pill.color.borderLight;

                return (
                  <Button
                    key={pill.key}
                    onClick={() => setTaskCategory(pill.key as any)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '24px',
                      px: 2.5,
                      py: 0.8,
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      bgcolor: isSelected 
                        ? activeBg 
                        : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                      color: isSelected 
                        ? activeColor 
                        : (isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary'),
                      border: '1px solid',
                      borderColor: isSelected 
                        ? activeBorder 
                        : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                      boxShadow: isSelected 
                        ? `0 4px 14px ${isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'}` 
                        : 'none',
                      '&:hover': {
                        transform: 'translateY(-1.5px)',
                        bgcolor: isSelected 
                          ? activeBg 
                          : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                        borderColor: isSelected 
                          ? activeBorder 
                          : (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                        color: isSelected 
                          ? activeColor 
                          : (isDarkMode ? '#fff' : 'text.primary'),
                      },
                      '&:active': {
                        transform: 'scale(0.97)',
                      }
                    }}
                  >
                    <span>{pill.label}</span>
                    <Box
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        bgcolor: isSelected 
                          ? (isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)')
                          : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        color: isSelected 
                          ? activeColor 
                          : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary'),
                        px: 1,
                        py: 0.25,
                        borderRadius: '10px',
                        minWidth: 20,
                        textAlign: 'center',
                        lineHeight: 1,
                        display: 'inline-block',
                      }}
                    >
                      {pill.count}
                    </Box>
                  </Button>
                );
              })}
            </Box>
          )}

          {filteredAssignments.length === 0 ? (
            <Box sx={{ py: 8, pyLayout: 8, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                No active targets assigned matching your search criteria.
              </Typography>
            </Box>
          ) : viewLayout === 'grid' ? (
            <Grid container spacing={3.5}>
              {filteredAssignments.map((assign) => {
                const total = assign.kpis.length;
                const completed = assign.kpis.filter((k) => k.completed).length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <Grid item xs={12} md={6} key={assign._id}>
                    <Card
                      sx={{
                        height: '100%',
                        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                        borderRadius: '24px',
                        boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: tokens.brand.primaryLight,
                          boxShadow: isDarkMode ? '0 12px 40px rgba(0, 0, 0, 0.4)' : '0 12px 40px rgba(93, 26, 137, 0.06)',
                        },
                      }}
                    >
                      <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          {percentage === 100 ? (
                            <Chip
                              label="Completed"
                              size="small"
                              sx={{
                                bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.12)' : 'rgba(45, 138, 94, 0.05)',
                                color: tokens.semantic.success,
                                border: `1px solid ${isDarkMode ? 'rgba(45, 138, 94, 0.25)' : 'rgba(45, 138, 94, 0.15)'}`,
                                fontWeight: 800,
                                fontSize: '0.62rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                height: 22,
                                borderRadius: '4px',
                              }}
                            />
                          ) : percentage > 0 ? (
                            <Chip
                              label="In Progress"
                              size="small"
                              sx={{
                                bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.12)' : 'rgba(93, 26, 137, 0.05)',
                                color: tokens.brand.primary,
                                border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.25)' : 'rgba(93, 26, 137, 0.15)'}`,
                                fontWeight: 800,
                                fontSize: '0.62rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                height: 22,
                                borderRadius: '4px',
                              }}
                            />
                          ) : (
                            <Chip
                              label="Not Started"
                              size="small"
                              sx={{
                                bgcolor: isDarkMode ? 'rgba(255, 127, 17, 0.12)' : 'rgba(255, 127, 17, 0.05)',
                                color: tokens.brand.accent,
                                border: `1px solid ${isDarkMode ? 'rgba(255, 127, 17, 0.25)' : 'rgba(255, 127, 17, 0.15)'}`,
                                fontWeight: 800,
                                fontSize: '0.62rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                height: 22,
                                borderRadius: '4px',
                              }}
                            />
                          )}

                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                            {completed}/{total} KPIs Done
                          </Typography>
                        </Box>

                        <Typography
                          variant="h6"
                          onClick={() => {
                            setSelectedAssignment(assign);
                            setViewMode('details');
                          }}
                          sx={{
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            letterSpacing: '-0.015em',
                            color: isDarkMode ? '#fff' : tokens.text.primary,
                            lineHeight: 1.3,
                            mb: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              color: tokens.brand.accent,
                            },
                          }}
                        >
                          {assign.templateName}
                        </Typography>

                        {/* Deadline note */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: assign.assignedBy ? 0.5 : 3, mt: 0.5 }}>
                          <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Deadline: {assign.deadlineDate} at {assign.deadlineTime}
                          </Typography>
                        </Box>
                        {assign.assignedBy && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, pl: 2.75 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              Assigned by: {getUserDetails(assign.assignedBy).name}
                            </Typography>
                          </Box>
                        )}

                        {/* Flat simple progress bar */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                              Completion
                            </Typography>
                            <Typography variant="caption" sx={{ color: percentage === 100 ? tokens.semantic.success : tokens.brand.primary, fontWeight: 700 }}>
                              {percentage}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: percentage === 100
                                  ? tokens.semantic.success
                                  : percentage > 0
                                    ? tokens.brand.primary
                                    : tokens.brand.accent,
                              },
                            }}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            pt: 2,
                            borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                            mt: 'auto',
                          }}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, textTransform: 'uppercase', fontSize: '0.58rem', mb: 0.5 }}>
                              Assignees
                            </Typography>
                            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.65rem', border: `2px solid ${isDarkMode ? '#1e1b24' : '#fff'}` } }}>
                              {assign.assignedTo.map((id) => {
                                const details = getUserDetails(id);
                                return (
                                  <Tooltip title={details.name} key={id} arrow>
                                    <Avatar sx={{ bgcolor: tokens.brand.primaryLight }}>
                                      {details.initial}
                                    </Avatar>
                                  </Tooltip>
                                );
                              })}
                            </AvatarGroup>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {isElevated && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnassign(assign);
                                }}
                                disabled={unassignTemplateMutation.isPending}
                                sx={{
                                  borderRadius: '16px',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '0.74rem',
                                  px: 2,
                                  color: tokens.semantic.error,
                                  borderColor: `color-mix(in srgb, ${tokens.semantic.error} 20%, transparent)`,
                                  '&:hover': {
                                    borderColor: tokens.semantic.error,
                                    bgcolor: `color-mix(in srgb, ${tokens.semantic.error} 5%, transparent)`,
                                  },
                                }}
                              >
                                {unassignTemplateMutation.isPending ? 'Removing...' : 'Unassign'}
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setSelectedAssignment(assign);
                                setViewMode('details');
                              }}
                              sx={{
                                borderRadius: '16px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.74rem',
                                px: 2,
                                color: tokens.brand.primary,
                                borderColor: `color-mix(in srgb, ${tokens.brand.primary} 20%, transparent)`,
                                '&:hover': {
                                  borderColor: tokens.brand.primary,
                                  bgcolor: `color-mix(in srgb, ${tokens.brand.primary} 5%, transparent)`,
                                },
                              }}
                            >
                              {isElevated ? 'View Target' : 'Update Target'}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              {filteredAssignments.map((assign) => {
                const total = assign.kpis.length;
                const completed = assign.kpis.filter((k) => k.completed).length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <Box
                    key={assign._id}
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                      borderRadius: '16px',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      p: '16px 24px',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: tokens.brand.primaryLight,
                        boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(93, 26, 137, 0.04)',
                      },
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Typography
                            variant="subtitle2"
                            onClick={() => {
                              setSelectedAssignment(assign);
                              setViewMode('details');
                            }}
                            sx={{
                              fontWeight: 800,
                              color: isDarkMode ? '#fff' : tokens.text.primary,
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              '&:hover': { color: tokens.brand.accent },
                            }}
                          >
                            {assign.templateName}
                          </Typography>
                          
                          {percentage === 100 ? (
                            <Chip
                              label="Completed"
                              size="small"
                              sx={{
                                bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.12)' : 'rgba(45, 138, 94, 0.05)',
                                color: tokens.semantic.success,
                                border: `1px solid ${isDarkMode ? 'rgba(45, 138, 94, 0.25)' : 'rgba(45, 138, 94, 0.15)'}`,
                                fontWeight: 800,
                                fontSize: '0.55rem',
                                height: 18,
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                              }}
                            />
                          ) : percentage > 0 ? (
                            <Chip
                              label="In Progress"
                              size="small"
                              sx={{
                                bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.12)' : 'rgba(93, 26, 137, 0.05)',
                                color: tokens.brand.primary,
                                border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.25)' : 'rgba(93, 26, 137, 0.15)'}`,
                                fontWeight: 800,
                                fontSize: '0.55rem',
                                height: 18,
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                              }}
                            />
                          ) : (
                            <Chip
                              label="Not Started"
                              size="small"
                              sx={{
                                bgcolor: isDarkMode ? 'rgba(255, 127, 17, 0.12)' : 'rgba(255, 127, 17, 0.05)',
                                color: tokens.brand.accent,
                                border: `1px solid ${isDarkMode ? 'rgba(255, 127, 17, 0.25)' : 'rgba(255, 127, 17, 0.15)'}`,
                                fontWeight: 800,
                                fontSize: '0.55rem',
                                height: 18,
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          Deadline: {assign.deadlineDate} at {assign.deadlineTime}
                          {assign.assignedBy && ` • Assigned by: ${getUserDetails(assign.assignedBy).name}`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', pr: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Progress</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: percentage === 100 ? tokens.semantic.success : tokens.brand.primary }}>{percentage}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 5,
                              borderRadius: 2.5,
                              bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: percentage === 100
                                  ? tokens.semantic.success
                                  : percentage > 0
                                    ? tokens.brand.primary
                                    : tokens.brand.accent,
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5 }}>
                        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.65rem' } }}>
                          {assign.assignedTo.map((id) => (
                            <Tooltip title={getUserDetails(id).name} key={id} arrow>
                              <Avatar sx={{ bgcolor: tokens.brand.primaryLight }}>
                                {getUserDetails(id).initial}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {isElevated && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnassign(assign);
                              }}
                              disabled={unassignTemplateMutation.isPending}
                              sx={{
                                borderRadius: '16px',
                                textTransform: 'none',
                                fontSize: '0.72rem',
                                height: 30,
                                fontWeight: 700,
                                color: tokens.semantic.error,
                                borderColor: `color-mix(in srgb, ${tokens.semantic.error} 20%, transparent)`,
                                '&:hover': {
                                  borderColor: tokens.semantic.error,
                                  bgcolor: `color-mix(in srgb, ${tokens.semantic.error} 5%, transparent)`,
                                },
                              }}
                            >
                              {unassignTemplateMutation.isPending ? 'Removing...' : 'Unassign'}
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedAssignment(assign);
                              setViewMode('details');
                            }}
                            sx={{
                              borderRadius: '16px',
                              textTransform: 'none',
                              fontSize: '0.72rem',
                              height: 30,
                              fontWeight: 700,
                              color: tokens.brand.primary,
                              borderColor: `color-mix(in srgb, ${tokens.brand.primary} 20%, transparent)`,
                              '&:hover': {
                                borderColor: tokens.brand.primary,
                                bgcolor: `color-mix(in srgb, ${tokens.brand.primary} 5%, transparent)`,
                              },
                            }}
                          >
                            {isElevated ? 'View Target' : 'Open Target'}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}
    </>
  );
};

return (
  <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
    {renderMainContent()}

      {/* ASSIGN TEMPLATE DIALOG MODAL */}
      <Dialog
        open={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? '#1e1b24' : '#fff',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
            p: 1.5,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, pr: 5, position: 'relative' }}>
          Assign KPI Template
          <IconButton
            onClick={() => setIsAssignOpen(false)}
            sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, pt: '12px !important', pb: 2 }}>
          {/* Template Info Card */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: tokens.brand.primary, mb: 0.5 }}>
              {assigningTemplate?.name}
            </Typography>
            {assigningTemplate?.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: '0.85rem' }}>
                {assigningTemplate.description}
              </Typography>
            )}

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
              KPI Targets Included ({assigningTemplate?.kpis.length || 0})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {assigningTemplate?.kpis.map((kpi, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 1 }}>
                    {kpi.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      label="Target"
                      type="number"
                      defaultValue={kpi.targetValue ?? ''}
                      onChange={(e) => setAssignItemOverrides((prev) => ({
                        ...prev,
                        [idx]: { ...prev[idx], targetValue: e.target.value === '' ? undefined : Number(e.target.value) },
                      }))}
                      sx={{ width: 100 }}
                    />
                    <TextField
                      select
                      size="small"
                      label="Priority"
                      defaultValue="medium"
                      onChange={(e) => setAssignItemOverrides((prev) => ({
                        ...prev,
                        [idx]: { ...prev[idx], priority: e.target.value as KpiPriority },
                      }))}
                      sx={{ width: 120 }}
                    >
                      {KPI_PRIORITY_OPTIONS.map((p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                      ))}
                    </TextField>
                    <MobileDateTimePicker
                      label="Due Date & Time"
                      ampm={false}
                      value={assignItemOverrides[idx]?.dueDate ? new Date(assignItemOverrides[idx]!.dueDate!) : null}
                      onChange={(newValue) => setAssignItemOverrides((prev) => ({
                        ...prev,
                        [idx]: { ...prev[idx], dueDate: newValue ? newValue.toISOString() : undefined },
                      }))}
                      slotProps={{
                        textField: { size: 'small', sx: { width: 200 } },
                        dialog: {
                          sx: {
                            '& .MuiPickersDay-root.Mui-selected': {
                              bgcolor: tokens.brand.primary,
                              '&:hover, &:focus': { bgcolor: tokens.brand.primary },
                            },
                            '& .MuiClock-pin, & .MuiClockPointer-root': {
                              bgcolor: tokens.brand.primary,
                            },
                            '& .MuiClockPointer-thumb': {
                              border: `16px solid ${tokens.brand.primary}`,
                              bgcolor: tokens.brand.primary,
                            },
                            '& .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersMonth-monthButton.Mui-selected': {
                              bgcolor: tokens.brand.primary,
                              '&:hover, &:focus': { bgcolor: tokens.brand.primary },
                            },
                            '& .MuiDialogActions-root .MuiButton-text': {
                              color: tokens.brand.primary,
                            },
                          },
                        },
                      }}
                    />
                    <TextField
                      select
                      size="small"
                      label="Pipeline Metric"
                      defaultValue={kpi.pipelineMetric || ''}
                      onChange={(e) => setAssignItemOverrides((prev) => ({
                        ...prev,
                        [idx]: { ...prev[idx], pipelineMetric: (e.target.value || undefined) as PipelineMetric | undefined },
                      }))}
                      sx={{ width: 160 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {PIPELINE_METRIC_OPTIONS.map((m) => (
                        <MenuItem key={m} value={m}>{PIPELINE_METRIC_LABELS[m]}</MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* User selection Autocomplete */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Assign to Team Member
            </Typography>
            <Autocomplete
              options={dbUsers.filter(u => u.role !== 'manager' && u.role !== 'admin')} 
              getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email}
              value={dbUsers.find((u) => u._id === selectedUserId) || null}
              onChange={(_, newValue) => setSelectedUserId(newValue ? newValue._id : null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search and select team member"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                      '& fieldset': {
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                    },
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props as any;
                const fullName = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email;
                const initial = fullName.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
                return (
                  <Box
                    key={option._id}
                    component="li"
                    {...otherProps}
                    sx={{
                      px: '16px !important',
                      py: '10px !important',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: tokens.brand.primary100,
                        color: tokens.brand.primary,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                      }}
                    >
                      {initial}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {option.email} • {option.jobTitle || 'Agent'}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setIsAssignOpen(false)}
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              fontWeight: 700,
              borderRadius: '20px',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignTemplate}
            disabled={assignTemplateMutation.isPending || !selectedUserId}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              borderRadius: '20px',
              textTransform: 'none',
              px: 3.5,
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                boxShadow: 'none',
              },
              '&.Mui-disabled': {
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                color: 'text.muted',
              },
            }}
          >
            {assignTemplateMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Confirm Assignment'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <ConfirmDialog
        open={confirmUnassignOpen}
        title="Unassign Target"
        message="Are you sure you want to unassign this target? This will remove the assignment for the user."
        confirmLabel="Unassign"
        cancelLabel="Cancel"
        isPending={unassignTemplateMutation.isPending}
        onConfirm={handleConfirmUnassign}
        onCancel={() => {
          setConfirmUnassignOpen(false);
          setPendingUnassign(null);
        }}
      />

      {/* Delete Template Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete KPI Template"
        message="Are you sure you want to delete this KPI template? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isPending={deleteTemplateMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      {/* Assign Template Confirmation Dialog */}
      <ConfirmDialog
        open={confirmAssignOpen}
        title="Assign KPI Template"
        message={`Are you sure you want to assign the template "${assigningTemplate?.name || ''}" to the selected user?`}
        confirmLabel="Assign"
        cancelLabel="Cancel"
        isPending={assignTemplateMutation.isPending}
        onConfirm={handleConfirmAssign}
        onCancel={() => setConfirmAssignOpen(false)}
      />

      {/* Delete Standalone KPI Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteStandaloneOpen}
        title="Delete Standalone KPI"
        message="Are you sure you want to delete this standalone KPI? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isPending={deleteKpiMutation.isPending}
        onConfirm={() => {
          if (standaloneKpiToDelete) {
            deleteKpiMutation.mutate(standaloneKpiToDelete, {
              onSuccess: () => {
                setConfirmDeleteStandaloneOpen(false);
                setStandaloneKpiToDelete(null);
              }
            });
          }
        }}
        onCancel={() => {
          setConfirmDeleteStandaloneOpen(false);
          setStandaloneKpiToDelete(null);
        }}
      />

      <KPIChangeRequestModal open={!!changeModal} mode={changeModal} onClose={() => setChangeModal(null)} />
      <StandaloneKPIForm open={standaloneFormOpen} onClose={() => setStandaloneFormOpen(false)} kpi={editingStandaloneKpi} />
    </Box>
  );
};

export default TasksPage;
