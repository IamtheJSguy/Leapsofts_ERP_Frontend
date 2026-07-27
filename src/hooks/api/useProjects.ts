import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Project, ProjectMember, KanbanBoard, ProjectStatus } from '@/types';

interface ProjectResponse {
  project: Project;
  boards: KanbanBoard[];
}

const projectsApi = {
  getProjects: () => api.get<{ data: Project[] }>('/projects'),
  getProject: (id: string) => api.get<{ data: ProjectResponse }>(`/projects/${id}`),
  createProject: (data: { name: string; description?: string; status?: ProjectStatus; tags?: string[] }) =>
    api.post<{ data: Project }>('/projects', data),
  updateProject: ({ id, data }: { id: string; data: Partial<Project> }) =>
    api.put<{ data: Project }>(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),

  getMembers: (id: string) => api.get<{ data: ProjectMember[] }>(`/projects/${id}/members`),
  addMember: ({ id, userId, role }: { id: string; userId: string; role?: string }) =>
    api.post<{ data: Project }>(`/projects/${id}/members`, { userId, role }),
  removeMember: ({ id, userId }: { id: string; userId: string }) =>
    api.delete(`/projects/${id}/members/${userId}`),

  getBoards: (id: string) => api.get<{ data: KanbanBoard[] }>(`/projects/${id}/boards`),
  createBoard: ({ id, data }: { id: string; data: { name: string; columns?: { name: string; order: number }[] } }) =>
    api.post<{ data: KanbanBoard }>(`/projects/${id}/boards`, data),

  getBoardMembers: ({ id, boardId }: { id: string; boardId: string }) =>
    api.get<{ data: any[] }>(`/projects/${id}/boards/${boardId}/members`),
  addBoardMember: ({ id, boardId, userId, role }: { id: string; boardId: string; userId: string; role?: string }) =>
    api.post<{ data: any }>(`/projects/${id}/boards/${boardId}/members`, { userId, role }),
  removeBoardMember: ({ id, boardId, userId }: { id: string; boardId: string; userId: string }) =>
    api.delete(`/projects/${id}/boards/${boardId}/members/${userId}`),
};

export const useProjects = () =>
  useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then((r) => r.data.data),
    staleTime: 0,
  });

export const useProject = (id: string | undefined) =>
  useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getProject(id!).then((r) => r.data.data),
    enabled: !!id,
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

export const useUpdateProject = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.updateProject,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['project', id] });
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

export const useProjectMembers = (id: string | undefined) =>
  useQuery({
    queryKey: ['projectMembers', id],
    queryFn: () => projectsApi.getMembers(id!).then((r) => r.data.data),
    enabled: !!id,
  });

export const useAddProjectMember = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.addMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projectMembers', variables.id] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['project', id] });
        queryClient.invalidateQueries({ queryKey: ['projectMembers', id] });
      }
    },
  });
};

export const useRemoveProjectMember = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.removeMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projectMembers', variables.id] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['project', id] });
        queryClient.invalidateQueries({ queryKey: ['projectMembers', id] });
      }
    },
  });
};

export const useProjectBoards = (id: string | undefined) =>
  useQuery({
    queryKey: ['projectBoards', id],
    queryFn: () => projectsApi.getBoards(id!).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateProjectBoard = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createBoard,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projectBoards', variables.id] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['project', id] });
        queryClient.invalidateQueries({ queryKey: ['projectBoards', id] });
      }
    },
  });
};

export const useBoardMembers = (id: string | undefined, boardId: string | undefined) =>
  useQuery({
    queryKey: ['boardMembers', id, boardId],
    queryFn: () => projectsApi.getBoardMembers({ id: id!, boardId: boardId! }).then((r) => r.data.data),
    enabled: !!id && !!boardId,
  });

export const useAddBoardMember = (id?: string, boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.addBoardMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boardMembers', variables.id, variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ['projectBoards', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      if (id && boardId) {
        queryClient.invalidateQueries({ queryKey: ['boardMembers', id, boardId] });
        queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
      }
    },
  });
};

export const useRemoveBoardMember = (id?: string, boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.removeBoardMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boardMembers', variables.id, variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ['projectBoards', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      if (id && boardId) {
        queryClient.invalidateQueries({ queryKey: ['boardMembers', id, boardId] });
        queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
      }
    },
  });
};
