import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface TeamMember {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  jobTitle?: string;
  department?: string;
  teamId?: string;
  isActive?: boolean;
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

export const useMyTeam = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['teams', 'mine'],
    queryFn: () => api.get<{ data: Team }>('/teams/mine').then((r) => r.data.data),
    retry: false,
    enabled: options?.enabled,
  });

export const useAvailableTeamMembers = (enabled = true) =>
  useQuery({
    queryKey: ['teams', 'mine', 'available-members'],
    queryFn: () =>
      api.get<{ data: TeamMember[] }>('/teams/mine/available-members').then((r) => r.data.data),
    enabled,
  });

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<{ data: Team }>('/teams', { name }).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams', 'mine'] }),
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.patch<{ data: Team }>('/teams/mine', { name }).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams', 'mine'] }),
  });
};

export const useAddTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ data: Team }>('/teams/mine/members', { userId }).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'mine', 'available-members'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<{ data: Team }>(`/teams/mine/members/${userId}`).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'mine', 'available-members'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
