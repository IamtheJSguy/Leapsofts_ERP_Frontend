import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
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
import FileUploadIcon from '@mui/icons-material/FileUpload';
import WorkIcon from '@mui/icons-material/Work';

import { tokens } from '@/styles/tokens';
import { ProjectDetailsSkeleton } from '@/components/page-skeletons/PageSkeletons';
import { useUsers } from '@/hooks/api/useUsers';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { canManageProjectMembers, memberUserId, userIdsEqual } from '@/lib/projectAccess';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { BoardCard } from '@/components/projects/BoardCard';
import { ImportBoardDialog } from '@/components/projects/ImportBoardDialog';
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useAddProjectMember,
  useRemoveProjectMember,
  useCreateProjectBoard,
  useImportProjectBoard,
} from '@/hooks/api/useProjects';
import { useDeleteBoard, useUpdateBoard } from '@/hooks/api/useKanban';
import type { ProjectStatus, ProjectMember } from '@/types';
import { showApiError } from '@/utils/apiError';
import { BOARD_CATEGORY_OPTIONS } from '@/lib/boardCategories';
import type { BoardCategory } from '@/types';

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
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));

  const initialTab = searchParams.get('tab') || 'Board';
  const initialTabIndex = TABS.indexOf(initialTab) !== -1 ? TABS.indexOf(initialTab) : 0;
  const [activeTab, setActiveTab] = useState(initialTabIndex);

  const { data, isLoading } = useProject(projectId);
  const updateProjectMutation = useUpdateProject(projectId);
  const deleteProjectMutation = useDeleteProject();
  const addProjectMemberMutation = useAddProjectMember(projectId);
  const removeProjectMemberMutation = useRemoveProjectMember(projectId);
  const createProjectBoardMutation = useCreateProjectBoard(projectId);
  const importProjectBoardMutation = useImportProjectBoard(projectId);
  const deleteBoardMutation = useDeleteBoard();
  const updateBoardMutation = useUpdateBoard();
  const queryClient = useQueryClient();

  const { data: dbUsers = [] } = useUsers();
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const { isElevated } = useAuth();
  const { canCreateProjectsAndBoards } = usePermissions();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isImportBoardOpen, setIsImportBoardOpen] = useState(false);
  
  const [isDeleteBoardConfirmOpen, setIsDeleteBoardConfirmOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);

  // New board input states
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardCategory, setNewBoardCategory] = useState<BoardCategory>('general');

  // Edit board states
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
  const [boardToEditId, setBoardToEditId] = useState<string | null>(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [editBoardCategory, setEditBoardCategory] = useState<BoardCategory>('general');
  const [editBoardError, setEditBoardError] = useState('');

  // Add member states
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');

  // Deconstruct derived data
  const project = data?.project;
  const boards = data?.boards || [];

  const canManageProject = canManageProjectMembers(currentUser, project);
  const isOverviewTab = activeTab === 1;
  const hideHeaderDescriptionOnCompact = isCompact && isOverviewTab;

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setSearchParams({ tab: TABS[index] });
  };

  const handleEditSubmit = (formData: any) => {
    if (!projectId) return;
    updateProjectMutation.mutate(
      {
        id: projectId,
        data: {
          name: formData.name,
          description: formData.description,
          status: formData.status,
          tags: formData.tags,
        },
      },
      {
        onSuccess: () => setIsEditOpen(false),
      },
    );
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
          onError: (err) => {
            showApiError(err);
            setMemberToRemove(null);
          },
        },
      );
    }
  };

  const handleProjectMemberRoleChange = (userId: string, role: 'admin' | 'member') => {
    if (!projectId) return;
    addProjectMemberMutation.mutate(
      { id: projectId, userId, role },
      {
        onSuccess: () => {
          addToast({ message: 'Member role updated', severity: 'success' });
        },
        onError: (err) => showApiError(err),
      },
    );
  };

  const projectRoleChipSx = (role: ProjectMember['role']) => {
    const isOwnerRole = role === 'owner';
    return {
      bgcolor: isOwnerRole
        ? 'rgba(167, 139, 250, 0.1)'
        : role === 'admin'
          ? 'rgba(59, 130, 246, 0.1)'
          : 'rgba(255, 255, 255, 0.05)',
      color: isOwnerRole ? '#a78bfa' : role === 'admin' ? '#3b82f6' : 'text.secondary',
      fontWeight: 750,
      fontSize: '0.65rem',
      height: 22,
    };
  };

  const handleCreateBoard = () => {
    if (projectId && newBoardName.trim()) {
      createProjectBoardMutation.mutate(
        {
          id: projectId,
          data: { name: newBoardName.trim(), category: newBoardCategory },
        },
        {
          onSuccess: () => {
            setNewBoardName('');
            setNewBoardCategory('general');
            setIsCreateBoardOpen(false);
            addToast({ message: 'Board created successfully', severity: 'success' });
          },
          onError: (err: any) => {
            showApiError(err);
          },
        }
      );
    }
  };

  const handleImportBoard = (payload: {
    name: string;
    columns: { name: string; order: number }[];
    cards: {
      title: string;
      description?: string;
      columnName: string;
      assignedTo: string[];
      priority: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: string;
      isDone: boolean;
    }[];
    memberUserIds: string[];
  }) => {
    if (!projectId) return;
    importProjectBoardMutation.mutate(
      { id: projectId, data: payload },
      {
        onSuccess: (res) => {
          const boardId = res.data.data._id;
          setIsImportBoardOpen(false);
          addToast({ message: 'Board imported', severity: 'success' });
          if (boardId) {
            navigate(`/projects/${projectId}/boards/${boardId}`);
          }
        },
        onError: (err: any) => {
          showApiError(err);
        },
      },
    );
  };

  const handleDeleteBoardConfirm = () => {
    if (boardToDelete) {
      deleteBoardMutation.mutate(boardToDelete, {
        onSuccess: () => {
          setBoardToDelete(null);
          setIsDeleteBoardConfirmOpen(false);
          addToast({ message: 'Board deleted successfully', severity: 'success' });
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          }
        },
        onError: (err: any) => {
          showApiError(err);
        },
      });
    }
  };

  const handleOpenEditBoard = (board: any) => {
    setBoardToEditId(board._id);
    setEditBoardName(board.name || '');
    setEditBoardCategory(board.category || 'general');
    setEditBoardError('');
    setIsEditBoardModalOpen(true);
  };

  const handleSaveBoardEdit = () => {
    const trimmed = editBoardName.trim();
    if (!trimmed) {
      setEditBoardError('Board name is required');
      return;
    }
    if (trimmed.length > 100) {
      setEditBoardError('Board name cannot exceed 100 characters');
      return;
    }
    if (!boardToEditId) return;

    setEditBoardError('');
    updateBoardMutation.mutate(
      { id: boardToEditId, name: trimmed, category: editBoardCategory },
      {
        onSuccess: () => {
          addToast({ message: 'Board updated successfully', severity: 'success' });
          setIsEditBoardModalOpen(false);
          setBoardToEditId(null);
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          }
        },
        onError: (err: any) => {
          showApiError(err);
        },
      },
    );
  };

  const projectOwnerUser = useMemo(() => {
    const id =
      typeof project?.ownerId === 'string'
        ? project.ownerId
        : (project?.ownerId as { _id?: string } | undefined)?._id;
    return dbUsers.find((u) => u._id === id);
  }, [project?.ownerId, dbUsers]);

  if (isLoading && !project) {
    return <ProjectDetailsSkeleton />;
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

  const projectActions = canManageProject ? (
    isCompact ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <Tooltip title="Edit Details" arrow>
          <IconButton
            aria-label="Edit project details"
            onClick={() => setIsEditOpen(true)}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: tokens.brand.primary,
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              },
            }}
          >
            <EditIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        {!project.isDefault && (
          <Tooltip title="Delete Project" arrow>
            <IconButton
              aria-label="Delete project"
              onClick={() => setIsDeleteConfirmOpen(true)}
              sx={{
                color: tokens.semantic.error,
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
              }}
            >
              <DeleteIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    ) : (
      <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
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
          Edit Details
        </Button>
        {!project.isDefault && (
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
        )}
      </Box>
    )
  ) : null;

  return (
    <Box className="animate-fade-in-up" sx={{ pb: { xs: 4, sm: 6 } }}>
      {/* Back + actions (compact header row) */}
      <Box
        sx={{
          mb: hideHeaderDescriptionOnCompact ? { xs: 1.25, sm: 3 } : { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.5,
          minHeight: 40,
        }}
      >
        {isCompact ? (
          <Tooltip title="Back to Projects" arrow>
            <IconButton
              aria-label="Back to Projects"
              onClick={() => navigate('/projects')}
              sx={{
                color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  color: tokens.brand.primary,
                },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            onClick={() => navigate('/projects')}
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none',
              px: 0,
              '&:hover': { bgcolor: 'transparent', color: tokens.brand.primary },
            }}
          >
            Back to Projects
          </Button>
        )}
        {isCompact && projectActions}
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: hideHeaderDescriptionOnCompact ? { xs: 1.5, sm: 4 } : { xs: 2.5, sm: 4 },
          flexWrap: 'wrap',
          gap: hideHeaderDescriptionOnCompact ? { xs: 1, sm: 3 } : { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 2 },
              mb: hideHeaderDescriptionOnCompact ? 0 : 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'text.primary',
                fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.25rem' },
                lineHeight: 1.2,
                overflowWrap: 'break-word',
              }}
            >
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
                flexShrink: 0,
              }}
            />
          </Box>
          {!hideHeaderDescriptionOnCompact && (
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: '700px',
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.55,
                overflowWrap: 'break-word',
              }}
            >
              {project.description || 'No description provided.'}
            </Typography>
          )}
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

        {!isCompact && projectActions}
      </Box>

      {/* Tabs Menu */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          mb: hideHeaderDescriptionOnCompact ? { xs: 1.75, sm: 4 } : { xs: 2.5, sm: 4 },
          gap: isMdDown ? 0 : 3,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {TABS.map((tab, idx) => (
          <Box
            key={tab}
            onClick={() => handleTabChange(idx)}
            sx={{
              pb: 1.5,
              pt: 0.25,
              px: isMdDown ? 2 : 0,
              flex: isMdDown ? '1 0 auto' : undefined,
              minWidth: isMdDown ? 0 : undefined,
              textAlign: isMdDown ? 'center' : 'left',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              position: 'relative',
              color: activeTab === idx ? 'text.primary' : 'text.secondary',
              fontWeight: activeTab === idx ? 800 : 600,
              fontSize: { xs: '0.875rem', sm: '0.95rem' },
              transition: 'color 0.2s ease',
              '&::after': activeTab === idx ? {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: isMdDown ? 8 : 0,
                right: isMdDown ? 8 : 0,
                height: '3px',
                bgcolor: tokens.brand.solid,
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: isCompact ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isCompact ? 'stretch' : 'center',
                gap: isCompact ? 1.5 : 2,
                mb: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  fontSize: { xs: '1.1rem', sm: '1.5rem' },
                }}
              >
                {boards.length} boards
              </Typography>
              {canCreateProjectsAndBoards && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isCompact ? 'column' : 'row',
                    gap: 1,
                    width: isCompact ? '100%' : 'auto',
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FileUploadIcon />}
                    onClick={() => setIsImportBoardOpen(true)}
                    fullWidth={isCompact}
                    sx={{
                      color: 'text.primary',
                      fontWeight: 700,
                      borderRadius: '24px',
                      textTransform: 'none',
                    }}
                  >
                    {isCompact ? 'Import' : 'Import Board'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsCreateBoardOpen(true)}
                    fullWidth={isCompact}
                    sx={{
                      bgcolor: tokens.brand.solid,
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: '24px',
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: tokens.brand.solid, boxShadow: 'none' },
                    }}
                  >
                    New Board
                  </Button>
                </Box>
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
                {canCreateProjectsAndBoards && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 1,
                      justifyContent: 'center',
                      px: { xs: 2, sm: 0 },
                      maxWidth: 360,
                      mx: 'auto',
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<FileUploadIcon />}
                      onClick={() => setIsImportBoardOpen(true)}
                      fullWidth={isCompact}
                      sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Import Board
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setIsCreateBoardOpen(true)}
                      fullWidth={isCompact}
                      sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Create the First Board
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: { xs: 2, sm: 3 },
                }}
              >
                {boards.map((board) => {
                  const isQualifiedBoard = board.name.trim().toLowerCase() === 'qualified';
                  const canEditBoard = Boolean(
                    isElevated ||
                    currentUser?.role === 'admin' ||
                    board.ownerId === currentUser?._id
                  );
                  const canDeleteBoard = (canManageProject || board.ownerId === currentUser?._id) && !isQualifiedBoard;
                  return (
                    <BoardCard
                      key={board._id}
                      board={board}
                      onClick={() => navigate(`/projects/${project._id}/boards/${board._id}`)}
                      onEdit={
                        canEditBoard
                          ? (e) => {
                              e.stopPropagation();
                              handleOpenEditBoard(board);
                            }
                          : undefined
                      }
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
              gap: { xs: 1.5, sm: 4 },
            }}
          >
            {/* Main Info */}
            <Box
              sx={{
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                borderRadius: { xs: '16px', sm: '24px' },
                p: { xs: 1.5, sm: 3, md: 4 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: { xs: 1.25, sm: 3 },
                  gap: 1,
                  minHeight: isCompact ? 32 : undefined,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1rem', sm: '1.5rem' },
                    lineHeight: 1.25,
                  }}
                >
                  Project Description
                </Typography>
                {canManageProject &&
                  (isCompact ? (
                    <Tooltip title="Edit Details" arrow>
                      <IconButton
                        aria-label="Edit project details"
                        onClick={() => setIsEditOpen(true)}
                        size="small"
                        sx={{ flexShrink: 0, color: 'text.secondary', ml: 0.5 }}
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setIsEditOpen(true)}
                      sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
                    >
                      Edit Details
                    </Button>
                  ))}
              </Box>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: { xs: 2, sm: 4 },
                  lineHeight: { xs: 1.55, sm: 1.7 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
              >
                {project.description || 'No description provided.'}
              </Typography>
              <Divider sx={{ mb: { xs: 2, sm: 4 } }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, mb: { xs: 1.25, sm: 3 }, fontSize: { xs: '1rem', sm: '1.5rem' } }}
              >
                Status & Tags
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.55,
                  mb: { xs: 1.25, sm: 2 },
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                }}
              >
                This is a <strong>{project.isDefault ? 'default system' : 'custom'}</strong> project currently in the{' '}
                <strong>{project.status.replace('_', ' ')}</strong> phase.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(project.tags?.length ? project.tags : []).map((tag) => (
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
                {!project.tags?.length && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    No tags yet — use Edit Details to add some.
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Sidebar metadata */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.5, sm: 3 },
              }}
            >
              <Box
                sx={{
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  borderRadius: { xs: '16px', sm: '24px' },
                  p: { xs: 1.5, sm: 3 },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 800, mb: { xs: 1.25, sm: 2 }, fontSize: { xs: '0.9375rem', sm: '1rem' } }}
                >
                  Metadata
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.25, sm: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                    <InfoIcon sx={{ color: 'text.secondary', fontSize: { xs: 16, sm: 18 }, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          fontSize: { xs: '0.625rem', sm: '0.75rem' },
                          letterSpacing: { xs: '0.04em', sm: 'normal' },
                          lineHeight: 1.2,
                          mb: 0.15,
                        }}
                      >
                        PROJECT OWNER
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                        {projectOwnerUser
                          ? `${projectOwnerUser.firstName || ''} ${projectOwnerUser.lastName || ''}`.trim() ||
                            projectOwnerUser.email
                          : 'System Admin'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                    <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: { xs: 16, sm: 18 }, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          fontSize: { xs: '0.625rem', sm: '0.75rem' },
                          letterSpacing: { xs: '0.04em', sm: 'normal' },
                          lineHeight: 1.2,
                          mb: 0.15,
                        }}
                      >
                        CREATED ON
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                        {new Date(project.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                    <GroupIcon sx={{ color: 'text.secondary', fontSize: { xs: 16, sm: 18 }, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          fontSize: { xs: '0.625rem', sm: '0.75rem' },
                          letterSpacing: { xs: '0.04em', sm: 'normal' },
                          lineHeight: 1.2,
                          mb: 0.15,
                        }}
                      >
                        TEAM MEMBERS
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: isCompact ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isCompact ? 'stretch' : 'center',
                gap: isCompact ? 1.5 : 2,
                mb: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}
              >
                {project.members?.length || 0} members
              </Typography>
              {canManageProject && (
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setIsAddMemberOpen(true)}
                  fullWidth={isCompact}
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
                const id = memberUserId(member.userId);
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
                      alignItems: isCompact ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      flexDirection: isCompact ? 'column' : 'row',
                      gap: isCompact ? 1.5 : 0,
                      p: { xs: 2, sm: 2.5 },
                      borderBottom:
                        idx < project.members.length - 1
                          ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                          : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, width: isCompact ? '100%' : 'auto' }}>
                      <Avatar src={user.avatarUrl || undefined} sx={{ bgcolor: tokens.brand.primaryMuted, fontWeight: 700, flexShrink: 0 }}>{initial}</Avatar>
                      <Box sx={{ minWidth: 0 }}>
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

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        alignSelf: isCompact ? 'flex-end' : 'center',
                        flexShrink: 0,
                      }}
                    >
                      {canManageProject && !isOwner && !userIdsEqual(id, currentUser?._id) ? (
                        <FormControl size="small" sx={{ minWidth: isCompact ? '100%' : 120 }}>
                          <Select
                            value={member.role === 'admin' ? 'admin' : 'member'}
                            onChange={(e) =>
                              handleProjectMemberRoleChange(id!, e.target.value as 'admin' | 'member')
                            }
                            disabled={addProjectMemberMutation.isPending}
                            aria-label={`Role for ${name}`}
                            sx={{
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              height: 32,
                              '& .MuiSelect-select': { py: 0.75 },
                            }}
                          >
                            <MenuItem value="member">Member</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          label={member.role.toUpperCase()}
                          size="small"
                          icon={<ShieldIcon sx={{ fontSize: '12px !important' }} />}
                          sx={projectRoleChipSx(member.role)}
                        />
                      )}
                      {canManageProject && !isOwner && !userIdsEqual(id, currentUser?._id) && (
                        <IconButton
                          size={isCompact ? 'medium' : 'small'}
                          aria-label={`Remove ${name} from project`}
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
        lockName={project.isDefault}
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

      {/* Edit Board Name Dialog */}
      <Dialog
        open={isEditBoardModalOpen}
        onClose={() => setIsEditBoardModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Board</DialogTitle>
        <DialogContent sx={{ overflow: 'visible' }}>
          <TextField
            autoFocus
            fullWidth
            label="Board Name"
            variant="outlined"
            size="small"
            value={editBoardName}
            onChange={(e) => {
              setEditBoardName(e.target.value);
              if (editBoardError) setEditBoardError('');
            }}
            error={Boolean(editBoardError)}
            helperText={editBoardError || `${editBoardName.trim().length}/100`}
            inputProps={{ maxLength: 100 }}
            sx={{ mt: 1.5 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveBoardEdit();
            }}
          />
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Board category</InputLabel>
            <Select
              value={editBoardCategory}
              label="Board category"
              onChange={(e) => setEditBoardCategory(e.target.value as BoardCategory)}
            >
              {BOARD_CATEGORY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setIsEditBoardModalOpen(false)}
            disabled={updateBoardMutation.isPending}
            sx={{ color: 'text.secondary', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveBoardEdit}
            disabled={!editBoardName.trim() || updateBoardMutation.isPending}
            variant="contained"
            sx={{ bgcolor: tokens.brand.solid, borderRadius: '24px', '&:hover': { bgcolor: tokens.brand.solid } }}
          >
            {updateBoardMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!memberToRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name || 'this user'} from this project? They will lose access to the project and its boards, be unassigned from their cards, and those cards will be removed from their daily tasks. Board managers will be notified about any cards left with no assignee.`}
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
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Board category</InputLabel>
            <Select
              value={newBoardCategory}
              label="Board category"
              onChange={(e) => setNewBoardCategory(e.target.value as BoardCategory)}
            >
              {BOARD_CATEGORY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
              bgcolor: tokens.brand.solid,
              color: '#fff',
              fontWeight: 700,
              borderRadius: '24px',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.brand.solid, boxShadow: 'none' },
            }}
          >
            {createProjectBoardMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ImportBoardDialog
        open={isImportBoardOpen}
        projectId={projectId || ''}
        isPending={importProjectBoardMutation.isPending}
        onClose={() => setIsImportBoardOpen(false)}
        onConfirm={handleImportBoard}
      />

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
              bgcolor: tokens.brand.solid,
              color: '#fff',
              fontWeight: 700,
              borderRadius: '24px',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.brand.solid, boxShadow: 'none' },
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
