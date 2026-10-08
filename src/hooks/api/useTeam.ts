import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

import type { UserPermissions } from '@/types';

export interface TeamMember {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
  role: string;
  jobTitle?: string;
  department?: string;
  teamIds?: string[];
  baseOrganizationId?: string;
  organizationId?: string;
  isActive?: boolean;
  permissions?: UserPermissions;
  shiftStart?: string;
  shiftEnd?: string;
  idleTimeoutMinutes?: number;
  monitorScreenshots?: boolean;
  monitorAppUsage?: boolean;
}

export interface Team {
  _id: string;
  name: string;
  managerId: TeamMember;
  members: TeamMember[];
  isActive: boolean;
}

export const useMyTeam = (options?: { enabled?: boolean }) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['teams', 'mine', organizationId],
    queryFn: () => api.get<{ data: Team }>('/teams/mine').then((r) => r.data.data),
    retry: false,
    enabled: options?.enabled,
  });
};

export const useAvailableTeamMembers = (enabled = true, teamId?: string) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['teams', 'mine', 'available-members', organizationId, teamId],
    queryFn: () =>
      api.get<{ data: TeamMember[] }>(teamId ? `/teams/${teamId}/available-members` : '/teams/mine/available-members').then((r) => r.data.data),
    enabled,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<{ data: Team }>('/teams', { name }).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useUpdateTeam = (teamId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.patch<{ data: Team }>(teamId ? `/teams/${teamId}/name` : '/teams/mine', { name }).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useAddTeamMember = (teamId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ data: Team }>(teamId ? `/teams/${teamId}/members` : '/teams/mine/members', { userId }).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'mine', 'available-members'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useRemoveTeamMember = (teamId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<{ data: Team }>(teamId ? `/teams/${teamId}/members/${userId}` : `/teams/mine/members/${userId}`).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'mine', 'available-members'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useMyTeams = (options?: { enabled?: boolean }) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: ['teams', 'mine', 'all', organizationId],
    queryFn: () => api.get<{ data: Team[] }>('/teams/mine/all').then((r) => r.data.data),
    retry: false,
    enabled: options?.enabled,
  });
};
