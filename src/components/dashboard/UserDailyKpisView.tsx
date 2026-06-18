import React from 'react';
import { Box, Typography, Card, LinearProgress, CircularProgress, useTheme } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import { useDailyKpis, useMarkDailyKpiComplete, useMarkDailyKpiIncomplete } from '@/hooks/api/useShifts';
import { tokens } from '@/styles/tokens';

export const UserDailyKpisView = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Use local date for querying today's KPIs
  const today = new Date().toISOString().split('T')[0];
  
  const { data: dailyKpis = [], isLoading } = useDailyKpis(today);

  const markComplete = useMarkDailyKpiComplete();
  const markIncomplete = useMarkDailyKpiIncomplete();
  
  const [loadingIds, setLoadingIds] = React.useState<Set<string>>(new Set());

  const completedCount = dailyKpis.filter((k) => k.isCompleted).length;
  
  const totalCount = dailyKpis.length;

  const progressPercent = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100) 
    : 0;

  const handleToggle = (id: string, isCompleted: boolean) => {
    setLoadingIds((prev) => new Set(prev).add(id));

    if (isCompleted) {
      markIncomplete.mutate(id, {
        onSettled: () => {
          setLoadingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      });
    } else {
      markComplete.mutate({ id }, {
        onSettled: () => {
          setLoadingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      });
    }
  };

  if (isLoading) {
    return <Box sx={{ p: 4 }}><LinearProgress /></Box>;
  }

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      {/* Premium Summary Header */}
      <Card
        sx={{
          mb: 4,
          p: 4,
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)'}`,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${tokens.brand.primary} 0%, ${tokens.brand.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5
              }}
            >
              Today's Targets
            </Typography>
            <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, fontWeight: 500 }}>
              {progressPercent === 100 ? "Amazing work! You've crushed all your daily goals. 🎉" : "Stay focused! Check off your targets as you complete them."}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: tokens.brand.primary, lineHeight: 1 }}>
              {progressPercent}%
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.brand.accent }}>
              {completedCount} / {totalCount} Completed
            </Typography>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            mt: 2,
            height: 12,
            borderRadius: 6,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${tokens.brand.primary} 0%, ${tokens.brand.accent} 100%)`,
              borderRadius: 6,
            },
          }}
        />
      </Card>

      {/* KPI List items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {dailyKpis.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: '24px', bgcolor: 'transparent', border: '1px dashed rgba(155, 107, 184, 0.4)' }}>
            <Typography variant="h6" sx={{ color: tokens.text.muted }}>No daily KPIs generated for today.</Typography>
          </Card>
        ) : (
          dailyKpis.map((kpi: any) => {
            const isChecked = kpi.isCompleted;
            const isLoading = loadingIds.has(kpi._id);

            return (
              <Box
                key={kpi._id}
                onClick={() => {
                  if (!isLoading) handleToggle(kpi._id, isChecked);
                }}
                sx={{
                  p: 2.5,
                  pr: 4,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  bgcolor: isChecked
                    ? isDarkMode ? 'rgba(45, 138, 94, 0.05)' : 'rgba(16, 185, 129, 0.04)'
                    : isDarkMode ? 'rgba(30, 27, 36, 0.7)' : '#ffffff',
                  border: `1px solid ${
                    isChecked
                      ? isDarkMode ? 'rgba(45, 138, 94, 0.3)' : 'rgba(16, 185, 129, 0.4)'
                      : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                  }`,
                  boxShadow: isChecked 
                    ? 'none' 
                    : isDarkMode ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Custom Animated Circular Checkbox */}
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: isChecked || isLoading ? 'none' : `2px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                    background: isLoading 
                      ? 'transparent'
                      : isChecked 
                        ? `linear-gradient(135deg, #10B981 0%, #059669 100%)` 
                        : 'transparent',
                    boxShadow: isChecked && !isLoading ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLoading) handleToggle(kpi._id, isChecked);
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={16} thickness={5} sx={{ color: tokens.brand.primary }} />
                  ) : (
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        opacity: isChecked ? 1 : 0,
                        transform: isChecked ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-45deg)',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s',
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </Box>
                  )}
                </Box>
                <Box sx={{ flexGrow: 1, zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: isChecked 
                          ? isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' 
                          : isDarkMode ? '#ffffff' : tokens.text.primary,
                        textDecoration: isChecked ? 'line-through' : 'none',
                        transition: 'all 0.3s ease',
                        mb: 0.25,
                      }}
                    >
                      {kpi.kpiName || kpi.name || kpi.kpiId?.name || 'Unnamed KPI'}
                    </Typography>
                    
                    {(kpi.description || kpi.kpiId?.description) && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: isChecked 
                            ? isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' 
                            : 'text.secondary',
                          fontWeight: 400,
                          textDecoration: isChecked ? 'line-through' : 'none',
                          transition: 'all 0.3s ease',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {kpi.description || kpi.kpiId?.description}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'right', pl: 2, borderLeft: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                    <Typography 
                      variant="overline" 
                      sx={{ 
                        lineHeight: 1, 
                        display: 'block', 
                        color: 'text.secondary', 
                        fontWeight: 600, 
                        letterSpacing: '0.05em',
                        mb: 0.5
                      }}
                    >
                      TARGET
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        lineHeight: 1, 
                        fontWeight: 800, 
                        color: isChecked ? tokens.semantic.success : tokens.brand.primary,
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {kpi.targetValue || kpi.kpiId?.targetValue || 0}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    right: -20,
                    top: -20,
                    opacity: isChecked ? 0.08 : 0,
                    transform: isChecked ? 'scale(1)' : 'scale(0.5)',
                    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    pointerEvents: 'none',
                  }}
                >
                  <ShieldIcon sx={{ color: tokens.semantic.success, fontSize: 120 }} />
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};
