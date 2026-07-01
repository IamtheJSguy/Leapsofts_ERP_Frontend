import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { DriveFile } from '@/types';

const driveApi = {
  getAuthUrl: () => api.get<{ data: { url: string } }>('/drive/auth'),
  getFiles: (params?: { q?: string; pageToken?: string; pageSize?: number }) =>
    api.get<{ data: { files: DriveFile[]; nextPageToken: string | null } }>('/drive/files', { params }),
  getFile: (fileId: string) =>
    api.get<{ data: DriveFile }>(`/drive/files/${fileId}`),
  getStatus: () => api.get<{ data: { connected: boolean } }>('/drive/status'),
  disconnect: () => api.delete<{ data: { connected: boolean } }>('/drive/disconnect'),
};

export const useDriveStatus = () =>
  useQuery({
    queryKey: ['driveStatus'],
    queryFn: () => driveApi.getStatus().then((r) => r.data.data),
  });

export const useDriveFiles = (query?: string) =>
  useQuery({
    queryKey: ['driveFiles', query],
    queryFn: () => driveApi.getFiles({ q: query || undefined }).then((r) => r.data.data),
    enabled: false,
  });

export const useDriveAuthUrl = () =>
  useMutation({
    mutationFn: () => driveApi.getAuthUrl().then((r) => r.data.data.url),
  });

export const useDriveFile = () =>
  useMutation({
    mutationFn: (fileId: string) => driveApi.getFile(fileId).then((r) => r.data.data),
  });

export const useDisconnectDrive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => driveApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driveStatus'] });
      queryClient.invalidateQueries({ queryKey: ['driveFiles'] });
    },
  });
};
