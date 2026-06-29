import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  OutlinedInput,
  InputAdornment,
  CircularProgress,
  useTheme,
  alpha,
  Badge,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WorkIcon from '@mui/icons-material/Work';
import GridViewIcon from '@mui/icons-material/GridView';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimelineIcon from '@mui/icons-material/Timeline';

import { tokens } from '@/styles/tokens';
import { formatTime12Hour } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/store/useUIStore';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/api/useUsers';
import { getSocket } from '@/lib/socket';

const TeamPage = () => {
  const { isAdmin } = usePermissions();
  const addToast = useUIStore((s) => s.addToast);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Load team users from DB API
  const { data: dbUsers = [], isLoading: isUsersLoading } = useUsers();
  const createUserMutation = useCreateUser();

  const teamList = dbUsers;

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // View state: grid or list
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Selected user for details page sub-view
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get('userId');

  useEffect(() => {
    if (userIdFromUrl && teamList.length > 0) {
      const matched = teamList.find((u: any) => u._id === userIdFromUrl);
      if (matched && (!selectedUser || selectedUser._id !== userIdFromUrl)) {
        setSelectedUser(matched);
      }
    } else if (!userIdFromUrl && selectedUser) {
      setSelectedUser(null);
    }
  }, [userIdFromUrl, teamList, selectedUser]);

  // Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields matching Reference mockup exactly
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [roleSelection, setRoleSelection] = useState<'user' | 'admin'>('user');
  const [bio, setBio] = useState('');

  const filteredTeam = useMemo(() => {
    return teamList.filter((member) => {
      const name = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
      const job = (member.jobTitle || '').toLowerCase();
      const dept = (member.department || '').toLowerCase();
      const mail = member.email.toLowerCase();
      const query = searchQuery.toLowerCase();

      return name.includes(query) || job.includes(query) || dept.includes(query) || mail.includes(query);
    });
  }, [teamList, searchQuery]);

  useEffect(() => {
    if (teamList.length > 0) {
      const userIds = teamList.map((u: any) => u._id);
      const socket = getSocket();
      socket.emit('presence:subscribe', userIds);
    }
  }, [teamList]);

  const handleResetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setJobTitle('');
    setPhone('');
    setDepartment('Engineering');
    setRoleSelection('user');
    setBio('');
    setShowPassword(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim() || !jobTitle.trim()) {
      addToast({ message: 'Please fill in all required fields.', severity: 'error' });
      return;
    }

    // Split Full Name into firstName and lastName for database schema
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      email,
      password,
      firstName,
      lastName,
      role: roleSelection,
      jobTitle,
      phone,
      department,
      bio,
    };

    createUserMutation.mutate(payload, {
      onSuccess: () => {
        addToast({ message: 'Team member added successfully!', severity: 'success' });
        setIsAddOpen(false);
        handleResetForm();
      },
      onError: (err: any) => {
        addToast({
          message: err?.response?.data?.message || 'Failed to add team member.',
          severity: 'error'
        });
      },
    });
  };

  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const handleDeleteUser = () => {
    if (!selectedUser?._id) return;

    deleteUserMutation.mutate(selectedUser._id, {
      onSuccess: () => {
        addToast({ message: 'User deleted successfully!', severity: 'success' });
        setIsDeleteConfirmOpen(false);
        setSelectedUser(null);
        setSearchParams({});
      },
      onError: (err: any) => {
        addToast({
          message: err?.response?.data?.message || 'Failed to delete user.',
          severity: 'error'
        });
      }
    });
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?._id) return;

    updateUserMutation.mutate({
      id: selectedUser._id,
      data: {
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        role: selectedUser.role,
        isActive: selectedUser.isActive,
        shiftStart: (selectedUser as any).shiftStart,
        shiftEnd: (selectedUser as any).shiftEnd,
      } as any
    }, {
      onSuccess: () => {
        addToast({ message: 'User updated successfully!', severity: 'success' });
        setIsEditUserOpen(false);
      },
      onError: (err: any) => {
        addToast({
          message: err?.response?.data?.message || 'Failed to update user.',
          severity: 'error'
        });
      }
    });
  };

  // Reusable custom input styles matching the reference mockup
  const inputSx = {
    mb: 2.5,
    '& .MuiOutlinedInput-root': {
      borderRadius: '20px',
      bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
      height: 46,
      fontSize: '0.88rem',
      '& fieldset': {
        borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      },
      '&:hover fieldset': {
        borderColor: tokens.brand.primary,
      },
    },
  };

  if (selectedUser) {
    const actionButtonSx = {
      borderRadius: '24px',
      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
      bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff',
      color: isDarkMode ? 'rgba(255,255,255,0.8)' : tokens.text.secondary,
      textTransform: 'none',
      px: 2.25,
      py: 0.75,
      fontWeight: 600,
      fontSize: '0.82rem',
      '&:hover': {
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
      },
    };

    const userInitials = `${selectedUser.firstName?.charAt(0) || ''}${selectedUser.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
    const userFullName = `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email;

    return (
      <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
        {/* Top Header Navigation & Action Toolbar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            mb: 4.5,
          }}
        >
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setSelectedUser(null);
              setSearchParams({});
            }}
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : tokens.text.secondary,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.9rem',
              p: 0,
              '&:hover': {
                bgcolor: 'transparent',
                color: tokens.brand.primary,
              },
            }}
          >
            Back to Team
          </Button>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button startIcon={<EditIcon sx={{ fontSize: 15 }} />} sx={actionButtonSx} onClick={() => setIsEditUserOpen(true)}>
              Edit
            </Button>
            <Button startIcon={<LockIcon sx={{ fontSize: 15 }} />} sx={actionButtonSx} onClick={() => alert('Resetting password is disabled in preview mode.')}>
              Reset Password
            </Button>
            <Button startIcon={<BlockIcon sx={{ fontSize: 15 }} />} sx={actionButtonSx} onClick={() => alert('Deactivation is disabled in preview mode.')}>
              Deactivate
            </Button>
            <Button
              startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
              sx={{
                ...actionButtonSx,
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.05)',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#EF4444',
                },
              }}
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* User Summary Card */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F2EEEC',
              color: isDarkMode ? '#FFFFFF' : '#1A1625',
              fontSize: '2rem',
              fontWeight: 800,
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
            }}
          >
            {userInitials}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 0.5, letterSpacing: '-0.025em' }}>
              {userFullName}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 550, mb: 1, fontSize: '0.96rem' }}>
              {selectedUser.jobTitle || 'Full Stack'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.84rem', userSelect: 'text' }}>
                <EmailIcon sx={{ fontSize: 15 }} />
                {selectedUser.email}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.84rem', userSelect: 'text' }}>
                <PhoneIcon sx={{ fontSize: 15 }} />
                {selectedUser.phone || '03256250751'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Personal stats widget (this week) */}
        <Card
          sx={{
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
            mb: 4.5,
            p: 3,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: '#FFF3F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TimelineIcon sx={{ color: '#FF4E3A', fontSize: 16 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                Personal stats · this week
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                bgcolor: isDarkMode ? 'rgba(217, 119, 6, 0.1)' : '#FFF8EE',
                color: '#D97706',
                px: 1.5,
                py: 0.4,
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 750,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D97706' }} />
              stalled
            </Box>
          </Box>

          {/* Metric cards grid */}
          <Grid container spacing={2}>
            {[
              { label: 'Open Tasks', value: '1', color: '#2563EB' },
              { label: 'Completed', value: '0', color: '#10B981' },
              { label: 'Overdue', value: '0', color: '#6B7280' },
              { label: 'Avg Cycle', value: '—', color: '#8B5CF6' },
            ].map((stat, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#F9F8F7',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.02)'}`,
                    borderRadius: '16px',
                    p: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.65rem',
                      display: 'block',
                      mb: 1.5,
                    }}
                  >
                    {stat.label}
                  </Typography>
                  {stat.value === '—' ? (
                    <Box sx={{ width: 24, height: 3, bgcolor: stat.color, borderRadius: '2px', mt: 1.5, mb: 1 }} />
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 800, color: stat.color, fontSize: '2rem', lineHeight: 1 }}>
                      {stat.value}
                    </Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Custom SVG Line Chart */}
          <Box sx={{ mt: 4, mb: 1, height: 110, position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: isDarkMode ? 0.05 : 0.08,
                pointerEvents: 'none',
              }}
            >
              <Box sx={{ borderBottom: '1.5px dashed currentColor', width: '100%' }} />
              <Box sx={{ borderBottom: '1.5px dashed currentColor', width: '100%' }} />
              <Box sx={{ borderBottom: '1.5px dashed currentColor', width: '100%' }} />
            </Box>
            <svg viewBox="0 0 1000 100" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFA08A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FFA08A" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 80 C 150 75, 250 15, 400 45 C 550 75, 650 35, 800 65 C 900 85, 950 50, 1000 55 L 1000 100 L 0 100 Z"
                fill="url(#waveGradient)"
              />
              <path
                d="M 0 80 C 150 75, 250 15, 400 45 C 550 75, 650 35, 800 65 C 900 85, 950 50, 1000 55"
                fill="none"
                stroke="#FFA08A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="400" cy="45" r="4.5" fill="#FFA08A" stroke={isDarkMode ? '#1a1721' : '#fff'} strokeWidth="1.5" />
              <circle cx="800" cy="65" r="4.5" fill="#FFA08A" stroke={isDarkMode ? '#1a1721' : '#fff'} strokeWidth="1.5" />
            </svg>
          </Box>

          {/* Graph labels */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, mb: 3 }}>
            {['6d', '5d', '4d', '3d', '2d', 'Yest', 'Today'].map((label, index) => (
              <Typography key={index} variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.7rem' }}>
                {label}
              </Typography>
            ))}
          </Box>

          {/* Bottom stats details row */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              pt: 2.5,
              borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            {[
              { label: 'Meetings', value: '0/0', sub: null },
              { label: 'Punctuality', value: '—', sub: 'avg late' },
              { label: 'Comments', value: '0', sub: 'this week' },
              { label: 'Notes', value: '0', sub: 'authored' },
            ].map((item, idx) => (
              <Box key={idx} sx={{ minWidth: 100 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.65rem',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  {item.label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '0.94rem', lineHeight: 1.1 }}>
                  {item.value}
                </Typography>
                {item.sub && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mt: 0.25 }}>
                    {item.sub}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Card>

        {/* Multi-column Projects & Secondary Metadata details */}
        <Grid container spacing={{ xs: 2, md: 4 }} sx={{ mb: 4.5 }}>
          {/* Column 1: Projects list card */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                borderRadius: '24px',
                bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                p: 3,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FolderIcon sx={{ color: '#3B82F6', fontSize: 16 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                  Projects (1)
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  bgcolor: isDarkMode ? 'rgba(0,0,0,0.1)' : '#F9F8F7',
                  borderRadius: '16px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'}`,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                    Berger App
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Internal · MEMBER
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 750, letterSpacing: '0.04em' }}>
                  IN DEVELOPMENT
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Column 2: Department Meta Info & Active Tasks */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Department Meta */}
              <Card
                sx={{
                  borderRadius: '24px',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  p: 3,
                }}
              >
                <Grid container spacing={2}>
                  {[
                    { label: 'Department', value: selectedUser.department || 'Engineering' },
                    { label: 'Role', value: selectedUser.role === 'admin' ? 'ADMIN' : 'EMPLOYEE' },
                    { label: 'Shift Start', value: formatTime12Hour(selectedUser.shiftStart) || '09:00 AM' },
                    { label: 'Shift End', value: formatTime12Hour(selectedUser.shiftEnd) || '05:00 PM' },
                    { label: 'Start Date', value: 'Jun 3, 2026' },
                    { label: 'Status', value: selectedUser.isActive ? 'ACTIVE' : 'INACTIVE', isStatus: true },
                  ].map((meta, idx) => (
                    <Grid item xs={6} key={idx} sx={{ mb: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '0.65rem',
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {meta.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: meta.isStatus ? '#10B981' : (isDarkMode ? '#fff' : tokens.text.primary),
                          fontSize: '0.86rem',
                        }}
                      >
                        {meta.value}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Card>

              {/* Tasks Card */}
              <Card
                sx={{
                  borderRadius: '24px',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  p: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#FEF2F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AssignmentIcon sx={{ color: '#EF4444', fontSize: 16 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                    Tasks
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '0.88rem', lineHeight: 1.2 }}>
                      otp test
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                      Resolved
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Edit User Dialog */}
        <Dialog 
          open={isEditUserOpen} 
          onClose={() => setIsEditUserOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff',
              backgroundImage: 'none',
              width: '100%',
              maxWidth: 550,
            }
          }}
        >
          <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Edit User Details</Typography>
          </DialogTitle>
          <form onSubmit={handleEditUserSubmit}>
            <DialogContent sx={{ px: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    fullWidth
                    value={selectedUser.firstName || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    fullWidth
                    value={selectedUser.lastName || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={selectedUser.email || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Role"
                    fullWidth
                    value={selectedUser.role || 'user'}
                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    sx={inputSx}
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Status"
                    fullWidth
                    value={selectedUser.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setSelectedUser({ ...selectedUser, isActive: e.target.value === 'active' })}
                    sx={inputSx}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Shift Start"
                    type="time"
                    fullWidth
                    value={selectedUser.shiftStart || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, shiftStart: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Shift End"
                    type="time"
                    fullWidth
                    value={selectedUser.shiftEnd || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, shiftEnd: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={inputSx}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button 
                onClick={() => setIsEditUserOpen(false)} 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={updateUserMutation.isPending}
                sx={{ 
                  bgcolor: tokens.brand.primary,
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  px: 3,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: tokens.brand.primaryLight,
                  }
                }}
              >
                {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={isDeleteConfirmOpen} 
          onClose={() => setIsDeleteConfirmOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff',
              backgroundImage: 'none',
              maxWidth: 400,
            }
          }}
        >
          <DialogTitle sx={{ pb: 1, pt: 3, px: 3, color: '#EF4444' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Confirm Deletion</Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3 }}>
            <Typography variant="body1" sx={{ color: isDarkMode ? '#e0e0e0' : tokens.text.primary }}>
              Are you sure you want to delete {userFullName}? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button 
              onClick={() => setIsDeleteConfirmOpen(false)} 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteUser}
              variant="contained" 
              disabled={deleteUserMutation.isPending}
              sx={{ 
                bgcolor: '#EF4444',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '12px',
                textTransform: 'none',
                px: 3,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#DC2626',
                }
              }}
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Activity Log Card */}
        <Card
          sx={{
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            p: 3,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TimelineIcon sx={{ color: '#3B82F6', fontSize: 16 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                Activity log
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
              8 events
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4.5 }}>
            {/* THU, JUN 4 · 2026 */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}` }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.04em' }}>
                  THU, JUN 4 · 2026
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                  6
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {[
                  { desc: 'MOVED task "otp test" from Problem Cards to Resolved', time: '5:18 PM', from: 'Problem Cards', to: 'Resolved', isAction: true },
                  { desc: 'MOVED task "otp test" from InQA to Problem Cards', time: '5:18 PM', from: 'InQA', to: 'Problem Cards', isAction: true },
                  { desc: 'MOVED task "otp test" from Resolved to InQA', time: '5:18 PM', from: 'Resolved', to: 'InQA', isAction: true },
                  { desc: 'MOVED task "otp test" from Customer side to Resolved', time: '5:17 PM', from: 'Customer side', to: 'Resolved', isAction: true },
                  { desc: 'MOVED task "otp test" from Customer side to Doing', time: '5:17 PM', from: 'Customer side', to: 'Doing', isAction: true },
                  { desc: 'CREATED task "otp test" in Berger App', time: '5:16 PM', isCreate: true },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', position: 'relative' }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: item.isCreate ? '#3B82F6' : '#EF4444',
                        mt: 0.75,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                        <Typography variant="body2" sx={{ fontWeight: 650, color: isDarkMode ? '#e0e0e0' : tokens.text.primary, fontSize: '0.86rem' }}>
                          <Box component="span" sx={{ color: item.isCreate ? '#3B82F6' : '#EF4444', fontWeight: 750, mr: 0.5, fontSize: '0.82rem' }}>
                            {item.isCreate ? 'CREATED' : 'MOVED'}
                          </Box>
                          {item.desc.replace(/^(CREATED|MOVED)\s/, '')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                          {item.time}
                        </Typography>
                      </Box>

                      {item.isAction && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={item.from}
                            size="small"
                            sx={{
                              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                              color: 'text.secondary',
                              fontSize: '0.66rem',
                              height: 18,
                              fontWeight: 650,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            →
                          </Typography>
                          <Chip
                            label={item.to}
                            size="small"
                            sx={{
                              bgcolor: item.to === 'Resolved' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                              color: item.to === 'Resolved' ? '#10B981' : '#EF4444',
                              fontSize: '0.66rem',
                              height: 18,
                              fontWeight: 750,
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* WED, JUN 3 · 2026 */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}` }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.04em' }}>
                  WED, JUN 3 · 2026
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                  2
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {[
                  { desc: 'MOVED task "Pin location icon should be working in map" from Customer side to Service provider', time: '8:10 PM', from: 'Customer side', to: 'Service provider' },
                  { desc: 'MOVED task "Complete UI fixes for this screen" from Service provider to Customer side', time: '8:10 PM', from: 'Service provider', to: 'Customer side' },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#EF4444',
                        mt: 0.75,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                        <Typography variant="body2" sx={{ fontWeight: 650, color: isDarkMode ? '#e0e0e0' : tokens.text.primary, fontSize: '0.86rem' }}>
                          <Box component="span" sx={{ color: '#EF4444', fontWeight: 750, mr: 0.5, fontSize: '0.82rem' }}>
                            MOVED
                          </Box>
                          {item.desc.replace(/^MOVED\s/, '')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                          {item.time}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={item.from}
                          size="small"
                          sx={{
                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            color: 'text.secondary',
                            fontSize: '0.66rem',
                            height: 18,
                            fontWeight: 650,
                          }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          →
                        </Typography>
                        <Chip
                          label={item.to}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(239, 68, 68, 0.08)',
                            color: '#EF4444',
                            fontSize: '0.66rem',
                            height: 18,
                            fontWeight: 750,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.025em',
              mb: 0.5,
              color: isDarkMode ? '#fff' : tokens.text.primary,
            }}
          >
            Team Operations
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
              fontWeight: 500,
              fontSize: '0.92rem',
            }}
          >
            Coordinate representatives, allocate access roles, and monitor operations staff.
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddOpen(true)}
            sx={{
              background: `linear-gradient(135deg, ${tokens.brand.primary} 0%, ${tokens.brand.primaryLight} 100%)`,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              px: 3.5,
              py: 1.25,
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: isDarkMode
                ? '0 8px 24px rgba(93, 26, 137, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                : `0 8px 20px ${alpha(tokens.brand.primary, 0.25)}`,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDarkMode
                  ? '0 12px 32px rgba(93, 26, 137, 0.55), inset 0 1px 0 rgba(255,255,255,0.2)'
                  : `0 12px 28px ${alpha(tokens.brand.primary, 0.35)}`,
                filter: 'brightness(1.05)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            Add Member
          </Button>
        )}
      </Box>

      {/* Unified command control panel (Glassmorphic) */}
      <Box
        sx={{
          mb: 4,
          p: 2,
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.7)'}`,
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <TextField
          size="small"
          placeholder="Search team members by name, title, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: { sm: 400 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '30px',
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'transparent'}`,
              transition: 'border-color 0.2s',
              '&:hover': {
                borderColor: alpha(tokens.brand.primary, 0.3),
              },
            },
          }}
        />

        {/* Sleek Custom View Mode Toggler */}
        <Box
          sx={{
            display: 'flex',
            bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '20px',
            p: 0.5,
            gap: 0.5,
            alignSelf: { xs: 'flex-end', sm: 'center' },
          }}
        >
          <IconButton
            size="small"
            onClick={() => setViewMode('grid')}
            sx={{
              borderRadius: '16px',
              px: 2,
              py: 0.75,
              bgcolor: viewMode === 'grid' ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent',
              color: viewMode === 'grid' ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary',
              '&:hover': {
                bgcolor: viewMode === 'grid' ? (isDarkMode ? '#fff' : '#1A1625') : 'rgba(0,0,0,0.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <GridViewIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>Grid</Typography>
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewMode('list')}
            sx={{
              borderRadius: '16px',
              px: 2,
              py: 0.75,
              bgcolor: viewMode === 'list' ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent',
              color: viewMode === 'list' ? (isDarkMode ? '#1A1625' : '#fff') : 'text.secondary',
              '&:hover': {
                bgcolor: viewMode === 'list' ? (isDarkMode ? '#fff' : '#1A1625') : 'rgba(0,0,0,0.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <FormatListBulletedIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>List</Typography>
          </IconButton>
        </Box>
      </Box>

      {/* Team Cards Grid */}
      {isUsersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : filteredTeam.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(93, 26, 137, 0.08)'}`,
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.005)' : 'rgba(93, 26, 137, 0.005)',
          }}
        >
          <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary, fontWeight: 600 }}>
            No team members found matching your search.
          </Typography>
        </Box>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3.5}>
          {filteredTeam.map((member) => {
            const initials = `${member.firstName?.charAt(0) || ''}${member.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
            const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;

            return (
              <Grid item xs={12} sm={6} md={4} key={member._id}>
                <Card
                  onClick={() => {
                    setSelectedUser(member);
                    setSearchParams({ userId: member._id });
                  }}
                  sx={{
                    height: '100%',
                    bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : tokens.surface.card,
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : tokens.surface.border}`,
                    borderRadius: '24px',
                    boxShadow: isDarkMode ? '0 12px 32px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.015)',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: isDarkMode
                        ? '0 20px 48px rgba(93, 26, 137, 0.25)'
                        : '0 20px 40px rgba(93, 26, 137, 0.06)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                      '& .avatar-glow': {
                        transform: 'scale(1.03)',
                      }
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: (member as any).isOnline ? '#10B981' : '#9CA3AF',
                          color: (member as any).isOnline ? '#10B981' : '#9CA3AF',
                          boxShadow: `0 0 0 2px ${isDarkMode ? 'rgba(30, 27, 36, 1)' : '#fff'}`,
                          minWidth: 14,
                          height: 14,
                          borderRadius: '50%',
                        },
                      }}
                    >
                      <Avatar
                        className="avatar-glow"
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F2EEEC',
                          color: isDarkMode ? '#FFFFFF' : '#1A1625',
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {initials}
                      </Avatar>
                    </Badge>

                    <Typography variant="h6" sx={{ fontWeight: 700, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 0.5, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                      {name}
                    </Typography>

                    <Typography variant="body2" sx={{ color: tokens.brand.primaryMuted, fontWeight: 700, fontSize: '0.76rem', mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <WorkIcon sx={{ fontSize: 13 }} />
                      {member.jobTitle || 'Team Representative'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Chip
                        label={member.department || 'Staff'}
                        size="small"
                        sx={{
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          color: tokens.text.secondary,
                          fontWeight: 650,
                          fontSize: '0.68rem',
                          height: 22,
                        }}
                      />
                      <Chip
                        label={member.role === 'admin' ? 'Administrator' : 'Employee'}
                        size="small"
                        sx={{
                          bgcolor: member.role === 'admin' ? 'rgba(255, 127, 17, 0.08)' : 'rgba(93, 26, 137, 0.08)',
                          color: member.role === 'admin' ? tokens.brand.accent : tokens.brand.primary,
                          fontWeight: 750,
                          fontSize: '0.68rem',
                          height: 22,
                        }}
                      />
                    </Box>

                    {/* Quick micro stats box */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        flexWrap: 'wrap',
                        gap: 1,
                        width: '100%',
                        mt: 3,
                        py: 1.25,
                        px: 1,
                        borderRadius: '16px',
                        bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.015)',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.04)'}`,
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tasks</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: tokens.brand.primaryMuted, fontSize: '0.8rem', mt: 0.25 }}>{member.role === 'admin' ? '0' : '1'}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', borderLeft: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`, borderRight: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`, px: 2.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Projects</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: tokens.brand.primaryMuted, fontSize: '0.8rem', mt: 0.25 }}>1</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Meetings</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: tokens.brand.primaryMuted, fontSize: '0.8rem', mt: 0.25 }}>0</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredTeam.map((member) => {
            const initials = `${member.firstName?.charAt(0) || ''}${member.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
            const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;

            return (
              <Box
                key={member._id}
                onClick={() => {
                  setSelectedUser(member);
                  setSearchParams({ userId: member._id });
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : tokens.surface.card,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : tokens.surface.border}`,
                  borderRadius: '16px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.01)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    borderColor: tokens.brand.primaryMuted,
                    bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.05)' : 'rgba(93, 26, 137, 0.02)',
                    boxShadow: isDarkMode
                      ? '0 8px 24px rgba(93, 26, 137, 0.1)'
                      : '0 8px 20px rgba(93, 26, 137, 0.03)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: (member as any).isOnline ? '#10B981' : '#9CA3AF',
                        color: (member as any).isOnline ? '#10B981' : '#9CA3AF',
                        boxShadow: `0 0 0 2px ${isDarkMode ? 'rgba(30, 27, 36, 1)' : '#fff'}`,
                        minWidth: 12,
                        height: 12,
                        borderRadius: '50%',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 46,
                        height: 46,
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F2EEEC',
                        color: isDarkMode ? '#FFFFFF' : '#1A1625',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
                      }}
                    >
                      {initials}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: isDarkMode ? '#fff' : tokens.text.primary,
                        fontSize: '0.96rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: tokens.brand.primaryMuted,
                        fontWeight: 650,
                        fontSize: '0.76rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 0.25,
                      }}
                    >
                      <WorkIcon sx={{ fontSize: 12 }} />
                      {member.jobTitle || 'Team Representative'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Chip
                    label={member.department || 'Staff'}
                    size="small"
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      color: tokens.text.secondary,
                      fontWeight: 650,
                      fontSize: '0.68rem',
                      height: 22,
                    }}
                  />
                  <Chip
                    label={member.role === 'admin' ? 'Administrator' : 'Employee'}
                    size="small"
                    sx={{
                      bgcolor: member.role === 'admin' ? 'rgba(255, 127, 17, 0.08)' : 'rgba(93, 26, 137, 0.08)',
                      color: member.role === 'admin' ? tokens.brand.accent : tokens.brand.primary,
                      fontWeight: 750,
                      fontSize: '0.68rem',
                      height: 22,
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* dialog for Add Team Member (Strict Reference Alignment) */}
      <Dialog
        open={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          handleResetForm();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? '#1c1825' : '#fff',
            backgroundImage: 'none',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : tokens.surface.border}`,
            p: 1.5,
          },
        }}
      >
        <Box component="form" onSubmit={handleAddMember}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, pt: 2, px: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: isDarkMode ? '#fff' : tokens.text.primary, fontFamily: 'system-ui, sans-serif' }}>
              Add Team Member
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                setIsAddOpen(false);
                handleResetForm();
              }}
              sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent
            sx={{
              px: 3,
              py: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              '-ms-overflow-style': 'none',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1.5 }}>

              {/* Row 1: Full Name & Email */}
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 700, fontSize: '0.86rem', color: isDarkMode ? 'rgba(255,255,255,0.85)' : tokens.text.primary }}>
                    Full Name *
                  </Typography>
                  <TextField
                    placeholder="John Doe"
                    required
                    fullWidth
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 700, fontSize: '0.86rem', color: isDarkMode ? 'rgba(255,255,255,0.85)' : tokens.text.primary }}>
                    Email *
                  </Typography>
                  <TextField
                    placeholder="john@leapsofts.com"
                    required
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={inputSx}
                  />
                </Grid>
              </Grid>

              {/* Row 2: Password */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 700, fontSize: '0.86rem', color: isDarkMode ? 'rgba(255,255,255,0.85)' : tokens.text.primary }}>
                  Password *
                </Typography>
                <TextField
                  placeholder="Minimum 8 characters"
                  required
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: 'text.secondary' }}
                        >
                          {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={inputSx}
                />
              </Box>

              {/* Row 3: Job Title & Phone */}
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 700, fontSize: '0.86rem', color: isDarkMode ? 'rgba(255,255,255,0.85)' : tokens.text.primary }}>
                    Job Title *
                  </Typography>
                  <TextField
                    placeholder="Full Stack Developer"
                    required
                    fullWidth
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 700, fontSize: '0.86rem', color: isDarkMode ? 'rgba(255,255,255,0.85)' : tokens.text.primary }}>
                    Phone
                  </Typography>
                  <TextField
                    placeholder="+1 (786) 555-0100"
                    fullWidth
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    sx={inputSx}
                  />
                </Grid>
              </Grid>

              {/* Row 4: Department & Role */}
              <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 700, fontSize: '0.86rem', color: isDarkMode ? 'rgba(255,255,255,0.85)' : tokens.text.primary }}>
                    Department
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      input={
                        <OutlinedInput
                          sx={{
                            borderRadius: '20px',
                            height: 46,
                            bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                            fontSize: '0.88rem',
                            '& fieldset': {
                              borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            },
                          }}
                        />
                      }
                    >
                      <MenuItem value="Leadership">Leadership</MenuItem>
                      <MenuItem value="Engineering">Engineering</MenuItem>
                      <MenuItem value="Product">Product</MenuItem>
                      <MenuItem value="Quality">Quality</MenuItem>
                      <MenuItem value="Marketing">Marketing</MenuItem>
                      <MenuItem value="Design">Design</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 700, fontSize: '0.86rem', color: isDarkMode ? 'rgba(255,255,255,0.85)' : tokens.text.primary }}>
                    Role
                  </Typography>

                  {/* Segmented Toggler (Pill Toggler matching mockup reference) */}
                  <Box
                    sx={{
                      display: 'flex',
                      bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                      borderRadius: '24px',
                      p: 0.5,
                      width: '100%',
                      height: 46,
                      boxSizing: 'border-box',
                    }}
                  >
                    <Box
                      onClick={() => setRoleSelection('user')}
                      sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        bgcolor: roleSelection === 'user' ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent',
                        color: roleSelection === 'user' ? (isDarkMode ? '#1A1625' : '#fff') : tokens.text.secondary,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      Employee
                    </Box>
                    <Box
                      onClick={() => setRoleSelection('admin')}
                      sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        bgcolor: roleSelection === 'admin' ? (isDarkMode ? '#fff' : '#1A1625') : 'transparent',
                        color: roleSelection === 'admin' ? (isDarkMode ? '#1A1625' : '#fff') : tokens.text.secondary,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      Admin
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Row 5: Bio (Scrollable Text Area) */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 700, fontSize: '0.86rem', color: isDarkMode ? 'rgba(255,255,255,0.85)' : tokens.text.primary }}>
                  Bio
                </Typography>
                <TextField
                  placeholder="Enter a brief background, specialties, or bio details..."
                  multiline
                  rows={3}
                  fullWidth
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '20px',
                      bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
                      fontSize: '0.88rem',
                      '& fieldset': {
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </DialogContent>

          {/* Action CTAs */}
          <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={() => {
                setIsAddOpen(false);
                handleResetForm();
              }}
              sx={{
                color: isDarkMode ? 'rgba(255,255,255,0.6)' : tokens.text.secondary,
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'none',
                '&:hover': { bgcolor: 'transparent', color: tokens.brand.primary }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createUserMutation.isPending}
              sx={{
                bgcolor: '#FFA08A', // Coral background matching mockup exactly
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'none',
                borderRadius: '24px',
                px: 4,
                py: 1,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#FF8A6F', // slightly darker coral on hover
                  boxShadow: 'none',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              {createUserMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default TeamPage;
