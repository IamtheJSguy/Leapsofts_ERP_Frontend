import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  Tooltip,
  Divider,
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShieldIcon from '@mui/icons-material/Shield';
import AddIcon from '@mui/icons-material/Add';
import WorkIcon from '@mui/icons-material/Work';

import { tokens } from '@/styles/tokens';
import { useUsers } from '@/hooks/api/useUsers';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { BoardCard } from '@/components/projects/BoardCard';
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useAddProjectMember,
  useRemoveProjectMember,
  useCreateProjectBoard,
} from '@/hooks/api/useProjects';
import { useDeleteBoard } from '@/hooks/api/useKanban';
import type { ProjectStatus, ProjectMember } from '@/types';

const TABS = ['Board', 'Overview', 'Team'];

const getStatusConfig = (status?: ProjectStatus) => {
  switch (status) {
    case 'active':
      return { label: 'Active', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    case 'in_development':
      return { label: 'In Development', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
    case 'on_hold':
    default:
      return { label: 'On Hold', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  }
};

export const ProjectDetailsPage = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const initialTab = searchParams.get('tab') || 'Board';
  const initialTabIndex = TABS.indexOf(initialTab) !== -1 ? TABS.indexOf(initialTab) : 0;
  const [activeTab, setActiveTab] = useState(initialTabIndex);

  const { data, isLoading } = useProject(projectId);
  const updateProjectMutation = useUpdateProject(projectId);
  const deleteProjectMutation = useDeleteProject();
  const addProjectMemberMutation = useAddProjectMember(projectId);
  const removeProjectMemberMutation = useRemoveProjectMember(projectId);
  const createProjectBoardMutation = useCreateProjectBoard(projectId);
  const deleteBoardMutation = useDeleteBoard();
  const queryClient = useQueryClient();

  const { data: dbUsers = [] } = useUsers();
  const currentUser = useAuthStore((s) => s.user);
  const { isElevated } = useAuth();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  
  const [isDeleteBoardConfirmOpen, setIsDeleteBoardConfirmOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);

  // New board input states
  const [newBoardName, setNewBoardName] = useState('');

  // Add member states
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');

  // Deconstruct derived data
  const project = data?.project;
  const boards = data?.boards || [];

  const isProjectOwner = project?.ownerId === currentUser?._id;
  const canManageProject = isProjectOwner || isElevated;

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setSearchParams({ tab: TABS[index] });
  };

  const handleEditSubmit = (formData: any) => {
    if (projectId) {
      updateProjectMutation.mutate({
        id: projectId,
        data: {
          name: formData.name,
          description: formData.description,
          status: formData.status,
          tags: formData.tags,
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (projectId) {
      deleteProjectMutation.mutate(projectId, {
        onSuccess: () => {
          navigate('/projects');
        },
      });
    }
  };

  const handleAddMember = () => {
    if (projectId && selectedUserToAdd) {
      addProjectMemberMutation.mutate(
        {
          id: projectId,
          userId: selectedUserToAdd._id,
          role: selectedRole,
        },
        {
          onSuccess: () => {
            setSelectedUserToAdd(null);
            setIsAddMemberOpen(false);
          },
        }
      );
    }
  };

  const handleRemoveMemberClick = (userId: string, name: string) => {
    setMemberToRemove({ userId, name });
  };

  const handleConfirmRemoveMember = () => {
    if (projectId && memberToRemove) {
      removeProjectMemberMutation.mutate(
        { id: projectId, userId: memberToRemove.userId },
        {
          onSuccess: () => setMemberToRemove(null),
          onError: () => setMemberToRemove(null),
        },
      );
    }
  };

  const handleCreateBoard = () => {
    if (projectId && newBoardName.trim()) {
      createProjectBoardMutation.mutate(
        {
          id: projectId,
          data: { name: newBoardName.trim() },
        },
        {
          onSuccess: () => {
            setNewBoardName('');
            setIsCreateBoardOpen(false);
          },
        }
      );
    }
  };

  const handleDeleteBoardConfirm = () => {
    if (boardToDelete) {
      deleteBoardMutation.mutate(boardToDelete, {
        onSuccess: () => {
          setBoardToDelete(null);
          setIsDeleteBoardConfirmOpen(false);
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          }
        }
      });
    }
  };

  const projectOwnerUser = useMemo(() => {
    return dbUsers.find((u) => u._id === project?.ownerId);
  }, [project?.ownerId, dbUsers]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Project not found
        </Typography>
        <Button onClick={() => navigate('/projects')} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  const statusConfig = getStatusConfig(project.status);

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      {/* Back button */}
      <Button
        onClick={() => navigate('/projects')}
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        sx={{
          color: 'text.secondary',
          fontWeight: 700,
          fontSize: '0.85rem',
          mb: 3,
          textTransform: 'none',
          '&:hover': { bgcolor: 'transparent', color: tokens.brand.primary },
        }}
      >
        Back to Projects
      </Button>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>
              {project.name}
            </Typography>
            <Chip
              label={statusConfig.label}
              size="small"
              sx={{
                bgcolor: statusConfig.bg,
                color: statusConfig.color,
                fontWeight: 750,
                fontSize: '0.72rem',
                border: 'none',
              }}
            />
          </Box>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxW: '700px', mb: 2 }}>
            {project.description || 'No description provided.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {project.tags?.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: 'text.secondary',
                  fontWeight: 650,
                  fontSize: '0.68rem',
                  borderRadius: '6px',
                }}
              />
            ))}
          </Box>
        </Box>

        {canManageProject && !project.isDefault && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              onClick={() => setIsEditOpen(true)}
              sx={{
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 700,
                color: 'text.primary',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                '&:hover': {
                  borderColor: tokens.brand.primary,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                },
              }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
              onClick={() => setIsDeleteConfirmOpen(true)}
              sx={{
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 700,
                color: tokens.semantic.error,
                borderColor: 'rgba(239, 68, 68, 0.2)',
                '&:hover': {
                  borderColor: tokens.semantic.error,
                  bgcolor: 'rgba(239, 68, 68, 0.04)',
                },
              }}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      {/* Tabs Menu */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          mb: 4,
          gap: 3,
        }}
      >
        {TABS.map((tab, idx) => (
          <Box
            key={tab}
            onClick={() => handleTabChange(idx)}
            sx={{
              pb: 1.5,
              cursor: 'pointer',
              position: 'relative',
              color: activeTab === idx ? 'text.primary' : 'text.secondary',
              fontWeight: activeTab === idx ? 800 : 600,
              fontSize: '0.95rem',
              transition: 'color 0.2s ease',
              '&::after': activeTab === idx ? {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                bgcolor: tokens.brand.primary,
                borderRadius: '2px',
              } : undefined,
            }}
          >
            {tab}
          </Box>
        ))}
      </Box>

      {/* Tabs Content */}
      <Box>
        {/* BOARD TAB */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {boards.length} boards
              </Typography>
              {canManageProject && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsCreateBoardOpen(true)}
                  sx={{
                    bgcolor: tokens.brand.primary,
                    color: '#fff',
                    fontWeight: 700,
                    borderRadius: '24px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: tokens.brand.primary, boxShadow: 'none' },
                  }}
                >
                  New Board
                </Button>
              )}
            </Box>

            {boards.length === 0 ? (
              <Box
                sx={{
                  py: 8,
                  textAlign: 'center',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.2)' : 'rgba(0,0,0,0.01)',
                  borderRadius: '24px',
                  border: `1px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                }}
              >
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600 }}>
                  This project has no boards yet.
                </Typography>
                {canManageProject && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setIsCreateBoardOpen(true)}
                    sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 700 }}
                  >
                    Create the First Board
                  </Button>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 3,
                }}
              >
                {boards.map((board) => {
                  const isQualifiedBoard = board.name.trim().toLowerCase() === 'qualified';
                  const canDeleteBoard = (canManageProject || board.ownerId === currentUser?._id) && !isQualifiedBoard;
                  return (
                    <BoardCard
                      key={board._id}
                      board={board}
                      onClick={() => navigate(`/projects/${project._id}/boards/${board._id}`)}
                      onDelete={
                        canDeleteBoard
                          ? (e) => {
                              setBoardToDelete(board._id);
                              setIsDeleteBoardConfirmOpen(true);
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 1 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 4,
            }}
          >
            {/* Main Info */}
            <Box
              sx={{
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                borderRadius: '24px',
                p: 4,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                Project Description
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.7 }}>
                {project.description || 'No description provided.'}
              </Typography>
              <Divider sx={{ mb: 4 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                Status Details
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                This is a <strong>{project.isDefault ? 'default system' : 'custom'}</strong> project currently in the{' '}
                <strong>{project.status.replace('_', ' ')}</strong> phase.
              </Typography>
            </Box>

            {/* Sidebar metadata */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <Box
                sx={{
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  borderRadius: '24px',
                  p: 3,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Metadata
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <InfoIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        PROJECT OWNER
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {projectOwnerUser
                          ? `${projectOwnerUser.firstName || ''} ${projectOwnerUser.lastName || ''}`.trim() ||
                            projectOwnerUser.email
                          : 'System Admin'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        CREATED ON
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {new Date(project.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GroupIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        TEAM MEMBERS
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {project.members?.length || 0} users
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* TEAM TAB */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {project.members?.length || 0} members
              </Typography>
              {canManageProject && (
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setIsAddMemberOpen(true)}
                  sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 700 }}
                >
                  Add Member
                </Button>
              )}
            </Box>

            <Box
              sx={{
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                borderRadius: '24px',
                overflow: 'hidden',
              }}
            >
              {project.members.map((member, idx) => {
                const id = typeof member.userId === 'string' ? member.userId : member.userId?._id;
                const user = dbUsers.find((u) => u._id === id);
                if (!user) return null;

                const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                const initial = (user.firstName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase();

                const isOwner = member.role === 'owner';

                return (
                  <Box
                    key={member._id || idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2.5,
                      borderBottom:
                        idx < project.members.length - 1
                          ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                          : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: tokens.brand.primaryMuted, fontWeight: 700 }}>{initial}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {user.email}
                        </Typography>
                        {user.jobTitle && (
                          <Typography variant="caption" sx={{ color: tokens.brand.primary, display: 'block', mt: 0.25 }}>
                            {user.jobTitle}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={member.role.toUpperCase()}
                        size="small"
                        icon={<ShieldIcon sx={{ fontSize: '12px !important' }} />}
                        sx={{
                          bgcolor: isOwner
                            ? 'rgba(167, 139, 250, 0.1)'
                            : member.role === 'admin'
                            ? 'rgba(59, 130, 246, 0.1)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: isOwner ? '#a78bfa' : member.role === 'admin' ? '#3b82f6' : 'text.secondary',
                          fontWeight: 750,
                          fontSize: '0.65rem',
                          height: 22,
                        }}
                      />
                      {canManageProject && !isOwner && member.userId !== currentUser?._id && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveMemberClick(id!, name)}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': { color: tokens.semantic.error, bgcolor: 'rgba(239, 68, 68, 0.08)' },
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
        )}
      </Box>

      {/* dialogs */}
      <ProjectFormDialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        isSubmitting={updateProjectMutation.isPending}
        initialData={{
          name: project.name,
          description: project.description || '',
          status: project.status,
          tags: project.tags || [],
        }}
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Delete Project"
        message="Are you sure you want to delete this project and all its boards? This action is permanent and cannot be undone."
        confirmLabel="Yes, Delete Project"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      <ConfirmDialog
        open={isDeleteBoardConfirmOpen}
        title="Delete Board"
        message="Are you sure you want to delete this board? All columns and tasks inside it will be lost permanently."
        confirmLabel="Yes, Delete Board"
        cancelLabel="Cancel"
        onConfirm={handleDeleteBoardConfirm}
        onCancel={() => {
          setIsDeleteBoardConfirmOpen(false);
          setBoardToDelete(null);
        }}
      />

      <ConfirmDialog
        open={!!memberToRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name || 'this user'} from this project? They will lose access to the project and its boards.`}
        confirmLabel="Yes, Remove"
        cancelLabel="Cancel"
        isPending={removeProjectMemberMutation.isPending}
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />

      {/* CREATE BOARD DIALOG */}
      <Dialog
        open={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1,
            bgcolor: isDarkMode ? '#1E1B24' : '#fff',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>Create Board</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Provide a name for the new board inside this project.
          </Typography>
          <TextField
            autoFocus
            label="Board Name"
            fullWidth
            size="small"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            InputProps={{ sx: { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setIsCreateBoardOpen(false)}
            sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '24px', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateBoard}
            disabled={!newBoardName.trim() || createProjectBoardMutation.isPending}
            variant="contained"
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              fontWeight: 700,
              borderRadius: '24px',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.brand.primary, boxShadow: 'none' },
            }}
          >
            {createProjectBoardMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD MEMBER DIALOG */}
      <Dialog
        open={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1.5,
            bgcolor: isDarkMode ? '#1E1B24' : '#fff',
            backgroundImage: 'none',
            minWidth: { xs: '320px', sm: '400px' },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>Add Team Member</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <Autocomplete
              options={dbUsers.filter(
                (u) => !project.members.some((m) => (typeof m.userId === 'string' ? m.userId : m.userId?._id) === u._id)
              )}
              getOptionLabel={(option) =>
                `${option.firstName || ''} ${option.lastName || ''}`.trim()
                  ? `${option.firstName || ''} ${option.lastName || ''} (${option.email})`
                  : option.email
              }
              value={selectedUserToAdd}
              onChange={(_, newVal) => setSelectedUserToAdd(newVal)}
              renderInput={(params) => (
                <TextField {...params} label="Search User" size="small" InputProps={{ ...params.InputProps, sx: { borderRadius: '12px' } }} />
              )}
            />

            <FormControl fullWidth size="small">
              <InputLabel id="role-select-label">Project Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={selectedRole}
                label="Project Role"
                onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'member')}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="member">Member (Read/Write boards)</MenuItem>
                <MenuItem value="admin">Admin (Manage boards & members)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setIsAddMemberOpen(false)}
            sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '24px', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={!selectedUserToAdd || addProjectMemberMutation.isPending}
            variant="contained"
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              fontWeight: 700,
              borderRadius: '24px',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.brand.primary, boxShadow: 'none' },
            }}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetailsPage;
