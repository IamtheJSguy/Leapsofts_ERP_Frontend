import { useState, useMemo } from 'react';
import { 
  Box, Typography, Button, useTheme, IconButton, InputAdornment, 
  TextField, Avatar, AvatarGroup, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Drawer, CircularProgress, 
  Menu, MenuItem, ListItemIcon, ListItemText, FormControl, 
  InputLabel, Select, OutlinedInput
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
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
import { tokens } from '@/styles/tokens';

import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor,
  PointerSensor, useSensor, useSensors, type DragStartEvent,
  type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  useKanbanBoard, useMoveCard, useAddComment, useCreateColumn,
  useRenameColumn, useDeleteColumn, useReorderColumns,
  useCreateCard, useUpdateCard, useDeleteCard,
  useEditComment, useDeleteComment, useShareBoard
} from '@/hooks/api/useKanban';
import { useAuthStore } from '@/store/useAuthStore';
import { useUsers } from '@/hooks/api/useUsers';

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

const TaskCardVisual = ({ task, isDarkMode, onClick }: any) => {
  const companyName = task.lead?.company || 'Lead Prospect';
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: isDarkMode ? '#1E1B24' : '#fff',
        borderRadius: '12px',
        p: 2,
        cursor: 'pointer',
        boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
          borderColor: tokens.brand.primaryMuted,
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Chip label={companyName} size="small" sx={{ bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
        <IconButton size="small" sx={{ color: 'text.secondary', p: 0 }}>
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 650, color: 'text.primary', mb: 2, lineHeight: 1.4 }}>
        {task.title}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1.5, color: 'text.secondary' }}>
          {task.comments > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><ChatBubbleOutlineIcon sx={{ fontSize: 14 }} /><Typography variant="caption" sx={{ fontWeight: 600 }}>{task.comments}</Typography></Box>}
          {task.attachments > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AttachFileIcon sx={{ fontSize: 14 }} /><Typography variant="caption" sx={{ fontWeight: 600 }}>{task.attachments}</Typography></Box>}
        </Box>
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.65rem', fontWeight: 700, borderColor: isDarkMode ? '#1E1B24' : '#fff' } }}>
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
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

const TaskDetailDrawer = ({ task, open, onClose, isDarkMode, allUsers = [], boardId, actualBoard }: any) => {
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  // Confirmation Dialog States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDesc, setConfirmDesc] = useState('');
  const [confirmAction, setConfirmAction] = useState<'deleteCard' | 'deleteComment' | null>(null);
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);

  // Assignee Confirmation State
  const [assigneeConfirmOpen, setAssigneeConfirmOpen] = useState(false);
  const [pendingAssignees, setPendingAssignees] = useState<string[]>([]);

  const addCommentMutation = useAddComment();
  const editCommentMutation = useEditComment();
  const deleteCommentMutation = useDeleteComment();
  const updateCardMutation = useUpdateCard(boardId);
  const deleteCardMutation = useDeleteCard(boardId);
  const currentUser = useAuthStore((s) => s.user);

  const isAdminOrOwner = currentUser?.role === 'admin' || actualBoard?.ownerId === currentUser?._id;

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
        }
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
        }
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

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      updateCardMutation.mutate({
        cardId: task.id,
        data: { title: editTitle.trim() }
      });
    }
    setIsEditingTitle(false);
  };

  const handleAssigneeChange = (event: any) => {
    const selectedIds = event.target.value;
    setPendingAssignees(selectedIds);
    setAssigneeConfirmOpen(true);
  };

  const handleAssigneeConfirm = () => {
    updateCardMutation.mutate({
      cardId: task.id,
      data: { assignedTo: pendingAssignees }
    }, {
      onSuccess: () => {
        setAssigneeConfirmOpen(false);
      }
    });
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
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip label={lead?.company || 'Lead Prospect'} size="small" sx={{ bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
              {lead?.isQualified && (
                <Chip label="Qualified" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: tokens.semantic.success, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
              )}
            </Box>
            {isEditingTitle ? (
              <TextField
                fullWidth
                size="small"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSubmit(); }}
                autoFocus
                sx={{ '& .MuiOutlinedInput-root': { fontWeight: 800 } }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="h5" 
                  sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.3, cursor: 'pointer' }} 
                  onClick={() => { setEditTitle(task.title); setIsEditingTitle(true); }}
                  noWrap
                >
                  {task.title}
                </Typography>
                <IconButton size="small" onClick={() => { setEditTitle(task.title); setIsEditingTitle(true); }}>
                  <EditIcon fontSize="small" sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
            <IconButton onClick={triggerDeleteCardConfirm} sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.08)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={onClose} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Drawer Content Area */}
        <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* Assignees Section */}
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'text.secondary' }}>
              <GroupIcon fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignees</Typography>
            </Box>
            {isAdminOrOwner ? (
              <FormControl fullWidth size="small">
                <InputLabel id="assign-member-label">Assign Team Members</InputLabel>
                <Select
                  labelId="assign-member-label"
                  multiple
                  value={assignedToIds}
                  onChange={handleAssigneeChange}
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
                  {allUsers.map((u: any) => (
                    <MenuItem key={u._id} value={u._id}>
                      {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
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
                          <Typography variant="body2" sx={{ color: 'text.secondary', bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', p: 1.5, borderRadius: '0 12px 12px 12px', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word' }}>
                            {comm.text}
                          </Typography>
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
        </Box>

        <Box sx={{ p: 2.5, borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)' }}>
          <TextField
            fullWidth
            placeholder="Write a comment..."
            size="small"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendComment();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton sx={{ color: tokens.brand.primary }} size="small" onClick={handleSendComment} disabled={addCommentMutation.isPending || !commentText.trim()}>
                    <SendIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
      </Drawer>

      {/* Local confirm dialogue inside Drawer */}
      <ModernConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        onConfirm={handleConfirmAction}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); setTargetCommentId(null); }}
      />
      <ModernConfirmDialog
        open={assigneeConfirmOpen}
        title="Update Team Members"
        description="Are you sure you want to update the assigned team members for this lead?"
        onConfirm={handleAssigneeConfirm}
        onCancel={() => setAssigneeConfirmOpen(false)}
        confirmText="Yes, Update"
      />
    </>
  );
};

export const KanbanBoardPage = () => {
  const { projectId, boardId } = useParams<{ projectId: string; boardId: string }>();
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

  const actualBoard = useMemo(() => (board as any)?.board || board, [board]);
  const cardsList = useMemo(() => (board as any)?.cards || [], [board]);

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
  const [newCardAssignees, setNewCardAssignees] = useState<string[]>([]);

  // Page Confirm Dialog State
  const [columnConfirmOpen, setColumnConfirmOpen] = useState(false);

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Share Board Dialog State
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedUserToShare, setSelectedUserToShare] = useState<string>('');
  const shareBoardMutation = useShareBoard();

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
        comments: card.comments?.length || 0,
        attachments: 0,
        assignedUsers: cardAssignees,
        rawCard: card,
        position: card.position || 0,
      });
    });
    
    return tList.sort((a, b) => a.position - b.position);
  }, [actualBoard, cardsList, allUsers]);

  // Filter tasks based on searchQuery
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter((t) => {
      const titleMatch = t.title?.toLowerCase().includes(query);
      const companyMatch = t.lead?.company?.toLowerCase().includes(query);
      const emailMatch = t.lead?.email?.toLowerCase().includes(query);
      const nameMatch = `${t.lead?.firstName || ''} ${t.lead?.lastName || ''}`.toLowerCase().includes(query);
      return titleMatch || companyMatch || emailMatch || nameMatch;
    });
  }, [tasks, searchQuery]);

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
        assignedTo: newCardAssignees
      }, {
        onSuccess: () => {
          setNewCardTitle('');
          setNewCardAssignees([]);
          setIsCardDialogOpen(false);
        }
      });
    }
  };

  const handleShareSubmit = () => {
    if (activeBoardId && selectedUserToShare) {
      const currentShared = Array.isArray(actualBoard?.sharedWith) ? actualBoard.sharedWith : [];
      const updatedShared = [...currentShared, selectedUserToShare];
      shareBoardMutation.mutate({
        boardId: activeBoardId,
        userIds: updatedShared
      }, {
        onSuccess: () => {
          setSelectedUserToShare('');
          setIsShareDialogOpen(false);
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
    <Box className="animate-fade-in-up" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>{actualBoard.name} Board</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700, borderColor: isDarkMode ? '#1E1B24' : '#fff' } }}>
            {boardMembers.map((member: any, idx: number) => {
              const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'U';
              const initial = name.charAt(0).toUpperCase();
              return <Avatar key={member._id || idx} sx={{ bgcolor: tokens.brand.primary }}>{initial}</Avatar>;
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
          <IconButton sx={{ border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '50%' }}><FilterListIcon fontSize="small" /></IconButton>
          <IconButton sx={{ border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '50%' }}><GroupIcon fontSize="small" /></IconButton>
          <Button onClick={() => setIsShareDialogOpen(true)} variant="contained" sx={{ bgcolor: '#FF5733', color: '#fff', fontWeight: 700, borderRadius: '24px', textTransform: 'none', boxShadow: 'none', px: 3, ml: 1, '&:hover': { bgcolor: '#E04A2A', boxShadow: 'none' } }}>Share</Button>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', gap: 3, overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }, '&::-webkit-scrollbar-thumb': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 4 } }}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

          <DragOverlay>
            {activeTask ? (
              <div style={{ transform: 'rotate(2deg) scale(1.02)', boxShadow: tokens.shadow.cardHover, cursor: 'grabbing', width: 296 }}>
                <TaskCardVisual task={activeTask} isDarkMode={isDarkMode} />
              </div>
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

      {/* Add Column Dialog */}
      <Dialog open={isColumnDialogOpen} onClose={() => setIsColumnDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>New Column</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Column Name" variant="outlined" size="small" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} sx={{ mt: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') handleAddColumn(); }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIsColumnDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleAddColumn} disabled={!newColumnName.trim() || createColumnMutation.isPending} variant="contained" sx={{ bgcolor: '#FF5733', borderRadius: '24px', '&:hover': { bgcolor: '#E04A2A' } }}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Column Dialog */}
      <Dialog open={isRenameColumnOpen} onClose={() => setIsRenameColumnOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Rename Column</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Column Name" variant="outlined" size="small" value={renameColumnText} onChange={(e) => setRenameColumnText(e.target.value)} sx={{ mt: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameColumnSubmit(); }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIsRenameColumnOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleRenameColumnSubmit} disabled={!renameColumnText.trim() || renameColumnMutation.isPending} variant="contained" sx={{ bgcolor: '#FF5733', borderRadius: '24px', '&:hover': { bgcolor: '#E04A2A' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Direct Card Creation Dialog */}
      <Dialog open={isCardDialogOpen} onClose={() => setIsCardDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create New Task</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField 
            autoFocus 
            fullWidth 
            label="Task Title" 
            variant="outlined" 
            size="small" 
            value={newCardTitle} 
            onChange={(e) => setNewCardTitle(e.target.value)} 
          />
          <FormControl fullWidth size="small">
            <InputLabel id="new-card-assign-label">Assign Members</InputLabel>
            <Select
              labelId="new-card-assign-label"
              multiple
              value={newCardAssignees}
              onChange={(e) => setNewCardAssignees(e.target.value as string[])}
              input={<OutlinedInput label="Assign Members" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((val) => {
                    const match = allUsers.find((u: any) => u._id === val);
                    return <Chip key={val} label={match ? `${match.firstName || ''} ${match.lastName || ''}`.trim() : val} size="small" />;
                  })}
                </Box>
              )}
            >
              {allUsers.map((u: any) => (
                <MenuItem key={u._id} value={u._id}>
                  {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIsCardDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleCreateCardSubmit} disabled={!newCardTitle.trim() || createCardMutation.isPending} variant="contained" sx={{ bgcolor: '#FF5733', borderRadius: '24px', '&:hover': { bgcolor: '#E04A2A' } }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Detailed Task Drawer */}
      <TaskDetailDrawer
        task={drawerTask}
        open={Boolean(drawerTask)}
        onClose={() => setDrawerTaskId(null)}
        isDarkMode={isDarkMode}
        allUsers={allUsers}
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
    </Box>
  );
};

export default KanbanBoardPage;
