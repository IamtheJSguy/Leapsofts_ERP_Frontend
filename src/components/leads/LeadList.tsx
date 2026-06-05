import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useMemo } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { DataTable } from '@/components/common/DataTable';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/common/EmptyState';
import { LeadForm } from './LeadForm';
import { BulkUploadModal } from './BulkUploadModal';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { ProfileEnrichmentModal } from './ProfileEnrichmentModal';
import { ConnectionStatusCell } from './ConnectionStatusCell';
import { MessageStatusCell } from './MessageStatusCell';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  useLeads,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
} from '@/hooks/api/useLeads';
import { useDebounce } from '@/hooks/useDebounce';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useUIStore } from '@/store/useUIStore';
import type { Lead } from '@/types';
import { getLeadDisplayName } from '@/utils/formatters';
import type { LeadFormData } from '@/utils/validators';

export const LeadList = () => {
  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [qualifyLead, setQualifyLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const { data, isLoading } = useLeads({ page, limit: 50, search: debouncedSearch });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const leads = data?.data || [];

  const columnDefs = useMemo<ColDef<Lead>[]>(
    () => [
      {
        headerName: 'Name',
        valueGetter: (p) => getLeadDisplayName(p.data || {}),
        flex: 1.5,
      },
      { field: 'profile', headerName: 'Profile', flex: 1 },
      { field: 'icp', headerName: 'ICP', flex: 1 },
      { field: 'company', headerName: 'Company', flex: 1 },
      { field: 'email', headerName: 'Email', flex: 1.2 },
      {
        field: 'connectionStatus',
        headerName: 'Connection',
        cellRenderer: (p: ICellRendererParams<Lead>) =>
          p.data ? (
            <ConnectionStatusCell leadId={p.data._id} status={p.data.connectionStatus} />
          ) : null,
        flex: 1.2,
      },
      {
        field: 'messageStatus',
        headerName: 'Message',
        cellRenderer: (p: ICellRendererParams<Lead>) =>
          p.data ? (
            <MessageStatusCell leadId={p.data._id} status={p.data.messageStatus} />
          ) : null,
        flex: 1.2,
      },
      {
        field: 'isQualified',
        headerName: 'Qualified',
        cellRenderer: (p: ICellRendererParams<Lead>) =>
          p.data?.isQualified ? <StatusBadge status="accepted" type="connection" /> : null,
      },
      {
        headerName: 'Actions',
        cellRenderer: (p: ICellRendererParams<Lead>) =>
          p.data ? (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {!p.data.isQualified && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQualifyLead(p.data!);
                  }}
                  aria-label="Qualify lead"
                >
                  <StarIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ) : null,
        flex: 0.8,
      },
    ],
    [],
  );

  const handleFormSubmit = (formData: LeadFormData) => {
    const payload: Partial<Lead> = {
      ...formData,
      connectionStatus: formData.connectionStatus as Lead['connectionStatus'],
      messageStatus: formData.messageStatus as Lead['messageStatus'],
    };
    if (selectedLead) {
      updateLead.mutate(
        { id: selectedLead._id, data: payload },
        {
          onSuccess: () => {
            addToast({ message: 'Lead updated', severity: 'success' });
            setFormOpen(false);
          },
        },
      );
    } else {
      createLead.mutate(payload, {
        onSuccess: () => {
          addToast({ message: 'Lead created', severity: 'success' });
          setFormOpen(false);
        },
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search leads..." />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => setBulkOpen(true)}>
            Bulk Upload
          </Button>
          <Button variant="contained" onClick={() => { setSelectedLead(null); setFormOpen(true); }}>
            Add Lead
          </Button>
        </Box>
      </Box>
      {leads.length === 0 && !isLoading ? (
        <EmptyState title="No leads" actionLabel="Add Lead" onAction={() => setFormOpen(true)} />
      ) : (
        <DataTable
          rowData={leads}
          columnDefs={columnDefs}
          isLoading={isLoading}
          onRowClick={(row) => { setSelectedLead(row); setDetailOpen(true); }}
        />
      )}
      <LeadForm
        open={formOpen}
        lead={selectedLead}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        isPending={createLead.isPending || updateLead.isPending}
      />
      <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <LeadDetailDrawer
        lead={selectedLead}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => { setDetailOpen(false); setFormOpen(true); }}
        onDelete={() => selectedLead && setDeleteId(selectedLead._id)}
      />
      <ProfileEnrichmentModal
        lead={qualifyLead}
        open={!!qualifyLead}
        onClose={() => setQualifyLead(null)}
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Lead"
        message="Are you sure you want to delete this lead?"
        onConfirm={() => {
          if (deleteId) {
            deleteLead.mutate(deleteId, {
              onSuccess: () => {
                addToast({ message: 'Lead deleted', severity: 'success' });
                setDeleteId(null);
                setDetailOpen(false);
              },
            });
          }
        }}
        onCancel={() => setDeleteId(null)}
        isPending={deleteLead.isPending}
      />
    </Box>
  );
};
