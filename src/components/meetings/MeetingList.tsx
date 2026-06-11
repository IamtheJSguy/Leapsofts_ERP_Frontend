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
import { useMeetings, useDeleteMeeting, useUpdateMeeting } from '@/hooks/api/useMeetings';
import { useUsers } from '@/hooks/api/useUsers';
import { MeetingReminderBadge } from './MeetingReminderBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useState } from 'react';
import { tokens } from '@/styles/tokens';
import { isPast, format } from 'date-fns';
import type { Meeting } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { meetingSchema, type MeetingFormData } from '@/utils/validators';
import { useUIStore } from '@/store/useUIStore';

interface MeetingListProps {
  onScheduleTrigger?: () => void;
}

export const MeetingList = ({ onScheduleTrigger }: MeetingListProps) => {
  const { data: meetings = [], isLoading } = useMeetings();
  const deleteMeeting = useDeleteMeeting();
  const { data: dbUsers = [] } = useUsers();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);

  const getParticipantDetails = (participant: string | any) => {
    const id = typeof participant === 'string' ? participant : participant._id;
    return dbUsers.find((u) => u._id === id) || (typeof participant === 'object' ? participant : null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (meetings.length === 0) {
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
      <Grid container spacing={3}>
        {meetings.map((meeting) => {
          const isMeetingPast = isPast(new Date(meeting.scheduledAt));
          
          return (
            <Grid item xs={12} sm={6} md={4} key={meeting._id}>
              <Card
                onClick={() => setSelectedMeeting(meeting)}
                sx={{
                  borderRadius: '24px',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: tokens.shadow.card,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: isMeetingPast ? 0.75 : 1,
                  display: 'flex',
                  flexDirection: 'column',
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
                {/* Delete button positioned absolute at top right */}
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
                      top: 18,
                      right: 16,
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

                <Box sx={{ p: 3, pt: 3.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Top Row: Category Icon Box & Badge */}
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
                    <MeetingReminderBadge scheduledAt={meeting.scheduledAt} />
                  </Box>

                  {/* Title */}
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

                  {/* Date & Time display blocks */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 1.5,
                      mb: 3,
                      p: 1.5,
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F9F8F7',
                      borderRadius: '16px',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                        Date
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <CalendarTodayIcon sx={{ fontSize: 13, color: tokens.brand.primaryLight, opacity: 0.8 }} />
                        <Typography variant="body2" sx={{ fontWeight: 650, fontSize: '0.82rem', color: 'text.primary' }}>
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
                        <Typography variant="body2" sx={{ fontWeight: 650, fontSize: '0.82rem', color: 'text.primary' }}>
                          {format(new Date(meeting.scheduledAt), 'h:mm a')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Participants Avatars stacked list */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                      Participants
                    </Typography>
                    
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
                                    bgcolor: 'secondary.light',
                                    color: 'secondary.contrastText',
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
                {(meeting.meetingLink || meeting.link) && (
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

      {/* Details Dialog */}
      <Dialog
        open={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
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
                <MeetingReminderBadge scheduledAt={selectedMeeting.scheduledAt} />
                <IconButton onClick={() => setSelectedMeeting(null)} size="small" sx={{ color: 'text.secondary' }}>
                  <CloseIcon />
                </IconButton>
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
                  gridTemplateColumns: '1fr 1fr',
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

              {/* Participants list */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
                Participants ({selectedMeeting.participants?.length || 0})
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                {!selectedMeeting.participants || selectedMeeting.participants.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    No participants added yet.
                  </Typography>
                ) : (
                  selectedMeeting.participants.map((p, idx) => {
                    const details = getParticipantDetails(p);
                    const name = details ? `${details.firstName || ''} ${details.lastName || ''}`.trim() : (typeof p === 'string' ? p : 'Unknown Participant');
                    const email = details?.email || '';
                    const role = details?.role || 'user';
                    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                    
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
              {/* Top row: destructive action */}
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

              {/* Bottom row: navigation actions */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedMeeting(null)}
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
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditMeeting(selectedMeeting);
                    setSelectedMeeting(null);
                  }}
                  sx={{
                    flex: 1,
                    py: 1,
                    borderRadius: '14px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    borderColor: tokens.brand.primaryLight,
                    color: tokens.brand.primaryLight,
                    '&:hover': {
                      borderColor: tokens.brand.primaryDark,
                      bgcolor: 'rgba(93, 26, 137, 0.04)',
                    }
                  }}
                >
                  Edit Details
                </Button>
                {(selectedMeeting.meetingLink || selectedMeeting.link) && (
                  <Button
                    variant="contained"
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
                      bgcolor: tokens.brand.primary,
                      color: '#fff',
                      '&:hover': {
                        bgcolor: tokens.brand.primaryDark,
                      }
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
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            p: 1.5,
            bgcolor: 'background.paper',
            boxShadow: tokens.shadow.cardHover,
          }
        }}
      >
        {editMeeting && (
          <EditForm
            meeting={editMeeting}
            onClose={() => setEditMeeting(null)}
            dbUsers={dbUsers}
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
            deleteMeeting.mutate(deleteId, {
              onSuccess: () => {
                addToast({ message: 'Meeting canceled successfully', severity: 'success' });
                setDeleteId(null);
                setSelectedMeeting(null);
                setEditMeeting(null);
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
}

const EditForm = ({ meeting, onClose, dbUsers, onDeleteTrigger }: EditFormProps) => {
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle sx={{ pb: 1, pt: 2, px: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Edit Meeting Details
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550, mt: 0.5 }}>
          Update the fields below to edit this scheduled meeting.
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2 }}>
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
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1.5 }}>
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
