import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { useDownloadLeadExport, usePreviewLeadExport } from '@/hooks/api/useLeads';
import { useIcps, useProfiles } from '@/hooks/api/useSettings';
import { useUsers } from '@/hooks/api/useUsers';
import {
  DEFAULT_LEAD_EXPORT_FIELDS,
  LEAD_EXPORT_FIELDS,
  type LeadExportFieldKey,
} from '@/lib/leadExportFields';
import { resolvePermissions } from '@/lib/permissions';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type { LeadExportPreview, LeadExportRequest, LeadFilters, User } from '@/types';

interface ExportLeadsDialogProps {
  open: boolean;
  onClose: () => void;
  filters: LeadFilters;
}

interface ExportFilterDraft {
  search: string;
  assignedTo: string;
  icp: string;
  profile: string;
  connection: string;
  message: string;
  futureLeadWindow: string;
  followUpCount: string;
  startDate: string;
  endDate: string;
  dateField: 'date' | 'updatedAt';
}

const emptyDraft = (): ExportFilterDraft => ({
  search: '',
  assignedTo: '',
  icp: '',
  profile: '',
  connection: '',
  message: 'All statuses',
  futureLeadWindow: '',
  followUpCount: '',
  startDate: '',
  endDate: '',
  dateField: 'date',
});

const draftFromFilters = (filters: LeadFilters): ExportFilterDraft => ({
  search: filters.search ?? '',
  assignedTo: filters.assignedTo ?? '',
  icp: filters.icp ?? '',
  profile: filters.profile ?? '',
  connection: filters.connectionSent ? 'sent_bucket' : (filters.connectionStatus ?? ''),
  message: filters.messageStatus || 'All statuses',
  futureLeadWindow: filters.futureLeadWindow ?? '',
  followUpCount: filters.followUpCount ? String(filters.followUpCount) : '',
  startDate: filters.startDate ?? '',
  endDate: filters.endDate ?? '',
  dateField: filters.dateField ?? 'date',
});

const filtersFromDraft = (draft: ExportFilterDraft): LeadFilters => {
  const filters: LeadFilters = { dateField: draft.dateField };
  const search = draft.search.trim();
  if (search) filters.search = search;
  if (draft.assignedTo) filters.assignedTo = draft.assignedTo;
  if (draft.icp) filters.icp = draft.icp;
  if (draft.profile) filters.profile = draft.profile;
  if (draft.startDate) filters.startDate = draft.startDate;
  if (draft.endDate) filters.endDate = draft.endDate;
  if (draft.futureLeadWindow) {
    filters.futureLeadWindow = draft.futureLeadWindow as LeadFilters['futureLeadWindow'];
  }
  if (draft.followUpCount === '1' || draft.followUpCount === '2') {
    filters.followUpCount = Number(draft.followUpCount);
  }
  if (draft.connection === 'sent_bucket') filters.connectionSent = true;
  else if (draft.connection) filters.connectionStatus = draft.connection;
  if (draft.message && draft.message !== 'All statuses') filters.messageStatus = draft.message;
  return filters;
};

const exportErrorMessage = async (error: unknown): Promise<string> => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { error?: { message?: string } };
      if (parsed.error?.message) return parsed.error.message;
    } catch {
      return 'Export failed';
    }
  }
  const message = (data as { error?: { message?: string } } | undefined)?.error?.message;
  return message || 'Export failed';
};

const orderedFields = (selected: LeadExportFieldKey[]): LeadExportFieldKey[] =>
  LEAD_EXPORT_FIELDS.filter((field) => selected.includes(field.key)).map((field) => field.key);

const userLabel = (user: User) =>
  [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

export const ExportLeadsDialog = ({ open, onClose, filters }: ExportLeadsDialogProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((state) => state.addToast);
  const previewExport = usePreviewLeadExport();
  const previewRef = useRef<HTMLDivElement>(null);
  const downloadExport = useDownloadLeadExport();
  const { data: usersData } = useUsers(undefined, { enabled: open });
  const { data: icpsData } = useIcps();
  const { data: profilesData } = useProfiles();

  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [draft, setDraft] = useState<ExportFilterDraft>(emptyDraft);
  const [selected, setSelected] = useState<LeadExportFieldKey[]>(DEFAULT_LEAD_EXPORT_FIELDS);
  const [preview, setPreview] = useState<LeadExportPreview | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const users = useMemo(
    () =>
      (usersData ?? []).filter((user) => {
        if (user.role === 'admin') return true;
        return resolvePermissions(user.role, user.department, user.permissions).viewSalesPage;
      }),
    [usersData],
  );
  const icps = icpsData ?? [];
  const profiles = profilesData ?? [];

  const request = useMemo<LeadExportRequest>(
    () => ({
      scope,
      fields: orderedFields(selected),
      ...(scope === 'filtered' ? { filters: filtersFromDraft(draft) } : {}),
    }),
    [scope, selected, draft],
  );

  const requestKey = JSON.stringify(request);
  const previewIsCurrent = Boolean(preview) && previewKey === requestKey;

  useEffect(() => {
    if (!open) return;
    setScope('filtered');
    setDraft(draftFromFilters(filters));
    setSelected(DEFAULT_LEAD_EXPORT_FIELDS);
    setPreview(null);
    setPreviewKey(null);
    // Seed once per open from the filters on screen. Later edits stay in the dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const patchDraft = (patch: Partial<ExportFilterDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const toggleField = (key: LeadExportFieldKey) => {
    setSelected((current) =>
      current.includes(key) ? current.filter((field) => field !== key) : [...current, key],
    );
  };

  const handlePreview = async () => {
    try {
      const result = await previewExport.mutateAsync(request);
      setPreview(result);
      setPreviewKey(requestKey);
    } catch (error) {
      addToast({ message: await exportErrorMessage(error), severity: 'error' });
    }
  };

  useLayoutEffect(() => {
    const node = previewRef.current;
    if (!preview || !previewIsCurrent || !node) return;
    const container = node.closest('.MuiDialogContent-root');
    if (!(container instanceof HTMLElement)) return;
    const top =
      node.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTop = Math.max(0, top - 8);
  }, [preview, previewIsCurrent]);

  const handleDownload = async () => {
    if (!previewIsCurrent) return;
    try {
      await downloadExport.mutateAsync(request);
    } catch (error) {
      addToast({ message: await exportErrorMessage(error), severity: 'error' });
    }
  };

  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const showingCount = preview ? Math.min(preview.rows.length, preview.total) : 0;
  const selectedUser = users.find((user) => user._id === draft.assignedTo) ?? null;
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      minHeight: 40,
      fontSize: '0.84rem',
    },
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Export leads</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Filters start from the Sales page. Change them here, choose columns, then preview the sheet.
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Leads
        </Typography>
        <RadioGroup
          row
          value={scope}
          onChange={(event) => setScope(event.target.value as 'filtered' | 'all')}
          sx={{ mb: 2 }}
        >
          <FormControlLabel value="filtered" control={<Radio size="small" />} label="Matching filters" />
          <FormControlLabel value="all" control={<Radio size="small" />} label="All leads" />
        </RadioGroup>

        {scope === 'filtered' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              mb: 2,
            }}
          >
            <TextField
              size="small"
              label="Search"
              placeholder="Name, company, headline"
              value={draft.search}
              onChange={(event) => patchDraft({ search: event.target.value })}
              sx={{ ...fieldSx, gridColumn: { sm: '1 / -1' } }}
            />
            <Autocomplete
              options={users}
              getOptionLabel={(user) => userLabel(user)}
              value={selectedUser}
              onChange={(_event, user) => patchDraft({ assignedTo: user?._id ?? '' })}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              renderInput={(params) => <TextField {...params} size="small" label="Assigned agent" sx={fieldSx} />}
            />
            <Autocomplete
              options={icps.map((icp) => icp.name)}
              value={draft.icp || null}
              onChange={(_event, value) => patchDraft({ icp: value ?? '' })}
              renderInput={(params) => <TextField {...params} size="small" label="Campaign (ICP)" sx={fieldSx} />}
            />
            <Autocomplete
              options={profiles.map((profile) => profile.name)}
              value={draft.profile || null}
              onChange={(_event, value) => patchDraft({ profile: value ?? '' })}
              renderInput={(params) => <TextField {...params} size="small" label="Profile" sx={fieldSx} />}
            />
            <FormControl size="small" sx={fieldSx}>
              <Select
                value={draft.connection}
                displayEmpty
                onChange={(event) => patchDraft({ connection: event.target.value })}
                input={<OutlinedInput />}
                aria-label="Connection status"
              >
                <MenuItem value="">All connection statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="sent_bucket">Sent, accepted, or declined</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="declined">Declined</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={fieldSx}>
              <Select
                value={draft.message}
                onChange={(event) => {
                  const message = event.target.value;
                  patchDraft({
                    message,
                    ...(message !== 'All statuses' && message !== 'future_lead' ? { futureLeadWindow: '' } : {}),
                  });
                }}
                input={<OutlinedInput />}
                aria-label="Message status"
              >
                <MenuItem value="All statuses">All message statuses</MenuItem>
                <MenuItem value="not_sent">Not Sent</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="in_conversation">In Conversation</MenuItem>
                <MenuItem value="replied">Replied</MenuItem>
                <MenuItem value="follow_up">Follow Up</MenuItem>
                <MenuItem value="negative">Negative</MenuItem>
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="future_lead">Future Lead</MenuItem>
                <MenuItem value="invalid_lead">Invalid Lead</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={fieldSx}>
              <Select
                value={draft.futureLeadWindow}
                displayEmpty
                onChange={(event) => {
                  const futureLeadWindow = event.target.value;
                  patchDraft({
                    futureLeadWindow,
                    ...(futureLeadWindow ? { message: 'All statuses' } : {}),
                  });
                }}
                input={<OutlinedInput />}
                aria-label="Future lead window"
              >
                <MenuItem value="">All future windows</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="due">Due today</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="due_soon">Due soon (3 days)</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={fieldSx}>
              <Select
                value={draft.followUpCount}
                displayEmpty
                onChange={(event) => patchDraft({ followUpCount: event.target.value })}
                input={<OutlinedInput />}
                aria-label="Follow-up count"
              >
                <MenuItem value="">All follow-ups</MenuItem>
                <MenuItem value="1">Follow-up #1</MenuItem>
                <MenuItem value="2">Follow-up #2</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={fieldSx}>
              <Select
                value={draft.dateField}
                onChange={(event) => patchDraft({ dateField: event.target.value as 'date' | 'updatedAt' })}
                input={<OutlinedInput />}
                aria-label="Export date filter"
              >
                <MenuItem value="date">Filter by creation</MenuItem>
                <MenuItem value="updatedAt">Filter by update</MenuItem>
              </Select>
            </FormControl>
            <DateRangePicker
              startDate={draft.startDate}
              endDate={draft.endDate}
              onStartChange={(startDate) => patchDraft({ startDate })}
              onEndChange={(endDate) => patchDraft({ endDate })}
              size="small"
              layout="compact"
              maxDate={new Date()}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Columns
          </Typography>
          <Box>
            <Button
              size="small"
              onClick={() => setSelected(LEAD_EXPORT_FIELDS.map((field) => field.key))}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Select all
            </Button>
            <Button
              size="small"
              onClick={() => setSelected([])}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Clear
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            mb: 2,
          }}
        >
          {LEAD_EXPORT_FIELDS.map((field) => (
            <FormControlLabel
              key={field.key}
              control={
                <Checkbox
                  size="small"
                  checked={selected.includes(field.key)}
                  onChange={() => toggleField(field.key)}
                />
              }
              label={<Typography variant="body2">{field.label}</Typography>}
            />
          ))}
        </Box>

        {preview && previewIsCurrent && (
          <Box ref={previewRef}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
              {preview.total === 0
                ? 'No leads match this export'
                : `Showing ${showingCount} of ${preview.total}`}
            </Typography>
            {preview.rows.length > 0 && (
              <TableContainer
                sx={{
                  maxHeight: 280,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '12px',
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {preview.columns.map((column) => (
                        <TableCell
                          key={column.key}
                          sx={{ fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'background.paper' }}
                        >
                          {column.header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.rows.map((row, index) => (
                      <TableRow key={index}>
                        {preview.columns.map((column) => (
                          <TableCell key={column.key} sx={{ whiteSpace: 'nowrap' }}>
                            {row[column.header] || '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {preview && !previewIsCurrent && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Preview is out of date. Preview again before downloading.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '20px' }}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          onClick={() => { void handlePreview(); }}
          disabled={selected.length === 0 || previewExport.isPending || downloadExport.isPending}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '20px' }}
        >
          {previewExport.isPending ? <CircularProgress size={16} /> : 'Preview'}
        </Button>
        <Button
          variant="contained"
          startIcon={
            downloadExport.isPending
              ? <CircularProgress size={16} color="inherit" />
              : <FileDownloadOutlinedIcon />
          }
          onClick={() => { void handleDownload(); }}
          disabled={!previewIsCurrent || selected.length === 0 || downloadExport.isPending}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '20px',
            bgcolor: tokens.brand.primary,
            '&:hover': { bgcolor: tokens.brand.primaryLight },
          }}
        >
          Download Excel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
