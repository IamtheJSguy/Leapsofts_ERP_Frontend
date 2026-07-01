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
import { PriorityBadge } from '@/components/kpi/PriorityBadge';
import { KPIChangeRequestModal, type ChangeRequestModalMode } from '@/components/kpi/KPIChangeRequestModal';
import { MyChangeRequestsPanel } from '@/components/kpi/MyChangeRequestsPanel';
import { sortByPriority } from '@/lib/priorityConfig';
import { tokens } from '@/styles/tokens';
import type { KpiTimeframe } from '@/types';

const EMPTY_GROUPED = {
  active: [],
  overdue: [],
  done: [],
  highPriority: [],
  counts: { active: 0, overdue: 0, done: 0, highPriority: 0 },
};

const formatDateRange = (start?: string, end?: string) => {
  if (!start || !end) return null;
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
};

export const UserDailyKpisView = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [filter, setFilter] = useState<'active' | 'overdue' | 'high' | 'done' | 'requests'>('active');
  const [expandedKpiId, setExpandedKpiId] = useState<string | null>(null);
  const [changeModal, setChangeModal] = useState<ChangeRequestModalMode | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuKpi, setMenuKpi] = useState<any>(null);

  const { data: grouped = EMPTY_GROUPED, isLoading } = useDailyKpis();
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

  const handleToggle = (id: string, isCompleted: boolean) => {
    setLoadingIds((prev) => new Set(prev).add(id));
    if (isCompleted) {
      markIncomplete.mutate(id, {
        onSettled: () => setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; }),
      });
    } else {
      markComplete.mutate({ id }, {
        onSettled: () => setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; }),
      });
    }
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

  const filters = [
    { id: 'active', label: 'Active', count: grouped.counts.active },
    { id: 'overdue', label: 'Overdue', count: grouped.counts.overdue },
    { id: 'high', label: 'High priority', count: grouped.counts.highPriority },
    { id: 'done', label: 'Done', count: grouped.counts.done },
    { id: 'requests', label: 'Requests', count: myRequests.length },
  ];

  const openModifyModal = (kpi: any) => {
    const name = kpi.kpiName || kpi.name || kpi.kpiId?.name || 'KPI';
    const target = kpi.targetValue ?? kpi.kpiId?.targetValue ?? 0;
    const timeFrame = (kpi.timeFrame || kpi.kpiId?.timeFrame || 'daily') as KpiTimeframe;
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
        currentTimeFrame: timeFrame,
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
        currentTimeFrame: timeFrame,
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
      ) : filteredKpis.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', borderRadius: '24px', border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, py: 8 }}>
          <CheckRoundedIcon sx={{ fontSize: 32, color: tokens.semantic.success, mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>All caught up</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {filteredKpis.map((kpi: any) => {
            const isChecked = kpi.isCompleted;
            const isKpiLoading = loadingIds.has(kpi._id);
            const isOverdue = filter === 'overdue' || grouped.overdue.some((o: any) => o._id === kpi._id);
            const canRequestChange = !!(kpi.assignmentId || kpi.kpiId);
            const periodRange = formatDateRange(kpi.periodStart, kpi.periodEnd);
            const timeFrame = kpi.timeFrame || kpi.kpiId?.timeFrame;

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
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    {kpi.targetValue !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrackChangesIcon sx={{ fontSize: 14, color: tokens.brand.primary }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.brand.primary }}>Target: {kpi.targetValue}</Typography>
                      </Box>
                    )}
                    {periodRange ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EventNoteIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {periodRange}
                          {timeFrame && timeFrame !== 'daily' ? ` · ${timeFrame}` : ''}
                        </Typography>
                      </Box>
                    ) : kpi.date ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EventNoteIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(kpi.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Typography>
                      </Box>
                    ) : null}
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
                      {kpi.targetValue !== undefined && (
                        <Box>
                          <Typography variant="caption" sx={{ color: tokens.text.muted, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</Typography>
                          <Typography sx={{ fontWeight: 800, color: tokens.brand.primary, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TrackChangesIcon sx={{ fontSize: 16 }} /> {kpi.targetValue}
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
                      onClick={() => handleToggle(kpi._id, isChecked)}
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
            backdropFilter: 'blur(24px)',
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
    </Box>
  );
};
