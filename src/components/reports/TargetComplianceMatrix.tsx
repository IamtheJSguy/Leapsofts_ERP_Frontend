import { useMemo } from 'react';
import { Box, Typography, Tooltip, Avatar } from '@mui/material';
import { format, subDays, addDays } from 'date-fns';
import { tokens } from '@/styles/tokens';

interface TargetComplianceMatrixProps {
  mode: 'individual' | 'team';
  selectedAgentId?: string;
  selectedAgentName?: string;
  agents?: any[];
}

export const TargetComplianceMatrix = ({
  mode,
  selectedAgentId,
  selectedAgentName = 'Agent',
  agents = [],
}: TargetComplianceMatrixProps) => {
  
  // 1. Generate Individual Year-View Data (53 weeks * 7 days)
  const individualWeeks = useMemo(() => {
    if (mode !== 'individual') return [];
    
    const data = [];
    const seed = selectedAgentId
      ? selectedAgentId.charCodeAt(0) + selectedAgentId.charCodeAt(selectedAgentId.length - 1)
      : 42;
      
    const totalDays = 53 * 7;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const alignDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // align to Monday
    const startDate = subDays(today, totalDays - 1 - alignDays);

    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i);
      
      if (date > today) {
        // Future placeholders
        data.push({ date, target: 0, actual: 0, status: 'none', isFuture: true });
        continue;
      }

      const dayOfWeekVal = date.getDay();
      const isWeekend = dayOfWeekVal === 0 || dayOfWeekVal === 6;
      
      if (isWeekend) {
        // weekends usually have no targets assigned
        data.push({ date, target: 0, actual: 0, status: 'none', isFuture: false });
        continue;
      }

      // Generate target & actual performance
      const target = 20;
      const randomVal = Math.sin(i * 0.2 + seed) * 0.5 + 0.5; // 0 to 1
      
      let actual = 20;
      let status: 'met' | 'partial' | 'missed' = 'met';

      if (randomVal < 0.25) {
        actual = 0;
        status = 'missed';
      } else if (randomVal < 0.55) {
        actual = Math.round(target * (0.5 + randomVal * 0.4)); // e.g. 10 to 18
        status = 'partial';
      } else {
        actual = target;
        status = 'met';
      }

      data.push({
        date,
        target,
        actual,
        status,
        isFuture: false,
      });
    }

    const list = [];
    for (let w = 0; w < 53; w++) {
      list.push(data.slice(w * 7, (w + 1) * 7));
    }
    return list;
  }, [mode, selectedAgentId]);

  // 2. Generate Team 30-Day Grid Data
  const teamComplianceData = useMemo(() => {
    if (mode !== 'team') return [];

    const today = new Date();
    
    return agents.map((agent) => {
      const seed = agent._id.charCodeAt(0) + agent._id.charCodeAt(agent._id.length - 1);
      const days = [];

      for (let i = 29; i >= 0; i--) {
        const date = subDays(today, i);
        const dayOfWeekVal = date.getDay();
        const isWeekend = dayOfWeekVal === 0 || dayOfWeekVal === 6;

        if (isWeekend) {
          days.push({ date, target: 0, actual: 0, status: 'none' });
          continue;
        }

        const target = 20;
        const randomVal = Math.sin(i * 0.3 + seed) * 0.5 + 0.5;
        
        let actual = 20;
        let status: 'met' | 'partial' | 'missed' = 'met';

        if (randomVal < 0.2) {
          actual = 0;
          status = 'missed';
        } else if (randomVal < 0.5) {
          actual = Math.round(target * (0.6 + randomVal * 0.3));
          status = 'partial';
        } else {
          actual = target;
          status = 'met';
        }

        days.push({
          date,
          target,
          actual,
          status,
        });
      }

      return {
        ...agent,
        days,
      };
    });
  }, [mode, agents]);

  const getCellColor = (status: string, isFuture?: boolean) => {
    if (isFuture) return '#FAF9FC';
    switch (status) {
      case 'met':
        return tokens.semantic.success;
      case 'partial':
        return tokens.brand.accent;
      case 'missed':
        return tokens.semantic.error;
      default:
        return '#F3F1EE'; // none / grey
    }
  };

  const getTooltipTitle = (day: any) => {
    if (day.isFuture) return 'Future date';
    if (day.status === 'none') {
      return `${format(day.date, 'MMM d, yyyy')}: No target assigned`;
    }
    const rate = Math.round((day.actual / day.target) * 100);
    const statusText =
      day.status === 'met'
        ? 'All Targets Met'
        : day.status === 'partial'
        ? 'Partially Met'
        : 'Targets Missed';
    return `${format(day.date, 'MMM d, yyyy')} • ${statusText} • Actual: ${day.actual}/${day.target} Connections (${rate}%)`;
  };

  const dayLabels = ['Mon', 'Wed', 'Fri'];

  // Render Individual View
  if (mode === 'individual') {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: '20px',
          border: `1px solid ${tokens.surface.borderLight}`,
          backgroundColor: '#FFFFFF',
          boxShadow: tokens.shadow.card,
        }}
      >
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} color={tokens.brand.primary}>
              Target Compliance Heatmap (Past Year)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Daily KPI target completion statuses for {selectedAgentName}
            </Typography>
          </Box>
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
          {/* Y Axis Labels */}
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pr: 1, py: 0.5 }}>
            {dayLabels.map((label, idx) => (
              <Typography key={idx} variant="caption" sx={{ fontSize: '0.7rem', color: tokens.text.muted, height: 12, lineHeight: 1 }}>
                {label}
              </Typography>
            ))}
          </Box>

          {/* Cells */}
          <Box sx={{ display: 'flex', gap: '4px' }}>
            {individualWeeks.map((week, weekIdx) => (
              <Box key={weekIdx} sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {week.map((day, dayIdx) => (
                  <Tooltip key={dayIdx} title={getTooltipTitle(day)} arrow placement="top">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '3px',
                        backgroundColor: getCellColor(day.status, day.isFuture),
                        transition: 'transform 0.15s ease',
                        cursor: day.isFuture ? 'default' : 'pointer',
                        '&:hover': day.isFuture ? {} : {
                          transform: 'scale(1.3)',
                          outline: `1px solid ${tokens.brand.primaryLight}`,
                          zIndex: 2,
                        },
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: tokens.semantic.success }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Met</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: tokens.brand.accent }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Partially Met</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: tokens.semantic.error }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Missed</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#F3F1EE' }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>No Target</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render Team View (List of Users with 30-Day Strip)
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: '20px',
        border: `1px solid ${tokens.surface.borderLight}`,
        backgroundColor: '#FFFFFF',
        boxShadow: tokens.shadow.card,
        mt: 3,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} color={tokens.brand.primary}>
          Team Daily Target Compliance (Last 30 Days)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor goal compliance consistency across all team members
        </Typography>
      </Box>

      {/* Team Rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {teamComplianceData.map((agent) => {
          const name = `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email.split('@')[0];
          return (
            <Box
              key={agent._id}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1,
                py: 1.5,
                borderBottom: `1px solid ${tokens.surface.borderLight}`,
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              {/* Agent Detail */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
                <Avatar sx={{ bgcolor: tokens.brand.primaryLight, width: 32, height: 32, fontSize: '0.8rem' }}>
                  {agent.firstName ? agent.firstName[0] : agent.email[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {agent.jobTitle || 'Sales Agent'}
                  </Typography>
                </Box>
              </Box>

              {/* 30-day compliance cells strip */}
              <Box sx={{ display: 'flex', gap: '4px', overflowX: 'auto', py: 0.5, width: { xs: '100%', sm: 'auto' } }}>
                {agent.days.map((day: any, idx: number) => (
                  <Tooltip key={idx} title={getTooltipTitle(day)} arrow placement="top">
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '3px',
                        backgroundColor: getCellColor(day.status),
                        transition: 'transform 0.15s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.3)',
                          outline: `1px solid ${tokens.brand.primaryLight}`,
                          zIndex: 2,
                        },
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: tokens.semantic.success }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Met</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: tokens.brand.accent }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Partially Met</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: tokens.semantic.error }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Missed</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: '#F3F1EE' }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>No Target</Typography>
        </Box>
      </Box>
    </Box>
  );
};
