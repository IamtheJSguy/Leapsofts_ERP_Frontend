import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Box, Typography, Button, useTheme, IconButton, InputAdornment,
  TextField, Avatar, AvatarGroup, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Drawer, CircularProgress,
  Menu, MenuItem, ListItemIcon, ListItemText, FormControl,
  InputLabel, Select, OutlinedInput, Tooltip, Divider,
  Popover, Checkbox, Autocomplete, Collapse,
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import LinkIcon from '@mui/icons-material/Link';
import EventIcon from '@mui/icons-material/Event';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { tokens } from '@/styles/tokens';
import { KANBAN_LABEL_COLORS } from '@/lib/constants';
import { ModernDatePicker } from '@/components/common/ModernDatePicker';
import { ModernTimePicker } from '@/components/common/ModernTimePicker';
import type { KanbanCardLink, KanbanLabel, Meeting } from '@/types';
import { formatDate, formatKpiDueDate, hasDisplayableClockTime } from '@/utils/formatters';

import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor,
  PointerSensor, useSensor, useSensors, type DragStartEvent,
  type DragEndEvent, type DragOverEvent, type CollisionDetection,
  useDroppable, MeasuringStrategy, pointerWithin, rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useKanbanBoard, useMoveCard, useAddComment, useCreateColumn,
  useRenameColumn, useDeleteColumn, useReorderColumns,
  useCreateCard, useUpdateCard, useDeleteCard, useAssignCard,
  useEditComment, useDeleteComment,
  useCreateLabel, useDeleteLabel,
  useAttachCardMeeting, useDetachCardMeeting, useCreateMeetingOnCard,
} from '@/hooks/api/useKanban';
import { useMeetings } from '@/hooks/api/useMeetings';
import { useAddBoardMember, useRemoveBoardMember } from '@/hooks/api/useProjects';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/useUIStore';
import { useUsers } from '@/hooks/api/useUsers';
import { useConversations, useCreateBoardConversation } from '@/hooks/api/useChat';
import { useChatStore } from '@/store/useChatStore';
import { CommentText } from '@/components/kanban/CommentText';
import { MentionInput } from '@/components/kanban/MentionInput';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const getLinkHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const kanbanUserDisplayName = (user?: { firstName?: string; lastName?: string; email?: string } | null) => {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
};

const kanbanUserInitial = (user?: { firstName?: string; lastName?: string; email?: string } | null) => {
  if (!user) return 'U';
  return (user.firstName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase();
};

const resolveKanbanUser = (value: any, allUsers: any[] = []) => {
  if (!value) return null;
  if (typeof value === 'object') {
    const fromList = allUsers.find((au: any) => au._id === value._id);
    return fromList ? { ...fromList, ...value } : value;
  }
  return allUsers.find((au: any) => au._id === value) || null;
};

const kanbanActiveMoverRingSx = (isActive: boolean) =>
  isActive
    ? {
        boxShadow: '0 0 0 2px #ef4444',
        outline: '2px solid #ef4444',
        outlineOffset: '1px',
      }
    : {};

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
          /* backdropFilter: 'blur(10px)' (removed for performance) */
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

const DEFAULT_DUE_TIME = '17:00';

const pad2 = (n: number) => String(n).padStart(2, '0');

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toLocalTimeStr = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const combineDueDateTime = (dateStr: string, timeStr: string): string | undefined => {
  if (!dateStr) return undefined;
  const time = timeStr || DEFAULT_DUE_TIME;
  const local = new Date(`${dateStr}T${time}:00`);
  if (Number.isNaN(local.getTime())) return dateStr;
  return local.toISOString();
};

const parseDueParts = (iso?: string) => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: String(iso).split('T')[0] || '', time: '' };
  return {
    date: toLocalDateStr(d),
    time: hasDisplayableClockTime(d) ? toLocalTimeStr(d) : '',
  };
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
  const isDone = Boolean(task.isDone ?? task.rawCard?.isDone);
  const commentsCount = Array.isArray(task.rawCard?.comments)
    ? task.rawCard.comments.filter((c: any) => c.isActive !== false).length
    : (task.comments || 0);
  const createdByUser = task.createdBy || null;
  const lastMovedById = task.lastMovedBy?._id || (typeof task.lastMovedBy === 'string' ? task.lastMovedBy : null);

  const formatDue = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const showTime = hasDisplayableClockTime(date);
    const compare = showTime ? date : (() => {
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return end;
    })();
    const isPast = compare.getTime() < now.getTime();
    return { label: formatKpiDueDate(date, { includeTime: showTime }), isPast };
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
        border: `1px solid ${
          isDone
            ? (isDarkMode ? 'rgba(34,197,94,0.35)' : 'rgba(22,163,74,0.3)')
            : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
        }`,
        opacity: isDone ? 0.88 : 1,
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
          {isDone && (
            <Chip
              icon={<CheckIcon sx={{ fontSize: '12px !important' }} />}
              label="Done"
              size="small"
              sx={{
                bgcolor: isDarkMode ? 'rgba(34,197,94,0.15)' : 'rgba(22,163,74,0.1)',
                color: isDarkMode ? '#4ade80' : '#15803d',
                fontWeight: 800,
                fontSize: '0.65rem',
                height: 22,
                border: `1px solid ${isDarkMode ? 'rgba(34,197,94,0.3)' : 'rgba(22,163,74,0.25)'}`,
                '& .MuiChip-icon': { color: 'inherit' },
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
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: (task.labels?.length || task.description) ? 1 : 2,
          lineHeight: 1.45,
          letterSpacing: '-0.01em',
          textDecoration: isDone ? 'line-through' : 'none',
          textDecorationColor: isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
        }}
      >
        {task.title}
      </Typography>

      {/* Board label chips */}
      {Array.isArray(task.labels) && task.labels.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: task.description ? 1 : 2 }}>
          {task.labels.map((label: KanbanLabel) => (
            <Box
              key={label._id}
              title={label.name}
              sx={{
                bgcolor: label.color,
                color: '#fff',
                borderRadius: '4px',
                px: 0.75,
                py: 0.15,
                fontSize: '0.65rem',
                fontWeight: 750,
                lineHeight: 1.4,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 1px rgba(0,0,0,0.25)',
              }}
            >
              {label.name || '\u00A0'}
            </Box>
          ))}
        </Box>
      )}

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
          {createdByUser && (
            <Tooltip title={kanbanUserDisplayName(createdByUser)} arrow enterDelay={100}>
              <Box component="span" sx={{ display: 'inline-flex' }}>
                <Avatar
                  sx={{
                    width: 22,
                    height: 22,
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    bgcolor: tokens.brand.primaryMuted || tokens.brand.primary,
                    ...kanbanActiveMoverRingSx(createdByUser._id === lastMovedById),
                  }}
                >
                  {kanbanUserInitial(createdByUser)}
                </Avatar>
              </Box>
            </Tooltip>
          )}
        </Box>
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.65rem', fontWeight: 800, borderColor: isDarkMode ? '#1E1B24' : '#fff' } }}>
          {task.assignedUsers?.map((u: any, idx: number) => (
            <Tooltip key={u._id || idx} title={kanbanUserDisplayName(u)} arrow enterDelay={100}>
              <Box component="span" sx={{ display: 'inline-flex' }}>
                <Avatar
                  sx={{
                    bgcolor: tokens.brand.primary,
                    ...kanbanActiveMoverRingSx(u._id === lastMovedById),
                  }}
                >
                  {kanbanUserInitial(u)}
                </Avatar>
              </Box>
            </Tooltip>
          ))}
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

const COLUMN_DROPPABLE_PREFIX = 'droppable-column-';

const columnDroppableId = (columnId: string) => `${COLUMN_DROPPABLE_PREFIX}${columnId}`;

const parseColumnDroppableId = (id: string | number): string | null => {
  const value = String(id);
  return value.startsWith(COLUMN_DROPPABLE_PREFIX)
    ? value.slice(COLUMN_DROPPABLE_PREFIX.length)
    : null;
};

const idsEqual = (a: unknown, b: unknown) => String(a) === String(b);

/** Prefer the pointer so a short empty last column is not lost among many nearby cards. */
const kanbanCollisionDetection: CollisionDetection = (args) => {
  const activeType = args.active.data.current?.type;
  const columnContainers = args.droppableContainers.filter((container) =>
    Boolean(parseColumnDroppableId(container.id)),
  );

  if (activeType === 'Column') {
    return closestCorners({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) =>
          container.data.current?.type === 'Column' &&
          !parseColumnDroppableId(container.id),
      ),
    });
  }

  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    const taskHit = pointerHits.find((hit) => {
      const container = args.droppableContainers.find((c) => c.id === hit.id);
      return container?.data.current?.type === 'Task';
    });
    if (taskHit) return [taskHit];

    const columnHit = pointerHits.find((hit) => parseColumnDroppableId(hit.id));
    if (columnHit) return [columnHit];

    return pointerHits;
  }

  if (columnContainers.length > 0) {
    const intersecting = rectIntersection({
      ...args,
      droppableContainers: columnContainers,
    });
    if (intersecting.length > 0) return intersecting;
    return closestCorners({ ...args, droppableContainers: columnContainers });
  }

  return closestCorners(args);
};

const resolveOverColumnId = (
  over: { id: string | number; data: { current?: any } } | null,
  columnIds: string[],
): string | null => {
  if (!over) return null;
  const fromPrefix = parseColumnDroppableId(over.id);
  if (fromPrefix) return fromPrefix;
  if (over.data.current?.type === 'Column') {
    const id = over.data.current.column?.id ?? over.data.current.column?._id;
    if (id) return String(id);
  }
  const overId = String(over.id);
  return columnIds.some((id) => idsEqual(id, overId)) ? overId : null;
};

const DroppableColumn = ({ col, isDarkMode, children }: any) => {
  const { setNodeRef } = useDroppable({
    id: columnDroppableId(col.id),
    data: { type: 'Column', column: col },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        borderRadius: '16px',
        p: 1.5,
        overflowY: 'auto',
      }}
    >
      {children}
    </Box>
  );
};

const SortableBoardColumn = ({
  col,
  colTasks,
  isDarkMode,
  onAddCard,
  onColumnMenuOpen,
  setDrawerTaskId,
}: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    data: { type: 'Column', column: col },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        minWidth: { xs: 280, sm: 320 },
        width: { xs: 280, sm: 320 },
        height: '100%',
        maxHeight: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'stretch',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box 
          {...attributes} 
          {...listeners} 
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, cursor: isDragging ? 'grabbing' : 'grab', py: 0.5 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>{col.title}</Typography>
          <Chip label={colTasks.length} size="small" sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: 'text.secondary', fontWeight: 700, height: 24, fontSize: '0.75rem' }} />
        </Box>
        <Box>
          <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={() => onAddCard(col.id)}>
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: 'text.secondary' }}
            onClick={(e) => onColumnMenuOpen(e, col.id, col.title)}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <SortableContext items={colTasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
        <DroppableColumn col={col} isDarkMode={isDarkMode}>
          {colTasks.map((task: any) => (
            <SortableTask key={task.id} task={task} isDarkMode={isDarkMode} onTaskClick={(t: any) => setDrawerTaskId(t.id)} />
          ))}
        </DroppableColumn>
      </SortableContext>
    </Box>
  );
};

const sectionBoxSx = (isDarkMode: boolean) => ({
  p: 2.5,
  bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
  borderRadius: '16px',
  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
});

const CardLabelsSection = ({
  isDarkMode,
  canEdit,
  boardId,
  cardId,
  boardLabels = [],
  selectedLabelIds = [],
  updateCardMutation,
  createLabelMutation,
  deleteLabelMutation,
  addToast,
}: {
  isDarkMode: boolean;
  canEdit: boolean;
  boardId: string;
  cardId: string;
  boardLabels: KanbanLabel[];
  selectedLabelIds: string[];
  updateCardMutation: any;
  createLabelMutation: any;
  deleteLabelMutation: any;
  addToast: (t: { message: string; severity: 'success' | 'error' | 'info' | 'warning' }) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(KANBAN_LABEL_COLORS[5]);

  const open = Boolean(anchorEl);
  const selectedLabels = boardLabels.filter((l) => selectedLabelIds.includes(l._id));

  const resetCreate = () => {
    setMode('list');
    setNewName('');
    setNewColor(KANBAN_LABEL_COLORS[5]);
  };

  const handleClose = () => {
    setAnchorEl(null);
    resetCreate();
  };

  const toggleLabel = (labelId: string) => {
    if (!canEdit) return;
    const next = selectedLabelIds.includes(labelId)
      ? selectedLabelIds.filter((id) => id !== labelId)
      : [...selectedLabelIds, labelId];
    updateCardMutation.mutate(
      { cardId, data: { labelIds: next } },
      {
        onError: (err: any) =>
          addToast({ message: err.response?.data?.message || 'Failed to update labels', severity: 'error' }),
      },
    );
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name || !newColor) return;
    createLabelMutation.mutate(
      { boardId, data: { name, color: newColor } },
      {
        onSuccess: (res: any) => {
          // createLabel returns the full board; pick the newly created label
          const boardLabels: KanbanLabel[] = res?.data?.data?.labels || [];
          const created =
            boardLabels.find((l) => l.name === name && l.color === newColor) ||
            boardLabels[boardLabels.length - 1];
          if (created?._id) {
            updateCardMutation.mutate({
              cardId,
              data: { labelIds: [...selectedLabelIds, created._id] },
            });
          }
          addToast({ message: 'Label created', severity: 'success' });
          resetCreate();
        },
        onError: (err: any) =>
          addToast({ message: err.response?.data?.message || 'Failed to create label', severity: 'error' }),
      },
    );
  };

  return (
    <Box sx={sectionBoxSx(isDarkMode)}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, color: 'text.secondary' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LabelOutlinedIcon fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Labels
          </Typography>
        </Box>
        {canEdit && (
          <Button
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
          >
            Labels
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, minHeight: 24 }}>
        {selectedLabels.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No labels
          </Typography>
        ) : (
          selectedLabels.map((label) => (
            <Chip
              key={label._id}
              label={label.name}
              size="small"
              onClick={canEdit ? (e) => setAnchorEl(e.currentTarget) : undefined}
              sx={{
                bgcolor: label.color,
                color: '#fff',
                fontWeight: 750,
                fontSize: '0.72rem',
                height: 24,
                textShadow: '0 1px 1px rgba(0,0,0,0.2)',
                cursor: canEdit ? 'pointer' : 'default',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          ))
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 280,
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            bgcolor: isDarkMode ? '#1e1b24' : '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            p: 1.5,
          },
        }}
      >
        {mode === 'list' ? (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary', px: 0.5, mb: 1, display: 'block' }}>
              Labels
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 240, overflowY: 'auto', mb: 1 }}>
              {boardLabels.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', px: 0.5, py: 1 }}>
                  No board labels yet
                </Typography>
              )}
              {boardLabels.map((label) => {
                const checked = selectedLabelIds.includes(label._id);
                return (
                  <Box
                    key={label._id}
                    onClick={() => toggleLabel(label._id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: 'pointer',
                      borderRadius: '8px',
                      pr: 0.5,
                      '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                    }}
                  >
                    <Checkbox size="small" checked={checked} sx={{ p: 0.5 }} />
                    <Box
                      sx={{
                        flex: 1,
                        bgcolor: label.color,
                        color: '#fff',
                        borderRadius: '4px',
                        px: 1,
                        py: 0.6,
                        fontSize: '0.8rem',
                        fontWeight: 750,
                        textShadow: '0 1px 1px rgba(0,0,0,0.25)',
                      }}
                    >
                      {label.name}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLabelMutation.mutate(
                          { boardId, labelId: label._id },
                          {
                            onSuccess: () => addToast({ message: 'Label deleted', severity: 'success' }),
                            onError: (err: any) =>
                              addToast({ message: err.response?.data?.message || 'Failed to delete label', severity: 'error' }),
                          },
                        );
                      }}
                      sx={{ opacity: 0.6, '&:hover': { opacity: 1, color: 'error.main' } }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
            <Button
              fullWidth
              size="small"
              onClick={() => setMode('create')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', mt: 0.5 }}
            >
              Create a new label
            </Button>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <IconButton size="small" onClick={resetCreate}>
                <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>Create label</Typography>
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            <Box
              sx={{
                bgcolor: newColor || (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                color: newColor ? '#fff' : 'text.secondary',
                borderRadius: '4px',
                px: 1.5,
                py: 1.25,
                mb: 1.5,
                fontWeight: 750,
                textAlign: 'center',
                textShadow: newColor ? '0 1px 1px rgba(0,0,0,0.25)' : 'none',
                minHeight: 40,
              }}
            >
              {newName.trim() || 'Label preview'}
            </Box>

            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Title
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Label name"
              sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.75, display: 'block' }}>
              Select a color
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.75, mb: 1.5 }}>
              {KANBAN_LABEL_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setNewColor(color)}
                  sx={{
                    bgcolor: color,
                    aspectRatio: '1',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: newColor === color ? `2px solid ${isDarkMode ? '#fff' : '#111'}` : 'none',
                    outlineOffset: 1,
                  }}
                >
                  {newColor === color && <CheckIcon sx={{ fontSize: 16, color: '#fff' }} />}
                </Box>
              ))}
            </Box>

            <Button
              fullWidth
              size="small"
              onClick={() => setNewColor('')}
              sx={{ textTransform: 'none', fontWeight: 650, mb: 1.5, color: 'text.secondary' }}
            >
              Remove color
            </Button>

            <Button
              fullWidth
              variant="contained"
              disabled={!newName.trim() || !newColor || createLabelMutation.isPending}
              onClick={handleCreate}
              sx={{
                textTransform: 'none',
                fontWeight: 750,
                borderRadius: '8px',
                bgcolor: tokens.brand.primary,
                '&:hover': { bgcolor: tokens.brand.primaryDark },
              }}
            >
              {createLabelMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

const CardLinksSection = ({
  isDarkMode,
  canEdit,
  cardId,
  links = [],
  updateCardMutation,
  addToast,
}: {
  isDarkMode: boolean;
  canEdit: boolean;
  cardId: string;
  links: KanbanCardLink[];
  updateCardMutation: any;
  addToast: (t: { message: string; severity: 'success' | 'error' | 'info' | 'warning' }) => void;
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const persistLinks = (next: KanbanCardLink[], successMsg?: string) => {
    updateCardMutation.mutate(
      { cardId, data: { links: next.map(({ title: t, url: u }) => ({ ...(t ? { title: t } : {}), url: u })) } },
      {
        onSuccess: () => {
          if (successMsg) addToast({ message: successMsg, severity: 'success' });
        },
        onError: (err: any) =>
          addToast({ message: err.response?.data?.message || 'Failed to update links', severity: 'error' }),
      },
    );
  };

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    persistLinks([...links, { title: title.trim() || undefined, url: normalized }], 'Link added');
    setTitle('');
    setUrl('');
    setShowAdd(false);
  };

  const handleRemove = (index: number) => {
    persistLinks(links.filter((_, i) => i !== index), 'Link removed');
  };

  return (
    <Box sx={sectionBoxSx(isDarkMode)}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, color: 'text.secondary' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Links
          </Typography>
        </Box>
        {canEdit && (
          <Button
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => setShowAdd((v) => !v)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
          >
            Add
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {links.length === 0 && !showAdd && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No links
          </Typography>
        )}
        {links.map((link, index) => (
          <Box
            key={link._id || `${link.url}-${index}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.25,
              borderRadius: '12px',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                component="a"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: tokens.brand.primary,
                  textDecoration: 'none',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {link.title || getLinkHostname(link.url)}
              </Typography>
              {link.title && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {getLinkHostname(link.url)}
                </Typography>
              )}
            </Box>
            <Tooltip title="Open">
              <IconButton size="small" component="a" href={link.url} target="_blank" rel="noopener noreferrer">
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            {canEdit && (
              <Tooltip title="Remove">
                <IconButton size="small" onClick={() => handleRemove(index)} sx={{ color: 'error.main' }}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ))}
      </Box>

      <Collapse in={showAdd && canEdit}>
        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField
            size="small"
            label="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <TextField
            size="small"
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              disabled={!url.trim() || updateCardMutation.isPending}
              onClick={handleAdd}
              sx={{
                textTransform: 'none',
                fontWeight: 750,
                borderRadius: '10px',
                bgcolor: tokens.brand.primary,
                '&:hover': { bgcolor: tokens.brand.primaryDark },
              }}
            >
              Save link
            </Button>
            <Button size="small" onClick={() => setShowAdd(false)} sx={{ textTransform: 'none', fontWeight: 650 }}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

const CardMeetingsSection = ({
  isDarkMode,
  canEdit,
  cardId,
  leadId,
  meetingIds = [],
  boardMembers = [],
  attachMutation,
  detachMutation,
  createOnCardMutation,
  addToast,
}: {
  isDarkMode: boolean;
  canEdit: boolean;
  cardId: string;
  leadId?: string;
  meetingIds: string[] | Meeting[];
  boardMembers: any[];
  attachMutation: any;
  detachMutation: any;
  createOnCardMutation: any;
  addToast: (t: { message: string; severity: 'success' | 'error' | 'info' | 'warning' }) => void;
}) => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const needsMeetingLookup = Array.isArray(meetingIds) && meetingIds.some((m) => typeof m === 'string');
  const { data: allMeetings = [] } = useMeetings({}, { enabled: canEdit || needsMeetingLookup });

  const linkedMeetings = useMemo(() => {
    if (!Array.isArray(meetingIds)) return [];
    return meetingIds
      .map((m) => {
        if (typeof m === 'object' && m?._id) return m as Meeting;
        const id = typeof m === 'string' ? m : '';
        return allMeetings.find((am) => am._id === id);
      })
      .filter(Boolean) as Meeting[];
  }, [meetingIds, allMeetings]);

  const [pickMeeting, setPickMeeting] = useState<Meeting | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createLink, setCreateLink] = useState('');
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [createTime, setCreateTime] = useState('09:00');
  const [createParticipants, setCreateParticipants] = useState<string[]>([]);

  const linkedIds = useMemo(
    () => new Set(linkedMeetings.map((m) => m._id)),
    [linkedMeetings],
  );

  const availableMeetings = useMemo(
    () =>
      allMeetings.filter((m) => {
        if (linkedIds.has(m._id) || m.status === 'cancelled') return false;
        if (new Date(m.scheduledAt).getTime() <= Date.now()) return false;
        if (!currentUser) return false;
        const participantIds = (m.participants || []).map((p: any) =>
          typeof p === 'string' ? p : p._id,
        );
        const createdById = m.createdBy
          ? typeof m.createdBy === 'string'
            ? m.createdBy
            : (m.createdBy as any)._id
          : null;
        return participantIds.includes(currentUser._id) || createdById === currentUser._id;
      }),
    [allMeetings, linkedIds, currentUser],
  );

  const handleAttach = () => {
    if (!pickMeeting) return;
    attachMutation.mutate(
      { cardId, meetingId: pickMeeting._id },
      {
        onSuccess: () => {
          addToast({ message: 'Meeting linked', severity: 'success' });
          setPickMeeting(null);
        },
        onError: (err: any) =>
          addToast({ message: err.response?.data?.message || 'Failed to link meeting', severity: 'error' }),
      },
    );
  };

  const handleDetach = (meetingId: string) => {
    detachMutation.mutate(
      { cardId, meetingId },
      {
        onSuccess: () => addToast({ message: 'Meeting unlinked', severity: 'success' }),
        onError: (err: any) =>
          addToast({ message: err.response?.data?.message || 'Failed to unlink meeting', severity: 'error' }),
      },
    );
  };

  const buildScheduledAt = () => {
    if (!createDate) return null;
    const d = new Date(createDate);
    const [hStr = '9', mStr = '0'] = createTime.split(':');
    d.setHours(parseInt(hStr, 10) || 0, parseInt(mStr, 10) || 0, 0, 0);
    return d.toISOString();
  };

  const handleCreate = () => {
    const scheduledAt = buildScheduledAt();
    if (!createTitle.trim() || !createLink.trim() || !scheduledAt || createParticipants.length === 0) {
      addToast({ message: 'Title, meeting link, date, and at least one participant are required', severity: 'error' });
      return;
    }
    let meetingLink = createLink.trim();
    if (!/^https?:\/\//i.test(meetingLink)) meetingLink = `https://${meetingLink}`;
    createOnCardMutation.mutate(
      {
        cardId,
        data: {
          title: createTitle.trim(),
          meetingLink,
          scheduledAt,
          participants: createParticipants,
          ...(leadId ? { leadId } : {}),
        },
      },
      {
        onSuccess: () => {
          addToast({ message: 'Meeting created and linked', severity: 'success' });
          setShowCreate(false);
          setCreateTitle('');
          setCreateLink('');
          setCreateDate(null);
          setCreateTime('09:00');
          setCreateParticipants([]);
        },
        onError: (err: any) =>
          addToast({ message: err.response?.data?.message || 'Failed to create meeting', severity: 'error' }),
      },
    );
  };

  const statusColor = (status?: string) => {
    if (status === 'completed') return tokens.semantic.success;
    if (status === 'cancelled') return '#ef4444';
    return tokens.brand.primary;
  };

  return (
    <Box sx={sectionBoxSx(isDarkMode)}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, color: 'text.secondary' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Meetings
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: canEdit ? 1.5 : 0 }}>
        {linkedMeetings.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No meetings linked
          </Typography>
        ) : (
          linkedMeetings.map((meeting) => (
            <Box
              key={meeting._id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1.25,
                borderRadius: '12px',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
                  {meeting.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {new Date(meeting.scheduledAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Typography>
                {meeting.status && (
                  <Chip
                    label={meeting.status}
                    size="small"
                    sx={{
                      mt: 0.5,
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      bgcolor: `${statusColor(meeting.status)}18`,
                      color: statusColor(meeting.status),
                    }}
                  />
                )}
              </Box>
              <Tooltip title="Open meeting">
                <IconButton
                  size="small"
                  onClick={() => navigate(`/meetings?meetingId=${meeting._id}`)}
                >
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              {canEdit && (
                <Tooltip title="Unlink">
                  <IconButton size="small" onClick={() => handleDetach(meeting._id)} sx={{ color: 'error.main' }}>
                    <LinkOffIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))
        )}
      </Box>

      {canEdit && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Autocomplete
              size="small"
              fullWidth
              options={availableMeetings}
              value={pickMeeting}
              onChange={(_, v) => setPickMeeting(v)}
              getOptionLabel={(o) => o.title || 'Untitled'}
              filterOptions={(options, { inputValue }) => {
                const q = inputValue.toLowerCase();
                return options.filter((o) => o.title?.toLowerCase().includes(q));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Link existing meeting"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              )}
            />
            <Button
              variant="outlined"
              size="small"
              disabled={!pickMeeting || attachMutation.isPending}
              onClick={handleAttach}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', mt: 0.5, whiteSpace: 'nowrap' }}
            >
              Link
            </Button>
          </Box>

          <Button
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => setShowCreate((v) => !v)}
            sx={{ textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start', borderRadius: '10px' }}
          >
            {showCreate ? 'Cancel create' : 'Create meeting'}
          </Button>

          <Collapse in={showCreate}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <TextField
                size="small"
                label="Title"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                size="small"
                label="Meeting link"
                value={createLink}
                onChange={(e) => setCreateLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <ModernDatePicker
                label="Date"
                value={createDate}
                onChange={(d) => setCreateDate(d)}
              />
              <ModernTimePicker
                label="Time"
                value={createTime}
                onChange={(t) => setCreateTime(t)}
              />
              <Autocomplete
                multiple
                size="small"
                options={boardMembers}
                value={boardMembers.filter((u: any) => createParticipants.includes(u._id))}
                onChange={(_, selected) => setCreateParticipants(selected.map((u: any) => u._id))}
                getOptionLabel={(u: any) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u._id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Participants"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                )}
              />
              <Button
                variant="contained"
                size="small"
                disabled={createOnCardMutation.isPending}
                onClick={handleCreate}
                sx={{
                  textTransform: 'none',
                  fontWeight: 750,
                  borderRadius: '10px',
                  bgcolor: tokens.brand.primary,
                  '&:hover': { bgcolor: tokens.brand.primaryDark },
                }}
              >
                {createOnCardMutation.isPending ? 'Creating...' : 'Create & attach'}
              </Button>
            </Box>
          </Collapse>
        </Box>
      )}
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
  const [pendingDueTime, setPendingDueTime] = useState('');
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
      const dueParts = parseDueParts(task.rawCard?.dueDate);
      setPendingDueDate(dueParts.date);
      setPendingDueTime(dueParts.time);
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

  const addCommentMutation = useAddComment(boardId);
  const editCommentMutation = useEditComment(boardId);
  const deleteCommentMutation = useDeleteComment(boardId);
  const updateCardMutation = useUpdateCard(boardId);
  const assignCardMutation = useAssignCard(boardId);
  const deleteCardMutation = useDeleteCard(boardId);
  const createLabelMutation = useCreateLabel(boardId);
  const deleteLabelMutation = useDeleteLabel(boardId);
  const attachMeetingMutation = useAttachCardMeeting(boardId);
  const detachMeetingMutation = useDetachCardMeeting(boardId);
  const createMeetingOnCardMutation = useCreateMeetingOnCard(boardId);
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const mentionableUsers = useMemo(() => {
    const memberIds = new Set(boardMembers.map((user: any) => user._id));
    const admins = allUsers.filter((user: any) => user.role === 'admin' && !memberIds.has(user._id));
    return [...boardMembers, ...admins];
  }, [boardMembers, allUsers]);

  // Anyone who can open the board can edit cards (members included).
  const canEdit = true;

  const handleConfirmSave = () => {
    const currentAssigneeIds = Array.isArray(task.rawCard?.assignedTo)
      ? task.rawCard.assignedTo.map((u: any) => (typeof u === 'object' ? u._id : u))
      : [];
    const assigneesChanged =
      pendingAssignees.length !== currentAssigneeIds.length ||
      pendingAssignees.some((id) => !currentAssigneeIds.includes(id));
    const currentDue = parseDueParts(task.rawCard?.dueDate);
    const currentKpiEnd = task.rawCard?.kpiEndDate ? String(task.rawCard.kpiEndDate).split('T')[0] : '';
    const datesChanged =
      pendingDueDate !== currentDue.date ||
      pendingDueTime !== currentDue.time ||
      pendingKpiEndDate !== currentKpiEnd;

    const updates: Record<string, unknown> = {};
    if (editTitle.trim() && editTitle.trim() !== task.title) updates.title = editTitle.trim();
    if (editDesc.trim() !== (task.description || '')) updates.description = editDesc.trim();
    if (pendingPriority !== (task.rawCard?.priority || 'medium')) updates.priority = pendingPriority;

    const finishOk = () => {
      addToast({ message: 'Task updated successfully', severity: 'success' });
      onClose();
    };

    const runFieldUpdates = (onDone: () => void) => {
      if (Object.keys(updates).length === 0) {
        onDone();
        return;
      }
      updateCardMutation.mutate(
        { cardId: task.id, data: updates },
        { onSuccess: onDone },
      );
    };

    if (assigneesChanged || datesChanged) {
      assignCardMutation.mutate(
        {
          cardId: task.id,
          data: {
            assignedTo: pendingAssignees,
            ...(pendingDueDate
              ? { dueDate: combineDueDateTime(pendingDueDate, pendingDueTime), kpiEndDate: pendingDueDate }
              : pendingKpiEndDate
                ? { dueDate: pendingKpiEndDate, kpiEndDate: pendingKpiEndDate }
                : {}),
          },
        },
        {
          onSuccess: () => runFieldUpdates(finishOk),
          onError: (err: any) => {
            addToast({
              message: err?.response?.data?.message || err?.message || 'You cannot assign this task to that user',
              severity: 'error',
            });
          },
        },
      );
      return;
    }

    runFieldUpdates(finishOk);
  };

  if (!task) return null;

  const lead = task.lead;
  const rawCard = task.rawCard;
  const commentsList = rawCard?.comments || [];
  const assignedToIds = Array.isArray(rawCard?.assignedTo)
    ? rawCard.assignedTo.map((u: any) => typeof u === 'object' ? u._id : u)
    : [];
  const boardLabels: KanbanLabel[] = actualBoard?.labels || [];
  const selectedLabelIds: string[] = Array.isArray(rawCard?.labelIds)
    ? rawCard.labelIds.map((id: any) => (typeof id === 'object' ? id._id : id))
    : [];
  const cardLinks: KanbanCardLink[] = Array.isArray(rawCard?.links) ? rawCard.links : [];
  const cardLeadId =
    typeof rawCard?.leadId === 'object' && rawCard?.leadId
      ? rawCard.leadId._id
      : typeof rawCard?.leadId === 'string'
        ? rawCard.leadId
        : lead?._id;

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

  const handleToggleDone = () => {
    if (!canEdit || updateCardMutation.isPending) return;
    const nextDone = !Boolean(rawCard?.isDone);
    updateCardMutation.mutate(
      { cardId: task.id, data: { isDone: nextDone } },
      {
        onSuccess: () =>
          addToast({
            message: nextDone ? 'Card marked as done' : 'Card marked as not done',
            severity: 'success',
          }),
        onError: (err: any) =>
          addToast({
            message: err.response?.data?.message || 'Failed to update done status',
            severity: 'error',
          }),
      },
    );
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
            /* backdropFilter: 'blur(20px)' (removed for performance) */
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
              /* backdropFilter: 'blur(4px)' (removed for performance) */
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
                      onClick={canEdit ? handlePriorityClick : undefined}
                      sx={{
                        bgcolor: cfg.bg, color: cfg.color, fontWeight: 750, fontSize: '0.7rem', height: 24,
                        border: `1px solid ${cfg.color}30`, cursor: canEdit ? 'pointer' : 'default', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': canEdit ? { transform: 'translateY(-1px)', boxShadow: `0 4px 12px ${cfg.color}30` } : {}
                      }}
                    />
                    {canEdit && (
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
              {(canEdit || Boolean(rawCard?.isDone)) && (
                <Chip
                  icon={<CheckIcon sx={{ fontSize: '14px !important' }} />}
                  label={rawCard?.isDone ? 'Done' : 'Mark Done'}
                  size="small"
                  onClick={canEdit ? handleToggleDone : undefined}
                  disabled={canEdit && updateCardMutation.isPending}
                  sx={{
                    bgcolor: rawCard?.isDone
                      ? (isDarkMode ? 'rgba(34,197,94,0.15)' : 'rgba(22,163,74,0.1)')
                      : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    color: rawCard?.isDone
                      ? (isDarkMode ? '#4ade80' : '#15803d')
                      : 'text.secondary',
                    fontWeight: 750,
                    fontSize: '0.7rem',
                    height: 24,
                    border: `1px solid ${rawCard?.isDone
                      ? (isDarkMode ? 'rgba(34,197,94,0.3)' : 'rgba(22,163,74,0.25)')
                      : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                    cursor: canEdit ? 'pointer' : 'default',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': canEdit
                      ? {
                          transform: 'translateY(-1px)',
                          boxShadow: rawCard?.isDone
                            ? '0 4px 12px rgba(22,163,74,0.25)'
                            : '0 4px 12px rgba(0,0,0,0.08)',
                        }
                      : {},
                  }}
                />
              )}
            </Box>
            {canEdit ? (
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
            {lead && (
              <Tooltip title="View Details">
                <IconButton 
                  onClick={() => navigate(`/sales/leads/${lead._id}`)}
                  sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && (
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
                  {canEdit ? (
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
                    Due: {formatKpiDueDate(task.dueDate, { month: 'long', includeTime: hasDisplayableClockTime(task.dueDate) })}
                  </Typography>
                </Box>
              )}
              {rawCard?.assignedAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Assigned: {formatDate(rawCard.assignedAt)}
                  </Typography>
                </Box>
              )}

              {(task.lastMovedBy || task.createdBy) && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, px: 0.25 }}>
                  {task.lastMovedBy && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          bgcolor: tokens.brand.primary,
                          ...kanbanActiveMoverRingSx(true),
                        }}
                      >
                        {kanbanUserInitial(task.lastMovedBy)}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                          Active user
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {kanbanUserDisplayName(task.lastMovedBy)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {task.createdBy && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          bgcolor: tokens.brand.primaryMuted || tokens.brand.primary,
                        }}
                      >
                        {kanbanUserInitial(task.createdBy)}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                          Created by
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {kanbanUserDisplayName(task.createdBy)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Assignees Section */}
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'text.secondary' }}>
                  <GroupIcon fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignees</Typography>
                </Box>
                {canEdit ? (
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
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 160 }}>
                        <ModernDatePicker
                          label="Due Date"
                          value={pendingDueDate ? new Date(`${pendingDueDate}T00:00:00`) : null}
                          onChange={(date) => {
                            if (date) {
                              const formatted = toLocalDateStr(date);
                              setPendingDueDate(formatted);
                              setPendingKpiEndDate(formatted);
                              if (!pendingDueTime) setPendingDueTime(DEFAULT_DUE_TIME);
                            } else {
                              setPendingDueDate('');
                              setPendingDueTime('');
                              setPendingKpiEndDate('');
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 140 }}>
                        <ModernTimePicker
                          label="Due Time"
                          value={pendingDueTime || DEFAULT_DUE_TIME}
                          onChange={(t) => setPendingDueTime(t)}
                        />
                      </Box>
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

              <CardLabelsSection
                isDarkMode={isDarkMode}
                canEdit={canEdit}
                boardId={boardId}
                cardId={task.id}
                boardLabels={boardLabels}
                selectedLabelIds={selectedLabelIds}
                updateCardMutation={updateCardMutation}
                createLabelMutation={createLabelMutation}
                deleteLabelMutation={deleteLabelMutation}
                addToast={addToast}
              />

              <CardLinksSection
                isDarkMode={isDarkMode}
                canEdit={canEdit}
                cardId={task.id}
                links={cardLinks}
                updateCardMutation={updateCardMutation}
                addToast={addToast}
              />

              <CardMeetingsSection
                isDarkMode={isDarkMode}
                canEdit={canEdit}
                cardId={task.id}
                leadId={cardLeadId}
                meetingIds={rawCard?.meetingIds || []}
                boardMembers={boardMembers}
                attachMutation={attachMeetingMutation}
                detachMutation={detachMeetingMutation}
                createOnCardMutation={createMeetingOnCardMutation}
                addToast={addToast}
              />

              {/* Prospect Details — only when a lead is linked to the card */}
              {lead && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'text.secondary' }}>
                    <DescriptionOutlinedIcon fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prospect Details</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      Name: <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{authorName}</Box>
                    </Typography>
                    {lead.email && (
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                        Email: <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{lead.email}</Box>
                      </Typography>
                    )}
                    {lead.title && (
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                        Title: <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{lead.title}</Box>
                      </Typography>
                    )}
                    {lead.location && (
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                        Location: <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>{lead.location}</Box>
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

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
  const { id: projectId, boardId } = useParams<{ id: string; boardId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeBoardId = boardId || '';
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const { data: board, isLoading, error } = useKanbanBoard(activeBoardId);
  const { data: allUsers = [] } = useUsers();
  const { data: conversations = [] } = useConversations();
  const createBoardConversation = useCreateBoardConversation();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const addToast = useUIStore((s) => s.addToast);
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
  const canManageBoardChat = Boolean(
    currentUser &&
      actualBoard &&
      (actualBoard.ownerId === currentUser._id ||
        currentUser.role === 'admin' ||
        (actualBoard.members || []).some((m) => {
          const uid = typeof m.userId === 'string' ? m.userId : m.userId?._id;
          return uid === currentUser._id && m.role === 'admin';
        })),
  );
  const boardChat = conversations.find((c) => c.boardId === activeBoardId);

  const openBoardChat = (conversationId: string) => {
    setActiveConversation(conversationId);
    navigate(`/chat/${conversationId}`);
  };

  const handleBoardChatClick = () => {
    if (boardChat?._id) {
      openBoardChat(boardChat._id);
      return;
    }
    createBoardConversation.mutate(activeBoardId, {
      onSuccess: (res) => {
        const conv = (res.data as { data?: { _id?: string; participants?: Array<string | { _id: string }> } })?.data;
        const id = conv?._id;
        const participantIds = (conv?.participants || []).map((p) => (typeof p === 'string' ? p : p._id));
        if (id && currentUser?._id && participantIds.includes(currentUser._id)) {
          openBoardChat(id);
          return;
        }
        addToast({
          message: 'Board chat already exists. Ask the group admin to add you.',
          severity: 'info',
        });
      },
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to open board chat';
        addToast({ message, severity: 'error' });
      },
    });
  };

  const boardMembers = useMemo(() => {
    if (!actualBoard) return [];
    const owner = allUsers.find((u: any) => u._id === actualBoard.ownerId);
    const membersList = (actualBoard.members || []).map((m: any) => {
      const uid = typeof m.userId === 'string' ? m.userId : m.userId?._id;
      return allUsers.find((u: any) => u._id === uid);
    }).filter(Boolean);
    
    // De-duplicate in case owner is also in members
    const all = [owner, ...membersList].filter(Boolean);
    const seen = new Set();
    return all.filter((u: any) => {
      if (seen.has(u._id)) return false;
      seen.add(u._id);
      return true;
    });
  }, [actualBoard, allUsers]);

  const [activeTask, setActiveTask] = useState<any>(null);
  const [activeColumn, setActiveColumn] = useState<any>(null);
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
  const [cardTargetColumnId, setCardTargetColumnId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newCardDueDate, setNewCardDueDate] = useState('');
  const [newCardDueTime, setNewCardDueTime] = useState('');
  const [newCardAssignees, setNewCardAssignees] = useState<string[]>([]);

  // Page Confirm Dialog State
  const [columnConfirmOpen, setColumnConfirmOpen] = useState(false);

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilterIds, setAssigneeFilterIds] = useState<string[]>([]);

  // Share Board Dialog State
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedUserToShare, setSelectedUserToShare] = useState<string>('');
  const addBoardMemberMutation = useAddBoardMember(projectId, activeBoardId);
  const removeBoardMemberMutation = useRemoveBoardMember(projectId, activeBoardId);

  // Remove Board Member Confirmation Dialog State
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [pendingRemoveUserId, setPendingRemoveUserId] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Transform board columns and cards into flattened lists for dnd-kit
  const columns = useMemo(() => {
    if (!actualBoard || !actualBoard.columns) return [];
    return [...actualBoard.columns]
      .filter((col: any) => col.isActive !== false)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((col: any) => ({
        id: String(col._id),
        title: col.name,
      }));
  }, [actualBoard]);

  const tasks = useMemo(() => {
    if (!actualBoard || !actualBoard.columns) return [];
    const tList: any[] = [];
    const boardLabels: KanbanLabel[] = actualBoard.labels || [];

    cardsList.forEach((card: any) => {
      const lead = typeof card.leadId === 'object' ? card.leadId : null;
      const assignedLead = lead as any;
      const cardAssignees = Array.isArray(card.assignedTo)
        ? card.assignedTo.map((u: any) => typeof u === 'object' ? u : allUsers.find((au: any) => au._id === u)).filter(Boolean)
        : [];
      const cardLabelIds: string[] = Array.isArray(card.labelIds)
        ? card.labelIds.map((id: any) => (typeof id === 'object' ? id._id : id))
        : [];
      const resolvedLabels = cardLabelIds
        .map((id) => boardLabels.find((l) => l._id === id))
        .filter(Boolean) as KanbanLabel[];

      tList.push({
        id: card._id,
        columnId: String(card.columnId),
        title: card.title || (assignedLead ? `${assignedLead.firstName || ''} ${assignedLead.lastName || ''}`.trim() : 'Untitled Card'),
        lead: assignedLead,
        description: card.description,
        priority: card.priority || 'medium',
        dueDate: card.dueDate,
        isDone: Boolean(card.isDone),
        comments: card.comments?.filter((c: any) => c.isActive !== false).length || 0,
        attachments: 0,
        assignedUsers: cardAssignees,
        labels: resolvedLabels,
        createdBy: resolveKanbanUser(card.createdBy, allUsers),
        lastMovedBy: resolveKanbanUser(card.lastMovedBy, allUsers),
        lastMovedAt: card.lastMovedAt,
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

    if (isElevated && assigneeFilterIds.length > 0) {
      result = result.filter(t => {
        const assignedIds = Array.isArray(t.rawCard?.assignedTo)
          ? t.rawCard.assignedTo.map((u: any) => typeof u === 'object' ? u._id : u)
          : [];
        const creatorId = typeof t.rawCard?.createdBy === 'object' ? t.rawCard.createdBy?._id : t.rawCard?.createdBy;
        return assigneeFilterIds.some((id) => assignedIds.includes(id) || creatorId === id);
      });
    }

    return result;
  }, [tasks, searchQuery, priorityFilter, assigneeFilterIds, isElevated]);

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
        dueDate: newCardDueDate ? combineDueDateTime(newCardDueDate, newCardDueTime) : undefined,
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
          setNewCardDueTime('');
          setNewCardAssignees([]);
          setIsCardDialogOpen(false);
        },
      });
    }
  };

  // Invite member and keep share dialog open for more invites
  const handleShareSubmit = () => {
    if (activeBoardId && selectedUserToShare && projectId) {
      addBoardMemberMutation.mutate({
        id: projectId,
        boardId: activeBoardId,
        userId: selectedUserToShare,
        role: 'member',
      }, {
        onSuccess: () => {
          setSelectedUserToShare('');
        },
      });
    }
  };

  const handleRemoveMemberClick = (userId: string) => {
    setPendingRemoveUserId(userId);
    setConfirmRemoveOpen(true);
  };

  const handleConfirmRemoveMember = () => {
    if (activeBoardId && pendingRemoveUserId && projectId) {
      removeBoardMemberMutation.mutate({
        id: projectId,
        boardId: activeBoardId,
        userId: pendingRemoveUserId,
      }, {
        onSuccess: () => {
          setPendingRemoveUserId('');
          setConfirmRemoveOpen(false);
        },
        onError: () => {
          setPendingRemoveUserId('');
          setConfirmRemoveOpen(false);
        },
      });
    }
  };

  const lastCardOverRef = useRef<{ overId: string; columnId?: string } | null>(null);

  const handleDragStart = (e: DragStartEvent) => {
    lastCardOverRef.current = null;
    const { active } = e;
    if (active.data.current?.type === 'Column') {
      setActiveColumn(active.data.current.column);
      return;
    }
    const task = tasks.find(t => idsEqual(t.id, active.id));
    if (task) setActiveTask(task);
  };

  const handleDragOver = (e: DragOverEvent) => {
    if (e.active.data.current?.type === 'Column' || !e.over) return;
    const columnIds = columns.map((c: any) => String(c.id));
    lastCardOverRef.current = {
      overId: String(e.over.id),
      columnId: resolveOverColumnId(e.over, columnIds) || undefined,
    };
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    setActiveColumn(null);
    const { active } = e;
    const lastOver = lastCardOverRef.current;
    lastCardOverRef.current = null;
    const over = e.over;
    if (!over && !lastOver) return;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : lastOver!.overId;
    const columnIds = columns.map((c: any) => String(c.id));

    if (active.data.current?.type === 'Column') {
      if (!over) return;
      const overColumnId = parseColumnDroppableId(overId) || overId;
      const activeColIndex = columns.findIndex((c: any) => idsEqual(c.id, activeId));
      const overColIndex = columns.findIndex((c: any) => idsEqual(c.id, overColumnId));
      
      if (activeColIndex !== overColIndex && activeColIndex !== -1 && overColIndex !== -1) {
        const colIds = columns.map((c: any) => c.id);
        const newColIds = arrayMove(colIds, activeColIndex, overColIndex);
        reorderColumnsMutation.mutate({
          boardId: activeBoardId,
          columnIds: newColIds
        });
      }
      return;
    }

    const activeTaskMatch = tasks.find(t => idsEqual(t.id, activeId));
    if (!activeTaskMatch) return;

    const targetColumnIdFromOver =
      resolveOverColumnId(over, columnIds) ||
      lastOver?.columnId ||
      null;

    if (targetColumnIdFromOver) {
      const targetColumn = actualBoard?.columns.find((c: any) => idsEqual(c._id, targetColumnIdFromOver));
      if (!targetColumn?._id) return;
      const targetColumnCards = tasks.filter(t => idsEqual(t.columnId, targetColumn._id));
      const newPos = idsEqual(activeTaskMatch.columnId, targetColumn._id)
        ? Math.max(targetColumnCards.length - 1, 0)
        : targetColumnCards.length;
      moveCardMutation.mutate({
        cardId: activeId,
        data: {
          columnId: String(targetColumn._id),
          position: newPos,
        }
      });
      return;
    }

    const targetCardMatch = tasks.find(t => idsEqual(t.id, overId));
    if (targetCardMatch) {
      const targetColumnId = String(targetCardMatch.columnId);
      const targetColumnCards = tasks.filter(t => idsEqual(t.columnId, targetColumnId)).sort((a, b) => a.position - b.position);
      const targetIndex = targetColumnCards.findIndex(t => idsEqual(t.id, targetCardMatch.id));

      let newPos = targetIndex;
      if (idsEqual(activeTaskMatch.columnId, targetColumnId)) {
        const oldIndex = targetColumnCards.findIndex(t => idsEqual(t.id, activeId));
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
        <Button onClick={() => navigate('/projects')} sx={{ mt: 2 }} variant="outlined">Back to Projects</Button>
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
              onClick={() => navigate(`/projects/${projectId}?tab=Board`)}
              sx={{ color: 'text.secondary', textTransform: 'none', minWidth: 0, p: 0, '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
            >
              Project
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>/</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>{actualBoard.name}</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {boardLead
              ? ([boardLead.firstName, boardLead.lastName].filter(Boolean).join(' ').trim() || boardLead.company || actualBoard.name)
              : `${actualBoard.name}`}
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
              bgcolor: (priorityFilter !== 'All' || assigneeFilterIds.length > 0) ? (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent'
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
          {canManageBoardChat && (
            <Button
              startIcon={<ForumOutlinedIcon />}
              onClick={handleBoardChatClick}
              disabled={createBoardConversation.isPending}
              variant="outlined"
              sx={{
                color: tokens.brand.primary,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(93,26,137,0.2)',
                fontWeight: 700,
                borderRadius: '24px',
                textTransform: 'none',
                px: 2.5,
              }}
            >
              {boardChat ? 'Open board chat' : 'Create board chat'}
            </Button>
          )}
          {canManageTeam && (
            <Button onClick={() => setIsShareDialogOpen(true)} variant="contained" sx={{ bgcolor: '#FF5733', color: '#fff', fontWeight: 700, borderRadius: '24px', textTransform: 'none', boxShadow: 'none', px: 3, ml: 1, '&:hover': { bgcolor: '#E04A2A', boxShadow: 'none' } }}>Share</Button>
          )}
        </Box>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          }
        }}
      >
      <Box sx={{
        flexGrow: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'stretch',
        gap: 3,
        overflowX: 'auto',
        overflowY: 'hidden',
        pb: 2,
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 4 },
      }}>
          <SortableContext items={columns.map((c: any) => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((col: any) => {
              const colTasks = filteredTasks.filter(t => idsEqual(t.columnId, col.id));
              return (
                <SortableBoardColumn
                  key={col.id}
                  col={col}
                  colTasks={colTasks}
                  isDarkMode={isDarkMode}
                  onAddCard={(colId: string) => { setCardTargetColumnId(colId); setIsCardDialogOpen(true); }}
                  onColumnMenuOpen={(e: any, colId: string, title: string) => {
                    setColumnMenuAnchor(e.currentTarget);
                    setMenuTargetColumnId(colId);
                    setRenameColumnText(title);
                  }}
                  setDrawerTaskId={setDrawerTaskId}
                />
              );
            })}
          </SortableContext>

          {typeof document !== 'undefined' ? createPortal(
            <DragOverlay dropAnimation={{
              duration: 250,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
              {activeColumn ? (
                <Box sx={{ minWidth: { xs: 280, sm: 320 }, width: { xs: 280, sm: 320 }, display: 'flex', flexDirection: 'column', opacity: 0.9 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, py: 0.5, cursor: 'grabbing' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>{activeColumn.title}</Typography>
                      <Chip label={filteredTasks.filter(t => idsEqual(t.columnId, activeColumn.id)).length} size="small" sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: 'text.secondary', fontWeight: 700, height: 24, fontSize: '0.75rem' }} />
                    </Box>
                    <Box>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}><AddIcon fontSize="small" /></IconButton>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}><MoreHorizIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '16px', p: 1.5, minHeight: 150 }}>
                    {filteredTasks.filter(t => idsEqual(t.columnId, activeColumn.id)).map(task => (
                      <TaskCardVisual key={task.id} task={task} isDarkMode={isDarkMode} />
                    ))}
                  </Box>
                </Box>
              ) : activeTask ? (
                <Box sx={{ width: '100%', height: '100%', cursor: 'grabbing' }}>
                  <TaskCardVisual task={activeTask} isDarkMode={isDarkMode} />
                </Box>
              ) : null}
            </DragOverlay>,
            document.body
          ) : null}
        <Box sx={{ minWidth: { xs: 280, sm: 320 }, width: { xs: 280, sm: 320 }, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <Button onClick={() => setIsColumnDialogOpen(true)} startIcon={<AddIcon />} sx={{ height: 52, border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '16px', color: 'text.secondary', fontWeight: 650, textTransform: 'none', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', color: 'text.primary' } }}>Add Column</Button>
        </Box>
      </Box>
      </DndContext>

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

        {isElevated && (
          <>
            <Divider sx={{ my: 1 }} />

            <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filter by User
            </Typography>
            {boardMembers.map((m: any) => {
              const name = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email;
              const checked = assigneeFilterIds.includes(m._id);
              return (
                <MenuItem
                  key={m._id}
                  onClick={() => {
                    setAssigneeFilterIds((prev) =>
                      prev.includes(m._id) ? prev.filter((id) => id !== m._id) : [...prev, m._id]
                    );
                  }}
                  sx={{ borderRadius: '8px', mx: 1 }}
                >
                  <Checkbox size="small" checked={checked} sx={{ p: 0.5, mr: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: checked ? 700 : 500 }}>
                    {name}
                  </Typography>
                </MenuItem>
              );
            })}
          </>
        )}

        {(priorityFilter !== 'All' || assigneeFilterIds.length > 0) && (
          <>
            <Divider sx={{ my: 1 }} />
            <MenuItem
              onClick={() => {
                setPriorityFilter('All');
                setAssigneeFilterIds([]);
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
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ModernDatePicker
                label="Due Date"
                value={newCardDueDate ? new Date(`${newCardDueDate}T00:00:00`) : null}
                onChange={(date) => {
                  if (date) {
                    setNewCardDueDate(toLocalDateStr(date));
                    if (!newCardDueTime) setNewCardDueTime(DEFAULT_DUE_TIME);
                  } else {
                    setNewCardDueDate('');
                    setNewCardDueTime('');
                  }
                }}
              />
              {newCardDueDate && (
                <ModernTimePicker
                  label="Due Time"
                  value={newCardDueTime || DEFAULT_DUE_TIME}
                  onChange={(t) => setNewCardDueTime(t)}
                />
              )}
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
              setNewCardDueTime('');
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
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Manage who can access this board.
          </Typography>

          {/* Current members */}
          <Box
            sx={{
              mb: 3,
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              borderRadius: '16px',
              overflow: 'hidden',
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {boardMembers.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', p: 2, textAlign: 'center' }}>
                No members yet
              </Typography>
            ) : (
              boardMembers.map((member: any, idx: number) => {
                const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'User';
                const initial = (member.firstName?.charAt(0) || member.email?.charAt(0) || 'U').toUpperCase();
                const isOwner = member._id === actualBoard?.ownerId;
                const isInMembersList = (actualBoard?.members || []).some((m: any) => {
                  const uid = typeof m.userId === 'string' ? m.userId : m.userId?._id;
                  return uid === member._id;
                });
                const canRemove = canManageTeam && !isOwner && isInMembersList && member._id !== currentUser?._id;

                return (
                  <Box
                    key={member._id || idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                      borderBottom:
                        idx < boardMembers.length - 1
                          ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                          : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700, bgcolor: tokens.brand.primaryMuted }}>
                        {initial}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isOwner ? 'Owner' : member.email}
                        </Typography>
                      </Box>
                    </Box>
                    {canRemove && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveMemberClick(member._id)}
                        disabled={removeBoardMemberMutation.isPending}
                        sx={{
                          color: 'text.secondary',
                          flexShrink: 0,
                          '&:hover': { color: tokens.semantic.error, bgcolor: 'rgba(239, 68, 68, 0.08)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                );
              })
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
            Invite member
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Select User</InputLabel>
            <Select
              value={selectedUserToShare}
              onChange={(e) => setSelectedUserToShare(e.target.value)}
              label="Select User"
              sx={{ borderRadius: '24px' }}
            >
              {allUsers.filter((u: any) => u._id !== actualBoard?.ownerId && !(actualBoard?.members || []).some((m: any) => (typeof m.userId === 'string' ? m.userId : m.userId?._id) === u._id)).map((u: any) => (
                <MenuItem key={u._id} value={u._id}>
                  {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsShareDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '24px', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleShareSubmit} variant="contained" disabled={!selectedUserToShare || addBoardMemberMutation.isPending} sx={{ bgcolor: tokens.brand.primary, color: '#fff', fontWeight: 700, borderRadius: '24px', textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: tokens.brand.primaryMuted, boxShadow: 'none' } }}>
            Invite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Board Member Confirmation Dialog */}
      {(() => {
        const pendingUser = allUsers.find((u: any) => u._id === pendingRemoveUserId);
        const pendingUserName = pendingUser
          ? (`${pendingUser.firstName || ''} ${pendingUser.lastName || ''}`.trim() || pendingUser.email)
          : 'this team member';
        return (
          <ConfirmDialog
            open={confirmRemoveOpen}
            title="Remove Board Member"
            message={`Are you sure you want to remove ${pendingUserName} from this board? They will lose access, be unassigned from their cards on this board, and those cards will be removed from their daily tasks. If any cards are left with no assignee, board managers will be notified to reassign them.`}
            confirmLabel="Remove"
            cancelLabel="Cancel"
            isPending={removeBoardMemberMutation.isPending}
            onConfirm={handleConfirmRemoveMember}
            onCancel={() => {
              setConfirmRemoveOpen(false);
              setPendingRemoveUserId('');
            }}
          />
        );
      })()}
    </Box>
  );
};

export default KanbanBoardPage;
