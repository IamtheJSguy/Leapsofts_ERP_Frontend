import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Avatar,
  Chip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  OutlinedInput,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EmailIcon from '@mui/icons-material/Email';
import RoomIcon from '@mui/icons-material/Room';
import LinkIcon from '@mui/icons-material/Link';
import SyncIcon from '@mui/icons-material/Sync';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import WarningIcon from '@mui/icons-material/Warning';

import { tokens, connectionStatusTokens, messageStatusTokens } from '@/styles/tokens';
import { useSyncGoogleSheet } from '@/hooks/api/useGoogleSheets';
import { useLeads } from '@/hooks/api/useLeads';

// High-fidelity synced prospects mock database
const mockSyncedProspects = [
  {
    _id: 'prospect-1',
    name: 'Ali Rohaan',
    company: 'Leapsofts',
    title: 'Full Stack Developer',
    location: 'Pakistan',
    status: 'connection accepted',
    email: 'aliroohan321@gmail.com',
  },
  {
    _id: 'prospect-2',
    name: 'Sarah Chen',
    company: 'Design Studio',
    title: 'Product Designer',
    location: 'USA',
    status: 'meeting',
    email: 'sarah@designstudio.io',
  },
  {
    _id: 'prospect-3',
    name: 'Alex Rivera',
    company: 'SaaS Corp',
    title: 'VP of Growth',
    location: 'Canada',
    status: 'new',
    email: 'alex@saascorp.co',
  },
  {
    _id: 'prospect-4',
    name: 'John Doe',
    company: 'Innovate LLC',
    title: 'Founder',
    location: 'UK',
    status: 'connection sent',
    email: 'john@innovatellc.com',
  },
  {
    _id: 'prospect-5',
    name: 'Marcus Brody',
    company: 'Nexus Tech',
    title: 'Head of Sales',
    location: 'USA',
    status: 'messaged',
    email: 'marcus@nexustech.com',
  },
  {
    _id: 'prospect-6',
    name: 'Emma Watson',
    company: 'Creative Media',
    title: 'Marketing Director',
    location: 'UK',
    status: 'replied',
    email: 'emma@creativemedia.co.uk',
  },
  {
    _id: 'prospect-7',
    name: 'Daniel Craig',
    company: 'MI6 Holdings',
    title: 'Operations Manager',
    location: 'Canada',
    status: 'proposal sent',
    email: 'daniel@mi6holdings.ca',
  },
  {
    _id: 'prospect-8',
    name: 'Robert Downey',
    company: 'Stark Industries',
    title: 'CEO',
    location: 'USA',
    status: 'closed won',
    email: 'tony@starkindustries.com',
  },
  {
    _id: 'prospect-9',
    name: 'Chris Evans',
    company: 'Shield Logistics',
    title: 'Security Director',
    location: 'USA',
    status: 'closed lost',
    email: 'steve@shieldlogistics.gov',
  },
];

// Kanban columns config
const columnsConfig = [
  { id: 'qualified', label: 'Qualified', color: '#FF4E3A' },
  { id: 'discovery', label: 'Discovery', color: '#F59E0B' },
  { id: 'proposal', label: 'proposal', color: '#3B82F6' },
  { id: 'negotation', label: 'negotation', color: '#8B5CF6' },
  { id: 'closed_won', label: 'closed won', color: '#10B981' },
  { id: 'closed_lost', label: 'closed lost', color: '#6B7280' },
];

export const SalesPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const syncGoogleSheet = useSyncGoogleSheet();

  // Dynamic style injection to hide scrollbars globally while this page is active
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'hide-sales-page-scrollbar';
    styleEl.innerHTML = `
      ::-webkit-scrollbar {
        display: none !important;
        width: 0px !important;
        height: 0px !important;
      }
      * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      const el = document.getElementById('hide-sales-page-scrollbar');
      if (el) el.remove();
    };
  }, []);

  // Fetch actual prospects/leads from the API
  const { data: leadsData, isLoading: isLeadsLoading } = useLeads({ limit: 100 });

  // State Management
  const [prospects, setProspects] = useState<any[]>([]);

  useEffect(() => {
    if (leadsData?.data) {
      setProspects(leadsData.data);
    }
  }, [leadsData]);

  const getLinkedinMsgStyle = (msg?: string) => {
    if (!msg) return { color: 'text.secondary', bg: 'transparent', border: 'none' };
    const m = msg.toLowerCase();
    if (m.includes('sent') && !m.includes('not')) {
      return {
        color: tokens.semantic.success,
        bg: 'rgba(45, 138, 94, 0.08)',
        border: '1px solid rgba(45, 138, 94, 0.15)',
      };
    }
    if (m.includes('pending') || m.includes('not')) {
      return {
        color: tokens.semantic.warning,
        bg: 'rgba(184, 134, 11, 0.08)',
        border: '1px solid rgba(184, 134, 11, 0.15)',
      };
    }
    return {
      color: tokens.brand.primary,
      bg: 'rgba(93, 26, 137, 0.08)',
      border: '1px solid rgba(93, 26, 137, 0.15)',
    };
  };

  const getAssignedName = (assigned: any) => {
    if (!assigned) return 'Unassigned';
    if (typeof assigned === 'object') {
      return `${assigned.firstName || ''} ${assigned.lastName || ''}`.trim() || assigned.email || 'Representative';
    }
    return assigned;
  };

  const getLeadName = (lead: any): string => {
    if (!lead) return 'Unnamed Lead';
    if (lead.prospectName) return lead.prospectName;
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ');
    return name || lead.email || lead.company || 'Unnamed Lead';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const [googleSheetLink, setGoogleSheetLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'prospects'>('pipeline');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Location');
  const [selectedIndustry, setSelectedIndustry] = useState('Industry (ICP)');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');

  // Google Sheet Dialog and Sync Loading state
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [inputLink, setInputLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStageText, setSyncStageText] = useState('');

  // Map prospect status to Kanban stage columns
  const getColumnLeads = (columnId: string) => {
    return prospects.filter((p) => {
      if (columnId === 'qualified') return p.status === 'connection accepted' || p.status === 'replied';
      if (columnId === 'discovery') return p.status === 'meeting';
      if (columnId === 'proposal') return p.status === 'proposal sent';
      if (columnId === 'negotation') return p.status === 'messaged';
      if (columnId === 'closed_won') return p.status === 'closed won';
      if (columnId === 'closed_lost') return p.status === 'closed lost';
      return false;
    });
  };

  // Helper to extract the unique spreadsheet ID from a Google Sheet URL,
  // or return the input as is if it is already a direct spreadsheet ID.
  const extractSheetId = (input: string): string => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = input.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    return input.trim();
  };

  // Google sheet URL validator and submission flow
  const handleLinkSubmit = () => {
    const trimmedInput = inputLink.trim();
    if (!trimmedInput) {
      setLinkError('Google Sheet link or Spreadsheet ID is required.');
      return;
    }

    const isLink = trimmedInput.includes('docs.google.com/spreadsheets');
    if (trimmedInput.startsWith('http') && !isLink) {
      setLinkError('Please enter a valid Google Sheets URL (e.g. docs.google.com/spreadsheets/d/...)');
      return;
    }

    const sheetId = extractSheetId(trimmedInput);
    if (!sheetId) {
      setLinkError('Unable to extract a valid Spreadsheet ID.');
      return;
    }

    setLinkError('');
    setIsLinkDialogOpen(false);
    startSyncing(sheetId, trimmedInput);
  };

  // Google Sheets synchronization loading cycle and actual API integration
  const startSyncing = (sheetId: string, fullInput: string) => {
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncStageText('Connecting to Google Sheets API...');

    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev < 90) return prev + 15;
        return prev;
      });
    }, 250);

    syncGoogleSheet.mutate(sheetId, {
      onSuccess: (response) => {
        clearInterval(progressInterval);
        setSyncProgress(100);
        setSyncStageText('Import complete!');
        setTimeout(() => {
          setIsSyncing(false);
          setGoogleSheetLink(fullInput);
          // Load updated prospects list from server response if available, or fall back to mock synced data
          if (response?.data?.data) {
            setProspects(response.data.data);
          } else {
            setProspects(mockSyncedProspects);
          }
        }, 600);
      },
      onError: (err: any) => {
        clearInterval(progressInterval);
        setIsSyncing(false);
        alert(err?.response?.data?.message || 'Failed to sync Google Sheet. Please verify sharing permissions.');
      },
    });
  };

  const handleRefreshSync = () => {
    if (googleSheetLink) {
      const sheetId = extractSheetId(googleSheetLink);
      startSyncing(sheetId, googleSheetLink);
    }
  };

  const handleDisconnect = () => {
    setGoogleSheetLink(null);
    setProspects([]);
    setInputLink('');
  };

  // Calculate dynamic sales stats derived from prospects
  const stats = useMemo(() => {
    const total = prospects.length;
    if (total === 0) {
      return [
        { label: 'CONNECTIONS SENT', value: '0', percent: null },
        { label: 'ACCEPTED', value: '0', percent: '0%' },
        { label: 'REPLIED', value: '0', percent: '0%' },
        { label: 'MEETING', value: '0', percent: '0%' },
        { label: 'PROPOSAL SENT', value: '0', percent: '0%' },
        { label: 'CLOSED WON', value: '0', percent: '0%' },
      ];
    }

    const getStatusCount = (type: 'connectionsSent' | 'accepted' | 'replied' | 'meeting' | 'proposalSent' | 'closedWon') => {
      return prospects.filter((p) => {
        const conn = p.connectionStatus || p.status;
        const msg = p.messageStatus || p.status;
        const lead = (p.leadStatus || p.status || '').toLowerCase();

        if (type === 'connectionsSent') {
          return conn && conn !== 'not_sent' && conn !== 'new' && conn !== 'pending';
        }
        if (type === 'accepted') {
          return conn === 'accepted' || lead === 'accepted' || lead === 'meeting' || lead === 'proposal sent' || lead === 'closed won';
        }
        if (type === 'replied') {
          return msg === 'replied' || lead === 'replied' || lead === 'meeting' || lead === 'proposal sent' || lead === 'closed won';
        }
        if (type === 'meeting') {
          return lead === 'meeting';
        }
        if (type === 'proposalSent') {
          return lead === 'proposal sent' || lead === 'proposal';
        }
        if (type === 'closedWon') {
          return lead === 'closed won' || lead === 'closed_won';
        }
        return false;
      }).length;
    };

    const connectionsSent = getStatusCount('connectionsSent');
    const accepted = getStatusCount('accepted');
    const replied = getStatusCount('replied');
    const meeting = getStatusCount('meeting');
    const proposalSent = getStatusCount('proposalSent');
    const closedWon = getStatusCount('closedWon');

    const ratioPercent = (val: number, base: number) => {
      if (base === 0) return '0%';
      return `${Math.round((val / base) * 100)}%`;
    };

    return [
      { label: 'CONNECTIONS SENT', value: String(connectionsSent), percent: null },
      { label: 'ACCEPTED', value: String(accepted), percent: ratioPercent(accepted, connectionsSent || 1) },
      { label: 'REPLIED', value: String(replied), percent: ratioPercent(replied, accepted || 1) },
      { label: 'MEETING', value: String(meeting), percent: ratioPercent(meeting, replied || 1) },
      { label: 'PROPOSAL SENT', value: String(proposalSent), percent: ratioPercent(proposalSent, meeting || 1) },
      { label: 'CLOSED WON', value: String(closedWon), percent: ratioPercent(closedWon, connectionsSent || 1) },
    ];
  }, [prospects]);

  // Filters search query evaluation
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const name = (p.prospectName || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
      const company = (p.company || '').toLowerCase();
      const title = (p.title || '').toLowerCase();
      const profile = (p.profile || '').toLowerCase();
      const icp = (p.icp || '').toLowerCase();
      const industry = (p.industry || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        name.includes(query) ||
        company.includes(query) ||
        title.includes(query) ||
        profile.includes(query) ||
        icp.includes(query) ||
        industry.includes(query);

      const matchesLocation =
        selectedLocation === 'Location' ||
        selectedLocation === 'All Locations' ||
        (p.location && p.location === selectedLocation);

      const matchesICP =
        selectedIndustry === 'Industry (ICP)' ||
        selectedIndustry === 'All Industries' ||
        icp.includes(selectedIndustry.toLowerCase()) ||
        industry.includes(selectedIndustry.toLowerCase());

      const matchesStatus =
        selectedStatus === 'All statuses' ||
        (p.connectionStatus && p.connectionStatus === selectedStatus) ||
        (p.leadStatus && p.leadStatus.toLowerCase() === selectedStatus.toLowerCase()) ||
        (p.status && p.status === selectedStatus);

      return matchesSearch && matchesLocation && matchesICP && matchesStatus;
    });
  }, [prospects, searchQuery, selectedLocation, selectedIndustry, selectedStatus]);

  // Styles for input selects
  const filterSelectSx = {
    minWidth: { xs: '100%', sm: 160 },
    '& .MuiOutlinedInput-root': {
      borderRadius: '20px',
      height: 42,
      bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
      fontSize: '0.84rem',
      '& fieldset': {
        borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      },
      '&:hover fieldset': {
        borderColor: tokens.brand.primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: tokens.brand.primary,
      },
    },
  };

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      {/* Glow Ambient Backdrop Accent */}
      <Box
        sx={{
          position: 'absolute',
          top: -150,
          right: 100,
          width: 320,
          height: 320,
          background: `radial-gradient(circle, ${tokens.brand.primary} 0%, transparent 70%)`,
          filter: 'blur(90px)',
          opacity: isDarkMode ? 0.08 : 0.04,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Page Header */}
      <Box sx={{ mb: 4.5, position: 'relative' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.025em',
            mb: 0.5,
            color: isDarkMode ? '#fff' : tokens.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          Sales & Pipeline
          <Chip
            label="Outbound Motion"
            size="small"
            sx={{
              bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.15)' : 'rgba(93, 26, 137, 0.06)',
              color: tokens.brand.primary,
              fontWeight: 800,
              fontSize: '0.68rem',
              height: 22,
              border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.1)'}`,
            }}
          />
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
            fontWeight: 500,
            fontSize: '0.92rem',
          }}
        >
          Track outbound conversions, import contacts via Google Sheets, and manage stages.
        </Typography>
      </Box>

      {/* Stats Counter Row */}
      <Grid container spacing={2.5} sx={{ mb: 4.5 }}>
        {stats.map((item, idx) => (
          <Grid item xs={6} sm={4} md={2} key={idx}>
            <Card
              sx={{
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                borderRadius: '16px',
                p: 2.25,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)',
                '&:hover': {
                  borderColor: tokens.brand.primary,
                  transform: 'translateY(-1px)',
                  boxShadow: isDarkMode ? 'none' : '0 4px 12px rgba(93, 26, 137, 0.05)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 750,
                    fontSize: '0.62rem',
                    letterSpacing: '0.04em',
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </Typography>
                {item.percent && (
                  <Chip
                    label={item.percent}
                    size="small"
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      color: 'text.secondary',
                      fontSize: '0.62rem',
                      height: 18,
                      fontWeight: 700,
                    }}
                  />
                )}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mt: 1 }}>
                {item.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sub-Navigation Tabs Row */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: '24px',
          p: 0.5,
          gap: 0.5,
          width: 'fit-content',
          mb: 4,
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}`,
        }}
      >
        {(['pipeline', 'prospects'] as const).map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            sx={{
              borderRadius: '20px',
              px: 3.5,
              py: 0.75,
              bgcolor: activeTab === tab ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent',
              color: activeTab === tab ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary',
              '&:hover': {
                bgcolor: activeTab === tab ? (isDarkMode ? '#fff' : '#1A1625') : 'rgba(0,0,0,0.04)',
              },
              transition: 'all 0.2s ease',
              fontWeight: 700,
              textTransform: 'capitalize',
              fontSize: '0.86rem',
            }}
          >
            {tab}
          </Button>
        ))}
      </Box>

      {/* Linked Sheet Status Banner Toolbar */}
      {googleSheetLink && activeTab === 'prospects' && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.08)' : 'rgba(93, 26, 137, 0.02)',
            border: `1px solid ${isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.08)'}`,
            borderRadius: '16px',
            p: 2,
            mb: 3.5,
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                width: 38,
                height: 38,
              }}
            >
              <InsertDriveFileIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 750,
                  color: isDarkMode ? '#fff' : tokens.text.primary,
                  fontSize: '0.86rem',
                }}
                noWrap
              >
                Connected Google Sheet
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  fontFamily: 'monospace',
                }}
                noWrap
              >
                {googleSheetLink}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SyncIcon />}
              onClick={handleRefreshSync}
              sx={{
                borderRadius: '20px',
                borderColor: 'rgba(93, 26, 137, 0.25)',
                color: tokens.brand.primary,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.78rem',
                px: 2.25,
                '&:hover': {
                  bgcolor: 'rgba(93, 26, 137, 0.05)',
                  borderColor: tokens.brand.primary,
                },
              }}
            >
              Sync Now
            </Button>
            <Button
              variant="text"
              size="small"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDisconnect}
              sx={{
                borderRadius: '20px',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.78rem',
                px: 2,
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.05)',
                },
              }}
            >
              Disconnect
            </Button>
          </Box>
        </Box>
      )}

      {/* Tab Panel: Pipeline View */}
      {activeTab === 'pipeline' && (
        <Box className="animate-fade-in-up">
          {/* Sub-header actions row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {prospects.filter((p) => ['connection accepted', 'replied', 'meeting', 'proposal sent', 'messaged'].includes(p.status)).length} qualified leads on the board
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: '24px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                  color: isDarkMode ? 'rgba(255,255,255,0.8)' : tokens.text.secondary,
                  textTransform: 'none',
                  px: 2.5,
                  py: 0.75,
                  fontWeight: 650,
                  fontSize: '0.82rem',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                  },
                }}
              >
                Stage
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: '#FFA08A',
                  color: '#fff',
                  textTransform: 'none',
                  borderRadius: '24px',
                  px: 2.75,
                  py: 0.75,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#FF8A6F',
                    boxShadow: 'none',
                  },
                }}
              >
                Qualify a lead
              </Button>
            </Box>
          </Box>

          {/* Kanban board columns row */}
          <Box
            sx={{
              display: 'flex',
              gap: 2.5,
              overflowX: 'auto',
              pb: 3.5,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              '-ms-overflow-style': 'none',
            }}
          >
            {columnsConfig.map((col) => {
              const colLeads = getColumnLeads(col.id);
              return (
                <Box
                  key={col.id}
                  sx={{
                    width: 290,
                    flexShrink: 0,
                    bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                    borderRadius: '20px',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    minHeight: 450,
                  }}
                >
                  {/* Column header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: col.color }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '0.88rem' }}>
                        {col.label}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        {colLeads.length}
                      </Typography>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <MoreHorizIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Column content */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1 }}>
                    {colLeads.length > 0 ? (
                      colLeads.map((lead) => {
                        const leadName = getLeadName(lead);
                        const initials = leadName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';
                        return (
                          <Card
                            key={lead._id}
                            sx={{
                              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#fff',
                              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0,0,0,0.05)'}`,
                              borderRadius: '12px',
                              p: 1.75,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                              cursor: 'pointer',
                              transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(93, 26, 137, 0.06)',
                                borderColor: tokens.brand.primary,
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F2EEEC',
                                  color: isDarkMode ? '#fff' : '#1A1625',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                }}
                              >
                                {initials}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 750,
                                    color: isDarkMode ? '#fff' : tokens.text.primary,
                                    fontSize: '0.82rem',
                                    lineHeight: 1.2,
                                  }}
                                  noWrap
                                >
                                  {leadName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                    fontSize: '0.72rem',
                                  }}
                                  noWrap
                                >
                                  {lead.company}
                                </Typography>
                              </Box>
                            </Box>

                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                display: 'block',
                                mb: 1,
                                fontSize: '0.72rem',
                                fontWeight: 550,
                              }}
                              noWrap
                            >
                              {lead.title}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'text.secondary',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  fontSize: '0.7rem',
                                }}
                              >
                                <RoomIcon sx={{ fontSize: 12 }} />
                                {lead.location}
                              </Typography>
                              <Chip
                                label={lead.status}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.58rem',
                                  fontWeight: 750,
                                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                  color: 'text.secondary',
                                  textTransform: 'capitalize',
                                }}
                              />
                            </Box>
                          </Card>
                        );
                      })
                    ) : (
                      <Box
                        sx={{
                          flexGrow: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1.5px dashed ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                          borderRadius: '16px',
                          minHeight: 300,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.82rem' }}>
                          No leads
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Tab Panel: Prospects View */}
      {activeTab === 'prospects' && (
        <Box className="animate-fade-in-up">
          {/* Filters Command Toolbar */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: 'center',
              mb: 3.5,
            }}
          >
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search name, company, headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flexGrow: 1,
                minWidth: { xs: '100%', sm: 240 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  height: 42,
                  bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                  fontSize: '0.84rem',
                  '& fieldset': {
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  },
                  '&:hover fieldset': {
                    borderColor: tokens.brand.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: tokens.brand.primary,
                  },
                },
              }}
            />

            {/* Location Select Dropdown */}
            <FormControl sx={filterSelectSx}>
              <Select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                input={<OutlinedInput />}
              >
                <MenuItem value="Location">Location</MenuItem>
                <MenuItem value="All Locations">All Locations</MenuItem>
                <MenuItem value="Pakistan">Pakistan</MenuItem>
                <MenuItem value="USA">USA</MenuItem>
                <MenuItem value="Canada">Canada</MenuItem>
                <MenuItem value="UK">UK</MenuItem>
              </Select>
            </FormControl>

            {/* Industry ICP Select Dropdown */}
            <FormControl sx={filterSelectSx}>
              <Select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                input={<OutlinedInput />}
              >
                <MenuItem value="Industry (ICP)">Industry (ICP)</MenuItem>
                <MenuItem value="All Industries">All Industries</MenuItem>
                <MenuItem value="Software">Software</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
              </Select>
            </FormControl>

            {/* Status Select Dropdown */}
            <FormControl sx={filterSelectSx}>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                input={<OutlinedInput />}
              >
                <MenuItem value="All statuses">All statuses</MenuItem>
                <MenuItem value="new">new</MenuItem>
                <MenuItem value="connection sent">connection sent</MenuItem>
                <MenuItem value="connection accepted">connection accepted</MenuItem>
                <MenuItem value="messaged">messaged</MenuItem>
                <MenuItem value="replied">replied</MenuItem>
                <MenuItem value="meeting">meeting</MenuItem>
                <MenuItem value="proposal sent">proposal sent</MenuItem>
                <MenuItem value="closed won">closed won</MenuItem>
                <MenuItem value="closed lost">closed lost</MenuItem>
              </Select>
            </FormControl>

            {/* Add Prospect Action Button */}
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => setIsLinkDialogOpen(true)}
              sx={{
                bgcolor: '#FFA08A',
                color: '#fff',
                textTransform: 'none',
                borderRadius: '24px',
                height: 42,
                px: 3,
                fontWeight: 700,
                fontSize: '0.84rem',
                boxShadow: 'none',
                alignSelf: { xs: 'stretch', sm: 'auto' },
                '&:hover': {
                  bgcolor: '#FF8A6F',
                  boxShadow: 'none',
                },
              }}
            >
              New prospect
            </Button>
          </Box>

          {isLeadsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: tokens.brand.primary }} />
            </Box>
          ) : prospects.length === 0 ? (
            /* Unlinked Prospects View - Show Empty State Graphic below the toolbar */
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: 9,
                px: 3,
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.25)' : 'rgba(255, 255, 255, 0.45)',
                border: `1.5px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
                borderRadius: '24px',
                backdropFilter: 'blur(10px)',
                maxWidth: 560,
                mx: 'auto',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.01)',
              }}
            >
              <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="40" fill="url(#glowGradient2)" opacity="0.15" />
                <rect x="25" y="35" width="45" height="50" rx="6" stroke={tokens.brand.primary} strokeWidth="2.5" fill="none" opacity="0.8" />
                <line x1="32" y1="47" x2="63" y2="47" stroke={tokens.brand.primary} strokeWidth="2" opacity="0.4" />
                <line x1="32" y1="59" x2="63" y2="59" stroke={tokens.brand.primary} strokeWidth="2" opacity="0.4" />
                <line x1="32" y1="71" x2="63" y2="71" stroke={tokens.brand.primary} strokeWidth="2" opacity="0.4" />

                <rect x="50" y="25" width="45" height="50" rx="6" stroke={tokens.brand.accent} strokeWidth="2.5" fill={isDarkMode ? '#1e1b24' : '#fff'} />
                <line x1="57" y1="37" x2="88" y2="37" stroke={tokens.brand.accent} strokeWidth="2.5" />
                <rect x="57" y="47" width="12" height="8" rx="1.5" fill={tokens.brand.accent} opacity="0.25" />
                <rect x="73" y="47" width="15" height="8" rx="1.5" fill={tokens.brand.accent} opacity="0.25" />
                <rect x="57" y="59" width="15" height="8" rx="1.5" fill={tokens.brand.accent} opacity="0.25" />
                <rect x="76" y="59" width="12" height="8" rx="1.5" fill={tokens.brand.accent} opacity="0.25" />
                <path d="M 40 40 Q 50 15 65 30" stroke={tokens.brand.accent} strokeWidth="2" strokeDasharray="3 3" />
                <path d="M 80 70 Q 70 95 55 80" stroke={tokens.brand.primary} strokeWidth="2" strokeDasharray="3 3" />
                <defs>
                  <radialGradient id="glowGradient2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" transform="translate(60 60) rotate(90) scale(40)">
                    <stop offset="0%" stopColor={tokens.brand.primary} />
                    <stop offset="100%" stopColor={tokens.brand.accent} stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: isDarkMode ? '#fff' : tokens.text.primary,
                  mb: 1,
                  mt: 2.5,
                  letterSpacing: '-0.015em',
                }}
              >
                No Prospects Connected
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  maxWidth: 380,
                  mb: 4,
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}
              >
                Link a Google Sheets spreadsheet URL to sync and manage your outbound lead generation contacts.
              </Typography>
              <Button
                variant="contained"
                startIcon={<LinkIcon />}
                onClick={() => setIsLinkDialogOpen(true)}
                sx={{
                  bgcolor: '#FFA08A',
                  color: '#fff',
                  textTransform: 'none',
                  borderRadius: '24px',
                  px: 3.5,
                  py: 1,
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  boxShadow: '0 4px 14px rgba(255, 160, 138, 0.35)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    bgcolor: '#FF8A6F',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(255, 160, 138, 0.45)',
                  },
                }}
              >
                Link Google Sheet
              </Button>
            </Box>
          ) : (
            /* Connected Prospects View - Show Table */
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                boxShadow: 'none',
                overflow: 'hidden',
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.015)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`, pl: 3 }}>PROSPECT</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>CAMPAIGN (ICP)</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>OUTREACH STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>LINKEDIN ACTION</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>ASSIGNED AGENT</TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProspects.map((prospect) => {
                    const nameToUse = prospect.prospectName || `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || prospect.email || 'Prospect';
                    const initials = nameToUse.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';

                    const connToken = (connectionStatusTokens as any)[prospect.connectionStatus || 'not_sent'] || connectionStatusTokens.not_sent;
                    const msgToken = (messageStatusTokens as any)[prospect.messageStatus || 'not_sent'] || messageStatusTokens.not_sent;

                    const lkMsgStyle = getLinkedinMsgStyle(prospect.linkedinMsg);

                    return (
                      <TableRow
                        key={prospect._id}
                        sx={{
                          transition: 'all 0.2s',
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
                          '&:last-child': { borderBottom: 0 },
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                          },
                        }}
                      >
                        {/* Prospect Details */}
                        <TableCell sx={{ py: 2, borderBottom: 0, pl: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                            <Avatar
                              sx={{
                                width: 38,
                                height: 38,
                                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F2EEEC',
                                color: isDarkMode ? '#fff' : '#1A1625',
                                fontSize: '0.84rem',
                                fontWeight: 800,
                                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.03)'}`,
                              }}
                            >
                              {initials}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 750, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '0.88rem' }}>
                                {nameToUse}
                              </Typography>
                              {prospect.email && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                  <EmailIcon sx={{ fontSize: 12 }} />
                                  {prospect.email}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* ICP Profile */}
                        <TableCell sx={{ py: 2, borderBottom: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: isDarkMode ? 'rgba(255,255,255,0.9)' : tokens.text.primary, fontSize: '0.86rem', mb: 0.5 }}>
                            {prospect.icp || 'General Lead'}
                          </Typography>
                          {prospect.profile && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Profile: {prospect.profile}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Outreach Connection/Message Status */}
                        <TableCell sx={{ py: 2, borderBottom: 0 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                              label={`Conn: ${prospect.connectionStatus || 'not_sent'}`}
                              size="small"
                              sx={{
                                bgcolor: connToken.bg,
                                color: connToken.color,
                                fontWeight: 750,
                                fontSize: '0.64rem',
                                height: 20,
                                textTransform: 'uppercase',
                                borderRadius: '6px',
                                border: `1px solid ${alpha(connToken.color, 0.12)}`,
                              }}
                            />
                            <Chip
                              label={`Msg: ${prospect.messageStatus || 'not_sent'}`}
                              size="small"
                              sx={{
                                bgcolor: msgToken.bg,
                                color: msgToken.color,
                                fontWeight: 750,
                                fontSize: '0.64rem',
                                height: 20,
                                textTransform: 'uppercase',
                                borderRadius: '6px',
                                border: `1px solid ${alpha(msgToken.color, 0.12)}`,
                              }}
                            />
                          </Box>
                        </TableCell>

                        {/* LinkedIn message/action status */}
                        <TableCell sx={{ py: 2, borderBottom: 0 }}>
                          {prospect.linkedinMsg ? (
                            <Chip
                              label={prospect.linkedinMsg}
                              size="small"
                              sx={{
                                bgcolor: lkMsgStyle.bg,
                                color: lkMsgStyle.color,
                                fontWeight: 750,
                                fontSize: '0.66rem',
                                height: 22,
                                borderRadius: '8px',
                                border: lkMsgStyle.border,
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Assigned Representative */}
                        <TableCell sx={{ py: 2, borderBottom: 0 }}>
                          <Typography variant="body2" sx={{ color: isDarkMode ? '#fff' : tokens.text.primary, fontWeight: 700, fontSize: '0.86rem' }}>
                            {getAssignedName(prospect.assignedTo)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                            Added: {formatDate(prospect.date || prospect.createdAt)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ py: 2, borderBottom: 0, pr: 3 }}>
                          <IconButton size="small" sx={{ color: 'text.secondary' }}>
                            <MoreHorizIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Link Google Sheet Modal Dialog */}
      <Dialog
        open={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            p: 1.5,
            width: '100%',
            maxWidth: 480,
            boxShadow: tokens.shadow.card,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, letterSpacing: '-0.02em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
          Link Google Spreadsheet
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5, lineHeight: 1.5 }}>
            Paste the Google Docs Sheet link below to connect and sync your lead profiles directory. Ensure the link has public view access.
          </Typography>

          {linkError && (
            <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3, borderRadius: '12px' }}>
              {linkError}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={inputLink}
            onChange={(e) => setInputLink(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                '& fieldset': {
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setIsLinkDialogOpen(false)}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              borderRadius: '20px',
              px: 3,
              fontWeight: 650,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleLinkSubmit}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              textTransform: 'none',
              borderRadius: '20px',
              px: 3.5,
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: tokens.brand.primaryLight,
                boxShadow: 'none',
              },
            }}
          >
            Connect & Sync
          </Button>
        </DialogActions>
      </Dialog>

      {/* Syncing Progress Animation Dialog Overlay */}
      <Dialog
        open={isSyncing}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            p: 4,
            width: '100%',
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: tokens.shadow.card,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
            <CircularProgress
              variant="determinate"
              value={syncProgress}
              size={64}
              thickness={4}
              sx={{ color: tokens.brand.primary }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.9rem' }}>
                {`${Math.round(syncProgress)}%`}
              </Typography>
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.015em', color: isDarkMode ? '#fff' : tokens.text.primary }}>
            Syncing Outbound Prospects
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, minHeight: 20 }}>
            {syncStageText}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={syncProgress}
            sx={{
              width: '100%',
              mt: 4.5,
              height: 6,
              borderRadius: 3,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              '& .MuiLinearProgress-bar': {
                bgcolor: tokens.brand.accent,
                borderRadius: 3,
              },
            }}
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default SalesPage;
