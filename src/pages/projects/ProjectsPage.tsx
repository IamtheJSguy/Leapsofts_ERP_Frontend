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
  LinearProgress,
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
              width: 260,
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

          {/* Status Filters Capsule */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              p: 0.5,
              borderRadius: '30px',
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            }}
          >
            {filters.map(f => {
              const isSelected = activeFilter === f;
              const activeColor = isDarkMode ? tokens.brand.primaryLight : tokens.brand.primary;
              const activeBg = isDarkMode ? 'rgba(123, 61, 168, 0.12)' : 'rgba(93, 26, 137, 0.08)';
              const activeBorder = isDarkMode ? 'rgba(123, 61, 168, 0.3)' : 'rgba(93, 26, 137, 0.25)';

              return (
                <Button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: '24px',
                    px: 2,
                    py: 0.5,
                    minWidth: 'auto',
                    height: 28,
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    bgcolor: isSelected ? activeBg : 'transparent',
                    color: isSelected ? activeColor : 'text.secondary',
                    border: '1px solid',
                    borderColor: isSelected ? activeBorder : 'transparent',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      bgcolor: isSelected
                        ? activeBg
                        : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                      borderColor: isSelected ? activeBorder : 'transparent',
                      color: isSelected ? activeColor : 'text.primary',
                    },
                    '&:active': {
                      transform: 'scale(0.97)',
                    }
                  }}
                >
                  {f.replace('_', ' ')}
                </Button>
              );
            })}
          </Box>

          {/* Type Filters Capsule */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              p: 0.5,
              borderRadius: '30px',
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            }}
          >
            {types.map(t => {
              const isSelected = activeType === t;
              const activeColor = isDarkMode ? tokens.brand.primaryLight : tokens.brand.primary;
              const activeBg = isDarkMode ? 'rgba(123, 61, 168, 0.12)' : 'rgba(93, 26, 137, 0.08)';
              const activeBorder = isDarkMode ? 'rgba(123, 61, 168, 0.3)' : 'rgba(93, 26, 137, 0.25)';

              return (
                <Button
                  key={t}
                  onClick={() => setActiveType(t)}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: '24px',
                    px: 2,
                    py: 0.5,
                    minWidth: 'auto',
                    height: 28,
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    bgcolor: isSelected ? activeBg : 'transparent',
                    color: isSelected ? activeColor : 'text.secondary',
                    border: '1px solid',
                    borderColor: isSelected ? activeBorder : 'transparent',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      bgcolor: isSelected
                        ? activeBg
                        : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                      borderColor: isSelected ? activeBorder : 'transparent',
                      color: isSelected ? activeColor : 'text.primary',
                    },
                    '&:active': {
                      transform: 'scale(0.97)',
                    }
                  }}
                >
                  {t}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* View Switcher Capsule */}
        <Box sx={{
          display: 'flex',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: '30px',
          p: 0.5,
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
        }}>
          <IconButton size="small" sx={{ color: 'text.primary', bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: '50%' }}>
            <GridViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: 'text.secondary', borderRadius: '50%', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>
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
        {(() => {
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'Active':
                return tokens.semantic.success;
              case 'In Development':
              case 'Dev':
                return tokens.semantic.info;
              case 'On Hold':
                return tokens.semantic.warning;
              default:
                return tokens.brand.primary;
            }
          };

          return filteredProjects.map(project => {
            const statusColor = getStatusColor(project.status);
            const progressVal = project.title === 'Berger App' ? 75 : 35;

            return (
              <Box
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
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
                  <Chip
                    label={project.status}
                    size="small"
                    sx={{
                      bgcolor: `${statusColor}15`,
                      color: statusColor,
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      height: 24,
                      borderRadius: '8px',
                      border: `1px solid ${statusColor}30`,
                      '& .MuiChip-label': {
                        px: 1.25,
                      },
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: statusColor,
                        ml: 0.5,
                        mr: -0.5
                      }
                    }}
                  />
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

                {/* Progress Bar Section */}
                <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Project Completion
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: statusColor, fontSize: '0.75rem' }}>
                      {progressVal}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressVal}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: statusColor,
                      }
                    }}
                  />
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
                    {project.members.map((m, i) => (
                      <Avatar key={i}>{m}</Avatar>
                    ))}
                  </AvatarGroup>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                    <FolderIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {project.boardCount} boards
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          });
        })()}
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
