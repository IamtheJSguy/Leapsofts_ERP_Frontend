import { useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, useTheme, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useDailyKpis, useMarkDailyKpiComplete, useMarkDailyKpiIncomplete } from '@/hooks/api/useShifts';
import { tokens } from '@/styles/tokens';

export const UserDailyKpisView = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [filter, setFilter] = useState<'active' | 'overdue' | 'high' | 'done'>('active');

  const { data: allKpis = [], isLoading } = useDailyKpis();

  const markComplete = useMarkDailyKpiComplete();
  const markIncomplete = useMarkDailyKpiIncomplete();
  
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const handleToggle = (id: string, isCompleted: boolean) => {
    setLoadingIds((prev) => new Set(prev).add(id));
    if (isCompleted) {
      markIncomplete.mutate(id, {
        onSettled: () => setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; })
      });
    } else {
      markComplete.mutate({ id }, {
        onSettled: () => setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next; })
      });
    }
  };

  const filteredKpis = useMemo(() => {
    return allKpis.filter((kpi: any) => {
      const isCompleted = kpi.isCompleted;
      const dueDate = new Date(kpi.date || new Date().toISOString());
      const now = new Date();
      const isPast = dueDate.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
      
      if (filter === 'done') return isCompleted;
      if (isCompleted) return false;
      if (filter === 'overdue') return isPast;
      if (filter === 'high') return isPast || (dueDate.getTime() - now.getTime() <= 172800000);
      if (filter === 'active') return !isPast;
      return true;
    });
  }, [allKpis, filter]);

  const completedCount = allKpis.filter((k: any) => k.isCompleted).length;

  const filters = [
    { id: 'active', label: 'Active', count: allKpis.filter((k: any) => !k.isCompleted && new Date(k.date || new Date()).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0)).length },
    { id: 'overdue', label: 'Overdue', count: allKpis.filter((k: any) => !k.isCompleted && new Date(k.date || new Date()).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)).length },
    { id: 'high', label: 'High priority', count: allKpis.filter((k: any) => !k.isCompleted && (new Date(k.date || new Date()).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) || (new Date(k.date || new Date()).getTime() - new Date().getTime() <= 172800000))).length },
    { id: 'done', label: 'Done', count: completedCount },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: isDarkMode ? '#fff' : tokens.text.primary,
            letterSpacing: '-0.025em',
            mb: 0.5,
          }}
        >
          My Tasks
        </Typography>
        <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary, fontWeight: 500 }}>
          Everything assigned to you across projects, tailored to your workflow.
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1.5, 
          mb: 4, 
          p: 1, 
          borderRadius: '24px', 
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)', 
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'}`,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {filters.map(f => (
          <Chip
            key={f.id}
            label={`${f.label} ${f.count}`}
            onClick={() => setFilter(f.id as any)}
            sx={{
              px: 1,
              height: 38,
              borderRadius: '12px',
              fontWeight: filter === f.id ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: filter === f.id && f.id === 'overdue' 
                ? `1px solid rgba(239, 68, 68, 0.3)` 
                : filter === f.id
                  ? `1px solid ${tokens.brand.primaryLight}`
                  : `1px solid transparent`,
              bgcolor: filter === f.id 
                ? f.id === 'overdue' ? 'rgba(239, 68, 68, 0.08)' : isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.06)'
                : 'transparent',
              color: filter === f.id 
                ? f.id === 'overdue' ? tokens.semantic.error : tokens.brand.primary
                : isDarkMode ? 'rgba(255,255,255,0.6)' : tokens.text.secondary,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: filter === f.id 
                  ? f.id === 'overdue' ? 'rgba(239, 68, 68, 0.12)' : isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.1)'
                  : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }
            }}
          />
        ))}
      </Box>

      {filteredKpis.length === 0 ? (
        <Box
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'transparent',
            border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            gap: 2,
          }}
        >
          <Box sx={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            bgcolor: 'rgba(16, 185, 129, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 1
          }}>
            <CheckRoundedIcon sx={{ fontSize: 32, color: tokens.semantic.success }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
            All caught up
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Nothing on your plate that matches this filter.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {filteredKpis.map((kpi: any) => {
            const isChecked = kpi.isCompleted;
            const isKpiLoading = loadingIds.has(kpi._id);
            const isOverdue = new Date(kpi.date || new Date()).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && !isChecked;

            return (
              <Box
                key={kpi._id}
                onClick={() => !isKpiLoading && handleToggle(kpi._id, isChecked)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1.5, sm: 3 },
                  p: 1.75,
                  px: { xs: 1.5, sm: 2.5 },
                  cursor: 'pointer',
                  borderRadius: '16px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: tokens.shadow.cardHover,
                    borderColor: tokens.brand.primary,
                  }
                }}
              >
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isKpiLoading ? (
                    <CircularProgress size={24} thickness={4} sx={{ color: tokens.brand.primary }} />
                  ) : isChecked ? (
                    <CheckCircleIcon sx={{ fontSize: 26, color: tokens.semantic.success, transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.1)' } }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 26, color: isOverdue ? tokens.semantic.error : isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', transition: 'all 0.2s ease', '&:hover': { color: tokens.brand.primary, transform: 'scale(1.1)' } }} />
                  )}
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: '1rem',
                      color: isChecked 
                        ? isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' 
                        : isDarkMode ? '#fff' : tokens.text.primary,
                      textDecoration: isChecked ? 'line-through' : 'none',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {kpi.kpiName || kpi.name || kpi.kpiId?.name || 'Unnamed Task'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mt: 0.5 }}>
                    {kpi.targetValue !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.05)', px: 1.25, py: 0.5, borderRadius: '6px', border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.3)' : 'rgba(93, 26, 137, 0.1)'}`, opacity: isChecked ? 0.6 : 1 }}>
                        <TrackChangesIcon sx={{ fontSize: 14, color: tokens.brand.primary }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, letterSpacing: '0.02em' }}>
                          Target: {kpi.targetValue}
                        </Typography>
                      </Box>
                    )}
                    
                    {kpi.date && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', px: 1.25, py: 0.5, borderRadius: '6px', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, opacity: isChecked ? 0.6 : 1 }}>
                        <EventNoteIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', letterSpacing: '0.02em' }}>
                          {new Date(kpi.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {(kpi.description || kpi.kpiId?.description) && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isChecked ? isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' : 'text.secondary',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        mt: 0.5
                      }}
                    >
                      {kpi.description || kpi.kpiId?.description}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-end', sm: 'center' }, gap: 1 }}>
                  {isOverdue && (
                    <Chip 
                      icon={<WarningRoundedIcon sx={{ fontSize: '14px !important' }} />} 
                      label="Overdue" 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(239, 68, 68, 0.1)', 
                        color: tokens.semantic.error, 
                        fontWeight: 700, 
                        fontSize: '0.7rem',
                        borderRadius: '8px' 
                      }} 
                    />
                  )}
                  {isChecked && (
                    <Chip 
                      label="Done" 
                      size="small" 
                      sx={{ 
                        bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                        color: tokens.semantic.success, 
                        fontWeight: 700, 
                        fontSize: '0.7rem',
                        borderRadius: '8px' 
                      }} 
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
