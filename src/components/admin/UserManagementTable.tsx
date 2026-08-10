import { useState } from 'react';
import {
  Box,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  useTheme,
  alpha,
  Avatar,
  Typography,
  TableContainer,
  Paper,
  TextField,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ShieldIcon from '@mui/icons-material/Shield';
import PersonIcon from '@mui/icons-material/Person';
import { useUsers, useDeleteUser } from '@/hooks/api/useUsers';
import { usePermissions } from '@/hooks/usePermissions';
import { getDisplayName } from '@/utils/formatters';
import { RoleAssignmentModal } from './RoleAssignmentModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { tokens } from '@/styles/tokens';
import type { User } from '@/types';

export const UserManagementTable = () => {
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const { canPromoteRoles, canDeactivateUsers } = usePermissions();
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const showActions = canPromoteRoles || canDeactivateUsers;
  
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  if (users.length === 0) {
    return <EmptyState title="No users" description="Create users to manage access." />;
  }

  const filteredUsers = users.filter((user) => {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  return (
    <>
      {/* Unified Command & Control Toolbar (Glassmorphic) */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
          p: 2,
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : 'rgba(255, 255, 255, 0.65)',
          /* backdropFilter: 'blur(20px)' (removed for performance) */
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.7)'}`,
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Title with Count Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: isDarkMode ? '#fff' : tokens.text.primary,
              fontSize: '1.05rem',
              letterSpacing: '-0.015em',
            }}
          >
            Registered Users
          </Typography>
          <Box
            sx={{
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(93, 26, 137, 0.06)',
              color: isDarkMode ? '#fff' : tokens.brand.primary,
              px: 1.5,
              py: 0.4,
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(93, 26, 137, 0.1)'}`,
            }}
          >
            {filteredUsers.length} total
          </Box>
        </Box>

        {/* Search Input Control */}
        <TextField
          size="small"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 320 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'transparent'}`,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              },
              '&:hover fieldset': {
                borderColor: tokens.brand.primaryMuted,
              },
              '&.Mui-focused fieldset': {
                borderColor: tokens.brand.primary,
                borderWidth: '1px',
              },
            },
          }}
        />
      </Box>

      {/* Styled Custom Table Container */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : tokens.surface.border}`,
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
          overflowX: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)',
        }}
      >
        {filteredUsers.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              No users found matching your search.
            </Typography>
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.015)' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, pl: 3 }}>Name</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>Email Address</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>System Role</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>Account Status</TableCell>
                {showActions && (
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, textAlign: 'right', pr: 4 }}>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => {
                const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || '?';
                const isAdminUser = user.role === 'admin';
                const isActive = user.isActive !== false;

                return (
                  <TableRow
                    key={user._id}
                    sx={{
                      transition: 'all 0.2s ease',
                      borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.03)'}`,
                      '&:last-child': { borderBottom: 0 },
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0, 0, 0, 0.005)',
                      },
                    }}
                  >
                    {/* User Name */}
                    <TableCell sx={{ py: 1.75, borderBottom: 0, pl: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F2EEEC',
                            color: isDarkMode ? '#FFFFFF' : '#1A1625',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
                          {getDisplayName(user)}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Email */}
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.86rem', py: 1.75, borderBottom: 0 }}>
                      {user.email}
                    </TableCell>

                    {/* Role Badge */}
                    <TableCell sx={{ py: 1.75, borderBottom: 0 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '10px',
                          bgcolor: isAdminUser ? 'rgba(217, 82, 54, 0.08)' : 'rgba(93, 26, 137, 0.08)',
                          color: isAdminUser ? '#d95236' : tokens.brand.primary,
                          border: `1px solid ${isAdminUser ? 'rgba(217, 82, 54, 0.12)' : 'rgba(93, 26, 137, 0.12)'}`,
                        }}
                      >
                        {isAdminUser ? (
                          <ShieldIcon sx={{ fontSize: 13, color: '#d95236' }} />
                        ) : (
                          <PersonIcon sx={{ fontSize: 13, color: tokens.brand.primary }} />
                        )}
                        <Typography sx={{ fontWeight: 750, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>
                          {user.role}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Status Dot */}
                    <TableCell sx={{ py: 1.75, borderBottom: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: isActive ? tokens.semantic.success : tokens.semantic.neutral,
                          }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.82rem',
                            color: isActive ? tokens.semantic.success : tokens.text.secondary,
                            lineHeight: 1,
                          }}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Actions — admin only */}
                    {showActions && (
                      <TableCell sx={{ py: 1.75, borderBottom: 0, textAlign: 'right', pr: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          {canPromoteRoles && (
                          <IconButton
                            size="small"
                            onClick={() => setRoleUser(user)}
                            aria-label="Edit role"
                            sx={{
                              borderRadius: '10px',
                              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                              color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary,
                              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                color: tokens.brand.primary,
                                borderColor: `color-mix(in srgb, ${tokens.brand.primary} 25%, transparent)`,
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          )}
                          {canDeactivateUsers && (
                          <IconButton
                            size="small"
                            onClick={() => setDeleteId(user._id)}
                            aria-label="Delete user"
                            sx={{
                              borderRadius: '10px',
                              bgcolor: 'rgba(196, 69, 69, 0.05)',
                              color: tokens.semantic.error,
                              border: `1px solid rgba(196, 69, 69, 0.15)`,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: 'rgba(196, 69, 69, 0.1)',
                                borderColor: 'rgba(196, 69, 69, 0.3)',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <RoleAssignmentModal user={roleUser} open={!!roleUser} onClose={() => setRoleUser(null)} />
      <ConfirmDialog
        open={!!deleteId}
        message="Are you sure you want to deactivate this user?"
        onConfirm={() => {
          if (deleteId) deleteUser.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
        onCancel={() => setDeleteId(null)}
        isPending={deleteUser.isPending}
      />
    </>
  );
};
