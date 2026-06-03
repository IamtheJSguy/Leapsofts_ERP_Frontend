import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';

const driveApi = {
  getAuthUrl: () => api.get<{ data: { url: string } }>('/drive/auth'),
  getFiles: () => api.get<{ data: unknown[] }>('/drive/files'),
  shareFile: (data: { fileId: string; conversationId: string }) =>
    api.post('/drive/share', data),
  getStatus: () => api.get<{ data: { connected: boolean } }>('/drive/status'),
};

export const useDriveStatus = () =>
  useQuery({
    queryKey: ['driveStatus'],
    queryFn: () => driveApi.getStatus().then((r) => r.data.data),
  });

export const useDriveFiles = () =>
  useQuery({
    queryKey: ['driveFiles'],
    queryFn: () => driveApi.getFiles().then((r) => r.data.data),
    enabled: false,
  });

export const useDriveAuthUrl = () =>
  useMutation({
    mutationFn: () => driveApi.getAuthUrl().then((r) => r.data.data.url),
  });

export const useShareDriveFile = () =>
  useMutation({
    mutationFn: driveApi.shareFile,
  });
