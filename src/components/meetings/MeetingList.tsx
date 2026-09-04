import {
  Grid,
  Card,
  Typography,
  Button,
  IconButton,
  Box,
  CircularProgress,
  useTheme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VideocamIcon from '@mui/icons-material/Videocam';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import LabelIcon from '@mui/icons-material/Label';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useMeetings, useDeleteMeeting, useUpdateMeeting } from '@/hooks/api/useMeetings';
import { useUsers } from '@/hooks/api/useUsers';
import { MeetingReminderBadge } from './MeetingReminderBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useState, useMemo, useEffect } from 'react';
import { tokens } from '@/styles/tokens';
import { isPast, isFuture, isToday, format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import type { Meeting, Lead } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { meetingSchema, type MeetingFormData } from '@/utils/validators';
import { useUIStore } from '@/store/useUIStore';
import { useAuth } from '@/hooks/useAuth';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessIcon from '@mui/icons-material/Business';

const getLinkedLead = (leadId: Meeting['leadId']): { id: string; name: string; company?: string; email?: string } | null => {
  if (!leadId) return null;
  if (typeof leadId === 'string') return { id: leadId, name: 'Linked lead' };
  const lead = leadId as Lead;
  const name =
    lead.prospectName ||
    [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() ||
    lead.email ||
    'Linked lead';
  return { id: lead._id, name, company: lead.company, email: lead.email };
};

interface MeetingListProps {
  onScheduleTrigger?: () => void;
  currentUser?: any;
}

export const MeetingList = ({ onScheduleTrigger, currentUser }: MeetingListProps) => {
  const { data: meetings = [], isLoading } = useMeetings();
  const deleteMeeting = useDeleteMeeting();
  const { data: dbUsers = [] } = useUsers();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);
  const { user, isElevated } = useAuth();

  const myMeetings = useMemo(() => {
    return meetings.filter((m: Meeting) => {
      if (!currentUser) return false;
      const participantIds = (m.participants || []).map((p: any) =>
        typeof p === 'string' ? p : p._id
      );
      const createdById = m.createdBy
        ? (typeof m.createdBy === 'string' ? m.createdBy : (m.createdBy as any)._id)
        : null;
      return participantIds.includes(currentUser._id) || createdById === currentUser._id;
    });
  }, [meetings, currentUser]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [timeFilter, setTimeFilter] = useState<'all' | 'past' | 'today' | 'upcoming'>('all');

  useEffect(() => {
    const meetingId = searchParams.get('meetingId');
    if (meetingId && myMeetings.length > 0) {
      const found = myMeetings.find(m => m._id === meetingId);
      if (found) {
        setSelectedMeeting(found);
      }
    } else if (!meetingId && selectedMeeting) {
      setSelectedMeeting(null);
    }
  }, [searchParams, myMeetings]);

  const handleOpenMeeting = (meeting: Meeting) => {
    setSearchParams({ meetingId: meeting._id });
  };

  const handleCloseMeeting = () => {
    setSearchParams(new URLSearchParams());
    setSelectedMeeting(null);
  };

  const filteredMeetings = useMemo(() => {
    return myMeetings.filter((m) => {
      const date = new Date(m.scheduledAt);
      if (timeFilter === 'past') return isPast(date) && !isToday(date);
      if (timeFilter === 'today') return isToday(date);
      if (timeFilter === 'upcoming') return isFuture(date) && !isToday(date);
      return true;
    }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [myMeetings, timeFilter]);

  const getParticipantDetails = (participant: string | any) => {
    const id = typeof participant === 'string' ? participant : participant._id;
    return dbUsers.find((u) => u._id === id) || (typeof participant === 'object' ? participant : null);
  };

  // Check if the meeting was created by an admin
  const isCreatedByAdmin = (meeting: Meeting) => {
    if (!meeting.createdBy) return false;
    const creatorId = typeof meeting.createdBy === 'string' ? meeting.createdBy : meeting.createdBy._id;
    const creator = dbUsers.find((u: any) => u._id === creatorId);
    // If createdBy is a populated object with role
    if (typeof meeting.createdBy === 'object' && (meeting.createdBy as any).role) {
      return (meeting.createdBy as any).role === 'admin';
    }
    return creator?.role === 'admin';
  };

  // Can the current user edit or delete this meeting?
  // - Past / cancelled meetings are read-only
  // - Admins can always (for upcoming scheduled)
  // - Users can only if THEY created it AND it was NOT created by an admin
  const canEditOrDelete = (meeting: Meeting) => {
    if (meeting.status === 'cancelled') return false;
    if (isPast(new Date(meeting.scheduledAt))) return false;
    if (isElevated) return true;
    if (isCreatedByAdmin(meeting)) return false;
    if (!currentUser) return false;
    const creatorId = typeof meeting.createdBy === 'string'
      ? meeting.createdBy
      : (meeting.createdBy as any)?._id;
    return creatorId === currentUser._id;
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (myMeetings.length === 0) {
    return (
      <EmptyState
        title="No meetings scheduled"
        description="Get started by scheduling your first sync call, review session, or prospect demo."
        actionLabel="Schedule Meeting"
        onAction={onScheduleTrigger}
      />
    );
  }

  return (
    <>
      {/* Controls Row: Time Filter & View Toggle */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
        {/* iOS style segmented control for Time Filter */}
        <Box
          sx={{
            display: 'inline-flex',
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
            borderRadius: '20px',
            p: 0.5,
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
          }}
        >
          {['all', 'past', 'today', 'upcoming'].map((filter) => (
            <Button
              key={filter}
              onClick={() => setTimeFilter(filter as any)}
              sx={{
                px: 3, py: 0.75,
                borderRadius: '16px',
                textTransform: 'capitalize',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: timeFilter === filter 
                  ? (isDarkMode ? '#fff' : tokens.brand.primary) 
                  : 'text.secondary',
                bgcolor: timeFilter === filter 
                  ? (isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff') 
                  : 'transparent',
                boxShadow: timeFilter === filter && !isDarkMode ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: timeFilter === filter 
                    ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#fff') 
                    : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                }
              }}
            >
              {filter}
            </Button>
          ))}
        </Box>

        {/* View Toggle */}
        <Box sx={{ display: 'flex', gap: 0.5, bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', p: 0.5, borderRadius: '12px' }}>
          <IconButton 
            onClick={() => setViewMode('grid')}
            sx={{ 
              bgcolor: viewMode === 'grid' ? (isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff') : 'transparent',
              color: viewMode === 'grid' ? tokens.brand.primaryLight : 'text.secondary',
              boxShadow: viewMode === 'grid' && !isDarkMode ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              borderRadius: '10px'
            }}
          >
            <ViewModuleIcon fontSize="small" />
          </IconButton>
          <IconButton 
            onClick={() => setViewMode('list')}
            sx={{ 
              bgcolor: viewMode === 'list' ? (isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff') : 'transparent',
              color: viewMode === 'list' ? tokens.brand.primaryLight : 'text.secondary',
              boxShadow: viewMode === 'list' && !isDarkMode ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
              borderRadius: '10px'
            }}
          >
            <ViewListIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {filteredMeetings.length === 0 ? (
        <EmptyState
          title={`No ${timeFilter !== 'all' ? timeFilter : ''} meetings found`}
          description="Try changing your filters or schedule a new meeting."
          actionLabel="Schedule Meeting"
          onAction={onScheduleTrigger}
        />
      ) : (
        <Grid container spacing={3}>
          {filteredMeetings.map((meeting) => {
            const isMeetingPast = meeting.status === 'cancelled' || isPast(new Date(meeting.scheduledAt));

            return (
              <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12} key={meeting._id}>
              <Card
                onClick={() => handleOpenMeeting(meeting)}
                sx={{
                  borderRadius: viewMode === 'grid' ? '24px' : '16px',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: tokens.shadow.card,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: isMeetingPast ? 0.75 : 1,
                  display: 'flex',
                  flexDirection: viewMode === 'grid' ? 'column' : { xs: 'column', sm: 'row' },
                  alignItems: viewMode === 'grid' ? 'stretch' : 'center',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: tokens.shadow.cardHover,
                    borderColor: isDarkMode ? 'rgba(123, 61, 168, 0.25)' : 'rgba(93, 26, 137, 0.15)',
                  },
                }}
              >
                {/* Delete button positioned absolute at top right - visible if user can edit/delete */}
                {canEditOrDelete(meeting) && (
                  <Tooltip title="Cancel Meeting">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(meeting._id);
                      }}
                      aria-label="Delete meeting"
                      sx={{
                        position: 'absolute',
                        top: viewMode === 'list' ? 12 : 18,
                        right: viewMode === 'list' ? 12 : 16,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                        transition: 'all 0.2s',
                        zIndex: 2,
                        '&:hover': {
                          color: tokens.semantic.error,
                          bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.15)' : 'rgba(196, 69, 69, 0.08)',
                        }
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}

                <Box sx={{ p: 3, pt: viewMode === 'list' ? 3 : 3.5, flexGrow: 1, display: 'flex', flexDirection: viewMode === 'grid' ? 'column' : 'row', alignItems: viewMode === 'grid' ? 'stretch' : 'center', width: '100%' }}>
                  {/* Top Row: Category Icon Box & Badge */}
                  {viewMode === 'grid' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pr: 4 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '14px',
                          bgcolor: isMeetingPast
                            ? (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                            : (isDarkMode ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.06)'),
                          color: isMeetingPast
                            ? 'text.disabled'
                            : tokens.brand.primaryLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <VideocamIcon sx={{ fontSize: 22 }} />
                      </Box>
                      <MeetingReminderBadge scheduledAt={meeting.scheduledAt} status={meeting.status} />
                    </Box>
                  )}

                  {viewMode === 'list' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 3, minWidth: 200 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '14px',
                          bgcolor: isMeetingPast
                            ? (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                            : (isDarkMode ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.06)'),
                          color: isMeetingPast
                            ? 'text.disabled'
                            : tokens.brand.primaryLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <VideocamIcon sx={{ fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            fontSize: '1rem',
                            lineHeight: 1.3,
                            color: isMeetingPast ? (isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)') : 'text.primary',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {meeting.title}
                        </Typography>
                        {(() => {
                          const linked = getLinkedLead(meeting.leadId);
                          if (!linked) return null;
                          return (
                            <Chip
                              size="small"
                              icon={<PersonOutlineIcon sx={{ fontSize: '14px !important' }} />}
                              label={linked.name}
                              sx={{
                                mt: 0.75,
                                height: 22,
                                fontWeight: 700,
                                fontSize: '0.68rem',
                                bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.06)',
                                color: tokens.brand.primaryLight,
                                maxWidth: 200,
                                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                              }}
                            />
                          );
                        })()}
                        <Box sx={{ mt: 0.5 }}><MeetingReminderBadge scheduledAt={meeting.scheduledAt} status={meeting.status} /></Box>
                      </Box>
                    </Box>
                  )}

                  {/* Title for Grid View */}
                  {viewMode === 'grid' && (
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.08rem',
                        lineHeight: 1.4,
                        mb: 2.5,
                        color: isMeetingPast
                          ? (isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)')
                          : 'text.primary',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        height: '3rem',
                      }}
                    >
                      {meeting.title}
                    </Typography>
                  )}

                  {/* Date & Time display blocks */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: viewMode === 'grid' ? '1fr 1fr' : '1fr',
                      gap: 1.5,
                      mb: viewMode === 'grid' ? 3 : 0,
                      p: 1.5,
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F9F8F7',
                      borderRadius: '16px',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
                      flexGrow: viewMode === 'list' ? 1 : 0,
                      mr: viewMode === 'list' ? 3 : 0,
                      flexDirection: viewMode === 'list' ? 'row' : 'column',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                          Date
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <CalendarTodayIcon sx={{ fontSize: 13, color: tokens.brand.primaryLight, opacity: 0.8 }} />
                          <Typography variant="body2" sx={{ fontWeight: 650, fontSize: '0.82rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
                            {format(new Date(meeting.scheduledAt), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                          Time
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <AccessTimeIcon sx={{ fontSize: 13, color: tokens.brand.primaryLight, opacity: 0.8 }} />
                          <Typography variant="body2" sx={{ fontWeight: 650, fontSize: '0.82rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
                            {format(new Date(meeting.scheduledAt), 'h:mm a')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Participants Avatars stacked list */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: viewMode === 'grid' ? 'space-between' : 'flex-end', mt: viewMode === 'grid' ? 'auto' : 0, pt: viewMode === 'grid' ? 1 : 0, minWidth: viewMode === 'list' ? 150 : 'auto', pr: viewMode === 'list' ? 6 : 0 }}>
                    {viewMode === 'grid' && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                        Participants
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {(!meeting.participants || meeting.participants.length === 0) ? (
                        <Typography variant="caption" sx={{ color: 'text.muted', fontSize: '0.72rem', fontWeight: 550, fontStyle: 'italic' }}>
                          None
                        </Typography>
                      ) : (
                        <>
                          {meeting.participants.slice(0, 3).map((p, idx) => {
                            const details = getParticipantDetails(p);
                            const name = details ? `${details.firstName || ''} ${details.lastName || ''}`.trim() : (typeof p === 'string' ? p : '');
                            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

                            return (
                              <Tooltip key={idx} title={name}>
                                <Box
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    bgcolor: tokens.brand.primary,
                                    color: '#fff',
                                    border: `2px solid ${isDarkMode ? '#1e1b24' : '#fff'}`,
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: idx > 0 ? '-8px' : 0,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                  }}
                                >
                                  {initials}
                                </Box>
                              </Tooltip>
                            );
                          })}
                          {meeting.participants.length > 3 && (
                            <Typography variant="caption" sx={{ color: 'text.muted', ml: 1, fontSize: '0.72rem', fontWeight: 600 }}>
                              +{meeting.participants.length - 3} others
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Bottom button / action panel */}
                {(meeting.meetingLink || meeting.link) && viewMode === 'grid' && (
                  <Box
                    sx={{
                      p: 2.5,
                      pt: 0,
                      borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
                      mt: 'auto',
                    }}
                  >
                    <Button
                      fullWidth
                      variant={isMeetingPast ? "outlined" : "contained"}
                      startIcon={<VideocamIcon />}
                      endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(meeting.meetingLink || meeting.link, '_blank', 'noopener,noreferrer');
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 750,
                        fontSize: '0.8rem',
                        borderRadius: '14px',
                        py: 1.2,
                        boxShadow: 'none',
                        bgcolor: isMeetingPast
                          ? 'transparent'
                          : tokens.brand.primary,
                        color: isMeetingPast
                          ? 'text.secondary'
                          : '#fff',
                        border: isMeetingPast
                          ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                          : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isMeetingPast
                            ? (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                            : tokens.brand.primaryDark,
                          transform: isMeetingPast ? 'none' : 'translateY(-1px)',
                          boxShadow: isMeetingPast ? 'none' : '0 4px 12px rgba(93, 26, 137, 0.15)',
                        }
                      }}
                    >
                      Join Meeting
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
      )}

      {/* Details Dialog */}
      <Dialog
        open={!!selectedMeeting}
        onClose={handleCloseMeeting}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            p: 1,
            bgcolor: 'background.paper',
            boxShadow: tokens.shadow.cardHover,
            overflow: 'hidden',
          }
        }}
      >
        {selectedMeeting && (
          <>
            <DialogTitle sx={{ pb: 1, pt: 2, px: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <MeetingReminderBadge scheduledAt={selectedMeeting.scheduledAt} status={selectedMeeting.status} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {canEditOrDelete(selectedMeeting) && (
                    <Tooltip title="Edit meeting" arrow>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditMeeting(selectedMeeting);
                          handleCloseMeeting();
                        }}
                        sx={{
                          color: tokens.brand.primaryLight,
                          bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.12)' : 'rgba(93, 26, 137, 0.06)',
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.2)' : 'rgba(93, 26, 137, 0.12)',
                          },
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton onClick={handleCloseMeeting} size="small" sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 850, letterSpacing: '-0.02em', lineHeight: 1.3, color: 'text.primary' }}>
                {selectedMeeting.title}
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 1.5, overflowX: 'hidden' }}>
              {/* Timing Grid */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  mb: 2.5,
                  p: 2,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F9F8F7',
                  borderRadius: '16px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Scheduled Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <CalendarTodayIcon sx={{ color: tokens.brand.primaryLight, fontSize: 18 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {format(new Date(selectedMeeting.scheduledAt), 'eeee, MMM d, yyyy')}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Scheduled Time
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <AccessTimeIcon sx={{ color: tokens.brand.primaryLight, fontSize: 18 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {format(new Date(selectedMeeting.scheduledAt), 'h:mm a')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Linked Lead */}
              {(() => {
                const linked = getLinkedLead(selectedMeeting.leadId);
                if (!linked) return null;
                const initials = linked.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'L';
                return (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
                      Linked Lead
                    </Typography>
                    <Box
                      onClick={() => {
                        window.open(`/sales/leads/${linked.id}`, '_blank', 'noopener,noreferrer');
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.25,
                        borderRadius: '12px',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                        bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.08)' : 'rgba(93, 26, 137, 0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.14)' : 'rgba(93, 26, 137, 0.08)',
                        },
                      }}
                    >
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800, bgcolor: tokens.brand.primary, color: '#fff' }}>
                        {initials}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {linked.name}
                        </Typography>
                        {(linked.company || linked.email) && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {linked.company ? (
                              <>
                                <BusinessIcon sx={{ fontSize: 12 }} />
                                {linked.company}
                              </>
                            ) : linked.email}
                          </Typography>
                        )}
                      </Box>
                      <PersonOutlineIcon sx={{ color: tokens.brand.primaryLight, fontSize: 18 }} />
                    </Box>
                  </Box>
                );
              })()}

              {/* Organizer */}
              {(() => {
                if (!selectedMeeting.createdBy) return null;
                const details = getParticipantDetails(selectedMeeting.createdBy);
                const name = details ? `${details.firstName || ''} ${details.lastName || ''}`.trim() : (typeof selectedMeeting.createdBy === 'string' ? selectedMeeting.createdBy : 'Unknown Organizer');
                const email = details?.email || '';
                const role = details?.role || 'user';
                const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

                return (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
                      Organizer
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.25,
                        borderRadius: '12px',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                      }}
                    >
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        {initials}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {name}
                        </Typography>
                        {email && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {email}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={role.toUpperCase()}
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 750,
                          fontSize: '0.62rem',
                          bgcolor: role === 'admin' ? 'rgba(217, 82, 54, 0.08)' : 'rgba(93, 26, 137, 0.08)',
                          color: role === 'admin' ? '#d95236' : tokens.brand.primaryLight,
                        }}
                      />
                    </Box>
                  </Box>
                );
              })()}

              {/* Participants list */}
              {(() => {
                const createdById = selectedMeeting.createdBy 
                  ? (typeof selectedMeeting.createdBy === 'string' ? selectedMeeting.createdBy : (selectedMeeting.createdBy as any)._id) 
                  : null;
                const participantsToDisplay = selectedMeeting.participants?.filter(p => {
                  const id = typeof p === 'string' ? p : p._id;
                  return id !== createdById;
                }) || [];

                return (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
                      Participants ({participantsToDisplay.length})
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                      {participantsToDisplay.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          No participants added yet.
                        </Typography>
                      ) : (
                        participantsToDisplay.map((p, idx) => {
                          const details = getParticipantDetails(p);
                          const name = details ? `${details.firstName || ''} ${details.lastName || ''}`.trim() : (typeof p === 'string' ? p : 'Unknown Participant');
                          const email = details?.email || '';
                          const role = details?.role || 'user';
                          const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

                    return (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.25,
                          borderRadius: '12px',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                        }}
                      >
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                          {initials}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {name}
                          </Typography>
                          {email && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {email}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={role.toUpperCase()}
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            fontWeight: 750,
                            fontSize: '0.62rem',
                            bgcolor: role === 'admin' ? 'rgba(217, 82, 54, 0.08)' : 'rgba(93, 26, 137, 0.08)',
                            color: role === 'admin' ? '#d95236' : tokens.brand.primaryLight,
                          }}
                        />
                        </Box>
                      );
                    })
                  )}
                </Box>
              </>
            );
          })()}

          {/* Description */}
              {selectedMeeting.description && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F9F8F7',
                    borderRadius: '14px',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.75 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {selectedMeeting.description}
                  </Typography>
                </Box>
              )}

              {/* Meeting Link detail */}
              {(selectedMeeting.meetingLink || selectedMeeting.link) && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: isDarkMode ? 'rgba(123, 61, 168, 0.06)' : 'rgba(93, 26, 137, 0.03)',
                    borderRadius: '14px',
                    border: `1px solid ${isDarkMode ? 'rgba(123, 61, 168, 0.15)' : 'rgba(93, 26, 137, 0.08)'}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.75 }}>
                    Meeting Link
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: tokens.brand.primaryLight,
                      fontWeight: 650,
                      wordBreak: 'break-all',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                    onClick={() => window.open(selectedMeeting.meetingLink || selectedMeeting.link, '_blank', 'noopener,noreferrer')}
                  >
                    {selectedMeeting.meetingLink || selectedMeeting.link}
                  </Typography>
                </Box>
              )}
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                pb: 2.5,
                pt: 1,
                flexDirection: 'column',
                gap: 1.5,
                alignItems: 'stretch',
              }}
            >
              {/* Top row: destructive action - only if user can edit/delete this meeting */}
              {selectedMeeting && canEditOrDelete(selectedMeeting) && (
                <Button
                  onClick={() => setDeleteId(selectedMeeting._id)}
                  fullWidth
                  sx={{
                    py: 1,
                    borderRadius: '14px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: tokens.semantic.error,
                    bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.08)' : 'rgba(196, 69, 69, 0.05)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.15)' : 'rgba(196, 69, 69, 0.08)',
                    }
                  }}
                >
                  Cancel Meeting
                </Button>
              )}

              {/* Bottom row: navigation actions */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={handleCloseMeeting}
                  sx={{
                    flex: 1,
                    py: 1,
                    borderRadius: '14px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: 'text.secondary',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                  }}
                >
                  Close
                </Button>
                {selectedMeeting && canEditOrDelete(selectedMeeting) && (
                  <Button
                    variant="contained"
                    startIcon={<EditOutlinedIcon />}
                    onClick={() => {
                      setEditMeeting(selectedMeeting);
                      handleCloseMeeting();
                    }}
                    sx={{
                      flex: 1,
                      py: 1,
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      bgcolor: tokens.brand.primary,
                      color: '#fff',
                      '&:hover': {
                        bgcolor: tokens.brand.primaryDark,
                      }
                    }}
                  >
                    Edit Meeting
                  </Button>
                )}
                {(selectedMeeting.meetingLink || selectedMeeting.link) && (
                  <Button
                    variant={canEditOrDelete(selectedMeeting) ? 'outlined' : 'contained'}
                    startIcon={<VideocamIcon />}
                    endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                    onClick={() => window.open(selectedMeeting.meetingLink || selectedMeeting.link, '_blank', 'noopener,noreferrer')}
                    sx={{
                      flex: 1.5,
                      py: 1,
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      ...(canEditOrDelete(selectedMeeting)
                        ? {
                            borderColor: tokens.brand.primaryLight,
                            color: tokens.brand.primaryLight,
                            '&:hover': {
                              borderColor: tokens.brand.primaryDark,
                              bgcolor: 'rgba(93, 26, 137, 0.04)',
                            },
                          }
                        : {
                            bgcolor: tokens.brand.primary,
                            color: '#fff',
                            '&:hover': {
                              bgcolor: tokens.brand.primaryDark,
                            },
                          }),
                    }}
                  >
                    Join Meeting
                  </Button>
                )}
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editMeeting}
        onClose={() => setEditMeeting(null)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            p: 1.5,
            bgcolor: 'background.paper',
            boxShadow: tokens.shadow.cardHover,
            overflow: 'hidden',
            maxHeight: { xs: 'calc(100dvh - 24px)', sm: 'calc(100dvh - 48px)' },
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        {editMeeting && (
          <EditForm
            meeting={editMeeting}
            onClose={() => setEditMeeting(null)}
            dbUsers={dbUsers}
            canDelete={canEditOrDelete(editMeeting)}
            onDeleteTrigger={(id) => {
              setDeleteId(id);
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        message="Are you sure you want to cancel this meeting?"
        onConfirm={() => {
          if (deleteId) {
            const cancelledId = deleteId;
            deleteMeeting.mutate(cancelledId, {
              onSuccess: () => {
                addToast({ message: 'Meeting canceled successfully', severity: 'success' });
                setDeleteId(null);
                setEditMeeting(null);
                // Keep detail open for the cancelled meeting
                setSelectedMeeting((prev) =>
                  prev && prev._id === cancelledId ? { ...prev, status: 'cancelled' } : prev,
                );
                if (!searchParams.get('meetingId')) {
                  setSearchParams({ meetingId: cancelledId });
                }
              }
            });
          }
        }}
        onCancel={() => setDeleteId(null)}
        isPending={deleteMeeting.isPending}
      />
    </>
  );
};

interface EditFormProps {
  meeting: Meeting;
  onClose: () => void;
  dbUsers: any[];
  onDeleteTrigger: (id: string) => void;
  canDelete?: boolean;
}

const EditForm = ({ meeting, onClose, dbUsers, onDeleteTrigger, canDelete }: EditFormProps) => {
  const updateMeeting = useUpdateMeeting();
  const addToast = useUIStore((s) => s.addToast);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const { register, handleSubmit, control } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: meeting.title,
      description: meeting.description || '',
      meetingLink: meeting.meetingLink || meeting.link || '',
      scheduledAt: format(new Date(meeting.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
      participants: (meeting.participants || []).map((p: any) =>
        typeof p === 'string' ? p : p._id
      ),
    }
  });

  const onSubmit = (data: MeetingFormData) => {
    updateMeeting.mutate(
      {
        id: meeting._id,
        data: {
          title: data.title,
          description: data.description,
          meetingLink: data.meetingLink,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
          participants: data.participants ?? [],
        }
      },
      {
        onSuccess: () => {
          addToast({ message: 'Meeting updated successfully', severity: 'success' });
          onClose();
        }
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2, px: 3, flexShrink: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Edit Meeting Details
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, mt: 0.5 }}>
          Update the fields below to edit this scheduled meeting.
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          px: 3,
          py: 2,
          overflowX: 'hidden',
          overflowY: 'auto',
          flex: '1 1 auto',
          minHeight: 0,
        }}
      >
        <TextField
          {...register('title')}
          label="Meeting Title"
          placeholder="e.g. Sales Weekly Sync"
          fullWidth
          sx={{
            mt: 1,
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LabelIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          {...register('description')}
          label="Description (optional)"
          placeholder="e.g. Weekly sync to review pipeline progress..."
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
            }
          }}
        />
        <TextField
          {...register('meetingLink')}
          label="Meeting Link (URL)"
          placeholder="https://meet.google.com/..."
          fullWidth
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <VideocamIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
              </InputAdornment>
            ),
          }}
        />

        <Controller
          name="participants"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={dbUsers}
              getOptionLabel={(option) => {
                const name = `${option.firstName || ''} ${option.lastName || ''}`.trim();
                return name || option.email;
              }}
              value={dbUsers.filter(u => field.value?.includes(u._id))}
              onChange={(_, newValue) => {
                field.onChange(newValue.map(u => u._id));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Participants"
                  placeholder="Search team members..."
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <GroupIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const initials = `${option.firstName?.charAt(0) || ''}${option.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
                const name = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email;
                return (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      {initials}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>{name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{option.email}</Typography>
                    </Box>
                  </Box>
                );
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const name = `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email;
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={option._id}
                      label={name}
                      size="small"
                      {...tagProps}
                      sx={{ borderRadius: '8px', fontWeight: 600 }}
                    />
                  );
                })
              }
            />
          )}
        />

        <TextField
          {...register('scheduledAt')}
          label="Date & Time"
          type="datetime-local"
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EventIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1.5, flexShrink: 0 }}>
        {canDelete && (
          <Button
            onClick={() => {
              onDeleteTrigger(meeting._id);
            }}
            sx={{
              mr: 'auto',
              px: 3,
              py: 1,
              borderRadius: '24px',
              textTransform: 'none',
              fontWeight: 650,
              color: tokens.semantic.error,
              bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.08)' : 'rgba(196, 69, 69, 0.05)',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(196, 69, 69, 0.15)' : 'rgba(196, 69, 69, 0.08)',
              }
            }}
          >
            Cancel Meeting
          </Button>
        )}
        <Button
          onClick={onClose}
          sx={{
            px: 3,
            py: 1,
            borderRadius: '24px',
            textTransform: 'none',
            fontWeight: 650,
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={updateMeeting.isPending}
          sx={{
            px: 4,
            py: 1,
            borderRadius: '24px',
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: tokens.brand.primary,
            color: '#fff',
            '&:hover': {
              bgcolor: tokens.brand.primaryDark,
            }
          }}
        >
          {updateMeeting.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </form>
  );
};
