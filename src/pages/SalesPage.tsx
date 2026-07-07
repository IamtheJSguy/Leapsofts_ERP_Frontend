import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Avatar,
  Chip,
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
  TablePagination,
  useTheme,
  alpha,
  Autocomplete,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import WarningIcon from '@mui/icons-material/Warning';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

import { tokens, connectionStatusTokens, messageStatusTokens } from '@/styles/tokens';
import { useSyncMySheet } from '@/hooks/api/useGoogleSheets';
import { useLeads, useQualifyLead } from '@/hooks/api/useLeads';
import { useSalesPipelineStats } from '@/hooks/api/useConnections';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/store/useUIStore';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { QualifyEnrichModal } from '@/components/leads/QualifyEnrichModal';
import SendIcon from '@mui/icons-material/Send';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ForumIcon from '@mui/icons-material/Forum';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useUpdateMe, useMe, useUsers } from '@/hooks/api/useUsers';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

export const SalesPage = () => {
  useMe(); // Fetch and hydrate store with latest profile data on mount
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';
  const { isAdmin } = usePermissions();
  const syncMySheet = useSyncMySheet();
  const updateMe = useUpdateMe();
  const qualifyLead = useQualifyLead();
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const handleAdminSync = () => {
    syncMySheet.mutate(undefined, {
      onSuccess: () => {
        addToast({ message: 'Sync triggered successfully.', severity: 'success' });
      },
      onError: () => {
        addToast({ message: 'Sync failed.', severity: 'error' });
      }
    });
  };

  const handleOpenQualifyConfirm = (leadId: string) => {
    setLeadIdToQualify(leadId);
    setConfirmQualifyOpen(true);
  };

  const handleQualifySuccess = (boardId?: string) => {
    addToast({ message: 'Lead qualified successfully! Board created.', severity: 'success' });
    setConfirmQualifyOpen(false);
    setLeadIdToQualify('');
    if (boardId) navigate(`/board/${boardId}`);
  };

  const getCardTheme = (label: string) => {
    switch (label) {
      case 'TOTAL PROSPECTS':
        return {
          icon: <SendIcon sx={{ fontSize: 20 }} />,
          color: tokens.brand.primary,
          bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.15)' : 'rgba(93, 26, 137, 0.08)',
          hoverBorder: tokens.brand.primary,
        };
      case 'ACCEPTED':
        return {
          icon: <GroupAddIcon sx={{ fontSize: 20 }} />,
          color: tokens.brand.accent,
          bgcolor: isDarkMode ? 'rgba(255, 127, 17, 0.15)' : 'rgba(255, 127, 17, 0.08)',
          hoverBorder: tokens.brand.accent,
        };
      case 'FOLLOW UP':
        return {
          icon: <ForumIcon sx={{ fontSize: 20 }} />,
          color: '#3B82F6',
          bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
          hoverBorder: '#3B82F6',
        };
      case 'QUALIFIED':
        return {
          icon: <EmojiEventsIcon sx={{ fontSize: 20 }} />,
          color: tokens.semantic.success,
          bgcolor: isDarkMode ? 'rgba(45, 138, 94, 0.15)' : 'rgba(45, 138, 94, 0.08)',
          hoverBorder: tokens.semantic.success,
        };
      case 'NOT SENT':
        return {
          icon: <EventIcon sx={{ fontSize: 20 }} />,
          color: '#F59E0B',
          bgcolor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
          hoverBorder: '#F59E0B',
        };
      case 'WAITING FOR REPLY':
        return {
          icon: <DescriptionIcon sx={{ fontSize: 20 }} />,
          color: '#EC4899',
          bgcolor: isDarkMode ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.08)',
          hoverBorder: '#EC4899',
        };
      default:
        return {
          icon: <SendIcon sx={{ fontSize: 20 }} />,
          color: tokens.brand.primary,
          bgcolor: 'rgba(0,0,0,0.05)',
          hoverBorder: tokens.brand.primary,
        };
    }
  };

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
  const activeTab = 'prospects'; // Pipeline tab removed per user request

  const { user } = useAuth();


  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('All Users');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [activeCard, setActiveCard] = useState('TOTAL PROSPECTS');

  const { data: usersData } = useUsers();
  const usersList = (usersData || []).filter((u: any) => u.role !== 'admin');

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 10);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedUserId, selectedStatus, activeCard]);

  const leadFilters = useMemo(() => {
    const filters: any = {
      page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(selectedUserId !== 'All Users' ? { assignedTo: selectedUserId } : {}),
      ...(selectedStatus !== 'All statuses' ? { messageStatus: selectedStatus } : {}),
    };

    if (activeCard === 'ACCEPTED') filters.connectionStatus = 'accepted';
    if (activeCard === 'FOLLOW UP') filters.messageStatus = 'follow_up';
    if (activeCard === 'QUALIFIED') filters.isQualified = true;
    if (activeCard === 'NOT SENT') filters.messageStatus = 'not_sent';
    if (activeCard === 'WAITING FOR REPLY') filters.messageStatus = 'sent';

    return filters;
  }, [page, rowsPerPage, debouncedSearch, selectedUserId, selectedStatus, activeCard]);

  const { data: leadsResponse, isLoading: isLeadsLoading, isFetching: isLeadsFetching } = useLeads(leadFilters);
  let prospects = leadsResponse?.data ?? [];
  if (selectedUserId !== 'All Users') {
    prospects = prospects.filter((p: any) =>
      p.assignedTo === selectedUserId || p.assignedTo?._id === selectedUserId
    );
  }
  const totalProspects = selectedUserId !== 'All Users' ? prospects.length : (leadsResponse?.meta.total ?? 0);
  const { data: pipelineStats, isLoading: isPipelineLoading } = useSalesPipelineStats();

  // Google Sheet Dialog and Sync Loading state
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [inputLink, setInputLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStageText, setSyncStageText] = useState('');

  // Qualify Lead Modal state
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);
  const [selectedLeadToQualify, setSelectedLeadToQualify] = useState<string>('');

  // Qualify Confirmation Dialog state
  const [confirmQualifyOpen, setConfirmQualifyOpen] = useState(false);
  const [leadIdToQualify, setLeadIdToQualify] = useState<string>('');

  useEffect(() => {
    if (user && (user as any).googleSheetId && !googleSheetLink && !inputLink) {
      const sheetId = (user as any).googleSheetId;
      setGoogleSheetLink(`https://docs.google.com/spreadsheets/d/${sheetId}`);
      setInputLink(`https://docs.google.com/spreadsheets/d/${sheetId}`);
    }
  }, [user, googleSheetLink, inputLink]);


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

    updateMe.mutate(
      { googleSheetId: sheetId } as any,
      {
        onSuccess: () => {
          syncMySheet.mutate(undefined, {
            onSuccess: () => {
              clearInterval(progressInterval);
              setSyncProgress(100);
              setSyncStageText('Import complete!');
              setTimeout(() => {
                setIsSyncing(false);
                setGoogleSheetLink(fullInput);
              }, 600);
            },
            onError: (err: any) => {
              clearInterval(progressInterval);
              setIsSyncing(false);
              alert(err?.response?.data?.message || 'Failed to sync Google Sheet. Please verify sharing permissions.');
            },
          });
        },
        onError: () => {
          clearInterval(progressInterval);
          setIsSyncing(false);
          alert('Failed to update user profile with sheet ID.');
        }
      }
    );
  };

  const handleRefreshSync = () => {
    if (googleSheetLink) {
      const sheetId = extractSheetId(googleSheetLink);
      startSyncing(sheetId, googleSheetLink);
    }
  };


  const stats = useMemo(() => {
    const pct = (value: number) => `${value}%`;

    if (!pipelineStats) {
      return [
        { label: 'TOTAL PROSPECTS', value: '0', percent: null },
        { label: 'ACCEPTED', value: '0', percent: '0%' },
        { label: 'FOLLOW UP', value: '0', percent: '0%' },
        { label: 'QUALIFIED', value: '0', percent: '0%' },
        { label: 'NOT SENT', value: '0', percent: '0%' },
        { label: 'WAITING FOR REPLY', value: '0', percent: '0%' },
      ];
    }

    const { conversionRates } = pipelineStats;

    return [
      { label: 'TOTAL PROSPECTS', value: String(pipelineStats.totalProspects), percent: null },
      { label: 'ACCEPTED', value: String(pipelineStats.acceptedConnections), percent: pct(conversionRates.acceptRate) },
      { label: 'FOLLOW UP', value: String(pipelineStats.messageStats?.follow_up || 0), percent: pct(conversionRates.conversationRate) },
      { label: 'QUALIFIED', value: String(pipelineStats.qualified), percent: pct(conversionRates.qualifiedRate) },
      { label: 'NOT SENT', value: String(pipelineStats.messageStats?.not_sent || 0), percent: pct(Math.round(((pipelineStats.messageStats?.not_sent || 0) / (pipelineStats.totalProspects || 1)) * 100)) },
      { label: 'WAITING FOR REPLY', value: String(pipelineStats.messageStats?.sent || 0), percent: pct(Math.round(((pipelineStats.messageStats?.sent || 0) / (pipelineStats.totalProspects || 1)) * 100)) },
    ];
  }, [pipelineStats]);

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
            flexWrap: 'wrap',
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
      {isPipelineLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, mb: 4.5 }}>
          <CircularProgress size={32} sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4.5 }}>
          {stats.map((item, idx) => {
            const theme = getCardTheme(item.label);
            return (
              <Grid item xs={6} sm={4} md={2} key={idx}>
                <Card
                  onClick={() => {
                    setActiveCard(item.label);
                    if (item.label === 'NOT SENT') setSelectedStatus('not_sent');
                    else if (item.label === 'WAITING FOR REPLY') setSelectedStatus('sent');
                    else if (item.label === 'FOLLOW UP') setSelectedStatus('follow_up');
                    else setSelectedStatus('All statuses');
                  }}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                    border: `2px solid ${activeCard === item.label ? theme.color : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)')}`,
                    borderRadius: '24px',
                    p: 2.25,
                    height: '100%',
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1.2, sm: 1.75 },
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: theme.hoverBorder,
                      transform: 'translateY(-3px)',
                      boxShadow: tokens.shadow.cardHover,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      bgcolor: theme.bgcolor,
                      color: theme.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {theme.icon}
                  </Box>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 750,
                          fontSize: '0.6rem',
                          letterSpacing: '0.04em',
                          lineHeight: 1.2,
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.label}
                      </Typography>
                      {item.percent && (
                        <Chip
                          label={item.percent}
                          size="small"
                          sx={{
                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            color: 'text.secondary',
                            fontSize: '0.58rem',
                            height: 16,
                            fontWeight: 800,
                            px: 0.2,
                            '& .MuiChip-label': { px: 0.75 }
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: theme.color, lineHeight: 1 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Sub-Navigation Tabs Row */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: '24px',
          p: 0.5,
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, ml: 1, py: 1 }}>
          Prospects List
        </Typography>
      </Box>

      {/* Linked Sheet Status Banner Toolbar */}
      {googleSheetLink && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
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
              flexDirection: { xs: 'column', md: 'row' },
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: { xs: 'stretch', md: 'center' },
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



            {/* User Search Autocomplete - Admin Only */}
            {isAdmin && (
              <Autocomplete
                options={[{ _id: 'All Users', label: 'All Users' }, ...usersList.map((u: any) => ({ _id: u._id, label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email }))]}
                getOptionLabel={(option) => option.label || ''}
                value={
                  selectedUserId === 'All Users'
                    ? { _id: 'All Users', label: 'All Users' }
                    : {
                      _id: selectedUserId, label: (() => {
                        const user = usersList.find((u: any) => u._id === selectedUserId);
                        return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown User';
                      })()
                    }
                }
                onChange={(e, newValue) => setSelectedUserId(newValue ? newValue._id : 'All Users')}
                disableClearable
                sx={{
                  flexGrow: 1,
                  minWidth: { xs: '100%', sm: 220 },
                  maxWidth: { sm: 260 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                    bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                    height: 42,
                    p: '0 12px',
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
                  '& .MuiAutocomplete-input': {
                    p: '0 !important',
                  },
                  '& .MuiAutocomplete-endAdornment': {
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search user..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PersonOutlineIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5, ml: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            )}

            {/* Status Select Dropdown */}
            <FormControl sx={filterSelectSx}>
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStatus(val);
                  if (val === 'not_sent') setActiveCard('NOT SENT');
                  else if (val === 'sent') setActiveCard('WAITING FOR REPLY');
                  else if (val === 'follow_up') setActiveCard('FOLLOW UP');
                  else setActiveCard('TOTAL PROSPECTS');
                }}
                input={<OutlinedInput />}
              >
                <MenuItem value="All statuses">All statuses</MenuItem>
                <MenuItem value="not_sent">Not Sent</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="replied">Replied</MenuItem>
                <MenuItem value="follow_up">Follow Up</MenuItem>
                <MenuItem value="negative">Negative</MenuItem>
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="future_lead">Future Lead</MenuItem>
              </Select>
            </FormControl>

            {/* Add Prospect Action Button */}
            <Button
              variant="contained"
              startIcon={isAdmin ? <SyncIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                if (isAdmin) {
                  handleAdminSync();
                } else {
                  setIsLinkDialogOpen(true);
                }
              }}
              sx={{
                bgcolor: tokens.brand.primary,
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
                  bgcolor: tokens.brand.primaryLight,
                  boxShadow: 'none',
                },
              }}
            >
              {isAdmin ? 'Sync Now' : 'Connect and sync'}
            </Button>
          </Box>

          {isLeadsLoading && !leadsResponse ? (
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
                overflowX: 'auto',
                overflowY: 'hidden',
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
                  {prospects.map((prospect) => {
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
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                            {prospect.isQualified ? (
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                label="Qualified"
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                                  color: '#10B981',
                                  fontWeight: 700,
                                  fontSize: '0.65rem',
                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                }}
                              />
                            ) : (
                              <Tooltip title={!isAdmin ? "Only administrators can qualify leads." : ""} arrow>
                                <span>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={!isAdmin ? <LockIcon sx={{ fontSize: '14px !important' }} /> : <StarIcon sx={{ fontSize: '14px !important' }} />}
                                    onClick={() => handleOpenQualifyConfirm(prospect._id)}
                                    disabled={!isAdmin || qualifyLead.isPending}
                                    sx={{
                                      borderRadius: '20px',
                                      textTransform: 'none',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                      color: 'text.secondary',
                                      '&:hover': {
                                        bgcolor: !isAdmin ? 'transparent' : tokens.brand.primary,
                                        borderColor: !isAdmin ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : tokens.brand.primary,
                                        color: !isAdmin ? 'text.secondary' : '#fff',
                                      },
                                      '&.Mui-disabled': {
                                        borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                                      }
                                    }}
                                  >
                                    Qualify
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {totalProspects > 0 && (
            <TablePagination
              component="div"
              count={totalProspects}
              page={page - 1}
              onPageChange={(_, newPage) => setPage(newPage + 1)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(1);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              sx={{
                mt: 1,
                borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                color: 'text.secondary',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontWeight: 600,
                  fontSize: '0.82rem',
                },
              }}
            />
          )}

          {isLeadsFetching && leadsResponse && (
            <LinearProgress sx={{ mt: -0.5, borderRadius: '0 0 12px 12px' }} />
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
      {/* Qualify a Lead Modal */}
      <Dialog
        open={isQualifyModalOpen}
        onClose={() => {
          setIsQualifyModalOpen(false);
          setSelectedLeadToQualify('');
        }}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? '#1e1b24' : '#fff',
            backgroundImage: 'none',
            minWidth: 400,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Qualify a Lead
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
            Move an unqualified prospect into your active pipeline.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3, pt: 2 }}>
          <FormControl fullWidth sx={filterSelectSx}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>
              SELECT PROSPECT
            </Typography>
            <Select
              value={selectedLeadToQualify}
              onChange={(e) => setSelectedLeadToQualify(e.target.value)}
              displayEmpty
              input={<OutlinedInput />}
            >
              <MenuItem value="" disabled>
                <em>Choose a prospect...</em>
              </MenuItem>
              {prospects
                .filter((p) => !p.isQualified && p.connectionStatus !== 'accepted')
                .map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {getLeadName(p)} {p.company ? `- ${p.company}` : ''}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setIsQualifyModalOpen(false);
              setSelectedLeadToQualify('');
            }}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '20px',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedLeadToQualify || qualifyLead.isPending}
            onClick={() => {
              if (selectedLeadToQualify) {
                const leadId = selectedLeadToQualify;
                setIsQualifyModalOpen(false);
                setSelectedLeadToQualify('');
                handleOpenQualifyConfirm(leadId);
              }
            }}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '20px',
              px: 3.5,
              '&:hover': { bgcolor: tokens.brand.primaryLight },
            }}
          >
            {qualifyLead.isPending ? 'Qualifying...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Qualify Lead Enrichment Modal */}
      <QualifyEnrichModal
        open={confirmQualifyOpen}
        leadId={leadIdToQualify}
        onSuccess={handleQualifySuccess}
        onClose={() => {
          setConfirmQualifyOpen(false);
          setLeadIdToQualify('');
        }}
      />
    </Box>
  );
};

export default SalesPage;
