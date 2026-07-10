import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Project, ProjectMember, KanbanBoard, ProjectStatus } from '@/types';

interface ProjectResponse {
  project: Project;
  boards: KanbanBoard[];
}

const projectsApi = {
  getProjects: () => api.get<{ data: Project[] }>('/projects'),
  getProject: (slug: string) => api.get<{ data: ProjectResponse }>(`/projects/${slug}`),
  createProject: (data: { name: string; description?: string; status?: ProjectStatus; tags?: string[] }) =>
    api.post<{ data: Project }>('/projects', data),
  updateProject: ({ slug, data }: { slug: string; data: Partial<Project> }) =>
    api.put<{ data: Project }>(`/projects/${slug}`, data),
  deleteProject: (slug: string) => api.delete(`/projects/${slug}`),

  getMembers: (slug: string) => api.get<{ data: ProjectMember[] }>(`/projects/${slug}/members`),
  addMember: ({ slug, userId, role }: { slug: string; userId: string; role?: string }) =>
    api.post<{ data: Project }>(`/projects/${slug}/members`, { userId, role }),
  removeMember: ({ slug, userId }: { slug: string; userId: string }) =>
    api.delete(`/projects/${slug}/members/${userId}`),

  getBoards: (slug: string) => api.get<{ data: KanbanBoard[] }>(`/projects/${slug}/boards`),
  createBoard: ({ slug, data }: { slug: string; data: { name: string; columns?: { name: string; order: number }[] } }) =>
    api.post<{ data: KanbanBoard }>(`/projects/${slug}/boards`, data),

  getBoardMembers: ({ slug, boardId }: { slug: string; boardId: string }) =>
    api.get<{ data: any[] }>(`/projects/${slug}/boards/${boardId}/members`),
  addBoardMember: ({ slug, boardId, userId, role }: { slug: string; boardId: string; userId: string; role?: string }) =>
    api.post<{ data: any }>(`/projects/${slug}/boards/${boardId}/members`, { userId, role }),
  removeBoardMember: ({ slug, boardId, userId }: { slug: string; boardId: string; userId: string }) =>
    api.delete(`/projects/${slug}/boards/${boardId}/members/${userId}`),
};

export const useProjects = () =>
  useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then((r) => r.data.data),
  });

export const useProject = (slug: string | undefined) =>
  useQuery({
    queryKey: ['project', slug],
    queryFn: () => projectsApi.getProject(slug!).then((r) => r.data.data),
    enabled: !!slug,
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = (slug?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.updateProject,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.slug] });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ['project', slug] });
      }
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useProjectMembers = (slug: string | undefined) =>
  useQuery({
    queryKey: ['projectMembers', slug],
    queryFn: () => projectsApi.getMembers(slug!).then((r) => r.data.data),
    enabled: !!slug,
  });

export const useAddProjectMember = (slug?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.addMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['projectMembers', variables.slug] });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ['project', slug] });
        queryClient.invalidateQueries({ queryKey: ['projectMembers', slug] });
      }
    },
  });
};

export const useRemoveProjectMember = (slug?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.removeMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['projectMembers', variables.slug] });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ['project', slug] });
        queryClient.invalidateQueries({ queryKey: ['projectMembers', slug] });
      }
    },
  });
};

export const useProjectBoards = (slug: string | undefined) =>
  useQuery({
    queryKey: ['projectBoards', slug],
    queryFn: () => projectsApi.getBoards(slug!).then((r) => r.data.data),
    enabled: !!slug,
  });

export const useCreateProjectBoard = (slug?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createBoard,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['projectBoards', variables.slug] });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ['project', slug] });
        queryClient.invalidateQueries({ queryKey: ['projectBoards', slug] });
      }
    },
  });
};

export const useBoardMembers = (slug: string | undefined, boardId: string | undefined) =>
  useQuery({
    queryKey: ['boardMembers', slug, boardId],
    queryFn: () => projectsApi.getBoardMembers({ slug: slug!, boardId: boardId! }).then((r) => r.data.data),
    enabled: !!slug && !!boardId,
  });

export const useAddBoardMember = (slug?: string, boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.addBoardMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boardMembers', variables.slug, variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ['projectBoards', variables.slug] });
      if (slug && boardId) {
        queryClient.invalidateQueries({ queryKey: ['boardMembers', slug, boardId] });
        queryClient.invalidateQueries({ queryKey: ['projectBoards', slug] });
      }
    },
  });
};

export const useRemoveBoardMember = (slug?: string, boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.removeBoardMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boardMembers', variables.slug, variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ['projectBoards', variables.slug] });
      if (slug && boardId) {
        queryClient.invalidateQueries({ queryKey: ['boardMembers', slug, boardId] });
        queryClient.invalidateQueries({ queryKey: ['projectBoards', slug] });
      }
    },
  });
};
