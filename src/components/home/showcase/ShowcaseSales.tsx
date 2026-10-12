import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Avatar,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EmailIcon from '@mui/icons-material/Email';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import EventIcon from '@mui/icons-material/Event';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

import {
  tokens,
  connectionStatusTokens,
  messageStatusTokens,
  coldOutreachStatusTokens,
  coldResponseStatusTokens,
} from '@/styles/tokens';

export interface ShowcaseLead {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  profileUrl: string;
  icp: string;
  profile: string;
  assignedTo: string;
  addedDate: string;
  channel: 'linkedin' | 'cold_calling';
  connStatus: 'pending' | 'sent' | 'accepted' | 'declined';
  msgStatus: 'not_sent' | 'sent' | 'in_conversation' | 'replied' | 'follow_up' | 'positive' | 'future_lead';
  followUpCount?: number;
  futureDate?: string;
  coldOutreach: 'pending' | 'dialed_1' | 'dialed_2' | 'dialed_3';
  coldResponse: 'no_response' | 'positive' | 'negative' | 'in_conversation' | 'future_lead' | 'follow_up_1' | 'follow_up_2';
  isQualified: boolean;
  comment?: string;
}

const INITIAL_LEADS: ShowcaseLead[] = [
  {
    id: 'lead-1',
    name: 'David C. Sterling',
    title: 'VP Technology & Infrastructure',
    company: 'Apex Cloud Solutions',
    email: 'd.sterling@apexcloud.io',
    phone: '+1 (415) 890-2341',
    profileUrl: 'linkedin.com/in/david-sterling-apex',
    icp: 'Enterprise Cloud EMEA',
    profile: 'VP Tech',
    assignedTo: 'Huzaifa Rasheed',
    addedDate: 'Oct 5',
    channel: 'linkedin',
    connStatus: 'accepted',
    msgStatus: 'in_conversation',
    followUpCount: 2,
    futureDate: 'Oct 15',
    coldOutreach: 'dialed_2',
    coldResponse: 'in_conversation',
    isQualified: true,
    comment: 'High interest in unified sales automation & custom ERP migration',
  },
  {
    id: 'lead-2',
    name: 'Rachel Montoya',
    title: 'Head of Global Procurement',
    company: 'FinTech Logistics Ltd',
    email: 'r.montoya@fintechlog.com',
    phone: '+44 20 7946 0912',
    profileUrl: 'linkedin.com/in/rachel-montoya-procure',
    icp: 'FinTech Scaleups',
    profile: 'Procurement',
    assignedTo: 'Sarah Jenkins',
    addedDate: 'Oct 6',
    channel: 'cold_calling',
    connStatus: 'sent',
    msgStatus: 'follow_up',
    followUpCount: 1,
    futureDate: 'Oct 12',
    coldOutreach: 'dialed_2',
    coldResponse: 'follow_up_1',
    isQualified: false,
    comment: 'Requested formal pilot proposal review on Oct 12',
  },
  {
    id: 'lead-3',
    name: 'Elena Rostova',
    title: 'Managing Director & Partner',
    company: 'Horizon BioScale',
    email: 'elena@horizonbioscale.de',
    phone: '+49 89 2018 4390',
    profileUrl: 'linkedin.com/in/elena-rostova-horizon',
    icp: 'BioScale Health',
    profile: 'Strategy',
    assignedTo: 'Marcus Vance',
    addedDate: 'Oct 4',
    channel: 'linkedin',
    connStatus: 'accepted',
    msgStatus: 'positive',
    futureDate: 'Oct 18',
    coldOutreach: 'dialed_1',
    coldResponse: 'positive',
    isQualified: true,
    comment: 'Budget signed off for Q4 deployment. Demo scheduled with COO.',
  },
  {
    id: 'lead-4',
    name: 'Tariq Al-Mansoor',
    title: 'Chief Financial Officer',
    company: 'Gulf Oasis Holdings',
    email: 't.mansoor@gulfoasis.ae',
    phone: '+971 4 391 8200',
    profileUrl: 'linkedin.com/in/tariq-mansoor-cfo',
    icp: 'Enterprise Cloud EMEA',
    profile: 'CFO Approval',
    assignedTo: 'Huzaifa Rasheed',
    addedDate: 'Oct 7',
    channel: 'cold_calling',
    connStatus: 'accepted',
    msgStatus: 'future_lead',
    futureDate: 'Oct 20',
    coldOutreach: 'dialed_1',
    coldResponse: 'in_conversation',
    isQualified: false,
  },
  {
    id: 'lead-5',
    name: 'Katherine Zhao',
    title: 'VP Product Engineering',
    company: 'NextGen Automation AI',
    email: 'kzhao@nextgenai.tech',
    phone: '+1 (650) 412-9901',
    profileUrl: 'linkedin.com/in/katherine-zhao-ai',
    icp: 'Tech SaaS AI',
    profile: 'VP Tech',
    assignedTo: 'Sarah Jenkins',
    addedDate: 'Oct 3',
    channel: 'linkedin',
    connStatus: 'accepted',
    msgStatus: 'follow_up',
    followUpCount: 2,
    futureDate: 'Oct 14',
    coldOutreach: 'dialed_3',
    coldResponse: 'follow_up_2',
    isQualified: false,
  },
];

export const ShowcaseSales: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [outreachChannel, setOutreachChannel] = useState<'linkedin' | 'cold_calling'>('linkedin');
  const [activeCard, setActiveCard] = useState<string>('TOTAL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIcp, setSelectedIcp] = useState<string>('All ICPs');
  const [leads, setLeads] = useState<ShowcaseLead[]>(INITIAL_LEADS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Short labels prevent any overlap with percentages in 7-column grid
  const stats = useMemo(() => {
    if (outreachChannel === 'cold_calling') {
      return [
        { label: 'TOTAL', value: '1,420', percent: null, color: tokens.brand.primary },
        { label: 'DIALED', value: '620', percent: '44%', color: '#0EA5E9' },
        { label: 'IN TALKS', value: '142', percent: '23%', color: '#8B5CF6' },
        { label: 'FOLLOW UP', value: '88', percent: '14%', color: '#3B82F6' },
        { label: 'POSITIVE', value: '46', percent: '32%', color: tokens.semantic.success },
        { label: 'NEGATIVE', value: '34', percent: '24%', color: tokens.semantic.error },
      ];
    }
    return [
      { label: 'TOTAL', value: '1,420', percent: null, color: tokens.brand.primary },
      { label: 'ACCEPTED', value: '412', percent: '49%', color: tokens.brand.accent },
      { label: 'SENT', value: '368', percent: '89%', color: '#0EA5E9' },
      { label: 'IN TALKS', value: '185', percent: '50%', color: '#8B5CF6' },
      { label: 'FOLLOW UP', value: '74', percent: '40%', color: '#3B82F6' },
      { label: 'POSITIVE', value: '64', percent: '35%', color: tokens.semantic.success },
      { label: 'NEGATIVE', value: '28', percent: '15%', color: tokens.semantic.error },
    ];
  }, [outreachChannel]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchCompany = lead.company.toLowerCase().includes(q);
        const matchEmail = lead.email.toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchEmail) return false;
      }
      if (selectedIcp !== 'All ICPs' && lead.icp !== selectedIcp) return false;
      if (activeCard === 'ACCEPTED' && lead.connStatus !== 'accepted') return false;
      if (activeCard === 'IN TALKS') {
        if (outreachChannel === 'linkedin' && lead.msgStatus !== 'in_conversation') return false;
        if (outreachChannel === 'cold_calling' && lead.coldResponse !== 'in_conversation') return false;
      }
      if (activeCard === 'POSITIVE') {
        if (outreachChannel === 'linkedin' && lead.msgStatus !== 'positive') return false;
        if (outreachChannel === 'cold_calling' && lead.coldResponse !== 'positive') return false;
      }
      if (activeCard === 'FOLLOW UP') {
        if (outreachChannel === 'linkedin' && lead.msgStatus !== 'follow_up') return false;
        if (outreachChannel === 'cold_calling' && !lead.coldResponse.startsWith('follow_up')) return false;
      }
      return true;
    });
  }, [leads, searchQuery, selectedIcp, activeCard, outreachChannel]);

  const handleCopy = (id: string, name: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(name);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleToggleQualify = (id: string) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, isQualified: !lead.isQualified } : lead))
    );
  };

  return (
    <Box sx={{ p: { xs: 1.25, sm: 1.5 }, display: 'flex', flexDirection: 'column', gap: 1.25, pb: 2 }}>
      {/* 1. Sleek Compact Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography
            sx={{
              fontWeight: 850,
              letterSpacing: '-0.02em',
              color: isDarkMode ? '#fff' : tokens.text.primary,
              fontSize: { xs: '0.98rem', sm: '1.08rem' },
            }}
          >
            {outreachChannel === 'cold_calling' ? 'Cold Calling & Pipeline' : 'LinkedIn Outreach & Pipeline'}
          </Typography>

          {/* Compact Channel Switcher Pill */}
          <FormControl size="small">
            <Select
              value={outreachChannel}
              onChange={(e) => setOutreachChannel(e.target.value as any)}
              aria-label="Outreach channel"
              sx={{
                height: 24,
                borderRadius: '999px',
                bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.08)',
                color: tokens.brand.primary,
                fontWeight: 800,
                fontSize: '0.67rem',
                '& .MuiSelect-select': { py: 0.2, pl: 1.2, pr: '24px !important' },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDarkMode ? 'rgba(93, 26, 137, 0.35)' : 'rgba(93, 26, 137, 0.18)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.brand.primary },
                '& .MuiSvgIcon-root': { color: tokens.brand.primary, fontSize: 15 },
              }}
            >
              <MenuItem value="linkedin" sx={{ fontSize: '0.72rem', fontWeight: 700 }}>LinkedIn Outreach</MenuItem>
              <MenuItem value="cold_calling" sx={{ fontSize: '0.72rem', fontWeight: 700 }}>Cold Calling</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Right Header: Google Sheet Pill + Date Pill + Settings */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          {/* Integrated Google Sheet Sync Pill */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1,
              py: 0.3,
              borderRadius: '999px',
              bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <InsertDriveFileIcon sx={{ fontSize: 13, color: '#10B981' }} />
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 750, color: '#10B981' }}>
              Sheets Sync
            </Typography>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#10B981' }} />
          </Box>

          {/* Date Range Badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.3,
              borderRadius: '10px',
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <EventIcon sx={{ fontSize: 13, color: tokens.brand.primary }} />
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: isDarkMode ? '#fff' : tokens.text.primary }}>
              Oct 01 – Oct 31, 2026
            </Typography>
          </Box>

          <Tooltip title="Sales settings" arrow>
            <IconButton
              size="small"
              sx={{
                width: 26,
                height: 26,
                borderRadius: '8px',
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                border: '1px solid',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                color: 'text.secondary',
              }}
            >
              <SettingsOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 2. Sleek Funnel KPI Metric Cards Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(3, minmax(0, 1fr))',
            sm: 'repeat(4, minmax(0, 1fr))',
            md: `repeat(${stats.length}, minmax(0, 1fr))`,
          },
          gap: 0.75,
        }}
      >
        {stats.map((item, idx) => {
          const isActive = activeCard === item.label;
          return (
            <Card
              key={idx}
              onClick={() => setActiveCard(item.label)}
              sx={{
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : '#FFFFFF',
                border: `1.5px solid ${isActive ? item.color : isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
                borderRadius: '12px',
                px: 0.85,
                py: 0.65,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: isDarkMode ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.02)',
                '&:hover': {
                  borderColor: item.color,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 800,
                    fontSize: '0.58rem',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                  }}
                >
                  {item.label}
                </Typography>
                {item.percent && (
                  <Typography
                    component="span"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    {item.percent}
                  </Typography>
                )}
              </Box>

              <Typography
                sx={{
                  fontWeight: 850,
                  color: item.color,
                  fontSize: '1.05rem',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.value}
              </Typography>
            </Card>
          );
        })}
      </Box>

      {/* 3. Unified Toolbar: Search + Filter + Future Leads + Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 0.75,
        }}
      >
        {/* Left: Search + ICP Filter + Future Leads Chip */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search prospect..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: 140, sm: 170 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                height: 28,
                fontSize: '0.72rem',
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
              },
            }}
          />

          <FormControl size="small">
            <Select
              value={selectedIcp}
              onChange={(e) => setSelectedIcp(e.target.value)}
              sx={{
                height: 28,
                borderRadius: '16px',
                fontSize: '0.7rem',
                fontWeight: 700,
                minWidth: 130,
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                '& .MuiSelect-select': { py: 0.2, pl: 1 },
              }}
            >
              <MenuItem value="All ICPs" sx={{ fontSize: '0.72rem' }}>All ICP Campaigns</MenuItem>
              <MenuItem value="Enterprise Cloud EMEA" sx={{ fontSize: '0.72rem' }}>Enterprise Cloud EMEA</MenuItem>
              <MenuItem value="FinTech Scaleups" sx={{ fontSize: '0.72rem' }}>FinTech Scaleups</MenuItem>
              <MenuItem value="BioScale Health" sx={{ fontSize: '0.72rem' }}>BioScale Health</MenuItem>
            </Select>
          </FormControl>

          <Chip
            icon={<EventIcon sx={{ fontSize: '12px !important' }} />}
            label="38 Future leads"
            size="small"
            sx={{
              fontWeight: 750,
              fontSize: '0.62rem',
              height: 22,
              bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.07)',
              color: tokens.brand.primary,
              border: `1px solid ${tokens.brand.primary}25`,
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          />
        </Box>

        {/* Right: Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 12 }} />}
            sx={{
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 750,
              fontSize: '0.68rem',
              height: 26,
              px: 1.25,
              bgcolor: tokens.brand.primary,
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.brand.primaryLight, boxShadow: 'none' },
            }}
          >
            Add Lead
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 12 }} />}
            sx={{
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.68rem',
              height: 26,
              px: 1,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }}
          >
            Edit All
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 12 }} />}
            sx={{
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.68rem',
              height: 26,
              px: 1,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              color: isDarkMode ? '#fff' : tokens.text.primary,
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* 4. Authentic Table: Fixed Column Proportions, Zero Wrapping or Text Distortion */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '14px',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : '#FFFFFF',
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          boxShadow: 'none',
          overflowX: 'auto',
        }}
      >
        <Table size="small" sx={{ minWidth: 780 }}>
          <TableHead sx={{ bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.02)' }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 850, fontSize: '0.62rem', textTransform: 'uppercase', color: 'text.secondary', width: 36, minWidth: 36, px: 0.5, py: 0.8 }}>
                #
              </TableCell>
              <TableCell sx={{ fontWeight: 850, fontSize: '0.62rem', textTransform: 'uppercase', color: 'text.secondary', minWidth: 230, pl: 1, py: 0.8 }}>
                PROSPECT
              </TableCell>
              <TableCell sx={{ fontWeight: 850, fontSize: '0.62rem', textTransform: 'uppercase', color: 'text.secondary', minWidth: 150, py: 0.8 }}>
                CAMPAIGN (ICP)
              </TableCell>
              <TableCell sx={{ fontWeight: 850, fontSize: '0.62rem', textTransform: 'uppercase', color: 'text.secondary', minWidth: 165, py: 0.8 }}>
                OUTREACH STATUS
              </TableCell>
              <TableCell sx={{ fontWeight: 850, fontSize: '0.62rem', textTransform: 'uppercase', color: 'text.secondary', minWidth: 120, py: 0.8 }}>
                ASSIGNED AGENT
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 850, fontSize: '0.62rem', textTransform: 'uppercase', color: 'text.secondary', minWidth: 110, pr: 1.5, py: 0.8 }}>
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredLeads.map((prospect, idx) => {
              const initials = prospect.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              const connToken = (connectionStatusTokens as any)[prospect.connStatus] || connectionStatusTokens.pending;
              const msgToken = (messageStatusTokens as any)[prospect.msgStatus] || messageStatusTokens.not_sent;
              const coldOutreachToken = (coldOutreachStatusTokens as any)[prospect.coldOutreach] || coldOutreachStatusTokens.pending;
              const coldResponseToken = (coldResponseStatusTokens as any)[prospect.coldResponse] || coldResponseStatusTokens.no_response;

              return (
                <TableRow
                  key={prospect.id}
                  sx={{
                    transition: 'all 0.15s ease',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'}`,
                    '&:last-child': { borderBottom: 0 },
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    },
                  }}
                >
                  {/* Continuous Index Pill */}
                  <TableCell align="center" sx={{ py: 1, px: 0.5, width: 36, minWidth: 36 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 24,
                        height: 19,
                        borderRadius: '5px',
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                        border: '1px solid',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : tokens.text.muted,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </Box>
                  </TableCell>

                  {/* Prospect Details: Fixed, Clean, Non-wrapping */}
                  <TableCell sx={{ py: 1, pl: 1, minWidth: 230 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#ECE6F2',
                          color: isDarkMode ? '#FFFFFF' : tokens.brand.primary,
                          fontSize: '0.72rem',
                          fontWeight: 850,
                          border: '1px solid',
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(93, 26, 137, 0.1)',
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        {/* Line 1: Name + Actions */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              color: isDarkMode ? '#FFFFFF' : tokens.text.primary,
                              fontSize: '0.8rem',
                              lineHeight: 1.2,
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              '&:hover': { color: tokens.brand.primary, textDecoration: 'underline' },
                            }}
                          >
                            {prospect.name}
                          </Typography>

                          <Tooltip title={copiedId === prospect.id ? 'Copied!' : 'Copy name'} arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(prospect.id, prospect.name)}
                              sx={{ p: 0.2, color: copiedId === prospect.id ? tokens.brand.primary : 'text.secondary' }}
                            >
                              {copiedId === prospect.id ? (
                                <CheckCircleIcon sx={{ fontSize: 12 }} />
                              ) : (
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              )}
                            </IconButton>
                          </Tooltip>

                          {prospect.comment && (
                            <Tooltip title={prospect.comment} arrow>
                              <Box sx={{ display: 'inline-flex', cursor: 'pointer', color: tokens.brand.accent }}>
                                <ChatBubbleOutlineIcon sx={{ fontSize: 12 }} />
                              </Box>
                            </Tooltip>
                          )}
                        </Box>

                        {/* Line 2: Title · Company (Single clean line with ellipsis) */}
                        <Typography
                          sx={{
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
                            fontSize: '0.68rem',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 240,
                            mt: 0.1,
                          }}
                        >
                          {prospect.title} · <Box component="span" fontWeight={750} color={isDarkMode ? '#fff' : tokens.text.primary}>{prospect.company}</Box>
                        </Typography>

                        {/* Line 3: Email + Clean LinkedIn chip badge */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.2 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.3,
                              fontSize: '0.64rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <EmailIcon sx={{ fontSize: 10 }} />
                            {prospect.email}
                          </Typography>
                          <Chip
                            icon={<LinkIcon sx={{ fontSize: '10px !important' }} />}
                            label="LinkedIn"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.58rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                              color: tokens.brand.primary,
                              '& .MuiChip-label': { px: 0.5 },
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Campaign (ICP): Non-wrapping */}
                  <TableCell sx={{ py: 1, minWidth: 150 }}>
                    <Typography
                      sx={{
                        fontWeight: 750,
                        color: isDarkMode ? '#FFFFFF' : tokens.text.primary,
                        fontSize: '0.74rem',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {prospect.icp}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        fontSize: '0.65rem',
                        mt: 0.15,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Profile: {prospect.profile}
                    </Typography>
                  </TableCell>

                  {/* Outreach Status Chips: Structured row layout */}
                  <TableCell sx={{ py: 1, minWidth: 165 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, alignItems: 'flex-start' }}>
                      {outreachChannel === 'linkedin' ? (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexWrap: 'nowrap' }}>
                            <Chip
                              label={`CONN: ${prospect.connStatus.toUpperCase()}`}
                              size="small"
                              sx={{
                                bgcolor: connToken.bg,
                                color: connToken.color,
                                fontWeight: 800,
                                fontSize: '0.58rem',
                                height: 18,
                                borderRadius: '4px',
                                border: `1px solid ${connToken.color}30`,
                                whiteSpace: 'nowrap',
                              }}
                            />
                            <Chip
                              label={`MSG: ${prospect.msgStatus.replace('_', ' ').toUpperCase()}`}
                              size="small"
                              sx={{
                                bgcolor: msgToken.bg,
                                color: msgToken.color,
                                fontWeight: 800,
                                fontSize: '0.58rem',
                                height: 18,
                                borderRadius: '4px',
                                border: `1px solid ${msgToken.color}30`,
                                whiteSpace: 'nowrap',
                              }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
                            {prospect.followUpCount && (
                              <Chip
                                label={`FollowUp #${prospect.followUpCount}`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255, 127, 17, 0.12)',
                                  color: tokens.brand.accent,
                                  fontWeight: 800,
                                  fontSize: '0.58rem',
                                  height: 16,
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap',
                                }}
                              />
                            )}
                            {prospect.futureDate && (
                              <Typography variant="caption" sx={{ color: isDarkMode ? '#A7F3D0' : '#059669', fontWeight: 700, fontSize: '0.64rem', whiteSpace: 'nowrap' }}>
                                Due {prospect.futureDate}
                              </Typography>
                            )}
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexWrap: 'nowrap' }}>
                            <Chip
                              label={`DIAL: ${prospect.coldOutreach.replace('_', ' ').toUpperCase()}`}
                              size="small"
                              sx={{
                                bgcolor: coldOutreachToken.bg,
                                color: coldOutreachToken.color,
                                fontWeight: 800,
                                fontSize: '0.58rem',
                                height: 18,
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            />
                            <Chip
                              label={`ANS: ${prospect.coldResponse.replace('_', ' ').toUpperCase()}`}
                              size="small"
                              sx={{
                                bgcolor: coldResponseToken.bg,
                                color: coldResponseToken.color,
                                fontWeight: 800,
                                fontSize: '0.58rem',
                                height: 18,
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            />
                          </Box>
                          {prospect.futureDate && (
                            <Typography variant="caption" sx={{ color: isDarkMode ? '#A7F3D0' : '#059669', fontWeight: 700, fontSize: '0.64rem', whiteSpace: 'nowrap' }}>
                              Due {prospect.futureDate}
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  </TableCell>

                  {/* Assigned Agent: Clean Non-wrapping */}
                  <TableCell sx={{ py: 1, minWidth: 120 }}>
                    <Typography
                      sx={{
                        color: isDarkMode ? '#FFFFFF' : tokens.text.primary,
                        fontWeight: 750,
                        fontSize: '0.74rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {prospect.assignedTo}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        fontSize: '0.64rem',
                        mt: 0.1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Added: {prospect.addedDate}
                    </Typography>
                  </TableCell>

                  {/* Actions & Qualify */}
                  <TableCell align="right" sx={{ py: 1, pr: 1.5, minWidth: 110 }}>
                    <Box sx={{ display: 'flex', gap: 0.35, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap' }}>
                      <Tooltip title="View lead details" arrow>
                        <IconButton
                          size="small"
                          sx={{
                            p: 0.4,
                            color: 'text.secondary',
                            '&:hover': { color: tokens.brand.primary },
                          }}
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Track lead activity" arrow>
                        <IconButton
                          size="small"
                          sx={{
                            p: 0.4,
                            color: 'text.secondary',
                            '&:hover': { color: tokens.brand.primary },
                          }}
                        >
                          <TimelineOutlinedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>

                      {prospect.isQualified ? (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: '11px !important' }} />}
                          label="Qualified"
                          size="small"
                          onClick={() => handleToggleQualify(prospect.id)}
                          sx={{
                            bgcolor: 'rgba(16, 185, 129, 0.12)',
                            color: '#10B981',
                            fontWeight: 800,
                            fontSize: '0.62rem',
                            height: 22,
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        />
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<StarIcon sx={{ fontSize: '11px !important' }} />}
                          onClick={() => handleToggleQualify(prospect.id)}
                          sx={{
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.64rem',
                            height: 22,
                            px: 0.85,
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                            color: 'text.secondary',
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              bgcolor: tokens.brand.primary,
                              borderColor: tokens.brand.primary,
                              color: '#FFFFFF',
                            },
                          }}
                        >
                          Qualify
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
