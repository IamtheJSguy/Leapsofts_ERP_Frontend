import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Alert,
} from '@mui/material';
import * as XLSX from 'xlsx';
import { FileUploader } from '@/components/common/FileUploader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useValidateLeads, useBulkUpload } from '@/hooks/api/useLeads';
import { useUIStore } from '@/store/useUIStore';
import type { Lead, ValidationResult } from '@/types';

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export const BulkUploadModal = ({ open, onClose }: BulkUploadModalProps) => {
  const [parsedLeads, setParsedLeads] = useState<Partial<Lead>[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress] = useState(0);
  const validateLeads = useValidateLeads();
  const bulkUpload = useBulkUpload();
  const addToast = useUIStore((s) => s.addToast);

  const parseFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Partial<Lead>>(sheet);
    setParsedLeads(rows);
    validateLeads.mutate(
      { leads: rows },
      {
        onSuccess: (res) => setValidation(res.data.data),
        onError: () => addToast({ message: 'Validation failed', severity: 'error' }),
      },
    );
  };

  const handleUpload = () => {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(parsedLeads)], { type: 'application/json' });
    formData.append('leads', blob, 'leads.json');
    bulkUpload.mutate(formData, {
      onSuccess: () => {
        addToast({ message: 'Bulk upload started', severity: 'success' });
        onClose();
        setConfirmOpen(false);
      },
      onError: () => addToast({ message: 'Upload failed', severity: 'error' }),
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Bulk Upload Leads</DialogTitle>
        <DialogContent>
          <FileUploader
            onFileSelect={parseFile}
            isUploading={bulkUpload.isPending}
            progress={progress}
          />
          {validation && (
            <>
              <Alert severity="info" sx={{ mt: 2 }}>
                New: {validation.newLeads?.length || 0} | Modified:{' '}
                {validation.modifiedLeads?.length || 0} | Duplicates:{' '}
                {validation.duplicates?.length || 0}
              </Alert>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Preview (first 10 rows)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Company</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedLeads.slice(0, 10).map((lead, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {[lead.firstName, lead.lastName].filter(Boolean).join(' ')}
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!validation || parsedLeads.length === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Confirm Upload
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Upload"
        message="Are you sure the contact list is correct?"
        onConfirm={handleUpload}
        onCancel={() => setConfirmOpen(false)}
        isPending={bulkUpload.isPending}
      />
    </>
  );
};
