import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  useTheme,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import { useDailyKpis, useMarkDailyKpiComplete, useMarkDailyKpiIncomplete } from '@/hooks/api/useShifts';
import type { DailyKPIEntry, GroupedDailyKpis } from '@/hooks/api/useShifts';
import { useAuth } from '@/hooks/useAuth';
import { useMyKPIChangeRequests } from '@/hooks/api/useKPIChangeRequests';
import { useMyAssignments } from '@/hooks/api/usekpiTemplate';
import { useMySalesKpis } from '@/hooks/api/useSalesKpis';
import { SalesKpiEntryCard } from '@/components/kpi/SalesKpiEntryCard';
import { KPIChangeRequestModal, type ChangeRequestModalMode } from '@/components/kpi/KPIChangeRequestModal';
import { MyChangeRequestsPanel } from '@/components/kpi/MyChangeRequestsPanel';
import { KPI_PRIORITY_OPTIONS, PRIORITY_CONFIG } from '@/lib/priorityConfig';
import { tokens } from '@/styles/tokens';
import api from '@/lib/axios';
import { formatDate, formatKpiDueDate, hasDisplayableClockTime } from '@/utils/formatters';
import type { GroupedKpiCounts, GroupedSalesKpis, PriorityBucket, SalesKpiEntry, SectionCounts } from '@/types';

/** Prefer periodEnd (includes schedule endTime) over bare date. */
const resolveKpiDueAt = (kpi: { periodEnd?: string; date?: string }): string | undefined =>
  kpi.periodEnd || kpi.date;

const EMPTY_PRIORITY_BUCKET = <T,>(): PriorityBucket<T> => ({
  low: [],
  medium: [],
  high: [],
  urgent: [],
});

const EMPTY_SECTION_COUNTS: SectionCounts = { low: 0, medium: 0, high: 0, urgent: 0, total: 0 };

const EMPTY_COUNTS: GroupedKpiCounts = {
  active: EMPTY_SECTION_COUNTS,
  overdue: EMPTY_SECTION_COUNTS,
  incomplete: EMPTY_SECTION_COUNTS,
  done: EMPTY_SECTION_COUNTS,
};

const EMPTY_GROUPED: GroupedDailyKpis = {
  active: EMPTY_PRIORITY_BUCKET(),
  overdue: EMPTY_PRIORITY_BUCKET(),
  incomplete: EMPTY_PRIORITY_BUCKET(),
  done: EMPTY_PRIORITY_BUCKET(),
  counts: EMPTY_COUNTS,
};

const EMPTY_SALES_GROUPED: GroupedSalesKpis = {
  active: EMPTY_PRIORITY_BUCKET(),
  overdue: EMPTY_PRIORITY_BUCKET(),
  incomplete: EMPTY_PRIORITY_BUCKET(),
  done: EMPTY_PRIORITY_BUCKET(),
  counts: EMPTY_COUNTS,
};

/** Kanban HTML descriptions render as truncated garbage if shown raw. */
const toPlainText = (value?: string): string => {
  if (!value) return '';
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

type StatusTab = 'active' | 'overdue' | 'done' | 'incomplete' | 'requests';

export const UserDailyKpisView = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<StatusTab>('active');
  const [changeModal, setChangeModal] = useState<ChangeRequestModalMode | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuKpi, setMenuKpi] = useState<any>(null);
  const [completeDialog, setCompleteDialog] = useState<any>(null);
  const [actualValueInput, setActualValueInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const { data: grouped = EMPTY_GROUPED, isLoading } = useDailyKpis();
  const { data: salesGrouped = EMPTY_SALES_GROUPED } = useMySalesKpis();
  const { data: myRequests = [] } = useMyKPIChangeRequests();
  const { data: myAssignments = [] } = useMyAssignments();

  const markComplete = useMarkDailyKpiComplete();
  const markIncomplete = useMarkDailyKpiIncomplete();

  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAdmin && (filter === 'incomplete' || filter === 'requests')) {
      setFilter('active');
    }
  }, [isAdmin, filter]);

  const pendingKeys = useMemo(() => {
    const keys = new Set<string>();
    myRequests.filter((r) => r.status === 'pending').forEach((r) => {
      if (r.assignmentId && r.assignmentItemId) {
        keys.add(`${r.assignmentId}:${r.assignmentItemId}`);
      }
      if (r.kpiId) {
        const id = typeof r.kpiId === 'string' ? r.kpiId : r.kpiId._id;
        keys.add(`k:${id}`);
      }
    });
    return keys;
  }, [myRequests]);

  const primaryAssignmentId = myAssignments[0]?._id as string | undefined;

  const handleToggle = (kpi: any, isCompleted: boolean) => {
    if (isCompleted) {
      setLoadingIds((prev) => new Set(prev).add(kpi._id));
      markIncomplete.mutate(kpi._id, {
        onSettled: () => setLoadingIds((prev) => { const next = new Set(prev); next.delete(kpi._id); return next; }),
      });
      return;
    }
    setActualValueInput('');
    setNotesInput('');
    setCompleteDialog(kpi);
  };

  /** Kanban board tasks are done/not-done — never require a quantity. */
  const requiresQuantity = (kpi: any) => {
    if (kpi?.kanbanCardId) return false;
    const target = kpi?.targetValue ?? kpi?.kpiId?.targetValue ?? 0;
    return target > 0;
  };

  const handleCompleteSubmit = () => {
    if (!completeDialog) return;
    const parsedActual = actualValueInput === '' ? undefined : Number(actualValueInput);
    if (
      requiresQuantity(completeDialog)
      && (parsedActual === undefined || Number.isNaN(parsedActual) || parsedActual < 0)
    ) {
      return;
    }

    const id = completeDialog._id;
    setLoadingIds((prev) => new Set(prev).add(id));
    setCompleteDialog(null);
    markComplete.mutate(
      {
        id,
        actualValue: requiresQuantity(completeDialog) ? parsedActual : undefined,
        notes: notesInput || undefined,
      },
      {
        onSettled: () => setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; }),
      },
    );
  };

  const getAttainmentLabel = (kpi: any) => {
    if (kpi?.kanbanCardId) return null;
    const target = kpi.targetValue ?? kpi.kpiId?.targetValue ?? 0;
    const actual = kpi.actualValue ?? 0;
    if (!kpi.isCompleted || target <= 0) return null;
    const rate = Math.round((actual / target) * 100);
    return `${actual} / ${target} (${rate}%)`;
  };

  const boardColumns = useMemo(() => {
    if (filter === 'requests') return null;
    const dailySection = grouped[filter] ?? EMPTY_PRIORITY_BUCKET<DailyKPIEntry>();
    const salesSection = salesGrouped[filter] ?? EMPTY_PRIORITY_BUCKET<SalesKpiEntry>();
    return [...KPI_PRIORITY_OPTIONS].reverse().map((priority) => ({
      priority,
      daily: dailySection[priority] ?? [],
      sales: salesSection[priority] ?? [],
    }));
  }, [grouped, salesGrouped, filter]);

  const boardIsEmpty = useMemo(() => {
    if (!boardColumns) return true;
    return boardColumns.every((col) => col.daily.length === 0 && col.sales.length === 0);
  }, [boardColumns]);

  const filters: { id: StatusTab; label: string; count: number }[] = [
    { id: 'active', label: 'Active', count: grouped.counts.active.total + salesGrouped.counts.active.total },
    { id: 'overdue', label: 'Overdue', count: grouped.counts.overdue.total + salesGrouped.counts.overdue.total },
    { id: 'done', label: 'Done', count: grouped.counts.done.total + salesGrouped.counts.done.total },
    ...(!isAdmin
      ? [
          { id: 'incomplete' as const, label: 'Incomplete', count: salesGrouped.counts.incomplete.total },
          { id: 'requests' as const, label: 'Requests', count: myRequests.length },
        ]
      : []),
  ];

  const openModifyModal = (kpi: any) => {
    const name = kpi.kpiName || kpi.name || kpi.kpiId?.name || 'KPI';
    const target = kpi.targetValue ?? kpi.kpiId?.targetValue;
    const dueDate = resolveKpiDueAt(kpi);
    const priority = kpi.priority || kpi.kpiId?.priority || 'medium';

    if (kpi.assignmentId) {
      const assignmentId = typeof kpi.assignmentId === 'string' ? kpi.assignmentId : kpi.assignmentId._id;
      setChangeModal({
        sourceType: 'assignment',
        type: 'modify',
        assignmentId,
        assignmentItemId: kpi.assignmentItemId,
        kpiName: name,
        currentTargetValue: target,
        currentDueDate: dueDate,
        currentPriority: priority,
      });
    } else if (kpi.kpiId) {
      const kpiId = typeof kpi.kpiId === 'string' ? kpi.kpiId : kpi.kpiId._id;
      setChangeModal({
        sourceType: 'standalone',
        type: 'modify',
        kpiId,
        kpiName: name,
        currentTargetValue: target,
        currentDueDate: dueDate,
        currentPriority: priority,
      });
    }
  };

  const openRemoveModal = (kpi: any) => {
    if (!kpi.assignmentId || !kpi.assignmentItemId) return;
    const assignmentId = typeof kpi.assignmentId === 'string' ? kpi.assignmentId : kpi.assignmentId._id;
    const name = kpi.kpiName || kpi.name || 'KPI';
    setChangeModal({
      sourceType: 'assignment',
      type: 'remove',
      assignmentId,
      assignmentItemId: kpi.assignmentItemId,
      kpiName: name,
    });
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, kpi: any) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuKpi(kpi);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuKpi(null);
  };

  const hasPending = (kpi: any) => {
    if (kpi.assignmentId && kpi.assignmentItemId) {
      const assignmentId = typeof kpi.assignmentId === 'string' ? kpi.assignmentId : kpi.assignmentId._id;
      return pendingKeys.has(`${assignmentId}:${kpi.assignmentItemId}`);
    }
    if (kpi.kpiId) {
      const id = typeof kpi.kpiId === 'string' ? kpi.kpiId : kpi.kpiId._id;
      return pendingKeys.has(`k:${id}`);
    }
    return false;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.025em', mb: 0.5 }}>
            My Tasks
          </Typography>
          <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary, fontWeight: 500 }}>
            Everything assigned to you across projects, tailored to your workflow.
          </Typography>
        </Box>
        {primaryAssignmentId && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setChangeModal({ sourceType: 'assignment', type: 'add', assignmentId: primaryAssignmentId })}
            sx={{ textTransform: 'none', borderRadius: '12px' }}
          >
            Request Add KPI
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 4, p: 1, borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)', overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
        {filters.map((f) => (
          <Chip
            key={f.id}
            label={`${f.label} ${f.count}`}
            onClick={() => setFilter(f.id as typeof filter)}
            sx={{
              px: 1, height: 38, borderRadius: '12px', fontWeight: filter === f.id ? 800 : 600, fontSize: '0.9rem', cursor: 'pointer',
              bgcolor: filter === f.id ? (isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.06)') : 'transparent',
              color: filter === f.id ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.6)' : tokens.text.secondary),
            }}
          />
        ))}
      </Box>

      {filter === 'requests' ? (
        <MyChangeRequestsPanel />
      ) : boardIsEmpty ? (
        <Box sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, py: 8 }}>
          <CheckRoundedIcon sx={{ fontSize: 32, color: tokens.semantic.success, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>All caught up</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            alignItems: 'start',
            width: '100%',
            minWidth: 0,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(4, minmax(0, 1fr))',
            },
            pb: 1,
          }}
        >
          {boardColumns?.map((col) => {
            const colCount = col.daily.length + col.sales.length;
            return (
            <Box
              key={col.priority}
              sx={{
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                minHeight: { xs: 0, sm: 180 },
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                p: 1.25,
                overflow: 'hidden',
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : tokens.semantic.neutralBg,
                border: `1px solid ${PRIORITY_CONFIG[col.priority].border}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.25 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontVariantNumeric: 'tabular-nums',
                    color: PRIORITY_CONFIG[col.priority].color,
                  }}
                >
                  {PRIORITY_CONFIG[col.priority].label}
                </Typography>
                <Chip
                  size="small"
                  label={colCount}
                  sx={{ height: 20, fontWeight: 700, fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums' }}
                />
              </Box>
              {colCount === 0 && (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                  <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 500 }}>
                    No tasks
                  </Typography>
                </Box>
              )}
              {col.sales.map((entry) => {
                let kanbanLink = null;
                const kId = (entry as any).kanbanCardId;
                if (kId) {
                  const isObj = typeof kId === 'object';
                  const cardId = isObj ? kId._id : kId;
                  const boardId = isObj ? kId.boardId : (entry as any).boardId;
                  const projectId = isObj ? (kId.projectId || kId.boardId) : ((entry as any).projectId || (entry as any).boardId);
                  if (boardId && cardId) {
                    kanbanLink = `/projects/${projectId || boardId}/boards/${boardId}?card=${cardId}`;
                  }
                }
                const hasKanbanLink = Boolean(kId);

                return (
                <Box 
                  key={entry._id} 
                  onClick={hasKanbanLink ? async (e) => {
                    e.stopPropagation();
                    if (kanbanLink) {
                      navigate(kanbanLink);
                    } else {
                      try {
                        const cardId = typeof kId === 'object' ? kId._id : kId;
                        const res = await api.get(`/kanban/cards/${cardId}`);
                        const card = res.data.data;
                        if (card && card.boardId) {
                          navigate(`/projects/${card.projectId || card.boardId}/boards/${card.boardId}?card=${card._id}`);
                        }
                      } catch (err) {
                        console.error('Could not route to kanban card', err);
                      }
                    }
                  } : undefined}
                  sx={{ 
                    minWidth: 0, 
                    maxWidth: '100%', 
                    overflow: 'hidden',
                    cursor: hasKanbanLink ? 'pointer' : 'default',
                    borderRadius: `${tokens.radius.md}px`,
                    transition: 'all 0.2s ease',
                    '&:hover': hasKanbanLink ? {
                      boxShadow: tokens.shadow.cardHover,
                      transform: 'translateY(-2px)'
                    } : {},
                  }}
                >
                  <SalesKpiEntryCard entry={entry} variant="board" />
                </Box>
                );
              })}
              {col.daily.map((kpi) => {
            const isChecked = kpi.isCompleted;
            const isKpiLoading = loadingIds.has(kpi._id);
            const isOverdue = filter === 'overdue';
            const canRequestChange = !!(kpi.assignmentId || kpi.kpiId);
            const hasTarget = !kpi.kanbanCardId && (kpi.targetValue ?? kpi.kpiId?.targetValue) != null;
            const dueAt = resolveKpiDueAt(kpi);
            const includeTime = !!(
              (kpi.periodEnd && hasDisplayableClockTime(kpi.periodEnd)) ||
              (!kpi.periodEnd && kpi.date && hasDisplayableClockTime(kpi.date))
            );
            const dueLabel = dueAt ? formatKpiDueDate(dueAt, { includeTime }) : null;
            const assignedAt =
              kpi.kanbanCardId && typeof kpi.kanbanCardId === 'object'
                ? (kpi.kanbanCardId as { assignedAt?: string }).assignedAt
                : undefined;
            const description = toPlainText(
              kpi.description || kpi.kpiId?.description || kpi.kanbanCardId?.description,
            );
            const title = kpi.kpiName || kpi.name || kpi.kpiId?.name || 'Unnamed Task';
            const statusChip = isOverdue
              ? { label: 'Overdue', bgcolor: tokens.semantic.errorBg, color: tokens.semantic.error }
              : isChecked
                ? { label: 'Done', bgcolor: tokens.semantic.successBg, color: tokens.semantic.success }
                : hasPending(kpi)
                  ? { label: 'Pending', bgcolor: tokens.semantic.warningBg, color: tokens.semantic.warning }
                  : null;
            let kanbanLink = null;
            if (kpi.kanbanCardId) {
              const kId = kpi.kanbanCardId;
              const isObj = typeof kId === 'object';
              const cardId = isObj ? (kId as any)._id : kId;
              const boardId = isObj ? (kId as any).boardId : (kpi as any).boardId;
              const projectId = isObj ? ((kId as any).projectId || (kId as any).boardId) : ((kpi as any).projectId || (kpi as any).boardId);
              if (boardId && cardId) {
                kanbanLink = `/projects/${projectId || boardId}/boards/${boardId}?card=${cardId}`;
              }
            }
            const hasKanbanLink = Boolean(kpi.kanbanCardId);

            return (
              <Box
                key={kpi._id}
                onClick={hasKanbanLink ? async (e) => {
                  e.stopPropagation();
                  if (kanbanLink) {
                    navigate(kanbanLink);
                  } else {
                    try {
                      const kId = kpi.kanbanCardId;
                      const cardId = typeof kId === 'object' ? (kId as any)._id : kId;
                      const res = await api.get(`/kanban/cards/${cardId}`);
                      const card = res.data.data;
                      if (card && card.boardId) {
                        navigate(`/projects/${card.projectId || card.boardId}/boards/${card.boardId}?card=${card._id}`);
                      }
                    } catch (err) {
                      console.error('Could not route to kanban card', err);
                    }
                  }
                } : undefined}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  px: 1.25,
                  py: 1,
                  minWidth: 0,
                  maxWidth: '100%',
                  minHeight: 72,
                  borderRadius: `${tokens.radius.md}px`,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : tokens.surface.border}`,
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : tokens.surface.card,
                  boxShadow: tokens.shadow.card,
                  cursor: hasKanbanLink ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  '&:hover': hasKanbanLink ? {
                    boxShadow: tokens.shadow.cardHover,
                    transform: 'translateY(-2px)'
                  } : {},
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    title={title}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontWeight: 650,
                      fontSize: '0.875rem',
                      lineHeight: 1.25,
                      textDecoration: isChecked ? 'line-through' : 'none',
                      color: isChecked ? 'text.disabled' : tokens.text.primary,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {title}
                  </Typography>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, alignSelf: 'center' }}
                  >
                    <Button
                      size="small"
                      aria-label={isChecked ? 'Mark as pending' : 'Mark as done'}
                      disabled={isKpiLoading}
                      onClick={() => handleToggle(kpi, isChecked)}
                      startIcon={
                        isKpiLoading ? (
                          <CircularProgress size={12} sx={{ color: 'inherit' }} />
                        ) : isChecked ? (
                          <RadioButtonUncheckedIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <CheckRoundedIcon sx={{ fontSize: 14 }} />
                        )
                      }
                      sx={{
                        minWidth: 0,
                        height: 26,
                        px: 0.75,
                        py: 0,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        lineHeight: 1,
                        borderRadius: `${tokens.radius.sm}px`,
                        ...(isChecked
                          ? {
                              bgcolor: 'rgba(45, 138, 94, 0.12)',
                              color: tokens.semantic.success,
                              border: '1px solid rgba(45, 138, 94, 0.28)',
                              '&:hover': {
                                bgcolor: 'rgba(45, 138, 94, 0.20)',
                                color: tokens.semantic.success,
                                borderColor: 'rgba(45, 138, 94, 0.40)',
                              },
                            }
                          : {
                              bgcolor: 'rgba(255, 127, 17, 0.16)',
                              color: tokens.brand.accentDark,
                              border: '1px solid transparent',
                              '&:hover': {
                                bgcolor: 'rgba(255, 127, 17, 0.28)',
                                color: tokens.brand.accentDark,
                              },
                            }),
                        '& .MuiButton-startIcon': { mr: 0.35, ml: 0 },
                        '&.Mui-disabled': { opacity: 0.65 },
                      }}
                    >
                      {isChecked ? 'Undo' : 'Done'}
                    </Button>
                    {canRequestChange && !isChecked && (
                      <IconButton
                        size="small"
                        aria-label="More actions"
                        onClick={(e) => openMenu(e, kpi)}
                        sx={{ width: 28, height: 28, color: tokens.text.muted, '&:hover': { color: tokens.text.primary } }}
                      >
                        <MoreVertIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, pr: 0.5 }}>
                  <Typography
                    variant="caption"
                    noWrap
                    title={dueLabel ?? undefined}
                    sx={{
                      color: dueLabel ? tokens.text.secondary : 'text.disabled',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: 0,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {dueLabel ?? 'No due date'}
                  </Typography>
                  {statusChip && (
                    <Chip
                      label={statusChip.label}
                      size="small"
                      sx={{
                        flexShrink: 0,
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20,
                        bgcolor: statusChip.bgcolor,
                        color: statusChip.color,
                      }}
                    />
                  )}
                </Box>

                {(description.length >= 8 || hasTarget || assignedAt) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 0.5 }}>
                    {description.length >= 8 && (
                      <Typography
                        variant="caption"
                        title={description}
                        sx={{
                          color: tokens.text.secondary,
                          fontWeight: 500,
                          lineHeight: 1.45,
                          minWidth: 0,
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {description}
                      </Typography>
                    )}
                    {hasTarget && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 650,
                          color: tokens.brand.primary,
                          minWidth: 0,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {isChecked && getAttainmentLabel(kpi)
                          ? getAttainmentLabel(kpi)
                          : `Target: ${kpi.targetValue ?? kpi.kpiId?.targetValue}${kpi.livePipelineValue != null ? ` (live: ${kpi.livePipelineValue})` : ''}`}
                      </Typography>
                    )}
                    {assignedAt && (
                      <Typography variant="caption" sx={{ color: tokens.text.muted }}>
                        Assigned {formatDate(assignedAt)}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            );
              })}
            </Box>
            );
          })}
        </Box>
      )}

      <Menu 
        anchorEl={menuAnchor} 
        open={Boolean(menuAnchor)} 
        onClose={closeMenu}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1,
            p: 1,
            borderRadius: '16px',
            minWidth: 180,
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            /* backdropFilter: 'blur(24px)' (removed for performance) */
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: isDarkMode 
              ? '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' 
              : '0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => { if (menuKpi) openModifyModal(menuKpi); closeMenu(); }}
          sx={{ borderRadius: '10px', py: 1, mb: 0.5, transition: 'all 0.2s', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}><EditNoteIcon fontSize="small" sx={{ color: tokens.text.secondary }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 650, color: tokens.text.primary }}>Request Change</ListItemText>
        </MenuItem>
        {menuKpi?.assignmentId && menuKpi?.assignmentItemId && (
          <MenuItem 
            onClick={() => { openRemoveModal(menuKpi); closeMenu(); }}
            sx={{ borderRadius: '10px', py: 1, transition: 'all 0.2s', '&:hover': { bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)' } }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}><RemoveCircleOutlineIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: 650, color: tokens.semantic.error }}>Request Remove</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <KPIChangeRequestModal open={!!changeModal} mode={changeModal} onClose={() => setChangeModal(null)} />

      <Dialog
        open={!!completeDialog}
        onClose={() => setCompleteDialog(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Mark KPI as Done
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {completeDialog?.kpiName || completeDialog?.name || completeDialog?.kpiId?.name || 'KPI'}
          </Typography>
          {requiresQuantity(completeDialog) && (
            <>
              <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.text.muted }}>
                Target: {completeDialog?.targetValue ?? completeDialog?.kpiId?.targetValue}
              </Typography>
              <TextField
                label="Actual amount achieved"
                type="number"
                required
                inputProps={{ min: 0 }}
                value={actualValueInput}
                onChange={(e) => setActualValueInput(e.target.value)}
                fullWidth
                autoFocus
              />
            </>
          )}
          <TextField
            label="Notes (optional)"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            autoFocus={!requiresQuantity(completeDialog)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCompleteDialog(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCompleteSubmit}
            disabled={
              requiresQuantity(completeDialog)
              && (actualValueInput === '' || Number.isNaN(Number(actualValueInput)) || Number(actualValueInput) < 0)
            }
            sx={{ textTransform: 'none' }}
          >
            Complete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
