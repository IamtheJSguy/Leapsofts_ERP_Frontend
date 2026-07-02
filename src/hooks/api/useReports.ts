import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Report } from '@/types';

const reportApi = {
  getReports: (params: Record<string, string>) =>
    api.get<{ data: Report[] }>('/reports', { params }),
  generateReport: (data: Record<string, unknown>) => api.post('/reports/generate', data),
  getReport: (id: string) => api.get<{ data: Report }>(`/reports/${id}`),
  exportReport: ({ id, format }: { id: string; format: string }) =>
    api.get(`/reports/${id}/export?format=${format}`, { responseType: 'blob' }),
  getAdminSummary: (params: Record<string, string>) =>
    api.get('/reports/admin/summary', { params }),
};

export const useReports = (filters: Record<string, string> = {}) =>
  useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportApi.getReports(filters).then((r) => r.data.data),
    staleTime: 1000 * 300,
  });

export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reportApi.generateReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
};

export const useReport = (id: string | undefined) =>
  useQuery({
    queryKey: ['report', id],
    queryFn: () => reportApi.getReport(id!).then((r) => r.data.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll while processing
      if (status === 'pending' || status === 'processing') return 2000;
      return false;
    },
  });

export const useExportReport = () =>
  useMutation({
    mutationFn: reportApi.exportReport,
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${variables.id}.${variables.format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });

export const useAdminSummary = (params: Record<string, string>) =>
  useQuery({
    queryKey: ['adminSummary', params],
    queryFn: () => reportApi.getAdminSummary(params).then((r) => r.data.data),
    enabled: !!params.startDate && !!params.endDate,
  });
