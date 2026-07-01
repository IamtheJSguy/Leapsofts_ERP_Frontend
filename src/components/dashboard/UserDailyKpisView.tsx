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

const isHighPriority = (priority?: string) =>
  priority === 'urgent' || priority === 'high';

export const UserDailyKpisView = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [filter, setFilter] = useState<'active' | 'overdue' | 'high' | 'done' | 'requests'>('active');
  const [changeModal, setChangeModal] = useState<ChangeRequestModalMode | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuKpi, setMenuKpi] = useState<any>(null);

  const { data: allKpis = [], isLoading } = useDailyKpis();
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

  const sortedKpis = useMemo(() => {
    return [...allKpis].sort((a: any, b: any) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return sortByPriority(a, b);
    });
  }, [allKpis]);

  const filteredKpis = useMemo(() => {
    return sortedKpis.filter((kpi: any) => {
      const isCompleted = kpi.isCompleted;
      const dueDate = new Date(kpi.date || new Date().toISOString());
      const isPast = dueDate.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

      if (filter === 'done') return isCompleted;
      if (isCompleted) return false;
      if (filter === 'overdue') return isPast;
      if (filter === 'high') return isHighPriority(kpi.priority);
      if (filter === 'active') return !isPast;
      return true;
    });
  }, [sortedKpis, filter]);

  const completedCount = allKpis.filter((k: any) => k.isCompleted).length;

  const filters = [
    { id: 'active', label: 'Active', count: allKpis.filter((k: any) => !k.isCompleted && new Date(k.date || new Date()).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)).length },
    { id: 'overdue', label: 'Overdue', count: allKpis.filter((k: any) => !k.isCompleted && new Date(k.date || new Date()).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)).length },
    { id: 'high', label: 'High priority', count: allKpis.filter((k: any) => !k.isCompleted && isHighPriority(k.priority)).length },
    { id: 'done', label: 'Done', count: completedCount },
    { id: 'requests', label: 'Requests', count: myRequests.length },
  ];

  const openModifyModal = (kpi: any) => {
    const name = kpi.kpiName || kpi.name || kpi.kpiId?.name || 'KPI';
    const target = kpi.targetValue ?? kpi.kpiId?.targetValue ?? 0;
    const timeFrame = (kpi.kpiId?.timeFrame || 'daily') as KpiTimeframe;
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
            const isOverdue = new Date(kpi.date || new Date()).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) && !isChecked;
            const canRequestChange = !!(kpi.assignmentId || kpi.kpiId);

            return (
              <Box
                key={kpi._id}
                onClick={() => !isKpiLoading && handleToggle(kpi._id, isChecked)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 3 }, p: 1.75, cursor: 'pointer', borderRadius: '16px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  '&:hover': { borderColor: tokens.brand.primary },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isKpiLoading ? (
                    <CircularProgress size={24} />
                  ) : isChecked ? (
                    <CheckCircleIcon sx={{ fontSize: 26, color: tokens.semantic.success }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 26, color: isOverdue ? tokens.semantic.error : 'text.disabled' }} />
                  )}
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'text.disabled' : 'text.primary' }}>
                      {kpi.kpiName || kpi.name || kpi.kpiId?.name || 'Unnamed Task'}
                    </Typography>
                    <PriorityBadge priority={kpi.priority || kpi.kpiId?.priority} />
                    {hasPending(kpi) && <Chip label="Pending review" size="small" color="warning" />}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    {kpi.targetValue !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrackChangesIcon sx={{ fontSize: 14, color: tokens.brand.primary }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.brand.primary }}>Target: {kpi.targetValue}</Typography>
                      </Box>
                    )}
                    {kpi.date && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EventNoteIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(kpi.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                  {isOverdue && <Chip icon={<WarningRoundedIcon />} label="Overdue" size="small" color="error" variant="outlined" />}
                  {canRequestChange && !isChecked && (
                    <IconButton size="small" onClick={(e) => openMenu(e, kpi)} title="KPI options">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
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
