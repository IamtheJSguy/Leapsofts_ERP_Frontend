import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import type { DriveFile } from '@/types';

export const DRIVE_CONNECTED_EVENT = 'leapsofts-drive-connected';
const DRIVE_RETURN_KEY = 'leapsofts-drive-return';

export const refreshDriveConnection = () => {
  void queryClient.invalidateQueries({ queryKey: ['driveStatus'] });
  void queryClient.invalidateQueries({ queryKey: ['driveFiles'] });
};

/** Open Google consent, then let the original page refresh when the popup finishes. */
export const openDriveOAuthPopup = (url: string) => {
  localStorage.setItem(DRIVE_RETURN_KEY, window.location.pathname + window.location.search);
  const popup = window.open(url, 'leapsofts-drive-oauth', 'width=600,height=700');
  popup?.focus();
  return popup;
};

export const consumeDriveReturnPath = () => {
  const path = localStorage.getItem(DRIVE_RETURN_KEY) || '/chat';
  localStorage.removeItem(DRIVE_RETURN_KEY);
  return path.startsWith('/') ? path : '/chat';
};

const driveApi = {
  getAuthUrl: () => api.get<{ data: { url: string } }>('/drive/auth'),
  getFiles: (params?: { q?: string; pageToken?: string; pageSize?: number }) =>
    api.get<{ data: { files: DriveFile[]; nextPageToken: string | null } }>('/drive/files', { params }),
  getFile: (fileId: string) =>
    api.get<{ data: DriveFile }>(`/drive/files/${fileId}`),
  getStatus: () => api.get<{ data: { connected: boolean } }>('/drive/status'),
  disconnect: () => api.delete<{ data: { connected: boolean } }>('/drive/disconnect'),
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ data: DriveFile }>('/drive/upload', formData, {
      headers: { 'Content-Type': undefined as unknown as string },
    });
  },
};

export const useDriveStatus = () =>
  useQuery({
    queryKey: ['driveStatus'],
    queryFn: () => driveApi.getStatus().then((r) => r.data.data),
  });

export const useDriveFiles = (query?: string, enabled = false) =>
  useQuery({
    queryKey: ['driveFiles', query ?? ''],
    queryFn: () => driveApi.getFiles({ q: query || undefined }).then((r) => r.data.data),
    enabled,
    placeholderData: (previous) => previous,
  });

export const useDriveAuthUrl = () =>
  useMutation({
    mutationFn: () => driveApi.getAuthUrl().then((r) => r.data.data.url),
  });

export const useDriveFile = () =>
  useMutation({
    mutationFn: (fileId: string) => driveApi.getFile(fileId).then((r) => r.data.data),
  });

export const useUploadDriveFile = () =>
  useMutation({
    mutationFn: (file: File) => driveApi.uploadFile(file).then((r) => r.data.data),
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
