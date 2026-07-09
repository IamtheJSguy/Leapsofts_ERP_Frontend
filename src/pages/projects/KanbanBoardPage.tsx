import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Button, useTheme, IconButton, InputAdornment,
  TextField, Avatar, AvatarGroup, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Drawer, CircularProgress,
  Menu, MenuItem, ListItemIcon, ListItemText, FormControl,
  InputLabel, Select, OutlinedInput, Tooltip, Divider
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckIcon from '@mui/icons-material/Check';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';
import { tokens } from '@/styles/tokens';
import { ModernDatePicker } from '@/components/common/ModernDatePicker';

import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor,
  PointerSensor, useSensor, useSensors, type DragStartEvent,
  type DragEndEvent,
  useDroppable, MeasuringStrategy
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useKanbanBoard, useMoveCard, useAddComment, useCreateColumn,
  useRenameColumn, useDeleteColumn, useReorderColumns,
  useCreateCard, useUpdateCard, useDeleteCard, useAssignCard,
  useEditComment, useDeleteComment, useShareBoard
} from '@/hooks/api/useKanban';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/useUIStore';
import { useUsers } from '@/hooks/api/useUsers';
import { CommentText } from '@/components/kanban/CommentText';
import { MentionInput } from '@/components/kanban/MentionInput';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

// Custom Modern Premium Confirmation Dialog Component
const ModernConfirmDialog = ({ open, title, description, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel" }: any) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          p: 1.5,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.5 }}>
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1.5, gap: 1 }}>
        <Button
          onClick={onCancel}
          sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '24px', textTransform: 'none', px: 2.5 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disableElevation
          sx={{
            bgcolor: '#ef4444',
            color: '#fff',
            fontWeight: 700,
            borderRadius: '24px',
            textTransform: 'none',
            px: 3,
            '&:hover': { bgcolor: '#dc2626' }
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', dot: '#3b82f6', border: 'rgba(96,165,250,0.2)' },
  medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', dot: '#d97706', border: 'rgba(251,191,36,0.2)' },
  high: { label: 'High', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', dot: '#ea580c', border: 'rgba(251,146,60,0.2)' },
  urgent: { label: 'Urgent', color: '#f87171', bg: 'rgba(248,113,113,0.08)', dot: '#dc2626', border: 'rgba(248,113,113,0.2)' },
};

const TaskCardVisual = ({ task, isDarkMode, onClick }: any) => {
  const companyName = task.lead?.company || (task.lead ? 'Lead Prospect' : null);
  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
  const hasDueDate = task.dueDate;
  const commentsCount = Array.isArray(task.rawCard?.comments)
    ? task.rawCard.comments.filter((c: any) => c.isActive !== false).length
    : (task.comments || 0);

  const formatDue = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    // Normalize times for accurate calendar comparison
    now.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const isPast = compareDate < now;
    return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isPast };
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: isDarkMode ? '#1E1B24' : '#fff',
        borderRadius: '16px',
        p: 2.25,
        cursor: 'pointer',
        boxShadow: isDarkMode
          ? '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
          : '0 4px 16px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.01)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        position: 'relative',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDarkMode
            ? `0 12px 24px rgba(0,0,0,0.45), 0 0 1px ${priority.color}`
            : `0 12px 24px rgba(0,0,0,0.04), 0 0 1px ${priority.color}`,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }
      }}
    >
      {/* Top row: label chips + priority pill */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {companyName ? (
            <Chip
              label={companyName}
              size="small"
              sx={{
                bgcolor: isDarkMode ? 'rgba(167,139,250,0.1)' : 'rgba(93,26,137,0.06)',
                color: isDarkMode ? '#a78bfa' : tokens.brand.primary,
                fontWeight: 750,
                fontSize: '0.68rem',
                height: 22,
                border: `1px solid ${isDarkMode ? 'rgba(167,139,250,0.15)' : 'rgba(93,26,137,0.1)'}`
              }}
            />
          ) : (
            <Chip
              label="Custom Task"
              size="small"
              sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                color: 'text.secondary',
                fontWeight: 700,
                fontSize: '0.68rem',
                height: 22
              }}
            />
          )}
        </Box>

        {/* Priority Badge */}
        <Chip
          label={priority.label}
          size="small"
          sx={{
            bgcolor: priority.bg,
            color: priority.dot,
            fontWeight: 800,
            fontSize: '0.65rem',
            height: 18,
            px: 0.5,
            border: `1px solid ${priority.border}`,
            '& .MuiChip-label': { px: 1 }
          }}
        />
      </Box>

      {/* Title */}
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: task.description ? 1 : 2, lineHeight: 1.45, letterSpacing: '-0.01em' }}>
        {task.title}
      </Typography>

      {/* Description preview */}
      {task.description && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 2, lineHeight: 1.5, fontWeight: 500 }}>
          {task.description}
        </Typography>
      )}

      {/* Bottom row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 1.25, color: 'text.secondary', alignItems: 'center' }}>
          {commentsCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem', color: 'text.secondary' }}>{commentsCount}</Typography>
            </Box>
          )}
          {hasDueDate && (() => {
            const { label, isPast } = formatDue(hasDueDate);
            return (
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: '11px !important', color: isPast ? '#ef4444 !important' : 'inherit' }} />}
                label={label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: isPast
                    ? 'rgba(239,68,68,0.1)'
                    : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  color: isPast ? '#f87171' : 'text.secondary',
                  border: isPast ? '1px solid rgba(239,68,68,0.15)' : 'none',
                  '& .MuiChip-label': { pl: 0.5, pr: 1 }
                }}
              />
            );
          })()}
        </Box>
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.65rem', fontWeight: 800, borderColor: isDarkMode ? '#1E1B24' : '#fff' } }}>
          {task.assignedUsers?.map((u: any, idx: number) => {
            const initial = (u.firstName?.charAt(0) || u.email?.charAt(0) || 'U').toUpperCase();
            return <Avatar key={idx} sx={{ bgcolor: tokens.brand.primary }}>{initial}</Avatar>;
          })}
        </AvatarGroup>
      </Box>
    </Box>
  );
};




const SortableTask = ({ task, isDarkMode, onTaskClick }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCardVisual task={task} isDarkMode={isDarkMode} onClick={() => onTaskClick(task)} />
    </div>
  );
};

const DroppableColumn = ({ col, isDarkMode, children }: any) => {
  const { setNodeRef } = useDroppable({
    id: col.id,
    data: { type: 'Column', column: col },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2,
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        borderRadius: '16px', p: 1.5, minHeight: 150
      }}
    >
      {children}
    </Box>
  );
};

const TaskDetailDrawer = ({ task, open, onClose, isDarkMode, allUsers = [], boardMembers = [], boardId, actualBoard }: any) => {
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [pendingAssignees, setPendingAssignees] = useState<string[]>([]);
  const [pendingDueDate, setPendingDueDate] = useState('');
  const [pendingKpiEndDate, setPendingKpiEndDate] = useState('');
  const [pendingPriority, setPendingPriority] = useState<string>('medium');
  const [priorityMenuAnchor, setPriorityMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (task && open) {
      setEditTitle(task.title || '');
      setEditDesc(task.description || '');
      setPendingAssignees(Array.isArray(task.rawCard?.assignedTo)
        ? task.rawCard.assignedTo.map((u: any) => typeof u === 'object' ? u._id : u)
        : []);
      setPendingDueDate(task.rawCard?.dueDate ? task.rawCard.dueDate.split('T')[0] : '');
      setPendingKpiEndDate(task.rawCard?.kpiEndDate ? task.rawCard.kpiEndDate.split('T')[0] : '');
      setPendingPriority(task.rawCard?.priority || 'medium');
    }
  }, [task, open]);

  // Confirmation Dialog States for Deletion only
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDesc, setConfirmDesc] = useState('');
  const [confirmAction, setConfirmAction] = useState<'deleteCard' | 'deleteComment' | null>(null);
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');

  const addCommentMutation = useAddComment();
  const editCommentMutation = useEditComment();
  const deleteCommentMutation = useDeleteComment();
  const updateCardMutation = useUpdateCard(boardId);
  const assignCardMutation = useAssignCard(boardId);
  const deleteCardMutation = useDeleteCard(boardId);
  const currentUser = useAuthStore((s) => s.user);
  const { isElevated } = useAuth();
  const addToast = useUIStore((s) => s.addToast);

  const mentionableUsers = useMemo(() => {
    const memberIds = new Set(boardMembers.map((user: any) => user._id));
    const admins = allUsers.filter((user: any) => user.role === 'admin' && !memberIds.has(user._id));
    return [...boardMembers, ...admins];
  }, [boardMembers, allUsers]);

  const isAdminOrOwner = isElevated || actualBoard?.ownerId === currentUser?._id;

  const handleConfirmSave = () => {
    // Update assignees and dates via assignCard
    assignCardMutation.mutate({
      cardId: task.id,
      data: {
        assignedTo: pendingAssignees,
        ...(pendingDueDate ? { dueDate: pendingDueDate } : {}),
        ...(pendingKpiEndDate ? { kpiEndDate: pendingKpiEndDate } : {}),
      },
    }, {
      onSuccess: () => {
        // Also update title, desc, and priority if they changed
        const updates: any = {};
        if (editTitle.trim() && editTitle.trim() !== task.title) updates.title = editTitle.trim();
        if (editDesc.trim() !== (task.description || '')) updates.description = editDesc.trim();
        if (pendingPriority !== (task.rawCard?.priority || 'medium')) updates.priority = pendingPriority;
        
        if (Object.keys(updates).length > 0) {
          updateCardMutation.mutate({
            cardId: task.id,
            data: updates
          }, {
            onSuccess: () => {
               addToast({ message: 'Task updated successfully', severity: 'success' });
               onClose();
            }
          });
        } else {
           addToast({ message: 'Task updated successfully', severity: 'success' });
           onClose();
        }
      }
    });
  };

  if (!task) return null;

  const lead = task.lead;
  const rawCard = task.rawCard;
  const commentsList = rawCard?.comments || [];
  const assignedToIds = Array.isArray(rawCard?.assignedTo)
    ? rawCard.assignedTo.map((u: any) => typeof u === 'object' ? u._id : u)
    : [];

  const handleSendComment = () => {
    if (commentText.trim() && !addCommentMutation.isPending) {
      addCommentMutation.mutate({
        cardId: task.id,
        data: { text: commentText.trim() }
      }, {
        onSuccess: () => {
          setCommentText('');
        },
        onError: (err: any) => {
          addToast({
            message: err.response?.data?.message || 'Failed to add comment',
            severity: 'error',
          });
        },
      });
    }
  };

  const handleSaveCommentEdit = (commentId: string) => {
    if (editCommentText.trim()) {
      editCommentMutation.mutate({
        cardId: task.id,
        commentId,
        text: editCommentText.trim()
      }, {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditCommentText('');
        },
        onError: (err: any) => {
          addToast({
            message: err.response?.data?.message || 'Failed to update comment',
            severity: 'error',
          });
        },
      });
    }
  };

  const triggerDeleteCommentConfirm = (commentId: string) => {
    setConfirmTitle('Delete Comment');
    setConfirmDesc('Are you sure you want to permanently delete this comment? This action cannot be undone.');
    setConfirmAction('deleteComment');
    setTargetCommentId(commentId);
    setConfirmOpen(true);
  };

  const triggerDeleteCardConfirm = () => {
    setConfirmTitle('Delete Task Card');
    setConfirmDesc(`Are you sure you want to permanently delete the task "${task.title}"? All progress and comments will be lost.`);
    setConfirmAction('deleteCard');
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    setConfirmOpen(false);
    if (confirmAction === 'deleteComment' && targetCommentId) {
      deleteCommentMutation.mutate({
        cardId: task.id,
        commentId: targetCommentId
      });
    } else if (confirmAction === 'deleteCard') {
      deleteCardMutation.mutate(task.id, {
        onSuccess: () => {
          onClose();
        }
      });
    }
    setConfirmAction(null);
    setTargetCommentId(null);
  };



  const handlePriorityClick = (e: any) => setPriorityMenuAnchor(e.currentTarget);
  const handlePriorityClose = () => setPriorityMenuAnchor(null);

  const handlePriorityChange = (newPriority: string) => {
    setPendingPriority(newPriority);
    handlePriorityClose();
  };



  const authorName = lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : 'Unnamed Lead';

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480 },
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            borderTopLeftRadius: '24px',
            borderBottomLeftRadius: '24px',
            boxShadow: isDarkMode ? '-8px 0 32px rgba(0,0,0,0.5)' : '-8px 0 32px rgba(26, 22, 37, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300,
          },
        }}
        ModalProps={{
          BackdropProps: {
            sx: {
              bgcolor: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(4px)',
            },
          },
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ p: 3, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              {lead ? (
                <Chip label={lead.company || 'Lead Prospect'} size="small" sx={{ bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
              ) : (
                <Chip label="Custom Task" size="small" sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: 'text.secondary', fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
              )}
              {lead?.isQualified && (
                <Chip label="Qualified" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: tokens.semantic.success, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
              )}
              {(() => {
                const p = pendingPriority as keyof typeof PRIORITY_CONFIG;
                const cfg = PRIORITY_CONFIG[p] || PRIORITY_CONFIG.medium;
                return (
                  <Box>
                    <Chip
                      label={cfg.label}
                      size="small"
                      onClick={isAdminOrOwner ? handlePriorityClick : undefined}
                      sx={{
                        bgcolor: cfg.bg, color: cfg.color, fontWeight: 750, fontSize: '0.7rem', height: 24,
                        border: `1px solid ${cfg.color}30`, cursor: isAdminOrOwner ? 'pointer' : 'default', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': isAdminOrOwner ? { transform: 'translateY(-1px)', boxShadow: `0 4px 12px ${cfg.color}30` } : {}
                      }}
                    />
                    {isAdminOrOwner && (
                      <Menu
                        anchorEl={priorityMenuAnchor}
                        open={Boolean(priorityMenuAnchor)}
                        onClose={handlePriorityClose}
                        PaperProps={{
                          sx: {
                            mt: 1, borderRadius: '16px', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', bgcolor: isDarkMode ? '#1e1b24' : '#fff', minWidth: 160
                          }
                        }}
                      >
                        {Object.entries(PRIORITY_CONFIG).map(([key, item]: any) => (
                          <MenuItem
                            key={key}
                            onClick={() => handlePriorityChange(key)}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 2,
                              borderRadius: '8px', mx: 1, my: 0.25, transition: 'all 0.15s',
                              bgcolor: key === p ? (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent',
                              '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
                            }}
                          >
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                            <Typography variant="body2" sx={{ fontWeight: 650 }}>{item.label}</Typography>
                          </MenuItem>
                        ))}
                      </Menu>
                    )}
                  </Box>
                );
              })()}
            </Box>
            {isAdminOrOwner ? (
              <TextField
                fullWidth
                size="small"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Task Title"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontWeight: 800,
                    borderRadius: '12px'
                  }
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.3 }}
                  noWrap
                >
                  {task.title}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
            {isAdminOrOwner && (
              <IconButton onClick={triggerDeleteCardConfirm} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.08)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton onClick={onClose} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs Control */}
        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          <Box
            sx={{
              display: 'inline-flex',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
              borderRadius: '20px',
              p: 0.5,
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
            }}
          >
            {[
              { id: 'details', label: 'Details & Assignees' },
              { id: 'comments', label: 'Comments' }
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'details' | 'comments')}
                sx={{
                  px: 3, py: 0.75,
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: activeTab === tab.id
                    ? (isDarkMode ? '#fff' : tokens.brand.primary)
                    : 'text.secondary',
                  bgcolor: activeTab === tab.id
                    ? (isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff')
                    : 'transparent',
                  boxShadow: activeTab === tab.id && !isDarkMode ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: activeTab === tab.id
                      ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#fff')
                      : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                  }
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Drawer Content Area */}
        <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {activeTab === 'details' && (
            <>
              {/* Description Section */}
              <Box sx={{
                p: 2.5,
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                borderRadius: '16px',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, color: 'text.secondary' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionOutlinedIcon fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</Typography>
                  </Box>
                  </Box>
                  {isAdminOrOwner ? (
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Add a detailed description..."
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        sx={{
                          mb: 1.5,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: isDarkMode ? 'rgba(0,0,0,0.1)' : '#fff',
                          }
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: task.description ? 'text.secondary' : 'text.disabled',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        minHeight: 24,
                        fontStyle: task.description ? 'normal' : 'italic',
                      }}
                    >
                      {task.description || 'No description provided.'}
                    </Typography>
                  )}
              </Box>

              {/* Due Date */}
              {task.dueDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </Box>
              )}

              {/* Assignees Section */}
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'text.secondary' }}>
                  <GroupIcon fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignees</Typography>
                </Box>
                {isAdminOrOwner ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="assign-member-label">Assign Team Members</InputLabel>
                      <Select
                        labelId="assign-member-label"
                        multiple
                        value={pendingAssignees}
                        onChange={(e) => setPendingAssignees(e.target.value as string[])}
                        input={<OutlinedInput label="Assign Team Members" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value: any) => {
                              const matched = allUsers.find((u: any) => u._id === value);
                              const name = matched ? `${matched.firstName || ''} ${matched.lastName || ''}`.trim() : value;
                              return <Chip key={value} label={name} size="small" />;
                            })}
                          </Box>
                        )}
                      >
                        {boardMembers.map((u: any) => (
                          <MenuItem key={u._id} value={u._id}>
                            {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <ModernDatePicker
                      label="Due Date"
                      value={(pendingDueDate || rawCard?.dueDate) ? new Date((pendingDueDate || rawCard.dueDate).split('T')[0] + 'T00:00:00') : null}
                      onChange={(date) => {
                        if (date) {
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, '0');
                          const d = String(date.getDate()).padStart(2, '0');
                          setPendingDueDate(`${y}-${m}-${d}`);
                        } else {
                          setPendingDueDate('');
                        }
                      }}
                    />
                    <Box>
                      <ModernDatePicker
                        label="KPI tracking end date"
                        value={(pendingKpiEndDate || rawCard?.kpiEndDate) ? new Date((pendingKpiEndDate || rawCard.kpiEndDate).split('T')[0] + 'T00:00:00') : null}
                        onChange={(date) => {
                          if (date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            setPendingKpiEndDate(`${y}-${m}-${d}`);
                          } else {
                            setPendingKpiEndDate('');
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        How long this task shows in daily KPIs (defaults to due date or 7 days)
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleConfirmSave}
                      disabled={updateCardMutation.isPending || assignCardMutation.isPending}
                      sx={{
                        mt: 2,
                        py: 1.5,
                        borderRadius: '12px',
                        fontWeight: 750,
                        bgcolor: tokens.brand.primary,
                        color: '#fff',
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(93, 26, 137, 0.4)',
                        '&:hover': {
                          bgcolor: tokens.brand.primaryDark,
                          boxShadow: '0 6px 20px rgba(93, 26, 137, 0.6)',
                        }
                      }}
                    >
                      {(updateCardMutation.isPending || assignCardMutation.isPending) ? 'Saving...' : 'Confirm and Save'}
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {assignedToIds.map((value: any) => {
                      const matched = allUsers.find((u: any) => u._id === value);
                      const name = matched ? `${matched.firstName || ''} ${matched.lastName || ''}`.trim() : value;
                      return <Chip key={value} label={name} size="small" />;
                    })}
                    {assignedToIds.length === 0 && (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>No assignees</Typography>
                    )}
                  </Box>
                )}
              </Box>

              {/* Description Section */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'text.secondary' }}>
                  <DescriptionOutlinedIcon fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prospect Details</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                    Name: <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{authorName}</Box>
                  </Typography>
                  {lead?.email && (
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      Email: <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{lead.email}</Box>
                    </Typography>
                  )}
                  {lead?.title && (
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      Title: <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{lead.title}</Box>
                    </Typography>
                  )}
                  {lead?.location && (
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      Location: <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{lead.location}</Box>
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Enrichment Profiles */}
              {rawCard?.enrichment && rawCard.enrichment.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'text.secondary' }}>
                    <FormatListBulletedIcon fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile Notes</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {rawCard.enrichment.map((sec: any, idx: number) => (
                      <Box key={idx} sx={{ p: 1.75, borderRadius: '12px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: tokens.brand.primary }}>{sec.title}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{sec.content}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}

          {activeTab === 'comments' && (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Comments Feed Section */}
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
                  <ChatBubbleOutlineIcon fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comments ({commentsList.length})</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {commentsList.map((comm: any, idx: number) => {
                    const commentUserId = comm.userId || (typeof comm.author === 'object' ? comm.author?._id : comm.author);
                    const isCommentAuthor = currentUser && currentUser._id === commentUserId;

                    let matchingUser: any = null;
                    if (typeof comm.author === 'object' && comm.author?.firstName) {
                      matchingUser = comm.author;
                    }

                    if (!matchingUser && commentUserId) {
                      matchingUser = (allUsers as any[]).find((u: any) => u._id === commentUserId) || null;
                    }

                    if (!matchingUser && currentUser && currentUser._id === commentUserId) {
                      matchingUser = currentUser;
                    }

                    const name = matchingUser
                      ? `${matchingUser.firstName || ''} ${matchingUser.lastName || ''}`.trim() || matchingUser.email || 'User'
                      : 'Unknown User';
                    const initial = name.charAt(0).toUpperCase() || 'U';

                    return (
                      <Box key={comm._id || idx} sx={{ display: 'flex', gap: 1.5, position: 'relative', '&:hover .comment-actions': { opacity: 1 } }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: idx % 2 === 0 ? tokens.brand.primaryMuted : tokens.brand.accentLight, fontSize: '0.8rem', fontWeight: 800 }}>{initial}</Avatar>
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 750 }} noWrap>{name}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                              {comm.createdAt ? new Date(comm.createdAt).toLocaleDateString() : 'Just now'}
                            </Typography>
                          </Box>
                          {editingCommentId === comm._id ? (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                              <MentionInput
                                value={editCommentText}
                                onChange={setEditCommentText}
                                mentionableUsers={mentionableUsers}
                                placeholder="Edit comment..."
                              />
                              <IconButton size="small" onClick={() => handleSaveCommentEdit(comm._id)}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => setEditingCommentId(null)}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box sx={{ position: 'relative' }}>
                              <Box sx={{ color: 'text.secondary', bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', p: 1.5, borderRadius: '0 12px 12px 12px', display: 'inline-block', maxWidth: '100%' }}>
                                <CommentText text={comm.text} users={allUsers} />
                              </Box>
                              {isCommentAuthor && (
                                <Box
                                  className="comment-actions"
                                  sx={{
                                    opacity: 0, transition: 'opacity 0.2s',
                                    position: 'absolute', right: 8, top: 4,
                                    display: 'flex', gap: 0.5, bgcolor: isDarkMode ? '#1E1B24' : '#fff',
                                    borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <IconButton size="small" onClick={() => { setEditingCommentId(comm._id); setEditCommentText(comm.text); }}>
                                    <EditIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => triggerDeleteCommentConfirm(comm._id)}>
                                    <DeleteIcon sx={{ fontSize: 13, color: 'error.main' }} />
                                  </IconButton>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                  {commentsList.length === 0 && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      No comments posted yet.
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)', mx: -3, px: 3, pt: 3, pb: 1, mt: 2 }}>
                <MentionInput
                  value={commentText}
                  onChange={setCommentText}
                  mentionableUsers={mentionableUsers}
                  placeholder="Write a comment... Use @ to mention someone"
                  disabled={addCommentMutation.isPending}
                  onSubmit={handleSendComment}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton sx={{ color: tokens.brand.primary }} size="small" onClick={handleSendComment} disabled={addCommentMutation.isPending || !commentText.trim()}>
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '24px',
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                      '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                      '&:hover fieldset': { borderColor: tokens.brand.primary },
                    },
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Local confirm dialogue inside Drawer */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmDesc}
        onConfirm={handleConfirmAction}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); setTargetCommentId(null); }}
        confirmLabel="Confirm Action"
      />

    </>
  );
};

export const KanbanBoardPage = () => {
  const { projectId, boardId } = useParams<{ projectId: string; boardId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeBoardId = boardId || projectId;
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const { data: board, isLoading, error } = useKanbanBoard(activeBoardId);
  const { data: allUsers = [] } = useUsers();
  const moveCardMutation = useMoveCard(activeBoardId);
  const createColumnMutation = useCreateColumn();
  const renameColumnMutation = useRenameColumn();
  const deleteColumnMutation = useDeleteColumn();
  const reorderColumnsMutation = useReorderColumns();
  const createCardMutation = useCreateCard(activeBoardId);
  const assignCardMutation = useAssignCard(activeBoardId);

  const actualBoard = useMemo(() => board?.board, [board]);
  const cardsList = useMemo(() => board?.cards || [], [board]);
  const boardLead = useMemo(() => {
    const lead = actualBoard?.leadId;
    return lead && typeof lead === 'object' ? lead : null;
  }, [actualBoard]);

  const currentUser = useAuthStore((s) => s.user);
  const { isElevated } = useAuth();
  const canManageTeam = actualBoard?.ownerId === currentUser?._id || isElevated;

  const boardMembers = useMemo(() => {
    if (!actualBoard) return [];
    const owner = allUsers.find((u: any) => u._id === actualBoard.ownerId);
    const sharedIds = Array.isArray(actualBoard.sharedWith) ? actualBoard.sharedWith : [];
    const shared = sharedIds.map((id: any) => allUsers.find((u: any) => u._id === id)).filter(Boolean);
    return [owner, ...shared].filter(Boolean);
  }, [actualBoard, allUsers]);

  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);

  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  // Column Menu trigger/anchor state
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTargetColumnId, setMenuTargetColumnId] = useState<string | null>(null);

  // Rename Column Dialog
  const [isRenameColumnOpen, setIsRenameColumnOpen] = useState(false);
  const [renameColumnText, setRenameColumnText] = useState('');

  // Direct Card Creation Dialog
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [cardTargetColumnId, setCardTargetColumnId] = useState<string>('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newCardDueDate, setNewCardDueDate] = useState('');
  const [newCardAssignees, setNewCardAssignees] = useState<string[]>([]);

  // Page Confirm Dialog State
  const [columnConfirmOpen, setColumnConfirmOpen] = useState(false);

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');

  // Share Board Dialog State
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedUserToShare, setSelectedUserToShare] = useState<string>('');
  const shareBoardMutation = useShareBoard();

  // Share Confirmation Dialog State
  const [confirmShareOpen, setConfirmShareOpen] = useState(false);
  const [pendingShareUserId, setPendingShareUserId] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Transform board columns and cards into flattened lists for dnd-kit
  const columns = useMemo(() => {
    if (!actualBoard || !actualBoard.columns) return [];
    return actualBoard.columns
      .filter((col: any) => col.isActive !== false)
      .map((col: any) => ({
        id: col._id,
        title: col.name,
      }));
  }, [actualBoard]);

  const tasks = useMemo(() => {
    if (!actualBoard || !actualBoard.columns) return [];
    const tList: any[] = [];

    cardsList.forEach((card: any) => {
      const lead = typeof card.leadId === 'object' ? card.leadId : null;
      const assignedLead = lead as any;
      const cardAssignees = Array.isArray(card.assignedTo)
        ? card.assignedTo.map((u: any) => typeof u === 'object' ? u : allUsers.find((au: any) => au._id === u)).filter(Boolean)
        : [];

      tList.push({
        id: card._id,
        columnId: card.columnId,
        title: card.title || (assignedLead ? `${assignedLead.firstName || ''} ${assignedLead.lastName || ''}`.trim() : 'Untitled Card'),
        lead: assignedLead,
        description: card.description,
        priority: card.priority || 'medium',
        dueDate: card.dueDate,
        comments: card.comments?.filter((c: any) => c.isActive !== false).length || 0,
        attachments: 0,
        assignedUsers: cardAssignees,
        rawCard: card,
        position: card.order ?? card.position ?? 0,
      });
    });

    return tList.sort((a, b) => a.position - b.position);
  }, [actualBoard, cardsList, allUsers]);

  useEffect(() => {
    const cardId = searchParams.get('card');
    if (cardId && tasks.length > 0) {
      if (drawerTaskId !== cardId) {
        setDrawerTaskId(cardId);
      }
    }
  }, [searchParams, tasks, drawerTaskId]);

  // Filter tasks based on searchQuery, priority, and assignee
  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const titleMatch = t.title?.toLowerCase().includes(query);
        const companyMatch = t.lead?.company?.toLowerCase().includes(query);
        const emailMatch = t.lead?.email?.toLowerCase().includes(query);
        const nameMatch = `${t.lead?.firstName || ''} ${t.lead?.lastName || ''}`.toLowerCase().includes(query);
        return titleMatch || companyMatch || emailMatch || nameMatch;
      });
    }

    if (priorityFilter !== 'All') {
      result = result.filter(t => (t.priority || 'medium').toLowerCase() === priorityFilter.toLowerCase());
    }

    if (assigneeFilter !== 'All') {
      result = result.filter(t => {
        const ids = Array.isArray(t.rawCard?.assignedTo)
          ? t.rawCard.assignedTo.map((u: any) => typeof u === 'object' ? u._id : u)
          : [];
        return ids.includes(assigneeFilter);
      });
    }

    return result;
  }, [tasks, searchQuery, priorityFilter, assigneeFilter]);

  const drawerTask = useMemo(() => {
    if (!drawerTaskId || !tasks.length) return null;
    return tasks.find(t => t.id === drawerTaskId) || null;
  }, [drawerTaskId, tasks]);

  const handleAddColumn = () => {
    if (newColumnName.trim() && activeBoardId) {
      createColumnMutation.mutate({
        boardId: activeBoardId,
        name: newColumnName.trim(),
      }, {
        onSuccess: () => {
          setNewColumnName('');
          setIsColumnDialogOpen(false);
        }
      });
    }
  };

  const handleRenameColumnSubmit = () => {
    if (renameColumnText.trim() && activeBoardId && menuTargetColumnId) {
      renameColumnMutation.mutate({
        boardId: activeBoardId,
        columnId: menuTargetColumnId,
        name: renameColumnText.trim()
      }, {
        onSuccess: () => {
          setIsRenameColumnOpen(false);
          setRenameColumnText('');
          setMenuTargetColumnId(null);
        }
      });
    }
  };

  const triggerDeleteColumnConfirm = () => {
    setColumnConfirmOpen(true);
  };

  const handleDeleteColumnConfirm = () => {
    setColumnConfirmOpen(false);
    if (activeBoardId && menuTargetColumnId) {
      deleteColumnMutation.mutate({
        boardId: activeBoardId,
        columnId: menuTargetColumnId
      }, {
        onSuccess: () => {
          setMenuTargetColumnId(null);
        }
      });
    }
  };

  const handleMoveColumn = (direction: 'left' | 'right') => {
    if (!activeBoardId || !menuTargetColumnId) return;
    const colIds = columns.map((c: any) => c.id);
    const index = colIds.indexOf(menuTargetColumnId);
    if (index === -1) return;

    if (direction === 'left' && index > 0) {
      colIds.splice(index, 1);
      colIds.splice(index - 1, 0, menuTargetColumnId);
    } else if (direction === 'right' && index < colIds.length - 1) {
      colIds.splice(index, 1);
      colIds.splice(index + 1, 0, menuTargetColumnId);
    }

    reorderColumnsMutation.mutate({
      boardId: activeBoardId,
      columnIds: colIds
    });
  };

  const handleCreateCardSubmit = () => {
    if (newCardTitle.trim() && activeBoardId && cardTargetColumnId) {
      createCardMutation.mutate({
        boardId: activeBoardId,
        columnId: cardTargetColumnId,
        title: newCardTitle.trim(),
        description: newCardDescription.trim() || undefined,
        priority: newCardPriority,
        dueDate: newCardDueDate || undefined,
      }, {
        onSuccess: (response) => {
          const createdCard = response?.data?.data;
          const cardId = createdCard?._id;
          if (cardId && newCardAssignees.length > 0) {
            assignCardMutation.mutate({
              cardId,
              data: { assignedTo: newCardAssignees },
            });
          }
          setNewCardTitle('');
          setNewCardDescription('');
          setNewCardPriority('medium');
          setNewCardDueDate('');
          setNewCardAssignees([]);
          setIsCardDialogOpen(false);
        },
      });
    }
  };

  // Stage share then show confirmation dialog
  const handleShareSubmit = () => {
    if (activeBoardId && selectedUserToShare) {
      setPendingShareUserId(selectedUserToShare);
      setIsShareDialogOpen(false);
      setConfirmShareOpen(true);
    }
  };

  // Executes actual share mutation after confirmation
  const handleConfirmShare = () => {
    if (activeBoardId && pendingShareUserId) {
      const currentShared = Array.isArray(actualBoard?.sharedWith) ? actualBoard.sharedWith : [];
      const updatedShared = [...currentShared, pendingShareUserId];
      shareBoardMutation.mutate({
        boardId: activeBoardId,
        userIds: updatedShared
      }, {
        onSuccess: () => {
          setSelectedUserToShare('');
          setPendingShareUserId('');
          setConfirmShareOpen(false);
        },
        onError: () => {
          setPendingShareUserId('');
          setConfirmShareOpen(false);
        }
      });
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks.find(t => t.id === e.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskMatch = tasks.find(t => t.id === activeId);
    if (!activeTaskMatch) return;

    const targetColumn = actualBoard?.columns.find((c: any) => c._id === overId);
    if (targetColumn) {
      const targetColumnCards = tasks.filter(t => t.columnId === targetColumn._id);
      const newPos = targetColumnCards.length;
      moveCardMutation.mutate({
        cardId: activeId,
        data: {
          columnId: targetColumn._id,
          position: newPos,
        }
      });
      return;
    }

    const targetCardMatch = tasks.find(t => t.id === overId);
    if (targetCardMatch) {
      const targetColumnId = targetCardMatch.columnId;
      const targetColumnCards = tasks.filter(t => t.columnId === targetColumnId).sort((a, b) => a.position - b.position);
      const targetIndex = targetColumnCards.findIndex(t => t.id === targetCardMatch.id);

      let newPos = targetIndex;
      if (activeTaskMatch.columnId === targetColumnId) {
        const oldIndex = targetColumnCards.findIndex(t => t.id === activeId);
        if (oldIndex < targetIndex) {
          newPos = targetIndex;
        }
      }

      moveCardMutation.mutate({
        cardId: activeId,
        data: {
          columnId: targetColumnId,
          position: newPos,
        }
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  if (error || !actualBoard) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">Error loading board details.</Typography>
        <Button onClick={() => navigate('/board')} sx={{ mt: 2 }} variant="outlined">Back to Board</Button>
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in-up" sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '100%' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Button
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => navigate(`/board/${projectId}`)}
              sx={{ color: 'text.secondary', textTransform: 'none', minWidth: 0, p: 0, '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
            >
              Board
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>/</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>{actualBoard.name}</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {boardLead
              ? ([boardLead.firstName, boardLead.lastName].filter(Boolean).join(' ').trim() || boardLead.company || actualBoard.name)
              : `${actualBoard.name} Board`}
          </Typography>
          {boardLead?.company && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
              {boardLead.company}{(boardLead.jobTitle || boardLead.title) ? ` · ${boardLead.jobTitle || boardLead.title}` : ''}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700, borderColor: isDarkMode ? '#1E1B24' : '#fff' } }}>
            {boardMembers.map((member: any, idx: number) => {
              const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'User';
              const initial = (member.firstName?.charAt(0) || member.email?.charAt(0) || 'U').toUpperCase();
              const tooltipText = (
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{name}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)' }}>{member.email}</Typography>
                  {member.jobTitle && <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>{member.jobTitle}</Typography>}
                </Box>
              );
              return (
                <Tooltip key={member._id || idx} title={tooltipText} arrow enterDelay={100} leaveDelay={100}>
                  <Avatar sx={{ bgcolor: tokens.brand.primaryMuted }}>{initial}</Avatar>
                </Tooltip>
              );
            })}
          </AvatarGroup>
          <TextField
            placeholder="Search cards..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', sm: 200 }, '& .MuiOutlinedInput-root': { borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' } } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
          />
          <IconButton
            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            sx={{
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '50%',
              bgcolor: (priorityFilter !== 'All' || assigneeFilter !== 'All') ? (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent'
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
          {canManageTeam && (
            <Button onClick={() => setIsShareDialogOpen(true)} variant="contained" sx={{ bgcolor: '#FF5733', color: '#fff', fontWeight: 700, borderRadius: '24px', textTransform: 'none', boxShadow: 'none', px: 3, ml: 1, '&:hover': { bgcolor: '#E04A2A', boxShadow: 'none' } }}>Share</Button>
          )}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', gap: 3, overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }, '&::-webkit-scrollbar-thumb': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 4 } }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            }
          }}
        >
          {columns.map((col: any) => {
            const colTasks = filteredTasks.filter(t => t.columnId === col.id);
            return (
              <Box key={col.id} sx={{ minWidth: { xs: 280, sm: 320 }, width: { xs: 280, sm: 320 }, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>{col.title}</Typography>
                    <Chip label={colTasks.length} size="small" sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: 'text.secondary', fontWeight: 700, height: 24, fontSize: '0.75rem' }} />
                  </Box>
                  <Box>
                    <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={() => { setCardTargetColumnId(col.id); setIsCardDialogOpen(true); }}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: 'text.secondary' }}
                      onClick={(e) => {
                        setColumnMenuAnchor(e.currentTarget);
                        setMenuTargetColumnId(col.id);
                        setRenameColumnText(col.title);
                      }}
                    >
                      <MoreHorizIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <DroppableColumn col={col} isDarkMode={isDarkMode}>
                    {colTasks.map(task => (
                      <SortableTask key={task.id} task={task} isDarkMode={isDarkMode} onTaskClick={(t: any) => setDrawerTaskId(t.id)} />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              </Box>
            );
          })}

          <DragOverlay dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeTask ? (
              <Box sx={{ width: '100%', height: '100%', transform: 'rotate(2deg) scale(1.02)', transformOrigin: 'top left', cursor: 'grabbing' }}>
                <TaskCardVisual task={activeTask} isDarkMode={isDarkMode} />
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>

        <Box sx={{ minWidth: { xs: 280, sm: 320 }, width: { xs: 280, sm: 320 }, display: 'flex', flexDirection: 'column' }}>
          <Button onClick={() => setIsColumnDialogOpen(true)} startIcon={<AddIcon />} sx={{ height: 52, border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '16px', color: 'text.secondary', fontWeight: 650, textTransform: 'none', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', color: 'text.primary' } }}>Add Column</Button>
        </Box>
      </Box>

      {/* Column Action Menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setColumnMenuAnchor(null); setIsRenameColumnOpen(true); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Rename Column</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setColumnMenuAnchor(null); handleMoveColumn('left'); }}>
          <ListItemIcon><ArrowBackIosNewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Move Left</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setColumnMenuAnchor(null); handleMoveColumn('right'); }}>
          <ListItemIcon><ArrowForwardIosIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Move Right</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setColumnMenuAnchor(null); triggerDeleteColumnConfirm(); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Delete Column</ListItemText>
        </MenuItem>
      </Menu>

      {/* Board Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{
          sx: {
            minWidth: 220,
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            p: 1
          }
        }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Filter by Priority
        </Typography>
        {['All', 'Low', 'Medium', 'High', 'Urgent'].map((opt) => (
          <MenuItem
            key={opt}
            selected={priorityFilter === opt}
            onClick={() => {
              setPriorityFilter(opt);
              setFilterMenuAnchor(null);
            }}
            sx={{ borderRadius: '8px', mx: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: priorityFilter === opt ? 700 : 500 }}>
              {opt}
            </Typography>
          </MenuItem>
        ))}

        <Divider sx={{ my: 1 }} />

        <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Filter by Assignee
        </Typography>
        <MenuItem
          selected={assigneeFilter === 'All'}
          onClick={() => {
            setAssigneeFilter('All');
            setFilterMenuAnchor(null);
          }}
          sx={{ borderRadius: '8px', mx: 1 }}
        >
          <Typography variant="body2" sx={{ fontWeight: assigneeFilter === 'All' ? 700 : 500 }}>
            All Assignees
          </Typography>
        </MenuItem>
        {boardMembers.map((m: any) => {
          const name = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email;
          return (
            <MenuItem
              key={m._id}
              selected={assigneeFilter === m._id}
              onClick={() => {
                setAssigneeFilter(m._id);
                setFilterMenuAnchor(null);
              }}
              sx={{ borderRadius: '8px', mx: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: assigneeFilter === m._id ? 700 : 500 }}>
                {name}
              </Typography>
            </MenuItem>
          );
        })}

        {(priorityFilter !== 'All' || assigneeFilter !== 'All') && (
          <>
            <Divider sx={{ my: 1 }} />
            <MenuItem
              onClick={() => {
                setPriorityFilter('All');
                setAssigneeFilter('All');
                setFilterMenuAnchor(null);
              }}
              sx={{ borderRadius: '8px', mx: 1, color: 'error.main', justifyContent: 'center' }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Clear Filters
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Add Column Dialog */}
      <Dialog open={isColumnDialogOpen} onClose={() => setIsColumnDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>New Column</DialogTitle>
        <DialogContent sx={{ overflow: 'visible' }}>
          <TextField autoFocus fullWidth label="Column Name" variant="outlined" size="small" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} sx={{ mt: 1.5 }} onKeyDown={(e) => { if (e.key === 'Enter') handleAddColumn(); }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIsColumnDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleAddColumn} disabled={!newColumnName.trim() || createColumnMutation.isPending} variant="contained" sx={{ bgcolor: '#FF5733', borderRadius: '24px', '&:hover': { bgcolor: '#E04A2A' } }}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Column Dialog */}
      <Dialog open={isRenameColumnOpen} onClose={() => setIsRenameColumnOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Rename Column</DialogTitle>
        <DialogContent sx={{ overflow: 'visible' }}>
          <TextField autoFocus fullWidth label="Column Name" variant="outlined" size="small" value={renameColumnText} onChange={(e) => setRenameColumnText(e.target.value)} sx={{ mt: 1.5 }} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameColumnSubmit(); }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIsRenameColumnOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleRenameColumnSubmit} disabled={!renameColumnText.trim() || renameColumnMutation.isPending} variant="contained" sx={{ bgcolor: '#FF5733', borderRadius: '24px', '&:hover': { bgcolor: '#E04A2A' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ── Rich Card Creation Dialog ── */}
      <Dialog
        open={isCardDialogOpen}
        onClose={() => setIsCardDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1.5,
            bgcolor: isDarkMode ? '#1E1B24' : '#fff',
            backgroundImage: 'none',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            overflow: 'visible',
          }
        }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Create New Card</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.25 }}>Add a custom task to this column</Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3.5, pb: 3, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'visible' }}>
          {/* Title */}
          <TextField
            autoFocus
            fullWidth
            label="Card Title"
            placeholder="e.g. Follow up with client..."
            variant="outlined"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleCreateCardSubmit(); }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '14px',
                fontWeight: 650,
              }
            }}
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            placeholder="Add more details about this task..."
            variant="outlined"
            multiline
            rows={3}
            value={newCardDescription}
            onChange={(e) => setNewCardDescription(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '14px' }
            }}
          />

          {/* Priority + Due Date row */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Priority */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 700, color: 'text.secondary' }}>
                Priority
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={newCardPriority}
                  onChange={(e) => setNewCardPriority(e.target.value as any)}
                  displayEmpty
                  sx={{ borderRadius: '14px', '& .MuiSelect-select': { py: 1.25 } }}
                  renderValue={(val) => {
                    const p = PRIORITY_CONFIG[val as keyof typeof PRIORITY_CONFIG];
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.dot }} />
                        <Typography variant="body2" sx={{ fontWeight: 650 }}>{p.label}</Typography>
                      </Box>
                    );
                  }}
                >
                  {(Object.entries(PRIORITY_CONFIG) as [string, any][]).map(([key, cfg]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cfg.dot }} />
                        <Typography variant="body2" sx={{ fontWeight: 650 }}>{cfg.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Due Date */}
            <Box sx={{ flex: 1 }}>
              <ModernDatePicker
                label="Due Date"
                value={newCardDueDate ? new Date(newCardDueDate.split('T')[0] + 'T00:00:00') : null}
                onChange={(date) => {
                  if (date) {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    setNewCardDueDate(`${y}-${m}-${d}`);
                  } else {
                    setNewCardDueDate('');
                  }
                }}
              />
            </Box>
          </Box>

          {/* Assignees */}
          <FormControl fullWidth size="small">
            <InputLabel id="new-card-assign-label">Assign Members</InputLabel>
            <Select
              labelId="new-card-assign-label"
              multiple
              value={newCardAssignees}
              onChange={(e) => setNewCardAssignees(e.target.value as string[])}
              input={<OutlinedInput label="Assign Members" />}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' }, borderRadius: '14px' }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((val) => {
                    const match = allUsers.find((u: any) => u._id === val);
                    return (
                      <Chip 
                        key={val} 
                        label={match ? `${match.firstName || ''} ${match.lastName || ''}`.trim() : val} 
                        size="small" 
                        onDelete={() => {
                          setNewCardAssignees(newCardAssignees.filter(id => id !== val));
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        sx={{ height: 22, fontSize: '0.72rem' }} 
                      />
                    );
                  })}
                </Box>
              )}
            >
              {boardMembers.map((u: any) => (
                <MenuItem key={u._id} value={u._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: tokens.brand.primaryMuted, fontSize: '0.72rem', fontWeight: 700 }}>
                      {(u.firstName?.charAt(0) || u.email?.charAt(0) || 'U').toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => {
              setIsCardDialogOpen(false);
              setNewCardTitle('');
              setNewCardDescription('');
              setNewCardPriority('medium');
              setNewCardDueDate('');
              setNewCardAssignees([]);
            }}
            sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '24px', textTransform: 'none', px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCardSubmit}
            disabled={!newCardTitle.trim() || createCardMutation.isPending}
            variant="contained"
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              fontWeight: 700,
              borderRadius: '24px',
              textTransform: 'none',
              px: 4,
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.brand.primaryLight, boxShadow: 'none' },
            }}
          >
            {createCardMutation.isPending ? 'Creating...' : 'Create Card'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detailed Task Drawer */}
      <TaskDetailDrawer
        task={drawerTask}
        open={Boolean(drawerTask)}
        onClose={() => {
          setDrawerTaskId(null);
          setSearchParams((prev) => {
            prev.delete('card');
            prev.delete('comment');
            return prev;
          });
        }}
        isDarkMode={isDarkMode}
        allUsers={allUsers}
        boardMembers={boardMembers}
        boardId={activeBoardId}
        actualBoard={actualBoard}
      />

      {/* Custom Column Delete Confirmation */}
      <ModernConfirmDialog
        open={columnConfirmOpen}
        title="Delete Column"
        description="Are you sure you want to delete this column? Sibling card leads will automatically move to the first active column."
        onConfirm={handleDeleteColumnConfirm}
        onCancel={() => setColumnConfirmOpen(false)}
      />
      {/* Share Board Dialog */}
      <Dialog open={isShareDialogOpen} onClose={() => setIsShareDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>Share Board</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Select a team member to invite to this project board.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Select User</InputLabel>
            <Select
              value={selectedUserToShare}
              onChange={(e) => setSelectedUserToShare(e.target.value)}
              label="Select User"
              sx={{ borderRadius: '24px' }}
            >
              {allUsers.filter((u: any) => u._id !== actualBoard?.ownerId && !(actualBoard?.sharedWith || []).includes(u._id)).map((u: any) => (
                <MenuItem key={u._id} value={u._id}>
                  {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsShareDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '24px', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleShareSubmit} variant="contained" disabled={!selectedUserToShare || shareBoardMutation.isPending} sx={{ bgcolor: tokens.brand.primary, color: '#fff', fontWeight: 700, borderRadius: '24px', textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: tokens.brand.primaryMuted, boxShadow: 'none' } }}>
            Invite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Board Confirmation Dialog */}
      {(() => {
        const pendingUser = allUsers.find((u: any) => u._id === pendingShareUserId);
        const pendingUserName = pendingUser
          ? (`${pendingUser.firstName || ''} ${pendingUser.lastName || ''}`.trim() || pendingUser.email)
          : 'this team member';
        return (
          <ConfirmDialog
            open={confirmShareOpen}
            title="Add Team Member"
            message={`Are you sure you want to add ${pendingUserName} to this board? They will be able to view and interact with all cards on this board.`}
            confirmLabel="Add Member"
            cancelLabel="Cancel"
            isPending={shareBoardMutation.isPending}
            onConfirm={handleConfirmShare}
            onCancel={() => {
              setConfirmShareOpen(false);
              setPendingShareUserId('');
              setSelectedUserToShare('');
            }}
          />
        );
      })()}
    </Box>
  );
};

export default KanbanBoardPage;
