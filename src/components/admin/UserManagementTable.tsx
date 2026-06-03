import { useState } from 'react';
import {
  Box,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUsers, useDeleteUser } from '@/hooks/api/useUsers';
import { getDisplayName } from '@/utils/formatters';
import { RoleAssignmentModal } from './RoleAssignmentModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { User } from '@/types';

export const UserManagementTable = () => {
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (users.length === 0) {
    return <EmptyState title="No users" description="Create users to manage access." />;
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>{getDisplayName(user)}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip label={user.role} size="small" color={user.role === 'admin' ? 'primary' : 'default'} />
              </TableCell>
              <TableCell>
                <Chip
                  label={user.isActive !== false ? 'Active' : 'Inactive'}
                  size="small"
                  color={user.isActive !== false ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => setRoleUser(user)} aria-label="Edit role">
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => setDeleteId(user._id)} aria-label="Delete user">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
