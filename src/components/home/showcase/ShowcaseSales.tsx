import { useState } from 'react';
import { Box, Typography, Button, Chip, Avatar, TextField, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { tokens } from '@/styles/tokens';

export const ShowcaseSales = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'linkedin' | 'cold_calling'>('all');
  const [pushedLeadId, setPushedLeadId] = useState<number | null>(null);

  const LEADS = [
    {
      id: 1,
      name: 'David C. Sterling',
      company: 'Apex Cloud Solutions',
      title: 'VP Technology & Infrastructure',
      channel: 'linkedin',
      connStatus: 'accepted',
      msgStatus: 'in_conversation',
      coldStatus: '—',
      futureDate: 'Oct 15, 2026',
      assignedTo: 'Huzaifa Rasheed',
    },
    {
      id: 2,
      name: 'Rachel Montoya',
      company: 'FinTech Logistics Ltd',
      title: 'Head of Global Procurement',
      channel: 'cold_calling',
      connStatus: '—',
      msgStatus: 'positive',
      coldStatus: 'Dialed (2) · Follow up',
      futureDate: 'Oct 12, 2026',
      assignedTo: 'Sarah Jenkins',
    },
    {
      id: 3,
      name: 'Elena Rostova',
      company: 'Horizon BioScale',
      title: 'Managing Director & Partner',
      channel: 'linkedin',
      connStatus: 'accepted',
      msgStatus: 'positive',
      coldStatus: '—',
      futureDate: 'Oct 18, 2026',
      assignedTo: 'Marcus Vance',
    },
    {
      id: 4,
      name: 'Tariq Al-Mansoor',
      company: 'Gulf Oasis Holdings',
      title: 'Chief Financial Officer',
      channel: 'cold_calling',
      connStatus: '—',
      msgStatus: 'follow_up',
      coldStatus: 'Dialed (1) · In Conversation',
      futureDate: 'Oct 20, 2026',
      assignedTo: 'Huzaifa Rasheed',
    },
  ];

  const filteredLeads = LEADS.filter((lead) => {
    if (selectedChannel === 'all') return true;
    return lead.channel === selectedChannel;
  });

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 1.5, pb: 2.5 }}>
      {/* Page Title & Filter Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 850, color: isDark ? '#fff' : tokens.text.primary, fontSize: '1.2rem' }}>
              Sales & Pipeline
            </Typography>
            <Chip label="1,420 Active Leads" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, bgcolor: tokens.brand.primary50, color: tokens.brand.primary }} />
          </Box>
          <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary', fontSize: '0.74rem' }}>
            Multi-channel outreach tracking across LinkedIn Funnels & Cold Calling queues.
          </Typography>
        </Box>

        {/* Channel Switcher Pills */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            p: 0.5,
            borderRadius: '12px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F5F3F8',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
          }}
        >
          {[
            { id: 'all', label: 'All Channels' },
            { id: 'linkedin', label: 'LinkedIn Outbound' },
            { id: 'cold_calling', label: 'Cold Calling Queue' },
          ].map((ch) => (
            <Button
              key={ch.id}
              size="small"
              onClick={() => setSelectedChannel(ch.id as any)}
              sx={{
                borderRadius: '8px',
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 750,
                textTransform: 'none',
                bgcolor: selectedChannel === ch.id ? tokens.brand.primary : 'transparent',
                color: selectedChannel === ch.id ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                '&:hover': {
                  bgcolor: selectedChannel === ch.id ? tokens.brand.primaryLight : 'rgba(255,255,255,0.05)',
                },
              }}
            >
              {ch.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Authentic Lead Table Container */}
      <Box
        sx={{
          borderRadius: '18px',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Table Header Row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1.5fr 1fr', md: '2fr 1fr 1.2fr 1.2fr 1fr' },
            px: 2.5,
            py: 1.25,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9F8FC',
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem' }}>Prospect & Title</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem' }}>Channel</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem', display: { xs: 'none', md: 'block' } }}>Connection / Status</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem', display: { xs: 'none', md: 'block' } }}>Future Lead Reminder</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem', textAlign: 'right', display: { xs: 'none', md: 'block' } }}>Action</Typography>
        </Box>

        {/* Table Rows */}
        {filteredLeads.map((lead, idx) => {
          const isPushed = pushedLeadId === lead.id;
          return (
            <Box
              key={lead.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1.5fr 1fr', md: '2fr 1fr 1.2fr 1.2fr 1fr' },
                alignItems: 'center',
                px: 2.5,
                py: 1.6,
                borderBottom: idx < filteredLeads.length - 1 ? '1px solid' : 'none',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                bgcolor: isPushed ? (isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)') : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {/* Prospect Details */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.74rem', fontWeight: 800, bgcolor: tokens.brand.primary }}>
                  {lead.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, color: isDark ? '#fff' : tokens.text.primary, fontSize: '0.84rem', lineHeight: 1.2 }}>
                    {lead.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'text.secondary', fontSize: '0.7rem' }}>
                    {lead.title} · <Box component="span" fontWeight={700} color={isDark ? '#fff' : tokens.text.primary}>{lead.company}</Box>
                  </Typography>
                </Box>
              </Box>

              {/* Outreach Channel */}
              <Box>
                <Chip
                  icon={lead.channel === 'cold_calling' ? <PhoneInTalkIcon sx={{ fontSize: 13 }} /> : <TrendingUpIcon sx={{ fontSize: 13 }} />}
                  label={lead.channel === 'cold_calling' ? 'Cold Call' : 'LinkedIn'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.67rem',
                    fontWeight: 750,
                    bgcolor: lead.channel === 'cold_calling' ? 'rgba(99, 102, 241, 0.12)' : tokens.brand.primary50,
                    color: lead.channel === 'cold_calling' ? '#6366F1' : tokens.brand.primary,
                  }}
                />
              </Box>

              {/* Status */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Chip
                  label={lead.channel === 'cold_calling' ? lead.coldStatus : `${lead.connStatus} · ${lead.msgStatus}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.67rem',
                    fontWeight: 750,
                    bgcolor: isDark ? 'rgba(255, 127, 17, 0.15)' : 'rgba(255, 127, 17, 0.1)',
                    color: tokens.brand.accent,
                  }}
                />
              </Box>

              {/* Future Lead Date */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="caption" sx={{ color: isDark ? '#A7F3D0' : '#065F46', fontWeight: 700, fontSize: '0.74rem' }}>
                  📅 {lead.futureDate}
                </Typography>
              </Box>

              {/* Action Button */}
              <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                <Button
                  size="small"
                  variant={isPushed ? 'outlined' : 'contained'}
                  color={isPushed ? 'success' : 'primary'}
                  onClick={() => setPushedLeadId(isPushed ? null : lead.id)}
                  startIcon={isPushed ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <LaunchIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontSize: '0.7rem',
                    py: 0.4,
                    px: 1.25,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 750,
                    bgcolor: isPushed ? 'transparent' : tokens.brand.primary,
                  }}
                >
                  {isPushed ? 'On Board' : 'Push'}
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
