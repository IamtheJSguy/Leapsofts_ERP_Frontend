import { useState } from 'react';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GridViewIcon from '@mui/icons-material/GridView';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FolderIcon from '@mui/icons-material/Folder';
import { tokens } from '@/styles/tokens';
import { useNavigate } from 'react-router-dom';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import type { ProjectFormData } from '@/components/projects/ProjectFormDialog';

// Dummy data for initial UI check
const dummyProjects = [
  {
    id: 'p1',
    title: 'Berger App',
    type: 'Internal Product',
    description: "It's a project",
    status: 'In Development',
    techStack: ['React', 'Node'],
    boardCount: 2,
    members: ['H', 'A'],
  },
];

const filters = ['All', 'Active', 'Dev', 'On_hold'];
const types = ['All Types', 'Client', 'Internal'];

const ProjectsPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const [projects, setProjects] = useState(dummyProjects);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeType, setActiveType] = useState('All Types');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Compute dynamic filtered list
  const filteredProjects = projects.filter((p) => {
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

  const activeCount = projects.filter(p => p.status === 'Active').length;
  const devCount = projects.filter(p => p.status === 'In Development').length;

  const handleAddProject = (data: ProjectFormData) => {
    const newProject = {
      id: `p${Date.now()}`,
      title: data.title,
      type: data.type,
      description: data.description,
      status: data.status,
      techStack: data.techStack,
      boardCount: 0,
      members: ['U'], // Add current user or default dummy
    };
    setProjects([newProject, ...projects]);
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
            Projects
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
            }}
          >
            {projects.length} projects · {activeCount} active · {devCount} in development
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
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
            onClick={() => setIsFormOpen(true)}
            sx={{
              bgcolor: '#FF5733', // Custom orange-red for the design
              color: '#fff',
              fontWeight: 700,
              borderRadius: '24px',
              textTransform: 'none',
              boxShadow: 'none',
              px: 3,
              '&:hover': {
                bgcolor: '#E04A2A',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search projects..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: 260,
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
                '& fieldset': {
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
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

          <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
            {filters.map(f => (
              <Chip
                key={f}
                label={f}
                onClick={() => setActiveFilter(f)}
                sx={{
                  borderRadius: '16px',
                  fontWeight: 650,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  bgcolor: activeFilter === f ? (isDarkMode ? '#fff' : tokens.text.primary) : 'transparent',
                  color: activeFilter === f ? (isDarkMode ? '#000' : '#fff') : 'text.secondary',
                  border: 'none',
                  '&:hover': {
                    bgcolor: activeFilter === f
                      ? (isDarkMode ? '#e0e0e0' : '#333')
                      : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  }
                }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, ml: 2, borderLeft: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, pl: 2 }}>
            {types.map(t => (
              <Chip
                key={t}
                label={t}
                onClick={() => setActiveType(t)}
                sx={{
                  borderRadius: '16px',
                  fontWeight: 650,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  bgcolor: activeType === t ? (isDarkMode ? '#fff' : tokens.text.primary) : 'transparent',
                  color: activeType === t ? (isDarkMode ? '#000' : '#fff') : 'text.secondary',
                  border: 'none',
                  '&:hover': {
                    bgcolor: activeType === t
                      ? (isDarkMode ? '#e0e0e0' : '#333')
                      : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{
          display: 'flex',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
          borderRadius: '24px',
          p: 0.5,
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
        }}>
          <IconButton size="small" sx={{ color: 'text.primary', bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)' }}>
            <GridViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
        {filteredProjects.length === 0 && (
          <Box sx={{ gridColumn: '1 / -1', py: 8, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              No projects found matching the current filters.
            </Typography>
          </Box>
        )}
        {filteredProjects.map(project => (
          <Box
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            sx={{
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              borderRadius: '24px',
              p: 3,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: tokens.shadow.cardHover,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)',
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
                {project.title}
              </Typography>
              <Chip
                label={project.status}
                size="small"
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                  '&::before': {
                    content: '""',
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: '#3b82f6',
                    ml: 1.2,
                    mr: -0.5
                  }
                }}
              />
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 2 }}>
              {project.type}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {project.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
              {project.techStack.map(tech => (
                <Chip
                  key={tech}
                  label={tech}
                  size="small"
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    color: 'text.secondary',
                    fontWeight: 650,
                    fontSize: '0.7rem',
                    borderRadius: '12px',
                  }}
                />
              ))}
            </Box>

            {/* Footer */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 2,
              borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
            }}>
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700, borderColor: isDarkMode ? '#1e1b24' : '#fff' } }}>
                {project.members.map((m, i) => (
                  <Avatar key={i}>{m}</Avatar>
                ))}
              </AvatarGroup>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <FolderIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {project.boardCount}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <ProjectFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddProject}
      />
    </Box>
  );
};

export default ProjectsPage;
