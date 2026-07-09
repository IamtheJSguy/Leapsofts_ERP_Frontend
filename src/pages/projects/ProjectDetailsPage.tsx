import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  useTheme,
  Chip,
  IconButton,
  CircularProgress,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Divider,
  Autocomplete,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotesIcon from '@mui/icons-material/Notes';
import { tokens } from '@/styles/tokens';
import { useKanbanBoard, useShareBoard } from '@/hooks/api/useKanban';
import { useUsers } from '@/hooks/api/useUsers';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const TABS = ['Overview', 'Team'];

// Connection / message status display helpers
const connStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  not_sent:  { label: 'Not Sent',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  sent:      { label: 'Sent',      color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  accepted:  { label: 'Accepted',  color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  declined:  { label: 'Declined',  color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  no_response: { label: 'No Response', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

const msgStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  not_sent:    { label: 'Not Sent',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  sent:        { label: 'Msg Sent',    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  replied:     { label: 'Replied',     color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  follow_up:   { label: 'Follow Up',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  negative:    { label: 'Negative',    color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  positive:    { label: 'Positive',    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  future_lead: { label: 'Future Lead', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
};

const InfoRow = ({ icon, label, value, href }: { icon: React.ReactNode; label: string; value?: string; href?: string }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
      <Box sx={{ color: 'text.secondary', mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.25 }}>
          {label}
        </Typography>
        {href ? (
          <Typography
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            sx={{
              fontWeight: 650,
              color: tokens.brand.primary,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {value} <OpenInNewIcon sx={{ fontSize: 14 }} />
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 650, color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'text.primary', wordBreak: 'break-all' }}>
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export const ProjectDetailsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState(0);

  const { data: boardData, isLoading } = useKanbanBoard(projectId);
  const { data: dbUsers = [] } = useUsers();
  const shareBoardMutation = useShareBoard();
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [selectedUserVal, setSelectedUserVal] = useState<any | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const currentUser = useAuthStore((s) => s.user);
  const { isElevated } = useAuth();

  // Confirmation state for adding member
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [pendingAddUser, setPendingAddUser] = useState<any | null>(null);

  // Derived data from get board API
  const actualBoard = useMemo(() => boardData?.board, [boardData]);
  const isBoardOwner = useMemo(() => actualBoard?.ownerId === currentUser?._id, [actualBoard, currentUser]);
  const canManageTeam = isBoardOwner || isElevated;
  const cards = useMemo(() => boardData?.cards || [], [boardData]);

  // Lead: prefer board-level leadId (qualified lead linked to board), fallback to first card
  const leadInfo = useMemo(() => {
    const boardLead = actualBoard?.leadId;
    if (boardLead && typeof boardLead === 'object') return boardLead;
    if (!cards.length) return null;
    const firstCardLead = cards[0]?.leadId;
    return firstCardLead && typeof firstCardLead === 'object' ? firstCardLead : null;
  }, [actualBoard, cards]);

  // All lead cards for display (grouped by column)
  const cardsByColumn = useMemo(() => {
    if (!actualBoard?.columns || !cards.length) return {};
    const map: Record<string, any[]> = {};
    for (const col of actualBoard.columns) {
      map[col._id] = cards.filter((c: any) => c.columnId === col._id || c.columnId?.toString() === col._id?.toString());
    }
    return map;
  }, [actualBoard, cards]);

  const totalCards = cards.length;

  const boardMeta = useMemo(() => {
    if (!actualBoard) return null;
    const ownerUser = dbUsers.find((u) => u._id === actualBoard.ownerId);
    const sharedUserIds = Array.isArray(actualBoard.sharedWith) ? actualBoard.sharedWith : [];
    const sharedUsers = sharedUserIds.map((id: any) => dbUsers.find((u) => u._id === id)).filter(Boolean);
    const allMembers = [ownerUser, ...sharedUsers].filter(Boolean);
    return { ownerUser, sharedUserIds, sharedUsers, allMembers };
  }, [actualBoard, dbUsers]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  const boardName = actualBoard?.name || 'Board';

  // ─── Lead info from any card on this board ─────────────────────────
  // leadInfo is the populated leadId object from the first card
  const leadName =
    leadInfo
      ? ([leadInfo.firstName, leadInfo.lastName].filter(Boolean).join(' ').trim() || leadInfo.prospectName || leadInfo.company || boardName)
      : boardName;

  const connToken = connStatusConfig[leadInfo?.connectionStatus || 'not_sent'] || connStatusConfig.not_sent;
  const msgToken = msgStatusConfig[leadInfo?.messageStatus || 'not_sent'] || msgStatusConfig.not_sent;

  // Stage user and open confirmation
  const handleAddMember = () => {
    if (selectedUserToAdd && projectId && boardMeta && selectedUserVal) {
      setPendingAddUser(selectedUserVal);
      setConfirmAddOpen(true);
    }
  };

  // Execute actual share mutation after confirmation
  const handleConfirmAddMember = () => {
    if (pendingAddUser && projectId && boardMeta) {
      const updatedShared = [...boardMeta.sharedUserIds, pendingAddUser._id];
      shareBoardMutation.mutate({ boardId: projectId, userIds: updatedShared }, {
        onSuccess: () => {
          setSelectedUserToAdd('');
          setSelectedUserVal(null);
          setPendingAddUser(null);
          setConfirmAddOpen(false);
        },
        onError: () => {
          setPendingAddUser(null);
          setConfirmAddOpen(false);
        },
      });
    }
  };

  const confirmRemoveMember = () => {
    if (projectId && memberToRemove && boardMeta) {
      const updatedShared = boardMeta.sharedUserIds.filter((id: any) => id !== memberToRemove);
      shareBoardMutation.mutate({ boardId: projectId, userIds: updatedShared }, {
        onSuccess: () => setMemberToRemove(null),
        onError: () => setMemberToRemove(null),
      });
    }
  };

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon fontSize="small" />}
        onClick={() => navigate('/board')}
        sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start', mb: 2, '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
      >
        Back to Boards
      </Button>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          {/* Lead Avatar */}
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: tokens.brand.primaryMuted,
              fontWeight: 800,
              fontSize: '1.25rem',
              border: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            {leadName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                {leadName}
              </Typography>
              {leadInfo?.isQualified && (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                  label="Qualified Lead"
                  size="small"
                  sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700, fontSize: '0.72rem', border: '1px solid rgba(16,185,129,0.2)' }}
                />
              )}
            </Box>
            {leadInfo?.company && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <BusinessIcon sx={{ fontSize: 15 }} />
                {leadInfo.company}
                {leadInfo.jobTitle && ` · ${leadInfo.jobTitle}`}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Top-Right High Priority Call To Action */}
        <Button
          variant="contained"
          onClick={() => navigate(`/board/${projectId}/boards/${projectId}`)}
          startIcon={<DashboardCustomizeIcon sx={{ fontSize: 18 }} />}
          sx={{
            bgcolor: tokens.brand.primary,
            color: '#fff',
            fontWeight: 750,
            borderRadius: '24px',
            textTransform: 'none',
            px: 3.5,
            py: 1.25,
            boxShadow: 'none',
            fontSize: '0.86rem',
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            '&:hover': {
              bgcolor: tokens.brand.primaryLight,
              boxShadow: tokens.shadow.cardHover,
              transform: 'translateY(-2px)'
            },
          }}
        >
          Open Kanban Board
        </Button>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.75, mb: 4, p: 0.6,
          alignSelf: 'flex-start', borderRadius: '30px',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: '1px solid', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          overflowX: 'auto', whiteSpace: 'nowrap',
          scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {TABS.map((tab, idx) => {
          const isSelected = activeTab === idx;
          const activeColor = isDarkMode ? tokens.brand.primaryLight : tokens.brand.primary;
          const activeBg = isDarkMode ? 'rgba(123,61,168,0.12)' : 'rgba(93,26,137,0.08)';
          const activeBorder = isDarkMode ? 'rgba(123,61,168,0.3)' : 'rgba(93,26,137,0.25)';
          return (
            <Button
              key={tab}
              onClick={() => setActiveTab(idx)}
              sx={{
                textTransform: 'none', borderRadius: '24px', px: 3, py: 0.8, fontWeight: 700, fontSize: '0.86rem',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                bgcolor: isSelected ? activeBg : 'transparent',
                color: isSelected ? activeColor : 'text.secondary',
                border: '1px solid', borderColor: isSelected ? activeBorder : 'transparent',
                '&:hover': { transform: 'translateY(-1.5px)', bgcolor: isSelected ? activeBg : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'), color: isSelected ? activeColor : 'text.primary' },
              }}
            >
              {tab}
            </Button>
          );
        })}
      </Box>

      {/* Tab Content */}
      <Box sx={{ flexGrow: 1 }}>

        {/* ── OVERVIEW TAB ───────────────────────────────────────────── */}
        {activeTab === 0 && (
          <Box className="animate-fade-in-up" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>

            {/* Left — Lead Profile */}
            <Box
              sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: '24px',
                p: { xs: 2.5, sm: 4 },
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon sx={{ color: tokens.brand.primary, fontSize: 20 }} />
                Lead Profile
              </Typography>

              {/* Status Chips */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                <Chip
                  label={`Connection: ${connToken.label}`}
                  size="small"
                  sx={{ bgcolor: connToken.bg, color: connToken.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${connToken.color}30` }}
                />
                <Chip
                  label={`Message: ${msgToken.label}`}
                  size="small"
                  sx={{ bgcolor: msgToken.bg, color: msgToken.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${msgToken.color}30` }}
                />
                {leadInfo?.icp && (
                  <Chip
                    label={`ICP: ${leadInfo.icp}`}
                    size="small"
                    sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: 'text.secondary', fontWeight: 700, fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              <Divider sx={{ mb: 3, opacity: 0.5 }} />

              {/* Contact Info Rows */}
              {leadInfo ? (
                <>
                  <InfoRow icon={<EmailIcon sx={{ fontSize: 18 }} />} label="Email" value={leadInfo.email} href={leadInfo.email ? `mailto:${leadInfo.email}` : undefined} />
                  <InfoRow icon={<PhoneIcon sx={{ fontSize: 18 }} />} label="Phone" value={leadInfo.phone} />
                  <InfoRow icon={<LinkedInIcon sx={{ fontSize: 18 }} />} label="LinkedIn" value={leadInfo.linkedInUrl} href={leadInfo.linkedInUrl} />
                  <InfoRow icon={<BusinessIcon sx={{ fontSize: 18 }} />} label="Company" value={leadInfo.company} />
                  <InfoRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Job Title" value={leadInfo.jobTitle} />
                  <InfoRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />} label="Location" value={leadInfo.location} />
                  <InfoRow icon={<GroupIcon sx={{ fontSize: 18 }} />} label="Company Size" value={leadInfo.companySize} />
                  {leadInfo.profile && <InfoRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Profile" value={leadInfo.profile} />}
                  {leadInfo.notes && (
                    <>
                      <Divider sx={{ my: 2.5, opacity: 0.5 }} />
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <NotesIcon sx={{ color: 'text.secondary', mt: 0.25, fontSize: 18, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                            Notes
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65, fontStyle: 'italic' }}>
                            {leadInfo.notes}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  )}
                </>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  No lead profile data available. Open the Board tab to view the Kanban board.
                </Typography>
              )}

              {/* Profile Sections from lead or first card */}
              {((leadInfo?.profileSections?.length ?? 0) > 0 || (cards[0]?.profileSections?.length ?? 0) > 0) && (
                <>
                  <Divider sx={{ my: 3, opacity: 0.5 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                    Profile Sections
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(leadInfo?.profileSections || cards[0]?.profileSections || []).map((ps: any, i: number) => (
                      <Box
                        key={i}
                        sx={{
                          p: 2.5, borderRadius: '16px',
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 800, color: tokens.brand.primary, display: 'block', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {ps.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>
                          {ps.content}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>

            {/* Right — Stats */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <StatCard
                icon={<DashboardCustomizeIcon sx={{ color: tokens.brand.primary, fontSize: 22 }} />}
                count={actualBoard?.columns?.length || 0}
                label="Columns"
                iconBg={isDarkMode ? 'rgba(93,26,137,0.15)' : 'rgba(93,26,137,0.08)'}
                onClick={() => navigate(`/board/${projectId}/boards/${projectId}`)}
              />
              <StatCard
                icon={<GroupIcon sx={{ color: '#3B82F6', fontSize: 22 }} />}
                count={boardMeta?.allMembers?.length || 1}
                label="Team Members"
                iconBg="rgba(59,130,246,0.1)"
                onClick={() => setActiveTab(1)}
              />
              <StatCard
                icon={<CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />}
                count={totalCards}
                label="Cards on Board"
                iconBg="rgba(16,185,129,0.1)"
                onClick={() => navigate(`/board/${projectId}/boards/${projectId}`)}
              />
            </Box>
          </Box>
        )}

        {/* ── TEAM TAB ───────────────────────────────────────────────── */}
        {activeTab === 1 && (() => {
          const availableUsersToAdd = dbUsers.filter((u) =>
            u._id !== actualBoard?.ownerId && !(boardMeta?.sharedUserIds || []).includes(u._id)
          );

          return (
            <Box className="animate-fade-in-up" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Add Member */}
              {canManageTeam ? (
                <Box
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: '20px', p: 3,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Manage Board Team</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Add new members or modify permissions for this board.</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', minWidth: { xs: '100%', sm: 380 }, flex: { xs: 1, md: 'none' } }}>
                    <Autocomplete
                      size="small"
                      options={availableUsersToAdd}
                      getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email || ''}
                      value={selectedUserVal}
                      onChange={(event, newValue) => {
                        setSelectedUserVal(newValue);
                        setSelectedUserToAdd(newValue ? newValue._id : '');
                      }}
                      sx={{
                        flexGrow: 1,
                        minWidth: 240,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '24px',
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                          '& fieldset': {
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                          },
                          '&:hover fieldset': {
                            borderColor: tokens.brand.primaryMuted,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: tokens.brand.primary,
                            borderWidth: '1px',
                          },
                        },
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          placeholder="Search user to add..." 
                          variant="outlined" 
                        />
                      )}
                      renderOption={(props, option) => {
                        const fullName = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email || 'User';
                        const initial = (option.firstName?.charAt(0) || option.email?.charAt(0) || 'U').toUpperCase();
                        return (
                          <li {...props} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 12px' }}>
                            <Avatar sx={{ width: 26, height: 26, fontSize: '0.72rem', fontWeight: 700, bgcolor: tokens.brand.primaryMuted }}>
                              {initial}
                            </Avatar>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" sx={{ fontWeight: 650 }}>{fullName}</Typography>
                              {option.firstName && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{option.email}</Typography>
                              )}
                            </Box>
                          </li>
                        );
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddMember}
                      disabled={!selectedUserToAdd || shareBoardMutation.isPending}
                      startIcon={<PersonAddIcon />}
                      sx={{ 
                        bgcolor: tokens.brand.primary, 
                        borderRadius: '24px', 
                        textTransform: 'none', 
                        fontWeight: 700, 
                        boxShadow: 'none', 
                        height: 38,
                        px: 3, 
                        '&:hover': { bgcolor: tokens.brand.primaryLight, boxShadow: 'none' } 
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: '20px', p: 3,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Board Team</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Only the board owner can add or remove members from this board.</Typography>
                </Box>
              )}

              {/* Members List */}
              <Box
                sx={{
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: '24px', p: 3,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Board Members ({boardMeta?.allMembers?.length || 0})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {(boardMeta?.allMembers || []).map((m: any, idx: number) => {
                    const isOwner = m._id === actualBoard?.ownerId;
                    const fullName = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email || 'User';
                    const initial = (m.firstName?.charAt(0) || m.email?.charAt(0) || 'U').toUpperCase();
                    return (
                      <Box
                        key={m._id || idx}
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
                          p: 2, borderRadius: '16px',
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: tokens.brand.primaryMuted, fontWeight: 700 }}>{initial}</Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{fullName}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{m.email}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Chip
                            label={isOwner ? 'Board Owner' : 'Member'}
                            size="small"
                            sx={{ bgcolor: isOwner ? 'rgba(93,26,137,0.08)' : 'rgba(0,0,0,0.04)', color: isOwner ? tokens.brand.primary : 'text.secondary', fontWeight: 700, fontSize: '0.72rem' }}
                          />
                          {!isOwner && isBoardOwner && (
                            <IconButton
                              size="small"
                              onClick={() => setMemberToRemove(m._id)}
                              disabled={shareBoardMutation.isPending}
                              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'rgba(239,68,68,0.08)' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <ConfirmDialog
                open={!!memberToRemove}
                title="Remove Team Member"
                message="Are you sure you want to remove this member? They will no longer have access to this board."
                confirmLabel="Remove Member"
                isPending={shareBoardMutation.isPending}
                onConfirm={confirmRemoveMember}
                onCancel={() => setMemberToRemove(null)}
              />

              {/* Add Member Confirmation */}
              <ConfirmDialog
                open={confirmAddOpen}
                title="Add Team Member"
                message={`Are you sure you want to add ${pendingAddUser ? (`${pendingAddUser.firstName || ''} ${pendingAddUser.lastName || ''}`.trim() || pendingAddUser.email) : 'this member'} to this board? They will be able to view and interact with all cards.`}
                confirmLabel="Add Member"
                cancelLabel="Cancel"
                isPending={shareBoardMutation.isPending}
                onConfirm={handleConfirmAddMember}
                onCancel={() => {
                  setConfirmAddOpen(false);
                  setPendingAddUser(null);
                }}
              />
            </Box>
          );
        })()}
      </Box>
    </Box>
  );
};

// ── Stat Card ───────────────────────────────────────────────────────────
const StatCard = ({ icon, count, label, iconBg, onClick }: { icon: React.ReactNode; count: number; label: string; iconBg: string; onClick?: () => void }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: '20px', p: 3,
        display: 'flex', alignItems: 'center', gap: 2.5,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: tokens.shadow.cardHover } : {},
      }}
    >
      <Box sx={{ width: 48, height: 48, borderRadius: '16px', bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>{count}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>{label}</Typography>
      </Box>
    </Box>
  );
};

export default ProjectDetailsPage;
