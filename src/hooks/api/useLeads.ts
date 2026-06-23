import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Lead, LeadFilters, PaginatedResponse, ValidationResult } from '@/types';

const leadApi = {
  getLeads: (params: LeadFilters) =>
    api.get<PaginatedResponse<Lead>>('/leads', { params }),
  getLead: (id: string) => api.get<{ data: Lead }>(`/leads/${id}`),
  createLead: (data: Partial<Lead>) => api.post('/leads', data),
  updateLead: ({ id, data }: { id: string; data: Partial<Lead> }) =>
    api.put(`/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/leads/${id}`),
  bulkUpload: (formData: FormData) =>
    api.post('/leads/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  validateLeads: (data: { leads: Partial<Lead>[] }) =>
    api.post<{ data: ValidationResult }>('/leads/validate', data),
  qualifyLead: ({ id, boardId }: { id: string; boardId?: string }) =>
    api.post(`/leads/${id}/qualify`, boardId ? { boardId } : {}),
  getLeadHistory: (id: string) => api.get(`/leads/${id}/history`),
};

export const useLeads = (filters: LeadFilters = {}) =>
  useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadApi.getLeads(filters).then((r) => r.data),
    staleTime: 1000 * 60,
  });

export const useLead = (id: string | undefined) =>
  useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadApi.getLead(id!).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.updateLead,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useBulkUpload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.bulkUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useValidateLeads = () =>
  useMutation({
    mutationFn: leadApi.validateLeads,
  });

export const useQualifyLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadApi.qualifyLead,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useLeadHistory = (id: string | undefined) =>
  useQuery({
    queryKey: ['leadHistory', id],
    queryFn: () => leadApi.getLeadHistory(id!).then((r) => r.data.data),
    enabled: !!id,
  });
