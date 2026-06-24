import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  InputAdornment,
  TextField,
  Chip,
  IconButton,
  Avatar,
  AvatarGroup,
  LinearProgress,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GridViewIcon from '@mui/icons-material/GridView';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { tokens } from '@/styles/tokens';
import { useNavigate } from 'react-router-dom';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import type { ProjectFormData } from '@/components/projects/ProjectFormDialog';
import { useKanbanBoards, useCreateBoard, useDeleteBoard } from '@/hooks/api/useKanban';
import { useUsers } from '@/hooks/api/useUsers';

const filters = ['All', 'Active', 'Dev', 'On_hold'];
const types = ['All Types', 'Client', 'Internal'];

const ModernConfirmDialog = ({ open, title, description, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel" }: any) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  return (
    <Dialog open={open} onClose={onCancel} PaperProps={{ sx: { borderRadius: '24px', p: 1, bgcolor: isDarkMode ? '#1E1B24' : '#fff', backgroundImage: 'none' } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>{description}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '24px', textTransform: 'none' }}>{cancelText}</Button>
        <Button onClick={onConfirm} variant="contained" sx={{ bgcolor: tokens.semantic.error, color: '#fff', fontWeight: 700, borderRadius: '24px', textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#D32F2F', boxShadow: 'none' } }}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
};

const ProjectsPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const { data: boards = [], isLoading } = useKanbanBoards();
  const createBoardMutation = useCreateBoard();

  const [activeFilter, setActiveFilter] = useState('All');
  const [activeType, setActiveType] = useState('All Types');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const deleteBoardMutation = useDeleteBoard();

  const { data: dbUsers = [] } = useUsers();

  // Compute dynamic project structures based on live boards data
  const projects = useMemo(() => {
    return boards.map((board) => {
      const totalCards = board.columns?.reduce((acc, col) => acc + (col.cards?.length || 0), 0) || 0;
      const lastColCards = board.columns && board.columns.length > 0
        ? (board.columns[board.columns.length - 1].cards?.length || 0)
        : 0;

      const progressVal = totalCards > 0 ? Math.round((lastColCards / totalCards) * 100) : 0;

      let status = 'In Development';
      if (progressVal === 100 && totalCards > 0) {
        status = 'Active';
      } else if (totalCards === 0) {
        status = 'On Hold';
      }

      // Dynamically create some tech stacks based on columns or defaults
      const techStack = board.columns?.slice(0, 3).map(c => c.cards ? `${c.name} (${c.cards.length})` : c.name) || [];

      // Determine project type dynamically
      const type = (board.name || '').toLowerCase().includes('internal') ? 'Internal Product' : 'Client';

      // Resolve members from ownerId and sharedWith
      const ownerUser = dbUsers.find(u => u._id === (board as any).ownerId);
      const sharedUsers = Array.isArray((board as any).sharedWith)
        ? (board as any).sharedWith.map((id: any) => dbUsers.find(u => u._id === id)).filter(Boolean)
        : [];
      const boardMembers = [ownerUser, ...sharedUsers].filter(Boolean);

      return {
        id: board._id,
        title: board.name,
        type,
        description: `Lead pipeline board containing ${board.columns?.length || 0} active columns and ${totalCards} total lead cards.`,
        status,
        techStack,
        boardCount: board.columns?.length || 0,
        progressVal,
        members: boardMembers.length > 0 ? boardMembers : (ownerUser ? [ownerUser] : []),
      };
    });
  }, [boards, dbUsers]);

  // Compute dynamic filtered list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Search filter
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Type filter
      const matchesType = activeType === 'All Types' ||
        (activeType === 'Client' && p.type === 'Client') ||
        (activeType === 'Internal' && p.type === 'Internal Product');

      // 3. Status filter
      let matchesStatus = true;
      if (activeFilter === 'Active') matchesStatus = p.status === 'Active';
      if (activeFilter === 'Dev') matchesStatus = p.status === 'In Development';
      if (activeFilter === 'On_hold') matchesStatus = p.status === 'On Hold';

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [projects, searchQuery, activeType, activeFilter]);

  const activeCount = useMemo(() => projects.filter(p => p.status === 'Active').length, [projects]);
  const devCount = useMemo(() => projects.filter(p => p.status === 'In Development').length, [projects]);

  const handleAddProject = (data: ProjectFormData) => {
    createBoardMutation.mutate({ name: data.title }, {
      onSuccess: () => {
        setIsFormOpen(false);
      }
    });
  };

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: isDarkMode ? '#fff' : tokens.text.primary,
              mb: 0.5,
            }}
          >
            Boards
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
            }}
          >
            {projects.length} boards · {activeCount} active · {devCount} in development
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{
              borderRadius: '24px',
              textTransform: 'none',
              fontWeight: 650,
              color: 'text.primary',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              }
            }}
          >
            Import from Trello
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/sales')}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              fontWeight: 700,
              borderRadius: '24px',
              textTransform: 'none',
              boxShadow: 'none',
              px: 3,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                bgcolor: tokens.brand.primary,
                transform: 'translateY(-1px)',
                boxShadow: 'none',
              }
            }}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search projects..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 260 },
              transition: 'transform 0.2s ease-in-out',
              '&:focus-within': {
                transform: 'scale(1.015)',
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.25s ease',
                '& fieldset': {
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                },
                '&:hover fieldset': {
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: isDarkMode ? tokens.brand.primaryLight : tokens.brand.primary,
                  borderWidth: '1px',
                },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />


        </Box>

        {/* View Switcher Capsule */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F4F4F6',
          borderRadius: '30px',
          p: '4px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
          gap: '4px'
        }}>
          <IconButton 
            onClick={() => setViewMode('grid')}
            sx={{ 
              width: 36,
              height: 36,
              color: viewMode === 'grid' ? (isDarkMode ? '#fff' : '#1A1625') : (isDarkMode ? 'rgba(255,255,255,0.4)' : '#71717A'), 
              bgcolor: viewMode === 'grid' ? (isDarkMode ? 'rgba(255,255,255,0.08)' : '#E4E4E7') : 'transparent', 
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              '&:hover': { 
                bgcolor: viewMode === 'grid' 
                  ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#D4D4D8') 
                  : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') 
              }
            }}
          >
            <GridViewIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton 
            onClick={() => setViewMode('list')}
            sx={{ 
              width: 36,
              height: 36,
              color: viewMode === 'list' ? (isDarkMode ? '#fff' : '#1A1625') : (isDarkMode ? 'rgba(255,255,255,0.4)' : '#71717A'), 
              bgcolor: viewMode === 'list' ? (isDarkMode ? 'rgba(255,255,255,0.08)' : '#E4E4E7') : 'transparent', 
              borderRadius: '50%', 
              transition: 'all 0.2s ease',
              '&:hover': { 
                bgcolor: viewMode === 'list' 
                  ? (isDarkMode ? 'rgba(255,255,255,0.12)' : '#D4D4D8') 
                  : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') 
              } 
            }}
          >
            <FormatListBulletedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Grid or List representation */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : viewMode === 'grid' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(320px, 1fr))' }, gap: 3 }}>
          {filteredProjects.length === 0 && (
            <Box sx={{ gridColumn: '1 / -1', py: 8, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                No boards found matching the current filters.
              </Typography>
            </Box>
          )}
          {filteredProjects.map(project => (
            <Box
              key={project.id}
              onClick={() => navigate(`/board/${project.id}`)}
              sx={{
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                borderRadius: '24px',
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(26, 22, 37, 0.04)',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: tokens.shadow.cardHover,
                  borderColor: tokens.brand.primary,
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
                  {project.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setBoardToDelete(project.id); }}
                    sx={{ color: 'text.secondary', '&:hover': { color: tokens.semantic.error, bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 2, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {project.type}
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {project.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 3.5, flexWrap: 'wrap' }}>
                {project.techStack.map(tech => (
                  <Chip
                    key={tech}
                    label={tech}
                    size="small"
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      color: 'text.secondary',
                      fontWeight: 650,
                      fontSize: '0.7rem',
                      borderRadius: '8px',
                    }}
                  />
                ))}
              </Box>

              {/* Footer */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pt: 2.25,
                borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
              }}>
                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.72rem', fontWeight: 700, borderColor: isDarkMode ? '#1e1b24' : '#fff' } }}>
                  {project.members.map((m: any, idx: number) => {
                    const name = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email || 'User';
                    const initial = (m.firstName?.charAt(0) || m.email?.charAt(0) || 'U').toUpperCase();
                    const tooltipText = (
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{name}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)' }}>{m.email}</Typography>
                        {m.jobTitle && <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>{m.jobTitle}</Typography>}
                      </Box>
                    );

                    return (
                      <Tooltip key={m._id || idx} title={tooltipText} arrow enterDelay={100} leaveDelay={100}>
                        <Avatar sx={{ bgcolor: tokens.brand.primaryMuted }}>{initial}</Avatar>
                      </Tooltip>
                    );
                  })}
                </AvatarGroup>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                  <FolderIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {project.boardCount} columns
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredProjects.length === 0 && (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                No boards found matching the current filters.
              </Typography>
            </Box>
          )}
          {filteredProjects.map(project => (
            <Box
              key={project.id}
              onClick={() => navigate(`/board/${project.id}`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                borderRadius: '16px',
                p: 2.25,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  transform: 'translateY(-1.5px)',
                  boxShadow: tokens.shadow.cardHover,
                  borderColor: tokens.brand.primary,
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, minWidth: 0, flex: 1 }}>
                <FolderIcon sx={{ color: tokens.brand.primary, fontSize: 24 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {project.title}
                    </Typography>
                    <Chip
                      label={project.type}
                      size="small"
                      sx={{
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        color: 'text.secondary',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {project.description}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                  <FolderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {project.boardCount} columns
                  </Typography>
                </Box>

                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 26, height: 26, fontSize: '0.68rem', fontWeight: 700, borderColor: isDarkMode ? '#1e1b24' : '#fff' } }}>
                  {project.members.map((m: any, idx: number) => {
                    const initial = (m.firstName?.charAt(0) || m.email?.charAt(0) || 'U').toUpperCase();
                    return (
                      <Tooltip key={idx} title={`${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email} arrow>
                        <Avatar sx={{ bgcolor: tokens.brand.primaryMuted }}>{initial}</Avatar>
                      </Tooltip>
                    );
                  })}
                </AvatarGroup>

                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setBoardToDelete(project.id); }}
                  sx={{ color: 'text.secondary', '&:hover': { color: tokens.semantic.error, bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <ProjectFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddProject}
        isSubmitting={createBoardMutation.isPending}
      />

      <ModernConfirmDialog
        open={Boolean(boardToDelete)}
        title="Delete Project"
        description="Are you sure you want to delete this project and all its cards? This action cannot be undone."
        onConfirm={() => {
          if (boardToDelete) {
            deleteBoardMutation.mutate(boardToDelete, {
              onSuccess: () => setBoardToDelete(null)
            });
          }
        }}
        onCancel={() => setBoardToDelete(null)}
        confirmText="Delete Project"
      />
    </Box>
  );
};

export default ProjectsPage;

