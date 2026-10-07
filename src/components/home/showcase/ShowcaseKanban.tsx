import { useState } from 'react';
import { Box, Typography, Button, Chip, Avatar, useTheme } from '@mui/material';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { tokens } from '@/styles/tokens';

export const ShowcaseKanban = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selectedDept, setSelectedDept] = useState<'Sales' | 'Technology' | 'Operations'>('Sales');

  const COLUMNS = [
    {
      id: 'qualified',
      title: 'Qualified Leads',
      count: 3,
      cards: [
        { title: 'Vanguard Global: Cloud ERP Setup', priority: 'Urgent', subtasks: '4/4 Done', tag: 'Enterprise', rep: 'Huzaifa Rasheed' },
        { title: 'Sterling Corp: Inbound Demonstration', priority: 'High', subtasks: '2/3 Done', tag: 'Outbound', rep: 'Sarah Jenkins' },
      ],
    },
    {
      id: 'proposal',
      title: 'In Proposal',
      count: 2,
      cards: [
        { title: 'Acme Cloud: Pricing & SOW Draft', priority: 'Urgent', subtasks: '3/3 Done', tag: 'Negotiation', rep: 'Huzaifa Rasheed' },
      ],
    },
    {
      id: 'closed',
      title: 'Closed Won / Deployed',
      count: 4,
      cards: [
        { title: 'Horizon BioScale: 15 Seats Onboarded', priority: 'Medium', subtasks: '5/5 Done', tag: 'Live Client', rep: 'Marcus Vance' },
        { title: 'Gulf Oasis: Telemetry Agent Installed', priority: 'Medium', subtasks: '3/3 Done', tag: 'Live Client', rep: 'Elena Rostova' },
      ],
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header & Department Switcher */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 850, color: isDark ? '#fff' : tokens.text.primary, fontSize: '1.35rem' }}>
              Departmental Kanban Boards
            </Typography>
            <Chip label="Realtime Sync" size="small" sx={{ fontWeight: 800, bgcolor: tokens.brand.primary50, color: tokens.brand.primary }} />
          </Box>
          <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
            Interactive task cards with checklist subtasks, @mention comments, and lead audit trail.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {['Sales', 'Technology', 'Operations'].map((dept) => (
            <Button
              key={dept}
              size="small"
              onClick={() => setSelectedDept(dept as any)}
              sx={{
                borderRadius: '8px',
                fontWeight: 750,
                fontSize: '0.74rem',
                textTransform: 'none',
                bgcolor: selectedDept === dept ? tokens.brand.primary : isDark ? 'rgba(255,255,255,0.05)' : '#F5F3F8',
                color: selectedDept === dept ? '#fff' : isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              }}
            >
              {dept} Board
            </Button>
          ))}
        </Box>
      </Box>

      {/* Kanban Columns Strip */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {COLUMNS.map((col) => (
          <Box
            key={col.id}
            sx={{
              p: 2,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F9F8FC',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            }}
          >
            {/* Column Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem', color: isDark ? '#fff' : tokens.text.primary }}>
                {col.title}
              </Typography>
              <Chip label={col.count} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
            </Box>

            {/* Cards in Column */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {col.cards.map((card, cIdx) => (
                <Box
                  key={cIdx}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: tokens.brand.accent,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip
                      label={card.priority}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: card.priority === 'Urgent' ? '#EF4444' : card.priority === 'High' ? '#F59E0B' : '#10B981',
                        color: '#fff',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', fontWeight: 650 }}>
                      {card.tag}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 750, color: isDark ? '#fff' : tokens.text.primary, fontSize: '0.82rem', mb: 1.5 }}>
                    {card.title}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 14, color: '#10B981' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary' }}>
                        {card.subtasks}
                      </Typography>
                    </Box>

                    <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', fontWeight: 800, bgcolor: tokens.brand.primary }}>
                      {card.rep.charAt(0)}
                    </Avatar>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
