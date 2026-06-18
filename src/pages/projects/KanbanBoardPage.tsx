import { useState } from 'react';
import { Box, Typography, Button, useTheme, IconButton, InputAdornment, TextField, Avatar, AvatarGroup, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupIcon from '@mui/icons-material/Group';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { tokens } from '@/styles/tokens';

import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor,
  PointerSensor, useSensor, useSensors, type DragStartEvent,
  type DragOverEvent, type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Flattened state exactly like help.tsx
const initialColumns = [
  { id: 'c1', title: 'To Do' },
  { id: 'c2', title: 'In Progress' },
  { id: 'c3', title: 'In Review' },
  { id: 'c4', title: 'Done' }
];

const initialTasks = [
  { id: 't1', title: 'Design landing page mockup', type: 'Design', comments: 3, attachments: 1, users: ['A', 'B'], columnId: 'c1' },
  { id: 't2', title: 'Setup project repository', type: 'Dev', comments: 0, attachments: 0, users: ['C'], columnId: 'c1' },
  { id: 't3', title: 'Implement authentication', type: 'Dev', comments: 5, attachments: 2, users: ['A'], columnId: 'c2' },
  { id: 't4', title: 'Review PR #45', type: 'Review', comments: 1, attachments: 0, users: ['B', 'C'], columnId: 'c3' },
  { id: 't5', title: 'Initial meeting with client', type: 'Meeting', comments: 0, attachments: 0, users: ['A'], columnId: 'c4' },
  { id: 't6', title: 'Wireframes approval', type: 'Design', comments: 12, attachments: 4, users: ['A', 'B', 'C'], columnId: 'c4' },
];

const getTagColor = (type: string) => {
  switch (type) {
    case 'Design': return { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899' };
    case 'Dev': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
    case 'Review': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
    default: return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
  }
};

const TaskCardVisual = ({ task, isDarkMode }: any) => {
  const tagStyle = getTagColor(task.type);
  return (
    <Box
      sx={{
        bgcolor: isDarkMode ? '#1E1B24' : '#fff',
        borderRadius: '12px',
        p: 2,
        boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Chip label={task.type} size="small" sx={{ bgcolor: tagStyle.bg, color: tagStyle.text, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
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
          {task.users.map((u: string, i: number) => <Avatar key={i}>{u}</Avatar>)}
        </AvatarGroup>
      </Box>
    </Box>
  );
};

const SortableTask = ({ task, isDarkMode }: any) => {
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
      <TaskCardVisual task={task} isDarkMode={isDarkMode} />
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

export const KanbanBoardPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      setColumns(prev => [...prev, { id: `c${Date.now()}`, title: newColumnName.trim() }]);
      setNewColumnName('');
      setIsColumnDialogOpen(false);
    }
  };

  // Drag handlers exactly adapted from help.tsx
  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks.find(t => t.id === e.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeTaskMatch = tasks.find(t => t.id === activeId);
    if (!activeTaskMatch) return;

    // Is it over a column?
    const overColumn = columns.find(c => c.id === overId);
    if (overColumn) {
      if (activeTaskMatch.columnId !== overColumn.id) {
        setTasks(prev => prev.map(t => t.id === activeId ? { ...t, columnId: overColumn.id } : t));
      }
      return;
    }

    // Is it over another task?
    const overTaskMatch = tasks.find(t => t.id === overId);
    if (overTaskMatch) {
      setTasks(prev => {
        const oldIndex = prev.findIndex(t => t.id === activeId);
        const newIndex = prev.findIndex(t => t.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;

        let newTasks = [...prev];
        if (activeTaskMatch.columnId !== overTaskMatch.columnId) {
          newTasks[oldIndex] = { ...newTasks[oldIndex], columnId: overTaskMatch.columnId };
        }
        return arrayMove(newTasks, oldIndex, newIndex);
      });
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const overColumn = columns.find(c => c.id === overId);
    if (overColumn) {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, columnId: overColumn.id } : t));
      return;
    }
  };

  return (
    <Box className="animate-fade-in-up" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Button
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => navigate(`/projects/${projectId}`)}
              sx={{ color: 'text.secondary', textTransform: 'none', minWidth: 0, p: 0, '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
            >
              Projects
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>/</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>Berger App</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>Berger App Board</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField placeholder="Search..." size="small" sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', '& fieldset': { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' } } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }} />
          <IconButton sx={{ border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '50%' }}><FilterListIcon fontSize="small" /></IconButton>
          <IconButton sx={{ border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '50%' }}><GroupIcon fontSize="small" /></IconButton>
          <Button variant="contained" sx={{ bgcolor: '#FF5733', color: '#fff', fontWeight: 700, borderRadius: '24px', textTransform: 'none', boxShadow: 'none', px: 3, ml: 1, '&:hover': { bgcolor: '#E04A2A', boxShadow: 'none' } }}>Share</Button>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', gap: 3, overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }, '&::-webkit-scrollbar-thumb': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 4 } }}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.columnId === col.id);
            return (
              <Box key={col.id} sx={{ minWidth: 320, width: 320, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>{col.title}</Typography>
                    <Chip label={colTasks.length} size="small" sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: 'text.secondary', fontWeight: 700, height: 24, fontSize: '0.75rem' }} />
                  </Box>
                  <Box>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}><AddIcon fontSize="small" /></IconButton>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}><MoreHorizIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>

                <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <DroppableColumn col={col} isDarkMode={isDarkMode}>
                    {colTasks.map(task => (
                      <SortableTask key={task.id} task={task} isDarkMode={isDarkMode} />
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

        <Box sx={{ minWidth: 320, width: 320, display: 'flex', flexDirection: 'column' }}>
          <Button onClick={() => setIsColumnDialogOpen(true)} startIcon={<AddIcon />} sx={{ height: 52, border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '16px', color: 'text.secondary', fontWeight: 650, textTransform: 'none', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', color: 'text.primary' } }}>Add Column</Button>
        </Box>
      </Box>

      <Dialog open={isColumnDialogOpen} onClose={() => setIsColumnDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>New Column</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Column Name" variant="outlined" size="small" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} sx={{ mt: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') handleAddColumn(); }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIsColumnDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleAddColumn} disabled={!newColumnName.trim()} variant="contained" sx={{ bgcolor: '#FF5733', borderRadius: '24px', '&:hover': { bgcolor: '#E04A2A' } }}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoardPage;
