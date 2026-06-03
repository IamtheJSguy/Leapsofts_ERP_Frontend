import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import type { LeadValidationResult } from '@/types';

type ValidationError = LeadValidationResult['errors'][number];

interface ValidationGateProps {
  open: boolean;
  result: LeadValidationResult | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export const ValidationGate = ({
  open,
  result,
  onConfirm,
  onCancel,
  isPending,
}: ValidationGateProps) => {
  if (!result) return null;

  return (
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogTitle>Validate contact list</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          New: {result.new.length} | Modified: {result.modified.length} | Duplicates:{' '}
          {result.duplicates.length} | Errors: {result.errors.length}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Are you sure the contact list is correct?
        </Typography>
        {result.errors.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Row</TableCell>
                <TableCell>Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.errors.map((e: ValidationError) => (
                <TableRow key={e.row}>
                  <TableCell>{e.row}</TableCell>
                  <TableCell>{e.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm} disabled={isPending}>
          Confirm upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};
