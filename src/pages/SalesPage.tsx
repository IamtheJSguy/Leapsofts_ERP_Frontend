import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Avatar,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  OutlinedInput,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  // alpha,
  Autocomplete,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import { tokens, connectionStatusTokens, messageStatusTokens } from '@/styles/tokens';
import type { Lead } from '@/types';
import { useLeads, useQualifyLead, useCreateLead, useUpdateLead, useLogFollowUp } from '@/hooks/api/useLeads';
import {
  useLeadAutoSync,
  buildEditDataFromProspect,
  type EditableLeadData,
} from '@/hooks/useLeadAutoSync';
import { useSalesPipelineStats } from '@/hooks/api/useConnections';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/store/useUIStore';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { QualifyEnrichModal } from '@/components/leads/QualifyEnrichModal';
import { SalesEditRow, SalesInlineAddRow } from '@/components/leads/SalesEditRow';
import { LeadCommentButton } from '@/components/leads/LeadCommentButton';
import {
  clearSalesEditDraft,
  loadSalesEditDraft,
  saveSalesEditDraft,
} from '@/lib/salesEditDraftDb';
import SendIcon from '@mui/icons-material/Send';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ForumIcon from '@mui/icons-material/Forum';
import EventIcon from '@mui/icons-material/Event';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { format, startOfMonth } from 'date-fns';
import { useMe, useUsers } from '@/hooks/api/useUsers';
import { useIcps, useProfiles } from '@/hooks/api/useSettings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { composeProspectName, splitProspectName } from '@/utils/formatters';

const DRAFT_SAVE_DEBOUNCE_MS = 1000;

export const SalesPage = () => {
  useMe(); // Fetch and hydrate store with latest profile data on mount
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';
  const { isElevated } = usePermissions();
  const qualifyLead = useQualifyLead();
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const handleOpenQualifyConfirm = (leadId: string) => {
    setLeadModalMode('qualify');
    setLeadModalId(leadId);
    setLeadModalOpen(true);
  };

  const handleOpenUpdateLead = (leadId: string) => {
    setLeadModalMode('update');
    setLeadModalId(leadId);
    setLeadModalOpen(true);
  };

  const handleOpenLeadDetail = (leadId: string) => {
    window.open(`/sales/leads/${leadId}`, '_blank', 'noopener,noreferrer');
  };

  const handleCloseLeadModal = () => {
    setLeadModalOpen(false);
    setLeadModalId('');
  };

  const handleQualifySuccess = (boardId?: string, projectId?: string) => {
    addToast({ message: 'Lead qualified successfully! Card created.', severity: 'success' });
    handleCloseLeadModal();
    if (boardId && projectId) navigate(`/projects/${projectId}/boards/${boardId}`);
  };

  const handleUpdateLeadSuccess = () => {
    handleCloseLeadModal();
  };

  const getCardTheme = (label: string) => {
    switch (label) {
      case 'TOTAL':
        return {
          icon: <SendIcon sx={{ fontSize: 20 }} />,
          color: tokens.brand.primary,
          bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.15)' : 'rgba(93, 26, 137, 0.08)',
          hoverBorder: tokens.brand.primary,
        };
      case 'ACCEPTED':
        return {
          icon: <GroupAddIcon sx={{ fontSize: 20 }} />,
          color: tokens.brand.accent,
          bgcolor: isDarkMode ? 'rgba(255, 127, 17, 0.15)' : 'rgba(255, 127, 17, 0.08)',
          hoverBorder: tokens.brand.accent,
        };
      case 'MESSAGE SENT':
        return {
          icon: <MarkEmailReadIcon sx={{ fontSize: 20 }} />,
          color: '#0EA5E9',
          bgcolor: isDarkMode ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.08)',
          hoverBorder: '#0EA5E9',
        };
      case 'RESPONDED':
        return {
          icon: <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />,
          color: '#8B5CF6',
          bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)',
          hoverBorder: '#8B5CF6',
        };
      case 'FOLLOW UP':
        return {
          icon: <ForumIcon sx={{ fontSize: 20 }} />,
          color: '#3B82F6',
          bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
          hoverBorder: '#3B82F6',
        };
      case 'NEGATIVE':
        return {
          icon: <ThumbDownOffAltIcon sx={{ fontSize: 20 }} />,
          color: tokens.semantic.error,
          bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
          hoverBorder: tokens.semantic.error,
        };
      case 'POSITIVE':
        return {
          icon: <ThumbUpOffAltIcon sx={{ fontSize: 20 }} />,
          color: tokens.semantic.success,
          bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.15)' : 'rgba(45, 138, 94, 0.08)',
          hoverBorder: tokens.semantic.success,
        };
      default:
        return {
          icon: <SendIcon sx={{ fontSize: 20 }} />,
          color: tokens.brand.primary,
          bgcolor: 'rgba(0,0,0,0.05)',
          hoverBorder: tokens.brand.primary,
        };
    }
  };

  // Dynamic style injection to hide scrollbars globally while this page is active
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'hide-sales-page-scrollbar';
    styleEl.innerHTML = `
      ::-webkit-scrollbar {
        display: none !important;
        width: 0px !important;
        height: 0px !important;
      }
      * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      const el = document.getElementById('hide-sales-page-scrollbar');
      if (el) el.remove();
    };
  }, []);

  const getLinkedinMsgStyle = (msg?: string) => {
    if (!msg) return { color: 'text.secondary', bg: 'transparent', border: 'none' };
    const m = msg.toLowerCase();
    if (m.includes('sent') && !m.includes('not')) {
      return {
        color: isDarkMode ? '#34D399' : tokens.semantic.success,
        bg: isDarkMode ? 'rgba(52, 211, 153, 0.1)' : 'rgba(45, 138, 94, 0.08)',
        border: isDarkMode ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(45, 138, 94, 0.15)',
      };
    }
    if (m.includes('pending') || m.includes('not')) {
      return {
        color: isDarkMode ? '#FBBF24' : tokens.semantic.warning,
        bg: isDarkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(184, 134, 11, 0.08)',
        border: isDarkMode ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid rgba(184, 134, 11, 0.15)',
      };
    }
    // Default fallback
    return {
      color: isDarkMode ? '#A8A2B2' : tokens.text.secondary,
      bg: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
    };
  };

  const getAssignedName = (assigned: any) => {
    if (!assigned) return 'Unassigned';
    if (typeof assigned === 'object') {
      return `${assigned.firstName || ''} ${assigned.lastName || ''}`.trim() || assigned.email || 'Representative';
    }
    return assigned;
  };

  const getLeadName = (lead: any): string => {
    if (!lead) return 'Unnamed Lead';
    if (lead.prospectName) return lead.prospectName;
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ');
    return name || lead.email || lead.company || 'Unnamed Lead';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const [googleSheetLink, setGoogleSheetLink] = useState<string | null>(null);
  const activeTab = 'prospects'; // Pipeline tab removed per user request

  const { user } = useAuth();


  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('All Users');
  const [selectedIcp, setSelectedIcp] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [selectedConnectionStatus, setSelectedConnectionStatus] = useState('');
  const [activeCard, setActiveCard] = useState('TOTAL');
  const [futureLeadWindow, setFutureLeadWindow] = useState<string>('');
  const [messagedOnly, setMessagedOnly] = useState(false);
  const [followUpView, setFollowUpView] = useState<'all' | '1' | '2'>('all');

  const { data: usersData } = useUsers();
  const usersList = (usersData || []).filter((u: any) => u.role !== 'admin');
  const { data: icpsData } = useIcps();
  const icpsList = icpsData || [];
  const { data: profilesData } = useProfiles();
  const profileUsersList = profilesData || [];

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');

  // Inline Lead Creation State
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newLeadData, setNewLeadData] = useState<Partial<Lead>>({
    firstName: '',
    lastName: '',
    prospectName: '',
    email: '',
    icp: '',
    profile: '',
    connectionStatus: 'pending',
    messageStatus: 'not_sent',
    linkedinMsg: '',
    futureLeadDate: undefined,
  });
  const [addLeadErrors, setAddLeadErrors] = useState<Record<string, boolean>>({});
  const createLead = useCreateLead();
  const logFollowUp = useLogFollowUp();

  const handleInlineSave = () => {
    const errors: Record<string, boolean> = {};
    const prospectName = (newLeadData.prospectName || '').trim();
    if (!prospectName) errors.prospectName = true;
    if (!newLeadData.icp?.trim()) errors.icp = true;
    if (!newLeadData.profile?.trim()) errors.profile = true;
    if (newLeadData.messageStatus === 'future_lead' && !newLeadData.futureLeadDate) {
      errors.futureLeadDate = true;
    }
    if (newLeadData.messageStatus === 'invalid_lead' && !newLeadData.leadComment?.text?.trim()) {
      errors.leadComment = true;
    }

    if (Object.keys(errors).length > 0) {
      setAddLeadErrors(errors);
      addToast({
        message: errors.futureLeadDate
          ? 'Please select a Future Lead date.'
          : errors.leadComment
            ? 'Please add a reason comment for the Invalid Lead status.'
            : 'Please fill in all required fields.',
        severity: 'error',
      });
      return;
    }

    const nameParts = splitProspectName(prospectName);
    setAddLeadErrors({});
    createLead.mutate(
      {
        ...newLeadData,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        prospectName: nameParts.prospectName.trim(),
      },
      {
        onSuccess: () => {
          addToast({ message: 'Lead created successfully', severity: 'success' });
          setIsAddingInline(false);
          setAddLeadErrors({});
          setNewLeadData({
            firstName: '', lastName: '', prospectName: '', email: '', icp: '', profile: '',
            connectionStatus: 'pending', messageStatus: 'not_sent', linkedinMsg: '',
            futureLeadDate: undefined,
          });
        },
        onError: (err: any) => {
          const errorMsg = err?.response?.data?.error?.message || 'Failed to create lead';
          addToast({ message: errorMsg, severity: 'error' });
        },
      },
    );
  };

  // Multi-Row Inline Edit State
  const [editingLeads, setEditingLeads] = useState<Record<string, EditableLeadData>>({});
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistEnabledRef = useRef(true);
  const prospectsByIdRef = useRef<Record<string, any>>({});
  const updateLead = useUpdateLead();
  const [markingSentIds, setMarkingSentIds] = useState<Record<string, true>>({});
  const [markingAcceptedIds, setMarkingAcceptedIds] = useState<Record<string, true>>({});

  const handleMarkConnectionAccepted = useCallback((id: string) => {
    if (markingAcceptedIds[id]) return;
    setMarkingAcceptedIds((prev) => ({ ...prev, [id]: true }));
    updateLead.mutate(
      { id, data: { connectionStatus: 'accepted' } },
      {
        onSuccess: () => {
          addToast({ message: 'Marked as accepted', severity: 'success' });
        },
        onError: (err: any) => {
          const errorMsg = err?.response?.data?.error?.message || 'Failed to mark as accepted';
          addToast({ message: errorMsg, severity: 'error' });
        },
        onSettled: () => {
          setMarkingAcceptedIds((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        },
      },
    );
  }, [markingAcceptedIds, updateLead, addToast]);

  const handleMarkMessageSent = useCallback((id: string) => {
    if (markingSentIds[id]) return;
    setMarkingSentIds((prev) => ({ ...prev, [id]: true }));
    updateLead.mutate(
      { id, data: { messageStatus: 'sent', linkedinMsg: 'sent' } },
      {
        onSuccess: () => {
          addToast({ message: 'Marked as sent', severity: 'success' });
        },
        onError: (err: any) => {
          const errorMsg = err?.response?.data?.error?.message || 'Failed to mark as sent';
          addToast({ message: errorMsg, severity: 'error' });
        },
        onSettled: () => {
          setMarkingSentIds((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        },
      },
    );
  }, [markingSentIds, updateLead, addToast]);
  const userId = user?._id || '';
  const {
    isEditAllMode,
    syncStats,
    enterEditAll,
    ensureProspectsEditable,
    saveAll,
    cancelEditAll,
    removeFromSnapshot,
    hydrateFromDraft,
    getSnapshot,
  } = useLeadAutoSync({
    editingLeads,
    setEditingLeads,
    onSessionCleared: () => {
      persistEnabledRef.current = false;
      if (userId) {
        void clearSalesEditDraft(userId).finally(() => {
          persistEnabledRef.current = true;
        });
      } else {
        persistEnabledRef.current = true;
      }
      setDraftRestored(false);
    },
  });

  const handleEditClick = useCallback((prospect: any) => {
    setEditingLeads((prev) => ({
      ...prev,
      [prospect._id]: buildEditDataFromProspect(prospect),
    }));
  }, []);

  const handleEditUpdate = useCallback((id: string, patch: Partial<EditableLeadData>) => {
    setEditingLeads((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          ...patch,
          ...(patch.messageStatus && patch.messageStatus !== 'future_lead'
            ? { futureLeadDate: undefined }
            : {}),
        },
      };
    });
  }, []);

  const handleEditCancel = useCallback((id: string) => {
    removeFromSnapshot(id);
    setEditingLeads((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  }, [removeFromSnapshot]);

  const handleEditSave = useCallback((id: string) => {
    const dataToSave = editingLeads[id];
    if (!dataToSave) return;
    const originalProspect = prospectsByIdRef.current[id];

    if (dataToSave.messageStatus === 'future_lead' && !dataToSave.futureLeadDate) {
      addToast({ message: 'Please select a Future Lead date.', severity: 'error' });
      return;
    }
    if (dataToSave.messageStatus === 'invalid_lead' && !dataToSave.leadComment?.text?.trim()) {
      addToast({ message: 'Please add a reason comment for the Invalid Lead status.', severity: 'error' });
      return;
    }

    const nameParts = splitProspectName(dataToSave.prospectName || composeProspectName(dataToSave));
    const payload = {
      ...dataToSave,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      prospectName: nameParts.prospectName.trim(),
    };

    if (originalProspect) {
      const originalName = composeProspectName(originalProspect);
      const hasChanged =
        payload.prospectName !== originalName ||
        payload.firstName !== (originalProspect.firstName || '') ||
        payload.lastName !== (originalProspect.lastName || '') ||
        payload.email !== (originalProspect.email || '') ||
        payload.icp !== (originalProspect.icp || '') ||
        payload.profile !== (originalProspect.profile || '') ||
        payload.connectionStatus !== (originalProspect.connectionStatus || 'pending') ||
        payload.messageStatus !== (originalProspect.messageStatus || 'not_sent') ||
        payload.linkedinMsg !== (originalProspect.linkedinMsg || '') ||
        (payload.futureLeadDate || '') !== (
          originalProspect.futureLeadDate
            ? format(new Date(originalProspect.futureLeadDate), 'yyyy-MM-dd')
            : ''
        );

      if (!hasChanged) {
        handleEditCancel(id);
        return;
      }
    }

    updateLead.mutate({ id, data: payload }, {
      onSuccess: () => {
        addToast({ message: 'Lead updated successfully', severity: 'success' });
        removeFromSnapshot(id);
        setEditingLeads((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      },
      onError: (err: any) => {
        const errorMsg = err?.response?.data?.error?.message || 'Failed to update lead';
        addToast({ message: errorMsg, severity: 'error' });
      }
    });
  }, [editingLeads, addToast, updateLead, removeFromSnapshot, handleEditCancel]);

  const handleFollowUpChange = useCallback((id: string, number: number) => {
    logFollowUp.mutate(
      { id, number },
      {
        onSuccess: () =>
          addToast({
            message: `FollowUp #${number} selected`,
            severity: 'success',
          }),
        onError: () =>
          addToast({
            message: 'Failed to update follow-up',
            severity: 'error',
          }),
      },
    );
  }, [logFollowUp, addToast]);

  const handleInlineAddUpdate = useCallback((patch: Record<string, unknown>) => {
    setNewLeadData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleInlineAddCancel = useCallback(() => {
    setIsAddingInline(false);
    setAddLeadErrors({});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 10);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedUserId, selectedIcp, selectedProfile, selectedStatus, selectedConnectionStatus, activeCard, startDate, endDate, futureLeadWindow, messagedOnly, followUpView]);

  const leadFilters = useMemo(() => {
    const filters: any = {
      page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(selectedUserId !== 'All Users' ? { assignedTo: selectedUserId } : {}),
      ...(selectedIcp ? { icp: selectedIcp } : {}),
      ...(selectedProfile ? { profile: selectedProfile } : {}),
      ...(selectedStatus !== 'All statuses' ? { messageStatus: selectedStatus } : {}),
      ...(selectedConnectionStatus ? { connectionStatus: selectedConnectionStatus } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(messagedOnly ? { messaged: true } : {}),
      ...(futureLeadWindow ? { futureLeadWindow } : {}),
    };

    if (activeCard === 'ACCEPTED') filters.connectionStatus = 'accepted';
    if (activeCard === 'MESSAGE SENT') {
      filters.messaged = true;
      delete filters.messageStatus;
    }
    if (activeCard === 'RESPONDED') filters.messageStatus = 'replied';
    if (activeCard === 'FOLLOW UP') {
      filters.messageStatus = 'follow_up';
      if (followUpView === '1') filters.followUpCount = 1;
      if (followUpView === '2') filters.followUpCount = 2;
    }
    if (activeCard === 'NEGATIVE') filters.messageStatus = 'negative';
    if (activeCard === 'POSITIVE') filters.messageStatus = 'positive';

    return filters;
  }, [page, rowsPerPage, debouncedSearch, selectedUserId, selectedIcp, selectedProfile, selectedStatus, selectedConnectionStatus, activeCard, startDate, endDate, futureLeadWindow, messagedOnly, followUpView]);

  const { data: leadsResponse, isLoading: isLeadsLoading, isFetching: isLeadsFetching } = useLeads(leadFilters);
  const prospects = leadsResponse?.data ?? [];
  const totalProspects = leadsResponse?.meta.total ?? 0;

  useEffect(() => {
    const map: Record<string, any> = {};
    for (const p of prospects) {
      map[p._id] = p;
    }
    prospectsByIdRef.current = map;
  }, [prospects]);

  // Restore edit drafts + sticky edit mode from IndexedDB
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!userId) {
        setDraftReady(false);
        return;
      }

      setDraftReady(false);
      persistEnabledRef.current = false;
      try {
        const draft = await loadSalesEditDraft(userId);
        if (cancelled) return;
        const hasDraft =
          !!draft &&
          (draft.isEditAllMode || Object.keys(draft.editingLeads || {}).length > 0);
        if (hasDraft && draft) {
          hydrateFromDraft({
            editingLeads: draft.editingLeads || {},
            snapshot: draft.snapshot || {},
            isEditAllMode: !!draft.isEditAllMode,
          });
          setDraftRestored(true);
          if (draft.isEditAllMode) {
            addToast({
              message: 'Restored previous edit session from local draft.',
              severity: 'info',
            });
          }
        } else {
          setDraftRestored(false);
        }
      } catch {
        if (!cancelled) setDraftRestored(false);
      } finally {
        if (!cancelled) {
          persistEnabledRef.current = true;
          setDraftReady(true);
        }
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [userId, hydrateFromDraft]);

  // Debounced persist of edit drafts
  useEffect(() => {
    if (!draftReady || !userId || !persistEnabledRef.current) return;

    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = setTimeout(() => {
      if (!persistEnabledRef.current) return;

      const hasDrafts = isEditAllMode || Object.keys(editingLeads).length > 0;
      setDraftSaving(true);
      const persist = hasDrafts
        ? saveSalesEditDraft(userId, {
            isEditAllMode,
            editingLeads,
            snapshot: getSnapshot(),
          })
        : clearSalesEditDraft(userId);

      void persist
        .then(() => {
          if (persistEnabledRef.current) setDraftRestored(hasDrafts);
        })
        .catch(() => {
          // Keep editing even if local persistence fails.
        })
        .finally(() => {
          setDraftSaving(false);
        });
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => {
      if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    };
  }, [editingLeads, isEditAllMode, draftReady, userId, getSnapshot]);

  useEffect(() => {
    if (isEditAllMode) {
      ensureProspectsEditable(prospects);
    }
  }, [isEditAllMode, prospects, ensureProspectsEditable]);

  const handleEditAllToggle = async () => {
    if (!isEditAllMode) {
      if (prospects.length === 0) {
        addToast({ message: 'No leads to edit on this page.', severity: 'info' });
        return;
      }
      enterEditAll(prospects);
      addToast({
        message: `Editing ${prospects.length} lead${prospects.length === 1 ? '' : 's'}. Changes auto-sync every 30s.`,
        severity: 'info',
      });
      return;
    }

    const result = await saveAll();
    if (result.failed > 0) {
      addToast({
        message: `Saved ${result.synced} lead(s); ${result.failed} failed. Still in edit mode — retry or fix and Save All again.`,
        severity: 'error',
      });
      return;
    }
    if (result.skipped > 0) {
      addToast({
        message: 'Some Future Lead rows need a date before they can be saved. Still in edit mode.',
        severity: 'warning',
      });
      return;
    }
    if (result.synced > 0) {
      addToast({
        message: `Saved ${result.synced} lead${result.synced === 1 ? '' : 's'}.`,
        severity: 'success',
      });
    } else {
      addToast({ message: 'No pending changes to save.', severity: 'info' });
    }
  };

  const pipelineFilters = useMemo(() => ({
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(selectedUserId !== 'All Users' ? { assignedTo: selectedUserId } : {}),
    ...(selectedIcp ? { icp: selectedIcp } : {}),
    ...(selectedProfile ? { profile: selectedProfile } : {}),
  }), [startDate, endDate, selectedUserId, selectedIcp, selectedProfile]);
  const { data: pipelineStats, isLoading: isPipelineLoading } = useSalesPipelineStats(pipelineFilters);

  // Qualify Lead Modal state
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);
  const [selectedLeadToQualify, setSelectedLeadToQualify] = useState<string>('');

  // Lead qualify/update modal (opened by Qualify button or name/avatar click)
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadModalId, setLeadModalId] = useState<string>('');
  const [leadModalMode, setLeadModalMode] = useState<'update' | 'qualify'>('qualify');

  useEffect(() => {
    if (user && (user as any).googleSheetId && !googleSheetLink) {
      const sheetId = (user as any).googleSheetId;
      setGoogleSheetLink(`https://docs.google.com/spreadsheets/d/${sheetId}`);
    }
  }, [user, googleSheetLink]);

  const stats = useMemo(() => {
    const pct = (value: number) => `${value}%`;

    if (!pipelineStats) {
      return [
        { label: 'TOTAL', value: '0', percent: null },
        { label: 'ACCEPTED', value: '0', percent: '0%' },
        { label: 'MESSAGE SENT', value: '0', percent: '0%' },
        { label: 'RESPONDED', value: '0', percent: '0%' },
        { label: 'FOLLOW UP', value: '0', percent: '0%' },
        { label: 'NEGATIVE', value: '0', percent: '0%' },
        { label: 'POSITIVE', value: '0', percent: '0%' },
      ];
    }

    const { conversionRates } = pipelineStats;

    const followUpValue =
      followUpView === '1'
        ? String(pipelineStats.followUp1 ?? 0)
        : followUpView === '2'
          ? String(pipelineStats.followUp2 ?? 0)
          : String(pipelineStats.followUp ?? pipelineStats.messageStats?.follow_up ?? 0);
    const followUpPercent =
      followUpView === '1'
        ? pct(conversionRates.followUp1Rate ?? 0)
        : followUpView === '2'
          ? pct(conversionRates.followUp2Rate ?? 0)
          : pct(conversionRates.followUpRate ?? 0);

    return [
      { label: 'TOTAL', value: String(pipelineStats.totalProspects), percent: null },
      { label: 'ACCEPTED', value: String(pipelineStats.acceptedConnections), percent: pct(conversionRates.acceptRate) },
      { label: 'MESSAGE SENT', value: String(pipelineStats.messageSent ?? 0), percent: pct(conversionRates.messageSentRate ?? 0) },
      { label: 'RESPONDED', value: String(pipelineStats.responded ?? 0), percent: pct(conversionRates.respondedRate ?? 0) },
      { label: 'FOLLOW UP', value: followUpValue, percent: followUpPercent },
      { label: 'NEGATIVE', value: String(pipelineStats.negative ?? pipelineStats.messageStats?.negative ?? 0), percent: pct(conversionRates.negativeRate ?? 0) },
      { label: 'POSITIVE', value: String(pipelineStats.positive ?? pipelineStats.messageStats?.positive ?? 0), percent: pct(conversionRates.positiveRate ?? 0) },
    ];
  }, [pipelineStats, followUpView]);

  const applyFunnelCard = (label: string) => {
    setActiveCard(label);
    setFutureLeadWindow('');
    setMessagedOnly(false);
    if (label === 'MESSAGE SENT') {
      setSelectedStatus('All statuses');
      setMessagedOnly(true);
      setSelectedConnectionStatus('');
    } else if (label === 'RESPONDED') {
      setSelectedStatus('replied');
      setSelectedConnectionStatus('');
    } else if (label === 'FOLLOW UP') {
      setSelectedStatus('follow_up');
      setSelectedConnectionStatus('');
    } else if (label === 'NEGATIVE') {
      setSelectedStatus('negative');
      setSelectedConnectionStatus('');
    } else if (label === 'POSITIVE') {
      setSelectedStatus('positive');
      setSelectedConnectionStatus('');
    } else if (label === 'ACCEPTED') {
      setSelectedStatus('All statuses');
      setSelectedConnectionStatus('accepted');
    } else {
      setSelectedStatus('All statuses');
      setSelectedConnectionStatus('');
    }
  };

  // Styles for input selects
  const filterSelectSx = {
    minWidth: { xs: '100%', sm: 160 },
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
  };

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      {/* Glow Ambient Backdrop Accent */}
      <Box
        sx={{
          position: 'absolute',
          top: -150,
          right: 100,
          width: 320,
          height: 320,
          background: `radial-gradient(circle, ${tokens.brand.primary} 0%, transparent 70%)`,
          filter: 'blur(90px)',
          opacity: isDarkMode ? 0.08 : 0.04,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Page Header */}
      <Box sx={{ mb: 4.5, position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.025em',
              mb: 0.5,
              color: isDarkMode ? '#fff' : tokens.text.primary,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            Sales & Pipeline
            <Chip
              label="Outbound Motion"
              size="small"
              sx={{
                bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.06)',
                color: tokens.brand.primary,
                fontWeight: 800,
                fontSize: '0.68rem',
                height: 22,
                border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.1)'}`,
              }}
            />
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.92rem',
            }}
          >
            Track outbound conversions, manage prospects, and update outreach stages.
          </Typography>
        </Box>

        {/* Date Range Filter in Header */}
        <Box sx={{ minWidth: { xs: '100%', sm: 260 }, maxWidth: { sm: 300 } }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            size="small"
            layout="compact"
            maxDate={new Date()}
          />
        </Box>
      </Box>

      {/* Stats Counter Row */}
      {isPipelineLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, mb: 4.5 }}>
          <CircularProgress size={32} sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : (
        <>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
              lg: 'repeat(7, minmax(0, 1fr))',
            },
            gap: 2,
            mb: 1.5,
          }}
        >
          {stats.map((item, idx) => {
            const theme = getCardTheme(item.label);
            return (
              <Card
                key={idx}
                onClick={() => applyFunnelCard(item.label)}
                sx={{
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `2px solid ${activeCard === item.label ? theme.color : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)')}`,
                  borderRadius: '24px',
                  p: 2.25,
                  height: '100%',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row', lg: 'column', xl: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center', lg: 'flex-start', xl: 'center' },
                  gap: { xs: 1.2, sm: 1.75 },
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: theme.hoverBorder,
                    transform: 'translateY(-3px)',
                    boxShadow: tokens.shadow.cardHover,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    bgcolor: theme.bgcolor,
                    color: theme.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {theme.icon}
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 750,
                        fontSize: '0.6rem',
                        letterSpacing: '0.04em',
                        lineHeight: 1.2,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label === 'FOLLOW UP'
                        ? followUpView === '1'
                          ? 'FOLLOW UP 1'
                          : followUpView === '2'
                            ? 'FOLLOW UP 2'
                            : 'FOLLOW UP'
                        : item.label}
                    </Typography>
                    {item.label === 'FOLLOW UP' && (
                      <Select
                        size="small"
                        value={followUpView}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const next = e.target.value as 'all' | '1' | '2';
                          setFollowUpView(next);
                          applyFunnelCard('FOLLOW UP');
                        }}
                        sx={{
                          minWidth: 58,
                          height: 20,
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          '& .MuiSelect-select': {
                            py: 0,
                            px: 0.75,
                            pr: '18px !important',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                          },
                          '& .MuiSvgIcon-root': { fontSize: 14 },
                        }}
                      >
                        <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
                        <MenuItem value="1" sx={{ fontSize: '0.75rem' }}>#1</MenuItem>
                        <MenuItem value="2" sx={{ fontSize: '0.75rem' }}>#2</MenuItem>
                      </Select>
                    )}
                    {item.percent && (
                      <Chip
                        label={item.percent}
                        size="small"
                        sx={{
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                          color: 'text.secondary',
                          fontSize: '0.58rem',
                          height: 16,
                          fontWeight: 800,
                          px: 0.2,
                          '& .MuiChip-label': { px: 0.75 }
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: theme.color, lineHeight: 1 }}>
                    {item.value}
                  </Typography>
                </Box>
              </Card>
            );
          })}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            mb: 4.5,
            mt: 0.5,
          }}
        >
          <Chip
            icon={<EventIcon sx={{ fontSize: '16px !important' }} />}
            label={`Future leads: ${pipelineStats?.futureLeads ?? 0}`}
            onClick={() => {
              setActiveCard('TOTAL');
              setMessagedOnly(false);
              setSelectedStatus('future_lead');
              setFutureLeadWindow('');
            }}
            sx={{
              fontWeight: 700,
              cursor: 'pointer',
              bgcolor: futureLeadWindow === '' && selectedStatus === 'future_lead'
                ? (isDarkMode ? 'rgba(93, 26, 137, 0.25)' : 'rgba(93, 26, 137, 0.12)')
                : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
              color: tokens.brand.primary,
              border: `1px solid ${tokens.brand.primary}33`,
            }}
          />
          <Chip
            label={`Due soon: ${pipelineStats?.futureLeadsDueSoon ?? 0}`}
            onClick={() => {
              setActiveCard('TOTAL');
              setMessagedOnly(false);
              setSelectedStatus('All statuses');
              setFutureLeadWindow('due_soon');
            }}
            sx={{
              fontWeight: 700,
              cursor: 'pointer',
              bgcolor: futureLeadWindow === 'due_soon'
                ? (isDarkMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.12)')
                : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
              color: '#F59E0B',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={futureLeadWindow}
              displayEmpty
              onChange={(e) => {
                const val = e.target.value;
                setFutureLeadWindow(val);
                setActiveCard('TOTAL');
                setMessagedOnly(false);
                if (val) setSelectedStatus('All statuses');
              }}
              sx={{
                height: 32,
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: '16px',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
              }}
            >
              <MenuItem value="">Future window: All</MenuItem>
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="due">Due today</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="due_soon">Due soon (3d)</MenuItem>
            </Select>
          </FormControl>
        </Box>
        </>
      )}

      {/* Sub-Navigation Tabs Row */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: '24px',
          p: 0.5,
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, ml: 1, py: 1 }}>
          Prospects List
        </Typography>
      </Box>

      {/* Linked Sheet Status Banner Toolbar */}
      {googleSheetLink && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.08)' : 'rgba(93, 26, 137, 0.02)',
            border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.08)'}`,
            borderRadius: '16px',
            p: 2,
            mb: 3.5,
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                width: 38,
                height: 38,
              }}
            >
              <InsertDriveFileIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 750,
                  color: isDarkMode ? '#fff' : tokens.text.primary,
                  fontSize: '0.86rem',
                }}
                noWrap
              >
                Connected Google Sheet
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  fontFamily: 'monospace',
                }}
                noWrap
              >
                {googleSheetLink}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}



      {/* Tab Panel: Prospects View */}
      {activeTab === 'prospects' && (
        <Box className="animate-fade-in-up">
          {/* Filters Command Toolbar */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: { xs: 'stretch', md: 'center' },
              mb: 3.5,
            }}
          >
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search name, company, headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flexGrow: 1,
                minWidth: { xs: '100%', sm: 240 },
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



            {/* User Search Autocomplete - Admin Only */}
            {isElevated && (
              <Autocomplete
                options={[{ _id: 'All Users', label: 'All Users' }, ...usersList.map((u: any) => ({ _id: u._id, label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email }))]}
                getOptionLabel={(option) => option.label || ''}
                value={
                  selectedUserId === 'All Users'
                    ? { _id: 'All Users', label: 'All Users' }
                    : {
                      _id: selectedUserId, label: (() => {
                        const user = usersList.find((u: any) => u._id === selectedUserId);
                        return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown User';
                      })()
                    }
                }
                onChange={(e, newValue) => setSelectedUserId(newValue ? newValue._id : 'All Users')}
                disableClearable
                sx={{
                  flexGrow: 1,
                  minWidth: { xs: '100%', sm: 220 },
                  maxWidth: { sm: 260 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                    bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                    height: 42,
                    p: '0 12px',
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
                  '& .MuiAutocomplete-input': {
                    p: '0 !important',
                  },
                  '& .MuiAutocomplete-endAdornment': {
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search user..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PersonOutlineIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5, ml: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            )}

            {/* ICP Filter — available to all roles */}
            <TextField
              select
              size="small"
              placeholder="Filter by Campaign (ICP)"
              value={selectedIcp}
              onChange={(e) => setSelectedIcp(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              sx={{
                flexGrow: 1,
                minWidth: { xs: '100%', sm: 180 },
                maxWidth: { sm: 240 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                  height: 42,
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
            >
              <MenuItem value="">All ICPs</MenuItem>
              {icpsList.map((icp) => (
                <MenuItem key={icp._id} value={icp.name}>
                  {icp.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Profile Filter — available to all roles */}
            <TextField
              select
              size="small"
              placeholder="Filter by Profile"
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              sx={{
                flexGrow: 1,
                minWidth: { xs: '100%', sm: 180 },
                maxWidth: { sm: 240 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                  height: 42,
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
            >
              <MenuItem value="">All Profiles</MenuItem>
              {profileUsersList.map((p: any) => (
                <MenuItem key={p._id} value={p.name}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Connection Status Filter */}
            <FormControl sx={filterSelectSx}>
              <Select
                value={selectedConnectionStatus}
                displayEmpty
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedConnectionStatus(val);
                  if (val === 'accepted') setActiveCard('ACCEPTED');
                  else if (activeCard === 'ACCEPTED') setActiveCard('TOTAL');
                }}
                input={<OutlinedInput />}
              >
                <MenuItem value="">All Connection Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="declined">Declined</MenuItem>
                <MenuItem value="no_response">No Response</MenuItem>
              </Select>
            </FormControl>

            {/* Status Select Dropdown */}
            <FormControl sx={filterSelectSx}>
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStatus(val);
                  setFutureLeadWindow('');
                  setMessagedOnly(false);
                  if (val === 'replied') setActiveCard('RESPONDED');
                  else if (val === 'follow_up') setActiveCard('FOLLOW UP');
                  else if (val === 'negative') setActiveCard('NEGATIVE');
                  else if (val === 'positive') setActiveCard('POSITIVE');
                  else setActiveCard('TOTAL');
                }}
                input={<OutlinedInput />}
              >
                <MenuItem value="All statuses">Message status</MenuItem>
                <MenuItem value="not_sent">Not Sent</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="replied">Replied</MenuItem>
                <MenuItem value="follow_up">Follow Up</MenuItem>
                <MenuItem value="negative">Negative</MenuItem>
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="future_lead">Future Lead</MenuItem>
                <MenuItem value="invalid_lead">Invalid Lead</MenuItem>
              </Select>
            </FormControl>

            {/* Action Buttons — users & managers can add leads; sheet sync/bulk stay user-facing */}
            
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', ml: 'auto', flexWrap: 'nowrap' }}>
                {(isEditAllMode || draftRestored || !draftReady || draftSaving) && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '20px',
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      mr: 0.5,
                    }}
                  >
                    {syncStats.isSyncing || !draftReady || draftSaving ? (
                      <CircularProgress size={14} thickness={5} sx={{ color: tokens.brand.primary }} />
                    ) : (
                      <SyncIcon sx={{ fontSize: 16, color: tokens.brand.primary, opacity: 0.85 }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
                        whiteSpace: 'nowrap',
                        fontSize: '0.72rem',
                      }}
                    >
                      {!draftReady
                        ? 'Restoring draft…'
                        : draftSaving
                          ? 'Saving draft…'
                          : isEditAllMode
                            ? `${syncStats.lastSyncAt
                              ? `Last sync ${format(syncStats.lastSyncAt, 'HH:mm:ss')}`
                              : 'Auto-sync ready'} · Synced ${syncStats.syncedCount} · Pending ${syncStats.pendingCount}${syncStats.failedCount > 0 ? ` · Failed ${syncStats.failedCount}` : ''}`
                            : draftRestored
                              ? 'Local draft saved'
                              : 'No local draft'}
                    </Typography>
                  </Box>
                )}
                <Button
                  variant={isEditAllMode ? 'contained' : 'outlined'}
                  startIcon={
                    isEditAllMode
                      ? (syncStats.isSyncing
                        ? <CircularProgress size={14} color="inherit" />
                        : <SaveIcon sx={{ fontSize: 16 }} />)
                      : <EditIcon sx={{ fontSize: 16 }} />
                  }
                  onClick={() => { void handleEditAllToggle(); }}
                  disabled={syncStats.isSyncing && isEditAllMode}
                  sx={{
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    color: isEditAllMode ? '#fff' : (isDarkMode ? '#fff' : tokens.text.primary),
                    bgcolor: isEditAllMode ? tokens.brand.primary : 'transparent',
                    textTransform: 'none',
                    borderRadius: '24px',
                    height: 42,
                    px: 3,
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: isEditAllMode
                        ? tokens.brand.primaryLight
                        : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {isEditAllMode ? 'Save All' : 'Edit All'}
                </Button>
                {isEditAllMode && (
                  <Button
                    variant="outlined"
                    startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                    onClick={cancelEditAll}
                    disabled={syncStats.isSyncing}
                    sx={{
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      color: isDarkMode ? '#fff' : tokens.text.primary,
                      textTransform: 'none',
                      borderRadius: '24px',
                      height: 42,
                      px: 2.5,
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      },
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setIsAddingInline(true)}
                  sx={{
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    color: isDarkMode ? '#fff' : tokens.text.primary,
                    textTransform: 'none',
                    borderRadius: '24px',
                    height: 42,
                    px: 3,
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  Add Lead
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GroupAddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate('/sales/add-leads')}
                  sx={{
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    color: isDarkMode ? '#fff' : tokens.text.primary,
                    textTransform: 'none',
                    borderRadius: '24px',
                    height: 42,
                    px: 3,
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  Add Multiple
                </Button>
              </Box>
            
          </Box>

          {isLeadsLoading && !leadsResponse ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: tokens.brand.primary }} />
            </Box>
          ) : prospects.length === 0 && !isAddingInline ? (
            /* Unlinked Prospects View - Show Empty State Graphic below the toolbar */
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: 9,
                px: 3,
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.25)' : 'rgba(255, 255, 255, 0.45)',
                border: `1.5px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
                borderRadius: '24px',
                /* backdropFilter: 'blur(10px)' (removed for performance) */
                maxWidth: 560,
                mx: 'auto',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.01)',
              }}
            >
              <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="40" fill="url(#glowGradient2)" opacity="0.15" />
                <rect x="25" y="35" width="45" height="50" rx="6" stroke={tokens.brand.primary} strokeWidth="2.5" fill="none" opacity="0.8" />
                <line x1="32" y1="47" x2="63" y2="47" stroke={tokens.brand.primary} strokeWidth="2" opacity="0.4" />
                <line x1="32" y1="59" x2="63" y2="59" stroke={tokens.brand.primary} strokeWidth="2" opacity="0.4" />
                <line x1="32" y1="71" x2="63" y2="71" stroke={tokens.brand.primary} strokeWidth="2" opacity="0.4" />

                <rect x="50" y="25" width="45" height="50" rx="6" stroke={tokens.brand.accent} strokeWidth="2.5" fill={isDarkMode ? '#1e1b24' : '#fff'} />
                <line x1="57" y1="37" x2="88" y2="37" stroke={tokens.brand.accent} strokeWidth="2.5" />
                <rect x="57" y="47" width="12" height="8" rx="1.5" fill={tokens.brand.accent} opacity="0.25" />
                <rect x="73" y="47" width="15" height="8" rx="1.5" fill={tokens.brand.accent} opacity="0.25" />
                <rect x="57" y="59" width="15" height="8" rx="1.5" fill={tokens.brand.accent} opacity="0.25" />
                <rect x="76" y="59" width="12" height="8" rx="1.5" fill={tokens.brand.accent} opacity="0.25" />
                <path d="M 40 40 Q 50 15 65 30" stroke={tokens.brand.accent} strokeWidth="2" strokeDasharray="3 3" />
                <path d="M 80 70 Q 70 95 55 80" stroke={tokens.brand.primary} strokeWidth="2" strokeDasharray="3 3" />
                <defs>
                  <radialGradient id="glowGradient2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" transform="translate(60 60) rotate(90) scale(40)">
                    <stop offset="0%" stopColor={tokens.brand.primary} />
                    <stop offset="100%" stopColor={tokens.brand.accent} stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: isDarkMode ? '#fff' : tokens.text.primary,
                  mb: 1,
                  mt: 2.5,
                  letterSpacing: '-0.015em',
                }}
              >
                No Prospects Connected
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  maxWidth: 380,
                  mb: 4,
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                No prospects yet. Add leads manually, or connect a Google Sheet from Settings to sync contacts.
              </Typography>
            </Box>
          ) : (
            /* Connected Prospects View - Show Table */
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                boxShadow: 'none',
                overflowX: 'auto',
                overflowY: 'hidden',
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.015)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`, pl: 3 }}>PROSPECT</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>CAMPAIGN (ICP)</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>OUTREACH STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>LINKEDIN ACTION</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>ASSIGNED AGENT</TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isAddingInline && (
                    <SalesInlineAddRow
                      data={newLeadData}
                      errors={addLeadErrors}
                      isDarkMode={isDarkMode}
                      icpsList={icpsList}
                      profileUsersList={profileUsersList}
                      agentName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                      onUpdate={handleInlineAddUpdate}
                      onSave={handleInlineSave}
                      onCancel={handleInlineAddCancel}
                    />
                  )}
                  {prospects.map((prospect) => {
                    const isEditing = !!editingLeads[prospect._id];
                    if (isEditing) {
                      const editData = editingLeads[prospect._id];
                      return (
                        <SalesEditRow
                          key={`edit-${prospect._id}`}
                          leadId={prospect._id}
                          editData={editData}
                          isDarkMode={isDarkMode}
                          icpsList={icpsList}
                          profileUsersList={profileUsersList}
                          assignedName={getAssignedName(prospect.assignedTo)}
                          addedLabel={formatDate(prospect.date || prospect.createdAt)}
                          followUpCount={prospect.followUpCount}
                          showFollowUpSelect={
                            editData.messageStatus === 'follow_up' &&
                            prospect.messageStatus === 'follow_up'
                          }
                          followUpPending={logFollowUp.isPending}
                          onUpdate={handleEditUpdate}
                          onSave={handleEditSave}
                          onCancel={handleEditCancel}
                          onFollowUpChange={handleFollowUpChange}
                        />
                      );
                    }

                    const nameToUse = prospect.prospectName || `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || prospect.email || 'Prospect';
                    const initials = nameToUse.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';

                    const connToken = (connectionStatusTokens as any)[prospect.connectionStatus || 'pending'] || connectionStatusTokens.pending;
                    const msgToken = (messageStatusTokens as any)[prospect.messageStatus || 'not_sent'] || messageStatusTokens.not_sent;
                    const isMarkingSent = !!markingSentIds[prospect._id];
                    const isMarkingAccepted = !!markingAcceptedIds[prospect._id];
                    const canMarkConnAccepted =
                      (prospect.connectionStatus || 'pending') === 'pending';
                    const canMarkMsgSent =
                      prospect.connectionStatus === 'accepted' &&
                      (prospect.messageStatus || 'not_sent') === 'not_sent';

                    const lkMsgStyle = getLinkedinMsgStyle(prospect.linkedinMsg);

                    return (
                      <TableRow
                        key={prospect._id}
                        sx={{
                          transition: 'all 0.2s',
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
                          '&:last-child': { borderBottom: 0 },
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                          },
                        }}
                      >
                        {/* Prospect Details */}
                        <TableCell sx={{ py: 2, borderBottom: 0, pl: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              role="button"
                              tabIndex={0}
                              onClick={() => handleOpenUpdateLead(String(prospect._id))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleOpenUpdateLead(String(prospect._id));
                                }
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.75,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'opacity 0.15s',
                                '&:hover': { opacity: 0.85 },
                                outline: 'none',
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 38,
                                  height: 38,
                                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F2EEEC',
                                  color: isDarkMode ? '#fff' : '#1A1625',
                                  fontSize: '0.84rem',
                                  fontWeight: 800,
                                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.03)'}`,
                                }}
                              >
                                {initials}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 750,
                                    color: isDarkMode ? '#fff' : tokens.text.primary,
                                    fontSize: '0.88rem',
                                    '&:hover': { color: tokens.brand.primary, textDecoration: 'underline' },
                                  }}
                                >
                                  {nameToUse}
                                </Typography>
                                {prospect.email && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                    <EmailIcon sx={{ fontSize: 12 }} />
                                    {prospect.email}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Box onClick={(e) => e.stopPropagation()}>
                              <LeadCommentButton
                                comment={prospect.leadComment}
                                onSave={(comment) =>
                                  updateLead.mutate(
                                    { id: prospect._id, data: { leadComment: comment } },
                                    {
                                      onSuccess: () =>
                                        addToast({
                                          message: comment ? 'Comment saved' : 'Comment removed',
                                          severity: 'success',
                                        }),
                                      onError: () =>
                                        addToast({ message: 'Failed to save comment', severity: 'error' }),
                                    },
                                  )
                                }
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        {/* ICP Profile */}
                        <TableCell sx={{ py: 2, borderBottom: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: isDarkMode ? 'rgba(255,255,255,0.9)' : tokens.text.primary, fontSize: '0.86rem', mb: 0.5 }}>
                            {prospect.icp || 'General Lead'}
                          </Typography>
                          {prospect.profile && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Profile: {prospect.profile}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Outreach Connection/Message Status */}
                        <TableCell sx={{ py: 2, borderBottom: 0 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                            <Chip
                              label={
                                isMarkingAccepted
                                  ? 'Conn: saving…'
                                  : `Conn: ${prospect.connectionStatus || 'pending'}`
                              }
                              size="small"
                              clickable={canMarkConnAccepted && !isMarkingAccepted}
                              disabled={isMarkingAccepted}
                              onClick={
                                canMarkConnAccepted && !isMarkingAccepted
                                  ? (e) => {
                                      e.stopPropagation();
                                      handleMarkConnectionAccepted(prospect._id);
                                    }
                                  : undefined
                              }
                              aria-label={
                                canMarkConnAccepted
                                  ? 'Mark connection as accepted'
                                  : `Connection status ${prospect.connectionStatus || 'pending'}`
                              }
                              sx={{
                                bgcolor: connToken.bg,
                                color: connToken.color,
                                fontWeight: 750,
                                fontSize: '0.64rem',
                                height: 20,
                                textTransform: 'uppercase',
                                borderRadius: '6px',
                                border: `1px solid ${`color-mix(in srgb, ${connToken.color} 12%, transparent)`}`,
                                ...(canMarkConnAccepted
                                  ? {
                                      cursor: isMarkingAccepted ? 'wait' : 'pointer',
                                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${connToken.color} 28%, transparent)`,
                                      '&:hover': {
                                        bgcolor: connToken.bg,
                                        filter: 'brightness(0.96)',
                                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${connToken.color} 45%, transparent)`,
                                      },
                                    }
                                  : {}),
                              }}
                            />
                            <Chip
                              label={
                                isMarkingSent
                                  ? 'Msg: saving…'
                                  : `Msg: ${prospect.messageStatus || 'not_sent'}`
                              }
                              size="small"
                              clickable={canMarkMsgSent && !isMarkingSent}
                              disabled={isMarkingSent}
                              onClick={
                                canMarkMsgSent && !isMarkingSent
                                  ? (e) => {
                                      e.stopPropagation();
                                      handleMarkMessageSent(prospect._id);
                                    }
                                  : undefined
                              }
                              aria-label={
                                canMarkMsgSent
                                  ? 'Mark message as sent'
                                  : `Message status ${prospect.messageStatus || 'not_sent'}`
                              }
                              sx={{
                                bgcolor: msgToken.bg,
                                color: msgToken.color,
                                fontWeight: 750,
                                fontSize: '0.64rem',
                                height: 20,
                                textTransform: 'uppercase',
                                borderRadius: '6px',
                                border: `1px solid ${`color-mix(in srgb, ${msgToken.color} 12%, transparent)`}`,
                                ...(canMarkMsgSent
                                  ? {
                                      cursor: isMarkingSent ? 'wait' : 'pointer',
                                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${msgToken.color} 28%, transparent)`,
                                      '&:hover': {
                                        bgcolor: msgToken.bg,
                                        filter: 'brightness(0.96)',
                                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${msgToken.color} 45%, transparent)`,
                                      },
                                    }
                                  : {}),
                              }}
                            />
                            {prospect.messageStatus === 'follow_up' &&
                              (prospect.followUpCount ?? 0) > 0 && (
                              <Chip
                                label={`FollowUp #${prospect.followUpCount}`}
                                size="small"
                                sx={{
                                  bgcolor: messageStatusTokens.follow_up.bg,
                                  color: messageStatusTokens.follow_up.color,
                                  fontWeight: 750,
                                  fontSize: '0.64rem',
                                  height: 20,
                                  borderRadius: '6px',
                                }}
                              />
                            )}
                            {prospect.messageStatus === 'follow_up' && (
                              <Select
                                size="small"
                                displayEmpty
                                value={prospect.followUpCount || ''}
                                disabled={logFollowUp.isPending}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const number = Number(e.target.value);
                                  if (!number || number === (prospect.followUpCount ?? 0)) return;
                                  logFollowUp.mutate(
                                    { id: prospect._id, number },
                                    {
                                      onSuccess: () =>
                                        addToast({
                                          message: `FollowUp #${number} selected`,
                                          severity: 'success',
                                        }),
                                      onError: () =>
                                        addToast({
                                          message: 'Failed to update follow-up',
                                          severity: 'error',
                                        }),
                                    },
                                  );
                                }}
                                sx={{
                                  borderRadius: '8px',
                                  minWidth: 120,
                                  '& .MuiSelect-select': {
                                    py: 0.5,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                  },
                                }}
                              >
                                <MenuItem value="" disabled>
                                  <em>FollowUp #</em>
                                </MenuItem>
                                {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                                  <MenuItem key={n} value={n}>
                                    FollowUp #{n}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                            {prospect.messageStatus === 'future_lead' && prospect.futureLeadDate && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                Due {format(new Date(prospect.futureLeadDate), 'MMM d, yyyy')}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* LinkedIn message/action status */}
                        <TableCell sx={{ py: 2, borderBottom: 0 }}>
                          {prospect.linkedinMsg ? (
                            <Chip
                              label={prospect.linkedinMsg}
                              size="small"
                              sx={{
                                bgcolor: lkMsgStyle.bg,
                                color: lkMsgStyle.color,
                                fontWeight: 750,
                                fontSize: '0.66rem',
                                height: 22,
                                borderRadius: '8px',
                                border: lkMsgStyle.border,
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Assigned Representative */}
                        <TableCell sx={{ py: 2, borderBottom: 0 }}>
                          <Typography variant="body2" sx={{ color: isDarkMode ? '#fff' : tokens.text.primary, fontWeight: 700, fontSize: '0.86rem' }}>
                            {getAssignedName(prospect.assignedTo)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                            Added: {formatDate(prospect.date || prospect.createdAt)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ py: 2, borderBottom: 0, pr: 3 }}>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Tooltip title="View lead details" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenLeadDetail(String(prospect._id))}
                                sx={{
                                  color: 'text.secondary',
                                  '&:hover': {
                                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                    color: tokens.brand.primary,
                                  }
                                }}
                              >
                                <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Prospect" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleEditClick(prospect)}
                                sx={{
                                  color: 'text.secondary',
                                  '&:hover': {
                                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                    color: tokens.brand.primary,
                                  }
                                }}
                              >
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            {prospect.isQualified ? (
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                label="Qualified"
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                                  color: '#10B981',
                                  fontWeight: 700,
                                  fontSize: '0.65rem',
                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                }}
                              />
                            ) : (
                              <Tooltip title={!isElevated ? "Only managers and administrators can qualify leads." : ""} arrow>
                                <span>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={!isElevated ? <LockIcon sx={{ fontSize: '14px !important' }} /> : <StarIcon sx={{ fontSize: '14px !important' }} />}
                                    onClick={() => handleOpenQualifyConfirm(prospect._id)}
                                    disabled={!isElevated || qualifyLead.isPending}
                                    sx={{
                                      borderRadius: '20px',
                                      textTransform: 'none',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                      color: 'text.secondary',
                                      '&:hover': {
                                        bgcolor: !isElevated ? 'transparent' : tokens.brand.primary,
                                        borderColor: !isElevated ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : tokens.brand.primary,
                                        color: !isElevated ? 'text.secondary' : '#fff',
                                      },
                                      '&.Mui-disabled': {
                                        borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                                      }
                                    }}
                                  >
                                    Qualify
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {totalProspects > 0 && (
            <TablePagination
              component="div"
              count={totalProspects}
              page={page - 1}
              onPageChange={(_, newPage) => setPage(newPage + 1)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(1);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              sx={{
                mt: 1,
                borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                color: 'text.secondary',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontWeight: 600,
                  fontSize: '0.82rem',
                },
              }}
            />
          )}

          {isLeadsFetching && leadsResponse && (
            <LinearProgress sx={{ mt: -0.5, borderRadius: '0 0 12px 12px' }} />
          )}
        </Box>
      )}

      {/* Qualify a Lead Modal */}
      <Dialog
        open={isQualifyModalOpen}
        onClose={() => {
          setIsQualifyModalOpen(false);
          setSelectedLeadToQualify('');
        }}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? '#1e1b24' : '#fff',
            backgroundImage: 'none',
            minWidth: { xs: 'auto', sm: 400 },
            width: { xs: '90%', sm: 'auto' },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Qualify a Lead
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
            Move an unqualified prospect into your active pipeline.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3, pt: 2 }}>
          <FormControl fullWidth sx={filterSelectSx}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>
              SELECT PROSPECT
            </Typography>
            <Select
              value={selectedLeadToQualify}
              onChange={(e) => setSelectedLeadToQualify(e.target.value)}
              displayEmpty
              input={<OutlinedInput />}
            >
              <MenuItem value="" disabled>
                <em>Choose a prospect...</em>
              </MenuItem>
              {prospects
                .filter((p) => !p.isQualified && p.connectionStatus !== 'accepted')
                .map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {getLeadName(p)} {p.company ? `- ${p.company}` : ''}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setIsQualifyModalOpen(false);
              setSelectedLeadToQualify('');
            }}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '20px',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedLeadToQualify || qualifyLead.isPending}
            onClick={() => {
              if (selectedLeadToQualify) {
                const leadId = selectedLeadToQualify;
                setIsQualifyModalOpen(false);
                setSelectedLeadToQualify('');
                handleOpenQualifyConfirm(leadId);
              }
            }}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '20px',
              px: 3.5,
              '&:hover': { bgcolor: tokens.brand.primaryLight },
            }}
          >
            {qualifyLead.isPending ? 'Qualifying...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Qualify / Update Lead Modal */}
      {leadModalOpen && leadModalId ? (
        <QualifyEnrichModal
          open={leadModalOpen}
          leadId={leadModalId}
          mode={leadModalMode}
          onSuccess={leadModalMode === 'update' ? handleUpdateLeadSuccess : handleQualifySuccess}
          onClose={handleCloseLeadModal}
        />
      ) : null}
    </Box>
  );
};

export default SalesPage;
