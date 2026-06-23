import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  useTheme,
  Chip,
  IconButton,
  CircularProgress,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { tokens } from '@/styles/tokens';
import { useKanbanBoard, useShareBoard } from '@/hooks/api/useKanban';
import { useUsers } from '@/hooks/api/useUsers';

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

const TABS = ['Overview', 'Board', 'Analysis', 'Team', 'Milestones', 'Notes', 'Files'];

export const ProjectDetailsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState(0);

  const { data: board, isLoading } = useKanbanBoard(projectId);
  const { data: dbUsers = [] } = useUsers();
  const shareBoardMutation = useShareBoard();
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');

  const project = useMemo(() => {
    if (!board) return dummyProject;
    const actualBoard = (board as any).board || board;
    const cards = (board as any).cards || [];
    const totalCards = cards.length || actualBoard.columns?.reduce((acc: number, col: any) => acc + (col.cards?.length || 0), 0) || 0;

    const lastColumn = actualBoard.columns && actualBoard.columns.length > 0
      ? actualBoard.columns[actualBoard.columns.length - 1]
      : null;
    const lastColCards = lastColumn
      ? (cards.length > 0 ? cards.filter((c: any) => c.columnId === lastColumn._id).length : (lastColumn.cards?.length || 0))
      : 0;
    const progressVal = totalCards > 0 ? Math.round((lastColCards / totalCards) * 100) : 0;

    let status = 'In Development';
    if (progressVal === 100 && totalCards > 0) {
      status = 'Active';
    } else if (totalCards === 0) {
      status = 'On Hold';
    }

    const techStack = actualBoard.columns?.slice(0, 3).map((c: any) => {
      const colCardsCount = cards.length > 0 ? cards.filter((card: any) => card.columnId === c._id).length : (c.cards?.length || 0);
      return `${c.name} (${colCardsCount})`;
    }) || [];
    const type = (actualBoard.name || '').toLowerCase().includes('internal') ? 'Internal Product' : 'Client';

    const ownerUser = dbUsers.find(u => u._id === actualBoard.ownerId);
    const sharedUsers = Array.isArray(actualBoard.sharedWith)
      ? actualBoard.sharedWith.map((id: any) => dbUsers.find(u => u._id === id)).filter(Boolean)
      : [];
    const boardMembers = [ownerUser, ...sharedUsers].filter(Boolean);
    const teamMembersCount = boardMembers.length || 1;

    return {
      id: actualBoard._id,
      title: actualBoard.name,
      type,
      description: `Lead pipeline board containing ${actualBoard.columns?.length || 0} active columns and ${totalCards} total lead cards.`,
      status,
      startedAt: 'Jun 4, 2026',
      deadline: 'Jun 25, 2026',
      techStack,
      boardCount: 1,
      milestoneCount: 0,
      teamMembersCount,
    };
  }, [board]);

  const boardsList = useMemo(() => {
    if (!board) return [];
    const actualBoard = (board as any).board || board;
    const cards = (board as any).cards || [];
    const totalCards = cards.length || actualBoard.columns?.reduce((acc: number, col: any) => acc + (col.cards?.length || 0), 0) || 0;

    return [
      {
        id: actualBoard._id,
        title: actualBoard.name,
        columnsCount: actualBoard.columns?.length || 0,
        tasksCount: totalCards,
        columns: actualBoard.columns?.map((col: any) => cards.length > 0 ? cards.filter((c: any) => c.columnId === col._id).length : (col.cards?.length || 0)) || [],
      }
    ];
  }, [board]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon fontSize="small" />}
        onClick={() => navigate('/board')}
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
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 4,
          p: 0.6,
          alignSelf: 'flex-start',
          borderRadius: '30px',
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          maxWidth: '100%',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none', // Firefox
          '&::-webkit-scrollbar': { display: 'none' }, // Safari & Chrome
        }}
      >
        {TABS.map((tab, idx) => {
          const isSelected = activeTab === idx;
          const activeColor = isDarkMode ? tokens.brand.primaryLight : tokens.brand.primary;
          const activeBg = isDarkMode ? 'rgba(123, 61, 168, 0.12)' : 'rgba(93, 26, 137, 0.08)';
          const activeBorder = isDarkMode ? 'rgba(123, 61, 168, 0.3)' : 'rgba(93, 26, 137, 0.25)';

          return (
            <Button
              key={tab}
              onClick={() => setActiveTab(idx)}
              sx={{
                textTransform: 'none',
                borderRadius: '24px',
                px: 3,
                py: 0.8,
                fontWeight: 700,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                bgcolor: isSelected ? activeBg : 'transparent',
                color: isSelected ? activeColor : 'text.secondary',
                border: '1px solid',
                borderColor: isSelected ? activeBorder : 'transparent',
                boxShadow: isSelected
                  ? `0 4px 14px ${isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(93, 26, 137, 0.04)'}`
                  : 'none',
                '&:hover': {
                  transform: 'translateY(-1.5px)',
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
              {tab}
            </Button>
          );
        })}
      </Box>

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
                    {project.techStack.map((tech: any) => (
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
                {boardsList.length} boards
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 3 }}>
              {boardsList.map((board) => (
                <Box
                  key={board.id}
                  onClick={() => navigate(`/board/${projectId}/boards/${board.id}`)}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                    borderRadius: '24px',
                    p: 3,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: tokens.shadow.cardHover,
                      borderColor: tokens.brand.primary,
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em', mb: 0.5 }}>
                    {board.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 4 }}>
                    {board.columnsCount} columns · {board.tasksCount} tasks
                  </Typography>

                  {/* Columns Visualizer */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {board.columns.map((colTasks: any, idx: any) => {
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
                            bgcolor: colTasks > 0 ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
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

        {/* Team Tab */}
        {activeTab === 3 && (() => {
          const actualBoard = (board as any)?.board || board;
          const ownerUser = dbUsers.find(u => u._id === actualBoard?.ownerId);
          const sharedUserIds = Array.isArray(actualBoard?.sharedWith) ? actualBoard.sharedWith : [];
          const sharedUsers = sharedUserIds.map((id: any) => dbUsers.find(u => u._id === id)).filter(Boolean);
          const allMembers = [ownerUser, ...sharedUsers].filter(Boolean);
          
          const availableUsersToAdd = dbUsers.filter(u => 
            u._id !== actualBoard?.ownerId && !sharedUserIds.includes(u._id)
          );

          const handleAddMember = () => {
            if (selectedUserToAdd && projectId) {
              const updatedShared = [...sharedUserIds, selectedUserToAdd];
              shareBoardMutation.mutate({
                boardId: projectId,
                userIds: updatedShared,
              }, {
                onSuccess: () => setSelectedUserToAdd('')
              });
            }
          };

          const handleRemoveMember = (userId: string) => {
            if (projectId) {
              const updatedShared = sharedUserIds.filter((id: any) => id !== userId);
              shareBoardMutation.mutate({
                boardId: projectId,
                userIds: updatedShared,
              });
            }
          };

          return (
            <Box className="animate-fade-in-up" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Add Team Member Section */}
              <Box sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: '20px',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Manage Project Team</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Add new members or modify permissions for this project board.</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', minWidth: 280 }}>
                  <FormControl size="small" sx={{ flexGrow: 1 }}>
                    <InputLabel id="add-member-label">Select User</InputLabel>
                    <Select
                      labelId="add-member-label"
                      value={selectedUserToAdd}
                      onChange={(e) => setSelectedUserToAdd(e.target.value)}
                      label="Select User"
                      sx={{ borderRadius: '24px' }}
                    >
                      {availableUsersToAdd.map((u: any) => (
                        <MenuItem key={u._id} value={u._id}>
                          {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                        </MenuItem>
                      ))}
                      {availableUsersToAdd.length === 0 && (
                        <MenuItem disabled>No users available</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleAddMember}
                    disabled={!selectedUserToAdd || shareBoardMutation.isPending}
                    startIcon={<PersonAddIcon />}
                    sx={{
                      bgcolor: tokens.brand.primary,
                      borderRadius: '24px',
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: 'none',
                      px: 3,
                      '&:hover': { bgcolor: tokens.brand.primary, boxShadow: 'none' }
                    }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>

              {/* Members List */}
              <Box sx={{
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: '24px',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Project Members ({allMembers.length})</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {allMembers.map((m: any, idx: number) => {
                    const isOwner = m._id === actualBoard?.ownerId;
                    const fullName = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email || 'User';
                    const initial = (m.firstName?.charAt(0) || m.email?.charAt(0) || 'U').toUpperCase();

                    return (
                      <Box
                        key={m._id || idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          borderRadius: '16px',
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: tokens.brand.primaryMuted, fontWeight: 700 }}>{initial}</Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{fullName}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{m.email}</Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          <Chip
                            label={isOwner ? "Project Owner" : "Member"}
                            size="small"
                            sx={{
                              bgcolor: isOwner ? 'rgba(93, 26, 137, 0.08)' : 'rgba(0,0,0,0.04)',
                              color: isOwner ? tokens.brand.primary : 'text.secondary',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          />
                          {!isOwner && (
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveMember(m._id)}
                              disabled={shareBoardMutation.isPending}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.08)' }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          );
        })()}

        {/* Placeholder for other tabs */}
        {activeTab > 1 && activeTab !== 3 && (
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
