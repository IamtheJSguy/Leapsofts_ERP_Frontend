import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  InputBase,
  Avatar,
  useTheme,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { tokens } from '@/styles/tokens';
import { useTeamConnections, useTeamProgress } from '@/hooks/api/useAdminTeamDashboard';
import { useNavigate } from 'react-router-dom';
import { ModernDatePicker } from '../common/ModernDatePicker';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';

// --- DUMMY CHART DATA ---
const velocityData = [
  { date: 'Mon', newLeads: 45, completed: 20 },
  { date: 'Tue', newLeads: 52, completed: 35 },
  { date: 'Wed', newLeads: 38, completed: 42 },
  { date: 'Thu', newLeads: 65, completed: 30 },
  { date: 'Fri', newLeads: 48, completed: 55 },
  { date: 'Sat', newLeads: 15, completed: 10 },
  { date: 'Sun', newLeads: 22, completed: 18 },
];


const formatDateParam = (date: Date | null) =>
  date ? date.toISOString().split('T')[0] : undefined;

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
          borderRadius: '12px',
          p: 2,
        }}
      >
        <Typography sx={{ fontWeight: 800, mb: 1, color: isDark ? '#fff' : tokens.text.primary, fontSize: '0.85rem' }}>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
            <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, fontSize: '0.8rem', fontWeight: 600 }}>
              {entry.name}:
            </Typography>
            <Typography sx={{ color: isDark ? '#fff' : tokens.text.primary, fontSize: '0.85rem', fontWeight: 800 }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

export const TeamConnectionsSplitView = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const navigate = useNavigate();

  // Left side state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState('This Week');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const {
    data: teamConnectionsData,
    isLoading: connectionsLoading,
  } = useTeamConnections(activeDateFilter, {
    search: searchQuery,
    startDate: formatDateParam(customStartDate),
    endDate: formatDateParam(customEndDate),
  });

  const teamConnections = teamConnectionsData?.data ?? [];

  // Right side state (Team Progress)
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [progressDateFilter, setProgressDateFilter] = useState('This Month');

  const {
    data: teamProgressData,
    isLoading: progressLoading,
  } = useTeamProgress(progressDateFilter, []);

  const teamProgressRows = teamProgressData?.data ?? [];

  useEffect(() => {
    if (teamProgressRows.length > 0 && selectedTeamMemberIds.length === 0) {
      setSelectedTeamMemberIds(teamProgressRows.slice(0, 3).map((member) => member.userId));
    }
  }, [teamProgressRows, selectedTeamMemberIds.length]);

  const filteredProgressData = useMemo(() => {
    if (selectedTeamMemberIds.length === 0) return teamProgressRows;
    return teamProgressRows.filter((member) => selectedTeamMemberIds.includes(member.userId));
  }, [teamProgressRows, selectedTeamMemberIds]);

  const cardStyles = {
    p: { xs: 2.5, sm: 3.5 },
    borderRadius: '24px',
    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : tokens.surface.card,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : tokens.surface.border}`,
    boxShadow: isDark ? 'none' : '0 4px 24px rgba(0, 0, 0, 0.02)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': { 
      boxShadow: isDark ? 'none' : '0 12px 32px rgba(26, 22, 37, 0.04)',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
    }
  };

  const chartAxisProps = {
    stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    tick: { fill: isDark ? 'rgba(255,255,255,0.5)' : tokens.text.muted, fontSize: 12, fontWeight: 600 },
    tickLine: false,
    axisLine: false,
  };
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  const availableTeamMembers = teamProgressRows.map((member) => ({
    userId: member.userId,
    name: member.name,
  }));

  return (
    <Box>
      <Grid container spacing={3.5} sx={{ mb: 3.5 }} id="team-connections-split">
        
        {/* 1. Team Connections List */}
        <Grid item xs={12} lg={6}>
          <Box sx={cardStyles}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: isDark ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
                Team Connections
              </Typography>
              <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : tokens.text.muted, fontSize: '0.85rem', fontWeight: 600 }}>
                Individual connection breakdown
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
              {/* Search Bar */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '20px',
                  px: 2.5,
                  py: 1.2,
                  transition: 'all 0.3s ease',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                  '&:focus-within': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
                    borderColor: tokens.brand.primaryMuted,
                    boxShadow: isDark ? 'none' : `0 4px 20px rgba(93, 26, 137, 0.08)`
                  }
                }}
              >
                <SearchIcon sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : tokens.text.muted, fontSize: 20, mr: 1.5 }} />
                <InputBase
                  placeholder="Search team member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  sx={{ 
                    color: isDark ? '#fff' : tokens.text.primary, 
                    fontSize: '0.92rem',
                    fontWeight: 650,
                    '& input::placeholder': {
                      color: isDark ? 'rgba(255,255,255,0.3)' : tokens.text.muted,
                      opacity: 1
                    }
                  }}
                />
              </Box>

              {/* Date Filters (Pills) */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['Today', 'This Week', 'This Month', 'All Time', 'Custom'].map((label) => {
                  const isActive = activeDateFilter === label;
                  return (
                    <Box
                      key={label}
                      onClick={() => setActiveDateFilter(label)}
                      sx={{
                        px: 2,
                        py: 0.7,
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        bgcolor: isActive 
                          ? (isDark ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.08)') 
                          : 'transparent',
                        color: isActive 
                          ? (isDark ? '#E8D9F2' : tokens.brand.primary) 
                          : (isDark ? 'rgba(255,255,255,0.5)' : tokens.text.secondary),
                        border: `1px solid ${
                          isActive 
                            ? (isDark ? 'rgba(93, 26, 137, 0.4)' : 'rgba(93, 26, 137, 0.15)') 
                            : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')
                        }`,
                        '&:hover': {
                          bgcolor: isActive 
                            ? (isDark ? 'rgba(93, 26, 137, 0.3)' : 'rgba(93, 26, 137, 0.12)') 
                            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                        }
                      }}
                    >
                      {label}
                    </Box>
                  )
                })}
              </Box>

              {/* Custom Date Range Picker */}
              {activeDateFilter === 'Custom' && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  animation: 'fadeIn 0.3s ease-in-out',
                  p: 1.5,
                  bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
                  borderRadius: '20px'
                }}>
                  <Box sx={{ flex: 1 }}>
                    <ModernDatePicker 
                      label="Start Date"
                      value={customStartDate}
                      onChange={(date) => setCustomStartDate(date)}
                      placeholder="Select start"
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <ModernDatePicker 
                      label="End Date"
                      value={customEndDate}
                      onChange={(date) => setCustomEndDate(date)}
                      minDate={customStartDate || undefined}
                      placeholder="Select end"
                    />
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              pr: 1,
              mr: -1,
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1.5,
              minHeight: 250,
              maxHeight: 400,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '4px' }
            }}>
              {connectionsLoading ? (
                <Typography sx={{ textAlign: 'center', color: tokens.text.muted, py: 4, fontWeight: 600 }}>
                  Loading team...
                </Typography>
              ) : teamConnections.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: tokens.text.muted, py: 4, fontWeight: 600 }}>
                  No team members found.
                </Typography>
              ) : (
                teamConnections.map((user) => {
                  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                  const initial = (fullName.charAt(0) || (user.email ? user.email.charAt(0) : 'U')).toUpperCase();

                  return (
                    <Box
                      key={user.userId}
                      onClick={() => {
                        navigate(`/team/member/${user.userId}`);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: isDark ? 'rgba(255,255,255,0.015)' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
                        boxShadow: isDark ? 'none' : '0 4px 15px rgba(0,0,0,0.01)',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(93, 26, 137, 0.15)',
                          transform: 'translateY(-2px)',
                          boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.2)' : '0 10px 30px rgba(93, 26, 137, 0.06)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 42, 
                            height: 42, 
                            bgcolor: isDark ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.08)',
                            color: isDark ? '#E8D9F2' : tokens.brand.primary,
                            fontWeight: 800,
                            fontSize: '1rem'
                          }}
                        >
                          {initial}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: isDark ? '#fff' : tokens.text.primary, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                            {fullName || user.email}
                          </Typography>
                          <Typography sx={{ fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.4)' : tokens.text.muted, fontSize: '0.72rem', mt: 0.2 }}>
                            {user.role || 'Member'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontWeight: 850, color: isDark ? '#fff' : tokens.text.primary, fontSize: '1.1rem' }}>
                          {user.connections}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: tokens.brand.primary, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Connections
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Grid>

        {/* 2. Team Progress Chart (Grouped Bar Chart) */}
        <Grid item xs={12} lg={6}>
          <Box sx={cardStyles}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: isDark ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
                  Team Progress
                </Typography>
                <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : tokens.text.muted, fontSize: '0.85rem', fontWeight: 600 }}>
                  Compare individual lead generation performance
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                 {/* Quick Date Filter Pill */}
                 <Select
                    value={progressDateFilter}
                    onChange={(e) => setProgressDateFilter(e.target.value)}
                    size="small"
                    sx={{
                      height: 36,
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: tokens.brand.primary,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: tokens.brand.primary,
                      }
                    }}
                  >
                    <MenuItem value="This Week">This Week</MenuItem>
                    <MenuItem value="This Month">This Month</MenuItem>
                    <MenuItem value="This Quarter">This Quarter</MenuItem>
                    <MenuItem value="All Time">All Time</MenuItem>
                  </Select>
              </Box>
            </Box>

            {/* Multi-Select Team Members Dropdown */}
            <Box sx={{ mb: 4 }}>
              <Select
                multiple
                displayEmpty
                value={selectedTeamMemberIds}
                onChange={(e) => {
                  const { target: { value } } = e;
                  setSelectedTeamMemberIds(typeof value === 'string' ? value.split(',') : value);
                }}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <Typography sx={{ color: tokens.text.muted, fontSize: '0.85rem', fontWeight: 600 }}>Select team members...</Typography>;
                  }
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((userId) => {
                        const member = availableTeamMembers.find((item) => item.userId === userId);
                        return (
                        <Chip 
                          key={userId} 
                          label={member?.name || userId} 
                          size="small" 
                          sx={{ 
                            bgcolor: isDark ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.08)',
                            color: isDark ? '#E8D9F2' : tokens.brand.primary,
                            fontWeight: 700,
                            borderRadius: '8px'
                          }} 
                        />
                      )})}
                    </Box>
                  );
                }}
                sx={{
                  width: '100%',
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: tokens.brand.primary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: tokens.brand.primary,
                  }
                }}
              >
                {availableTeamMembers.map((member) => (
                  <MenuItem key={member.userId} value={member.userId}>
                    <Checkbox checked={selectedTeamMemberIds.indexOf(member.userId) > -1} sx={{ color: tokens.brand.primary, '&.Mui-checked': { color: tokens.brand.primary } }} />
                    <ListItemText primary={member.name} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flexGrow: 1, minHeight: 300, ml: -2 }}>
              {progressLoading ? (
                <Typography sx={{ textAlign: 'center', color: tokens.text.muted, py: 8, fontWeight: 600 }}>
                  Loading progress...
                </Typography>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredProgressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" {...chartAxisProps} dy={10} />
                  <YAxis {...chartAxisProps} dx={-10} />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} />
                  <Bar dataKey="leadsContacted" name="Leads Contacted" fill={tokens.brand.primary} radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="meetingsBooked" name="Meetings Booked" fill={tokens.brand.accent} radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="dealsClosed" name="Deals Closed" fill={tokens.semantic.success} radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* 3. Pipeline Velocity Area Chart (Full Width) */}
      <Grid container spacing={3.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12}>
          <Box sx={{
            ...cardStyles,
            p: { xs: 3, sm: 4 },
          }}>
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: isDark ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
                Pipeline Velocity
              </Typography>
              <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : tokens.text.muted, fontSize: '0.9rem', fontWeight: 600 }}>
                New leads vs completed tasks over time (7 days)
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, minHeight: 380, ml: -2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tokens.brand.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={tokens.brand.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tokens.semantic.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={tokens.semantic.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="date" {...chartAxisProps} dy={10} />
                  <YAxis {...chartAxisProps} dx={-10} />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: gridColor, strokeWidth: 2 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '20px' }} />
                  <Area type="monotone" name="New Leads" dataKey="newLeads" stroke={tokens.brand.primary} strokeWidth={4} fillOpacity={1} fill="url(#colorNew)" />
                  <Area type="monotone" name="Tasks Completed" dataKey="completed" stroke={tokens.semantic.success} strokeWidth={4} fillOpacity={1} fill="url(#colorComp)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
