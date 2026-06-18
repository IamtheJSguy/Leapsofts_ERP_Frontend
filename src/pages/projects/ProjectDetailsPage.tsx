import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  useTheme,
  Chip,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupIcon from '@mui/icons-material/Group';
import { tokens } from '@/styles/tokens';

// Dummy data
const dummyProject = {
  id: 'p1',
  title: 'Berger App',
  type: 'Internal Product',
  description: "It's a project",
  status: 'In Development',
  startedAt: 'Jun 4, 2026',
  deadline: 'Jun 25, 2026',
  techStack: ['React', 'Node'],
  boardCount: 2,
  milestoneCount: 0,
  teamMembersCount: 2,
};

const dummyBoards = [
  { id: 'b1', title: 'Berger App Board', columnsCount: 5, tasksCount: 0, columns: [0, 0, 0, 0, 0] },
  { id: 'b2', title: 'Pinoyaya-bugs', columnsCount: 6, tasksCount: 66, columns: [7, 10, 3, 46, 0, 0] },
];

const TABS = ['Overview', 'Board', 'Analysis', 'Team', 'Milestones', 'Notes', 'Files'];

export const ProjectDetailsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState(0);

  // In a real app we'd fetch project details using `projectId`
  const project = dummyProject; // Fallback to dummy data for UI

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon fontSize="small" />}
        onClick={() => navigate('/projects')}
        sx={{
          color: 'text.secondary',
          textTransform: 'none',
          fontWeight: 600,
          alignSelf: 'flex-start',
          mb: 2,
          '&:hover': { bgcolor: 'transparent', color: 'text.primary' }
        }}
      >
        Back to Projects
      </Button>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              {project.title}
            </Typography>
            <Chip
              label={project.status}
              size="small"
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                fontWeight: 700,
                fontSize: '0.75rem',
                height: 26,
                '& .MuiChip-label': { px: 1.5 },
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
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {project.type}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: '24px',
              textTransform: 'none',
              fontWeight: 650,
              color: 'text.primary',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }
            }}
          >
            Edit
          </Button>
          <IconButton
            sx={{
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '50%',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderColor: 'transparent' }
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 4,
          minHeight: 36,
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTabs-flexContainer': { gap: 1 }
        }}
      >
        {TABS.map((tab, idx) => (
          <Tab
            key={tab}
            label={tab}
            sx={{
              minHeight: 36,
              py: 0.5,
              px: 2,
              textTransform: 'none',
              fontWeight: 650,
              fontSize: '0.9rem',
              borderRadius: '20px',
              color: activeTab === idx ? (isDarkMode ? '#000' : '#000') : 'text.secondary',
              bgcolor: activeTab === idx ? (isDarkMode ? '#fff' : '#fff') : 'transparent',
              border: activeTab === idx ? `1px solid ${isDarkMode ? '#fff' : 'rgba(0,0,0,0.1)'}` : '1px solid transparent',
              boxShadow: activeTab === idx && !isDarkMode ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
              '&:hover': {
                bgcolor: activeTab === idx ? (isDarkMode ? '#fff' : '#fff') : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
              }
            }}
          />
        ))}
      </Tabs>

      {/* Tab Content */}
      <Box sx={{ flexGrow: 1 }}>
        {activeTab === 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>

            {/* Left: Project Details */}
            <Box
              sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: '24px',
                p: 4,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 3 }}>
                Project Details
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5 }}>
                {project.description}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <Box>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1, letterSpacing: '0.05em' }}>
                    TYPE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 650, color: 'text.primary' }}>
                    {project.type}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1, letterSpacing: '0.05em' }}>
                    STARTED
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 650, color: 'text.primary' }}>
                    {project.startedAt}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1, letterSpacing: '0.05em' }}>
                    DEADLINE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 650, color: 'text.primary' }}>
                    {project.deadline}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1, letterSpacing: '0.05em' }}>
                    TEAM
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 650, color: 'text.primary' }}>
                    {project.teamMembersCount} members
                  </Typography>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1.5, letterSpacing: '0.05em' }}>
                    TECH STACK
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {project.techStack.map(tech => (
                      <Chip
                        key={tech}
                        label={tech}
                        size="small"
                        sx={{
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          color: 'text.secondary',
                          fontWeight: 650,
                          fontSize: '0.75rem',
                          borderRadius: '12px',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Right: Summary Cards */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <SummaryCard
                icon={<FolderOpenIcon sx={{ color: '#FF5733' }} />}
                count={project.boardCount}
                label="Boards"
                iconBg="rgba(255, 87, 51, 0.1)"
              />
              <SummaryCard
                icon={<EventNoteIcon sx={{ color: '#F59E0B' }} />}
                count={project.milestoneCount}
                label="Milestones"
                iconBg="rgba(245, 158, 11, 0.1)"
              />
              <SummaryCard
                icon={<GroupIcon sx={{ color: '#3B82F6' }} />}
                count={project.teamMembersCount}
                label="Team Members"
                iconBg="rgba(59, 130, 246, 0.1)"
              />
            </Box>

          </Box>
        )}

        {/* Board Tab */}
        {activeTab === 1 && (
          <Box className="animate-fade-in-up">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {dummyBoards.length} boards
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: '#FF5733',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '24px',
                  textTransform: 'none',
                  boxShadow: 'none',
                  px: 3,
                  '&:hover': { bgcolor: '#E04A2A', boxShadow: 'none' }
                }}
              >
                New Board
              </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 3 }}>
              {dummyBoards.map((board) => (
                <Box
                  key={board.id}
                  onClick={() => navigate(`/projects/${projectId}/boards/${board.id}`)}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: '24px',
                    p: 3,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: tokens.shadow.cardHover,
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)',
                      '& .delete-btn': { opacity: 1 }
                    }
                  }}
                >
                  <IconButton
                    className="delete-btn"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      color: 'text.secondary',
                      '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.08)' }
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em', mb: 0.5 }}>
                    {board.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 4 }}>
                    {board.columnsCount} columns · {board.tasksCount} tasks
                  </Typography>

                  {/* Columns Visualizer */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {board.columns.map((colTasks, idx) => {
                      const totalTasks = board.tasksCount || 1; // avoid division by zero
                      const widthPercent = board.tasksCount === 0 ? 100 / board.columnsCount : Math.max(5, (colTasks / totalTasks) * 100);

                      return (
                        <Box
                          key={idx}
                          sx={{
                            height: 6,
                            borderRadius: '3px',
                            flexBasis: `${widthPercent}%`,
                            flexGrow: board.tasksCount === 0 ? 1 : 0,
                            bgcolor: colTasks > 0 ? '#FF7A59' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                            opacity: colTasks > 20 ? 1 : (colTasks > 0 ? 0.6 : 1),
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Placeholder for other tabs */}
        {activeTab > 1 && (
          <Box sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
            border: `1px dashed ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: '24px',
          }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {TABS[activeTab]} view coming soon.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const SummaryCard = ({ icon, count, label, iconBg }: any) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: '20px',
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        transition: 'transform 0.2s',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: tokens.shadow.cardHover,
        }
      }}
    >
      <Box sx={{
        width: 48,
        height: 48,
        borderRadius: '16px',
        bgcolor: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
          {count}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProjectDetailsPage;
