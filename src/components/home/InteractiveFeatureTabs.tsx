import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Chip,
  Avatar,
  Tab,
  Tabs,
  useTheme,
  IconButton,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import LaunchIcon from '@mui/icons-material/Launch';
import { tokens } from '@/styles/tokens';
import { INVOICE_TEMPLATE_OPTIONS } from '@/types/invoice';

export const InteractiveFeatureTabs = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState(0);

  // Sub-states for interactive demos
  const [selectedInvoiceStyle, setSelectedInvoiceStyle] = useState('modern');
  const [invoiceCurrency, setInvoiceCurrency] = useState('USD');
  const [pushedLeadId, setPushedLeadId] = useState<number | null>(null);
  const [activeBoardDept, setActiveBoardDept] = useState('Sales');

  return (
    <Box
      id="interactive-demo"
      sx={{
        py: { xs: 8, md: 14 },
        position: 'relative',
        bgcolor: isDark ? 'rgba(18, 15, 24, 0.4)' : 'rgba(255, 255, 255, 0.5)',
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 6 } }}>
          <Chip
            label="Live Sandbox Demo"
            size="small"
            sx={{
              mb: 2,
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              bgcolor: isDark ? 'rgba(168, 85, 247, 0.2)' : tokens.brand.primary50,
              color: tokens.brand.primary,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 850,
              fontSize: { xs: '2rem', sm: '2.8rem', md: '3.2rem' },
              letterSpacing: '-0.03em',
              color: isDark ? '#FFFFFF' : tokens.text.primary,
              mb: 1.5,
            }}
          >
            Experience the Interface in Action.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'text.secondary',
              fontSize: '1.05rem',
              maxWidth: '620px',
              mx: 'auto',
            }}
          >
            Interact with simulated modules below to see how seamlessly data flows across sales, invoicing, boards, and telemetry.
          </Typography>
        </Box>

        {/* Tab Navigation Controls */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 5,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(93, 26, 137, 0.04)',
              p: 0.75,
              borderRadius: '20px',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.08)',
              '& .MuiTabs-indicator': {
                bgcolor: tokens.brand.primary,
                height: '100%',
                borderRadius: '16px',
                zIndex: 0,
                boxShadow: '0 4px 16px rgba(93, 26, 137, 0.35)',
              },
            }}
          >
            {[
              { label: 'Sales CRM & Leads', icon: <TrendingUpIcon sx={{ fontSize: 18 }} /> },
              { label: 'Invoicing Studio', icon: <ReceiptLongIcon sx={{ fontSize: 18 }} /> },
              { label: 'Departmental Kanban', icon: <ViewKanbanIcon sx={{ fontSize: 18 }} /> },
              { label: 'Workforce Telemetry', icon: <AccessTimeIcon sx={{ fontSize: 18 }} /> },
            ].map((tab, idx) => (
              <Tab
                key={idx}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  textTransform: 'none',
                  fontWeight: 750,
                  fontSize: '0.88rem',
                  py: 1.25,
                  px: { xs: 2, sm: 3 },
                  borderRadius: '16px',
                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                  transition: 'color 0.2s',
                  '&.Mui-selected': {
                    color: '#FFFFFF',
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Interactive Sandbox Canvas Container */}
        <Box
          sx={{
            borderRadius: '28px',
            bgcolor: isDark ? '#16131E' : '#FFFFFF',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.1)',
            boxShadow: isDark
              ? '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(93, 26, 137, 0.15)'
              : '0 20px 60px rgba(93, 26, 137, 0.08)',
            p: { xs: 2.5, sm: 4, md: 5 },
            minHeight: '440px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* TAB 0: SALES CRM DEMO */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={850} color={isDark ? '#fff' : tokens.text.primary}>
                    Lead Pipeline & Outreach Engine
                  </Typography>
                  <Typography variant="caption" color={isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary'}>
                    Click &quot;Push to Kanban&quot; on any prospect to test instant conversion into an execution card.
                  </Typography>
                </Box>
                <Chip label="Live Simulation" size="small" sx={{ bgcolor: tokens.brand.primary50, color: tokens.brand.primary, fontWeight: 700 }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { id: 1, name: 'David C. Sterling', company: 'Apex Cloud Solutions', role: 'CTO', channel: 'LinkedIn', status: 'Accepted', value: '$35,000' },
                  { id: 2, name: 'Rachel Montoya', company: 'Nova Global Logistics', role: 'VP Operations', channel: 'Cold Call', status: 'Dialed (2)', value: '$22,000' },
                  { id: 3, name: 'Kavita Sundaram', company: 'Zenith Health Systems', role: 'Managing Partner', channel: 'LinkedIn', status: 'In Conversation', value: '$48,000' },
                ].map((lead) => {
                  const isPushed = pushedLeadId === lead.id;
                  return (
                    <Box
                      key={lead.id}
                      sx={{
                        p: 2.5,
                        borderRadius: '18px',
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F9F8FC',
                        border: '1px solid',
                        borderColor: isPushed ? '#10B981' : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: tokens.brand.primary, width: 40, height: 40, fontWeight: 700 }}>
                          {lead.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#fff' : tokens.text.primary} lineHeight={1.2}>
                            {lead.name}
                          </Typography>
                          <Typography variant="caption" color={isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary'}>
                            {lead.role} · <Box component="span" fontWeight={700} color={isDark ? '#fff' : tokens.text.primary}>{lead.company}</Box>
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={lead.channel === 'Cold Call' ? <PhoneInTalkIcon sx={{ fontSize: 14 }} /> : undefined}
                          label={lead.channel}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                        <Chip
                          label={lead.status}
                          size="small"
                          sx={{ bgcolor: isDark ? 'rgba(255, 127, 17, 0.15)' : 'rgba(255, 127, 17, 0.1)', color: tokens.brand.accent, fontWeight: 750, fontSize: '0.72rem' }}
                        />
                        <Typography variant="subtitle2" fontWeight={850} color={tokens.brand.accent}>
                          {lead.value}
                        </Typography>

                        <Button
                          size="small"
                          variant={isPushed ? 'outlined' : 'contained'}
                          color={isPushed ? 'success' : 'primary'}
                          onClick={() => setPushedLeadId(isPushed ? null : lead.id)}
                          startIcon={isPushed ? <CheckCircleIcon /> : <LaunchIcon />}
                          sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            bgcolor: isPushed ? 'transparent' : tokens.brand.primary,
                            '&:hover': { bgcolor: isPushed ? 'transparent' : tokens.brand.primaryLight },
                          }}
                        >
                          {isPushed ? 'Pushed to Board!' : 'Push to Kanban'}
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* TAB 1: INVOICE STUDIO DEMO */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={850} color={isDark ? '#fff' : tokens.text.primary}>
                    Multi-Template Invoice Engine
                  </Typography>
                  <Typography variant="caption" color={isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary'}>
                    Select any template style below to see real-time layout adjustments.
                  </Typography>
                </Box>

                {/* Currency Switcher */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {['USD', 'PKR', 'EUR', 'AED'].map((curr) => (
                    <Button
                      key={curr}
                      size="small"
                      onClick={() => setInvoiceCurrency(curr)}
                      sx={{
                        borderRadius: '8px',
                        fontWeight: 750,
                        fontSize: '0.72rem',
                        bgcolor: invoiceCurrency === curr ? tokens.brand.accent : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        color: invoiceCurrency === curr ? '#fff' : 'inherit',
                      }}
                    >
                      {curr}
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Template Style Selector */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                {INVOICE_TEMPLATE_OPTIONS.map((style) => (
                  <Button
                    key={style.id}
                    size="small"
                    variant={selectedInvoiceStyle === style.id ? 'contained' : 'outlined'}
                    onClick={() => setSelectedInvoiceStyle(style.id)}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      bgcolor: selectedInvoiceStyle === style.id ? tokens.brand.primary : 'transparent',
                      borderColor: selectedInvoiceStyle === style.id ? tokens.brand.primary : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      color: selectedInvoiceStyle === style.id ? '#fff' : isDark ? '#fff' : tokens.text.primary,
                    }}
                  >
                    {style.label}
                  </Button>
                ))}
              </Box>

              {/* Simulated Rendered Invoice Card */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: '18px',
                  bgcolor: selectedInvoiceStyle === 'bold' ? (isDark ? '#000' : '#14111B') : isDark ? 'rgba(255,255,255,0.03)' : '#F9F8FC',
                  color: selectedInvoiceStyle === 'bold' ? '#FFFFFF' : 'inherit',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={850}>
                      LEAPSOFTS TECHNOLOGIES
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>NTN: 8294710-3 · Issued to: Vanguard Global Inc.</Typography>
                  </Box>
                  <Chip label={`Template: ${selectedInvoiceStyle.toUpperCase()}`} size="small" sx={{ fontWeight: 800, bgcolor: tokens.brand.primary, color: '#fff' }} />
                </Box>

                <Box sx={{ my: 2, p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={650}>Enterprise ERP Architecture & Implementation</Typography>
                    <Typography variant="body2" fontWeight={800}>{invoiceCurrency} 8,500.00</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={650}>Sales Automation & Telemetry Integration (15 Seats)</Typography>
                    <Typography variant="body2" fontWeight={800}>{invoiceCurrency} 4,500.00</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Typography variant="subtitle2" fontWeight={800}>Total Due</Typography>
                    <Typography variant="subtitle1" fontWeight={850} color={tokens.brand.accent}>{invoiceCurrency} 13,000.00</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* TAB 2: KANBAN DEMO */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={850} color={isDark ? '#fff' : tokens.text.primary}>
                    Departmental Board Architecture
                  </Typography>
                  <Typography variant="caption" color={isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary'}>
                    Filter by operational department category to inspect structured workflows.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {['Sales', 'Technology', 'Operations'].map((dept) => (
                    <Button
                      key={dept}
                      size="small"
                      onClick={() => setActiveBoardDept(dept)}
                      sx={{
                        borderRadius: '10px',
                        fontWeight: 750,
                        fontSize: '0.76rem',
                        bgcolor: activeBoardDept === dept ? tokens.brand.primary : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        color: activeBoardDept === dept ? '#fff' : 'inherit',
                      }}
                    >
                      {dept}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {[
                  { col: 'To Do / Inbound', task: 'Review ICP Fit for Sterling Corp', tag: 'High Priority', checklist: '3/3 Subtasks' },
                  { col: 'In Execution', task: 'Sprint 24: Real-time Socket Dispatch', tag: 'Urgent', checklist: '7/8 Subtasks' },
                  { col: 'Closed Won / Done', task: 'Acme Cloud Agreement Executed', tag: 'Completed', checklist: '5/5 Subtasks' },
                ].map((col, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 2,
                      borderRadius: '18px',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F9F8FC',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <Typography variant="caption" fontWeight={800} color={tokens.brand.accent} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1, display: 'block' }}>
                      {col.col}
                    </Typography>
                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF', border: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }}>
                      <Typography variant="body2" fontWeight={750} mb={1}>{col.task}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip label={col.tag} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={650}>{col.checklist}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* TAB 3: SHIFT TELEMETRY DEMO */}
          {activeTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={850} color={isDark ? '#fff' : tokens.text.primary}>
                    Shift Session & Telemetry Timeline
                  </Typography>
                  <Typography variant="caption" color={isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary'}>
                    Inspect automated work-session calculation, break categories, and active app distribution.
                  </Typography>
                </Box>
                <Chip label="Telemetry Consent Active" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 750 }} />
              </Box>

              {/* Simulated Session Timeline Bar */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
                  DAY SHIFT TIMELINE (09:00 AM — 05:00 PM)
                </Typography>
                <Box sx={{ height: 24, borderRadius: '8px', bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)', display: 'flex', overflow: 'hidden' }}>
                  <Box sx={{ width: '45%', bgcolor: tokens.brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 750 }}>Active Focus</Box>
                  <Box sx={{ width: '10%', bgcolor: tokens.brand.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 750 }}>Break</Box>
                  <Box sx={{ width: '35%', bgcolor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 750 }}>Client Meeting</Box>
                  <Box sx={{ width: '10%', bgcolor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 750 }}>Review</Box>
                </Box>
              </Box>

              {/* App Distribution */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                {[
                  { app: 'Google Chrome (CRM & Research)', time: '03h 45m', pct: '48%' },
                  { app: 'VS Code & Development', time: '02h 20m', pct: '30%' },
                  { app: 'Zoom Client (Meetings)', time: '01h 15m', pct: '15%' },
                  { app: 'Slack / Desktop Chat', time: '00h 35m', pct: '7%' },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9F8FC' }}>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>{item.app}</Typography>
                    <Typography variant="subtitle1" fontWeight={850} color={isDark ? '#fff' : tokens.text.primary}>{item.time}</Typography>
                    <Typography variant="caption" color={tokens.brand.accent} fontWeight={800}>{item.pct} Active Time</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};
