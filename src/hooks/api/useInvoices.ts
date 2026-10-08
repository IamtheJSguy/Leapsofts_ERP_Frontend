import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  InvoiceClient,
  InvoiceRecord,
  InvoiceSettings,
  InvoiceStatus,
  SaveInvoicePayload,
} from '@/types/invoice';

export const invoiceKeys = {
  settings: (organizationId?: string) => ['invoice-settings', organizationId] as const,
  clients: (organizationId?: string, includeArchived = false) =>
    ['invoice-clients', organizationId, includeArchived] as const,
  list: (organizationId?: string, status?: string, clientId?: string, issuedFrom?: string, issuedTo?: string) =>
    ['invoices', organizationId, status || 'all', clientId || 'all', issuedFrom || '', issuedTo || ''] as const,
  detail: (organizationId?: string, id?: string) => ['invoice', organizationId, id] as const,
};

const invoiceApi = {
  getSettings: () => api.get<{ data: InvoiceSettings }>('/invoices/settings').then((r) => r.data.data),
  updateSettings: (body: Record<string, unknown>) =>
    api.put<{ data: InvoiceSettings }>('/invoices/settings', body).then((r) => r.data.data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post<{ data: InvoiceSettings }>('/invoices/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },
  testMailbox: () => api.post<{ data: { sent: boolean } }>('/invoices/settings/mailbox/test').then((r) => r.data.data),
  addBank: (body: {
    paymentTitle: string;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    branch?: string;
  }) => api.post<{ data: InvoiceSettings }>('/invoices/settings/banks', body).then((r) => r.data.data),
  listClients: (includeArchived: boolean) =>
    api.get<{ data: InvoiceClient[] }>('/invoices/clients', {
      params: includeArchived ? { includeArchived: 'true' } : undefined,
    }).then((r) => r.data.data),
  createClient: (body: Omit<InvoiceClient, '_id' | 'isArchived'>) =>
    api.post<{ data: InvoiceClient }>('/invoices/clients', body).then((r) => r.data.data),
  updateClient: (id: string, body: Omit<InvoiceClient, '_id' | 'isArchived'>) =>
    api.put<{ data: InvoiceClient }>(`/invoices/clients/${id}`, body).then((r) => r.data.data),
  archiveClient: (id: string) =>
    api.post<{ data: InvoiceClient }>(`/invoices/clients/${id}/archive`).then((r) => r.data.data),
  unarchiveClient: (id: string) =>
    api.post<{ data: InvoiceClient }>(`/invoices/clients/${id}/unarchive`).then((r) => r.data.data),
  list: (status?: InvoiceStatus | 'overdue', clientId?: string, issuedFrom?: string, issuedTo?: string) =>
    api.get<{ data: InvoiceRecord[] }>('/invoices', {
      params: {
        ...(status ? { status } : {}),
        ...(clientId ? { clientId } : {}),
        ...(issuedFrom ? { issuedFrom } : {}),
        ...(issuedTo ? { issuedTo } : {}),
      },
    }).then((r) => r.data.data),
  get: (id: string) => api.get<{ data: InvoiceRecord }>(`/invoices/${id}`).then((r) => r.data.data),
  create: (body: SaveInvoicePayload) =>
    api.post<{ data: InvoiceRecord }>('/invoices', body).then((r) => r.data.data),
  update: (id: string, body: SaveInvoicePayload) =>
    api.put<{ data: InvoiceRecord }>(`/invoices/${id}`, body).then((r) => r.data.data),
  send: (id: string, pdf: Blob) => {
    const form = new FormData();
    form.append('pdf', pdf, 'invoice.pdf');
    return api.post<{ data: InvoiceRecord }>(`/invoices/${id}/send`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },
  sendReminder: (id: string) =>
    api.post<{ data: InvoiceRecord }>(`/invoices/${id}/remind`).then((r) => r.data.data),
  markPaid: (id: string, pdf: Blob) => {
    const form = new FormData();
    form.append('pdf', pdf, 'invoice.pdf');
    return api.post<{ data: InvoiceRecord }>(`/invoices/${id}/mark-paid`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },
  disputeInvoice: (id: string, reason: string) =>
    api.post<{ data: InvoiceRecord }>(`/invoices/${id}/dispute`, { reason }).then((r) => r.data.data),
  download: async (id: string, filename: string) => {
    const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },
};

export const useInvoiceSettings = () => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: invoiceKeys.settings(organizationId),
    queryFn: invoiceApi.getSettings,
    enabled: Boolean(organizationId),
  });
};

export const useInvoiceClients = (includeArchived = false) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: invoiceKeys.clients(organizationId, includeArchived),
    queryFn: () => invoiceApi.listClients(includeArchived),
    enabled: Boolean(organizationId),
  });
};

export const useInvoices = (
  status?: InvoiceStatus | 'overdue',
  clientId?: string,
  issuedFrom?: string,
  issuedTo?: string,
) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: invoiceKeys.list(organizationId, status, clientId, issuedFrom, issuedTo),
    queryFn: () => invoiceApi.list(status, clientId, issuedFrom, issuedTo),
    enabled: Boolean(organizationId) && !(issuedFrom && issuedTo && issuedFrom > issuedTo),
  });
};

export const useInvoice = (id?: string) => {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  return useQuery({
    queryKey: invoiceKeys.detail(organizationId, id),
    queryFn: () => invoiceApi.get(id!),
    enabled: Boolean(organizationId && id),
  });
};

export const useInvoiceMutations = () => {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['invoices', organizationId] });
    await queryClient.invalidateQueries({ queryKey: ['invoice', organizationId] });
    await queryClient.invalidateQueries({ queryKey: invoiceKeys.settings(organizationId) });
    await queryClient.invalidateQueries({ queryKey: ['invoice-clients', organizationId] });
  };

  return {
    updateSettings: useMutation({ mutationFn: invoiceApi.updateSettings, onSuccess: invalidate }),
    uploadLogo: useMutation({ mutationFn: invoiceApi.uploadLogo, onSuccess: invalidate }),
    testMailbox: useMutation({ mutationFn: invoiceApi.testMailbox }),
    addBank: useMutation({ mutationFn: invoiceApi.addBank, onSuccess: invalidate }),
    createClient: useMutation({ mutationFn: invoiceApi.createClient, onSuccess: invalidate }),
    updateClient: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Omit<InvoiceClient, '_id' | 'isArchived'> }) =>
        invoiceApi.updateClient(id, body),
      onSuccess: invalidate,
    }),
    archiveClient: useMutation({ mutationFn: invoiceApi.archiveClient, onSuccess: invalidate }),
    unarchiveClient: useMutation({ mutationFn: invoiceApi.unarchiveClient, onSuccess: invalidate }),
    createInvoice: useMutation({ mutationFn: invoiceApi.create, onSuccess: invalidate }),
    updateInvoice: useMutation({
      mutationFn: ({ id, body }: { id: string; body: SaveInvoicePayload }) => invoiceApi.update(id, body),
      onSuccess: invalidate,
    }),
    sendInvoice: useMutation({
      mutationFn: ({ id, pdf }: { id: string; pdf: Blob }) => invoiceApi.send(id, pdf),
      onSuccess: invalidate,
    }),
    sendReminder: useMutation({
      mutationFn: invoiceApi.sendReminder,
      onSuccess: invalidate,
    }),
    markPaid: useMutation({
      mutationFn: ({ id, pdf }: { id: string; pdf: Blob }) => invoiceApi.markPaid(id, pdf),
      onSuccess: invalidate,
    }),
    disputeInvoice: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) => invoiceApi.disputeInvoice(id, reason),
      onSuccess: invalidate,
    }),
    download: invoiceApi.download,
  };
};

export const checkInvoiceNumberApi = (clientId: string, number: string, excludeInvoiceId?: string) =>
  api.get<{ data: { isDuplicate: boolean } }>('/invoices/check-number', {
    params: { clientId, number, excludeInvoiceId },
  }).then((r) => r.data.data);

export const getNextInvoiceNumberApi = (clientId?: string) =>
  api.get<{ data: { nextInvoiceNumber: string } }>('/invoices/next-number', {
    params: { clientId },
  }).then((r) => r.data.data);
