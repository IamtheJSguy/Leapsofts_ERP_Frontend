import { useState, useMemo } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import { useDailyKpis, useMarkDailyKpiComplete, useMarkDailyKpiIncomplete } from '@/hooks/api/useShifts';
import { useMyKPIChangeRequests } from '@/hooks/api/useKPIChangeRequests';
import { useMyAssignments } from '@/hooks/api/usekpiTemplate';
import { useMySalesKpis } from '@/hooks/api/useSalesKpis';
import { PriorityBadge } from '@/components/kpi/PriorityBadge';
import { SalesKpiEntryCard } from '@/components/kpi/SalesKpiEntryCard';
import { KPIChangeRequestModal, type ChangeRequestModalMode } from '@/components/kpi/KPIChangeRequestModal';
import { MyChangeRequestsPanel } from '@/components/kpi/MyChangeRequestsPanel';
import { sortByPriority } from '@/lib/priorityConfig';
import { PIPELINE_METRIC_LABELS } from '@/lib/constants';
import { tokens } from '@/styles/tokens';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import type { GroupedSalesKpis, SalesKpiEntry } from '@/types';

const EMPTY_GROUPED = {
  active: [],
  overdue: [],
  done: [],
  highPriority: [],
  counts: { active: 0, overdue: 0, done: 0, highPriority: 0 },
};

const EMPTY_SALES_GROUPED: GroupedSalesKpis = {
  active: [],
  overdue: [],
  incomplete: [],
  done: [],
  counts: { active: 0, overdue: 0, incomplete: 0, done: 0 },
};

const isHighPrioritySalesKpi = (entry: SalesKpiEntry) => entry.priority === 'high' || entry.priority === 'urgent';

export const UserDailyKpisView = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [filter, setFilter] = useState<'active' | 'overdue' | 'incomplete' | 'high' | 'done' | 'requests'>('active');
  const [expandedKpiId, setExpandedKpiId] = useState<string | null>(null);
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

  const filteredKpis = useMemo(() => {
    const bucket =
      filter === 'active' ? grouped.active
      : filter === 'overdue' ? grouped.overdue
      : filter === 'high' ? grouped.highPriority
      : filter === 'done' ? grouped.done
      : [];

    return [...bucket].sort((a: any, b: any) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return sortByPriority(a, b);
    });
  }, [grouped, filter]);

  const salesKpis = useMemo(() => {
    const bucket =
      filter === 'active' ? salesGrouped.active
      : filter === 'overdue' ? salesGrouped.overdue
      : filter === 'incomplete' ? salesGrouped.incomplete
      : filter === 'high' ? salesGrouped.active.filter(isHighPrioritySalesKpi)
      : filter === 'done' ? salesGrouped.done
      : [];

    return [...bucket].sort(sortByPriority);
  }, [salesGrouped, filter]);

  const salesHighPriorityCount = useMemo(
    () => salesGrouped.active.filter(isHighPrioritySalesKpi).length,
    [salesGrouped],
  );

  const filters = [
    { id: 'active', label: 'Active', count: grouped.counts.active + salesGrouped.counts.active },
    { id: 'overdue', label: 'Overdue', count: grouped.counts.overdue + salesGrouped.counts.overdue },
    { id: 'incomplete', label: 'Incomplete', count: salesGrouped.counts.incomplete },
    { id: 'high', label: 'High priority', count: grouped.counts.highPriority + salesHighPriorityCount },
    { id: 'done', label: 'Done', count: grouped.counts.done + salesGrouped.counts.done },
    { id: 'requests', label: 'Requests', count: myRequests.length },
  ];

  const openModifyModal = (kpi: any) => {
    const name = kpi.kpiName || kpi.name || kpi.kpiId?.name || 'KPI';
    const target = kpi.targetValue ?? kpi.kpiId?.targetValue;
    const dueDate = kpi.date;
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
      ) : filteredKpis.length === 0 && salesKpis.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, py: 8 }}>
          <CheckRoundedIcon sx={{ fontSize: 32, color: tokens.semantic.success, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>All caught up</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {salesKpis.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <TrackChangesOutlinedIcon sx={{ fontSize: 16, color: tokens.brand.primary }} />
              <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sales KPIs · tracked automatically
              </Typography>
            </Box>
            {salesKpis.map((entry) => (
              <SalesKpiEntryCard key={entry._id} entry={entry} />
            ))}
          </Box>
        )}
        {filteredKpis.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {filteredKpis.map((kpi: any) => {
            const isChecked = kpi.isCompleted;
            const isKpiLoading = loadingIds.has(kpi._id);
            const isOverdue = filter === 'overdue' || grouped.overdue.some((o: any) => o._id === kpi._id);
            const canRequestChange = !!(kpi.assignmentId || kpi.kpiId);
            const pipelineMetric = kpi.pipelineMetric || kpi.kpiId?.pipelineMetric;
            const hasTarget = !kpi.kanbanCardId && (kpi.targetValue ?? kpi.kpiId?.targetValue) != null;

            return (
              <Box
                key={kpi._id}
                sx={{
                  display: 'flex', flexDirection: 'column', borderRadius: '20px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: expandedKpiId === kpi._id ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'),
                    transform: expandedKpiId === kpi._id ? 'none' : 'translateY(-2px)',
                    boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.04)'
                  },
                }}
              >
                {/* Summary Section */}
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, p: 2, pb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isKpiLoading ? (
                      <CircularProgress size={24} />
                    ) : isChecked ? (
                      <CheckCircleIcon sx={{ fontSize: 26, color: tokens.semantic.success }} />
                    ) : (
                      <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(255, 127, 17, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <TrackChangesIcon sx={{ fontSize: 20, color: tokens.brand.primary }} />
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 750, fontSize: '1rem', textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'text.disabled' : tokens.text.primary, letterSpacing: '-0.01em' }}>
                      {kpi.kpiName || kpi.name || kpi.kpiId?.name || 'Unnamed Task'}
                    </Typography>
                    <PriorityBadge priority={kpi.priority || kpi.kpiId?.priority} />
                    {hasPending(kpi) && <Chip label="Pending review" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22, bgcolor: 'rgba(245, 158, 11, 0.1)', color: tokens.semantic.warning }} />}
                    {pipelineMetric && (
                      <Chip
                        icon={<TrackChangesOutlinedIcon sx={{ fontSize: 14 }} />}
                        label={`Auto-tracked: ${PIPELINE_METRIC_LABELS[pipelineMetric] || pipelineMetric}`}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    {hasTarget ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrackChangesIcon sx={{ fontSize: 14, color: tokens.brand.primary }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.brand.primary }}>
                          {isChecked && getAttainmentLabel(kpi)
                            ? `Actual: ${getAttainmentLabel(kpi)}`
                            : `Target: ${kpi.targetValue ?? kpi.kpiId?.targetValue}${kpi.livePipelineValue != null ? ` (live: ${kpi.livePipelineValue})` : ''}`}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="Simple task" size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20, bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: 'text.secondary' }} />
                    )}
                    {kpi.date ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EventNoteIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Due {new Date(kpi.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">No due date</Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                    {isOverdue && <Chip icon={<WarningRoundedIcon />} label="Overdue" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22, bgcolor: 'rgba(239, 68, 68, 0.1)', color: tokens.semantic.error, border: 'none' }} />}
                    {canRequestChange && !isChecked && (
                      <IconButton size="small" onClick={(e) => openMenu(e, kpi)} sx={{ color: tokens.text.muted, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: tokens.text.primary } }}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                {/* Details Section */}
                <Box
                  sx={{
                    bgcolor: 'transparent'
                  }}
                >
                  <Box sx={{ p: 2, px: { xs: 2, sm: 8.5 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
                    
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {hasTarget && (
                        <Box>
                          <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {isChecked ? 'Actual / Target' : 'Target'}
                          </Typography>
                          <Typography sx={{ fontWeight: 800, color: tokens.brand.primary, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TrackChangesIcon sx={{ fontSize: 16 }} />
                            {isChecked && kpi.actualValue != null
                              ? `${kpi.actualValue} / ${kpi.targetValue ?? kpi.kpiId?.targetValue}`
                              : (kpi.targetValue ?? kpi.kpiId?.targetValue)}
                          </Typography>
                        </Box>
                      )}
                      {kpi.date && (
                        <Box>
                          <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</Typography>
                          <Typography sx={{ fontWeight: 700, color: tokens.text.secondary, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EventNoteIcon sx={{ fontSize: 16 }} /> {new Date(kpi.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Button
                      variant={isChecked ? "outlined" : "contained"}
                      color={isChecked ? "inherit" : "primary"}
                      disableElevation
                      startIcon={isChecked ? <RadioButtonUncheckedIcon /> : <CheckCircleIcon />}
                      disabled={isKpiLoading}
                      onClick={() => handleToggle(kpi, isChecked)}
                      sx={{
                        borderRadius: '12px',
                        fontWeight: 700,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        background: isChecked ? 'transparent' : `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.accentLight} 100%)`,
                        borderColor: isChecked ? tokens.surface.border : 'transparent',
                        color: isChecked ? tokens.text.secondary : '#fff',
                        boxShadow: isChecked ? 'none' : '0 4px 14px rgba(255, 127, 17, 0.25)',
                        '&:hover': {
                          background: isChecked ? 'rgba(0,0,0,0.03)' : `linear-gradient(135deg, ${tokens.brand.accentDark} 0%, ${tokens.brand.accent} 100%)`,
                          boxShadow: isChecked ? 'none' : '0 6px 20px rgba(255, 127, 17, 0.35)',
                        }
                      }}
                    >
                      {isChecked ? 'Mark as Pending' : 'Mark as Done'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
        )}
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
