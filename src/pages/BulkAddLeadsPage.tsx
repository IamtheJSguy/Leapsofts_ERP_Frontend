import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import { nativeFieldStyle } from '@/components/leads/nativeFieldStyles';
import { useBulkCreateLeads } from '@/hooks/api/useLeads';
import { useIcps, useProfiles } from '@/hooks/api/useSettings';
import { useAuth } from '@/hooks/useAuth';
import {
  clearBulkAddLeadsDraft,
  loadBulkAddLeadsDraft,
  saveBulkAddLeadsDraft,
} from '@/lib/bulkAddLeadsDraftDb';
import {
  downloadBulkAddSampleCsv,
  parseBulkAddLeadsFile,
} from '@/lib/bulkAddLeadsCsv';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type { ConnectionStatus, Lead, LeadComment, MessageStatus } from '@/types';
import { splitProspectName } from '@/utils/formatters';
import { LeadCommentButton } from '@/components/leads/LeadCommentButton';

const INITIAL_ROWS = 100;
const GROW_BY = 20;
const GROW_THRESHOLD = 5;
const DRAFT_SAVE_DEBOUNCE_MS = 1000; // 1 second

type BulkLeadRow = {
  prospectName: string;
  email: string;
  icp: string;
  profile: string;
  connectionStatus: ConnectionStatus | '';
  messageStatus: MessageStatus | '';
  linkedinMsg: string;
  futureLeadDate?: string;
  leadComment?: LeadComment | null;
};

type RowErrors = Record<string, boolean>;

type OptionItem = { _id: string; name: string };

const EMPTY_ERRORS: RowErrors = {};

const createEmptyRow = (): BulkLeadRow => ({
  prospectName: '',
  email: '',
  icp: '',
  profile: '',
  connectionStatus: 'pending',
  messageStatus: 'not_sent',
  linkedinMsg: 'not_sent',
  futureLeadDate: undefined,
});

const isRowEmpty = (row: BulkLeadRow) =>
  !row.prospectName.trim() &&
  !row.email.trim() &&
  !row.icp.trim() &&
  !row.profile.trim();

const createInitialRows = (count = INITIAL_ROWS): BulkLeadRow[] =>
  Array.from({ length: count }, () => createEmptyRow());

const normalizeDraftRows = (raw: unknown): BulkLeadRow[] | null => {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const rows = raw.map((item) => {
    const row = (item && typeof item === 'object' ? item : {}) as Partial<BulkLeadRow> & {
      firstName?: string;
      lastName?: string;
    };
    const prospectName =
      typeof row.prospectName === 'string' && row.prospectName
        ? row.prospectName
        : [row.firstName, row.lastName].filter(Boolean).join(' ');
    return {
      prospectName,
      email: typeof row.email === 'string' ? row.email : '',
      icp: typeof row.icp === 'string' ? row.icp : '',
      profile: typeof row.profile === 'string' ? row.profile : '',
      connectionStatus: (row.connectionStatus ?? 'pending') as ConnectionStatus | '',
      messageStatus: (row.messageStatus ?? 'not_sent') as MessageStatus | '',
      linkedinMsg:
        typeof row.linkedinMsg === 'string'
          ? row.linkedinMsg
          : String(row.messageStatus || ''),
      futureLeadDate:
        typeof row.futureLeadDate === 'string' && row.futureLeadDate
          ? row.futureLeadDate
          : undefined,
      leadComment:
        row.leadComment && typeof row.leadComment === 'object'
          ? (row.leadComment as LeadComment)
          : undefined,
    };
  });

  if (rows.length < INITIAL_ROWS) {
    return [...rows, ...createInitialRows(INITIAL_ROWS - rows.length)];
  }
  return rows;
};

const validateRow = (row: BulkLeadRow): RowErrors => {
  const errors: RowErrors = {};
  if (!row.prospectName.trim()) errors.prospectName = true;
  if (!row.icp.trim()) errors.icp = true;
  if (!row.profile.trim()) errors.profile = true;
  if (row.messageStatus === 'future_lead' && !row.futureLeadDate) {
    errors.futureLeadDate = true;
  }
  if (row.messageStatus === 'invalid_lead' && !row.leadComment?.text?.trim()) {
    errors.leadComment = true;
  }
  return errors;
};

const BulkLeadRowView = memo(function BulkLeadRowView({
  index,
  row,
  errors,
  isDarkMode,
  borderColor,
  agentName,
  icpsList,
  profileUsersList,
  onUpdate,
}: {
  index: number;
  row: BulkLeadRow;
  errors: RowErrors;
  isDarkMode: boolean;
  borderColor: string;
  agentName: string;
  icpsList: OptionItem[];
  profileUsersList: OptionItem[];
  onUpdate: (index: number, patch: Partial<BulkLeadRow>) => void;
}) {
  const hasError = Object.keys(errors).length > 0;
  const [promptInvalidComment, setPromptInvalidComment] = useState(false);

  return (
    <tr
      id={`bulk-lead-row-${index}`}
      style={{
        background: hasError
          ? isDarkMode
            ? 'rgba(198,40,40,0.08)'
            : 'rgba(198,40,40,0.04)'
          : 'transparent',
      }}
    >
      <td
        style={{
          width: 48,
          color: isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
          fontWeight: 700,
          fontSize: '0.75rem',
          borderBottom: `1px solid ${borderColor}`,
          verticalAlign: 'top',
          padding: '12px 10px',
        }}
      >
        {index + 1}
      </td>
      <td style={{ borderBottom: `1px solid ${borderColor}`, padding: '10px', verticalAlign: 'top' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <input
              placeholder="Prospect Name *"
              value={row.prospectName}
              onChange={(e) => onUpdate(index, { prospectName: e.target.value })}
              style={nativeFieldStyle(isDarkMode, !!errors.prospectName)}
            />
            <input
              placeholder="Email"
              value={row.email}
              onChange={(e) => onUpdate(index, { email: e.target.value })}
              style={nativeFieldStyle(isDarkMode)}
            />
          </div>
          <LeadCommentButton
            comment={row.leadComment}
            onSave={(comment) => onUpdate(index, { leadComment: comment })}
            promptOpen={promptInvalidComment}
            onPromptHandled={() => setPromptInvalidComment(false)}
            requireReason={row.messageStatus === 'invalid_lead'}
          />
        </div>
      </td>
      <td
        style={{
          borderBottom: `1px solid ${borderColor}`,
          padding: '10px',
          verticalAlign: 'top',
          minWidth: 180,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select
            value={row.icp}
            onChange={(e) => onUpdate(index, { icp: e.target.value })}
            style={nativeFieldStyle(isDarkMode, !!errors.icp)}
          >
            <option value="">ICP *</option>
            {icpsList.map((icp) => (
              <option key={icp._id} value={icp.name}>
                {icp.name}
              </option>
            ))}
          </select>
          <select
            value={row.profile}
            onChange={(e) => onUpdate(index, { profile: e.target.value })}
            style={nativeFieldStyle(isDarkMode, !!errors.profile)}
          >
            <option value="">Profile *</option>
            {profileUsersList.map((p) => (
              <option key={p._id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </td>
      <td
        style={{
          borderBottom: `1px solid ${borderColor}`,
          padding: '10px',
          verticalAlign: 'top',
          minWidth: 150,
        }}
      >
        <select
          value={row.connectionStatus}
          onChange={(e) =>
            onUpdate(index, {
              connectionStatus: e.target.value as ConnectionStatus | '',
            })
          }
          style={nativeFieldStyle(isDarkMode)}
        >
          <option value="">Connection</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="no_response">No Response</option>
        </select>
      </td>
      <td
        style={{
          borderBottom: `1px solid ${borderColor}`,
          padding: '10px',
          verticalAlign: 'top',
          minWidth: 170,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select
            value={row.messageStatus}
            onChange={(e) => {
              const messageStatus = e.target.value as MessageStatus | '';
              onUpdate(index, {
                messageStatus,
                linkedinMsg: messageStatus,
                ...(messageStatus !== 'future_lead' ? { futureLeadDate: undefined } : {}),
              });
              if (messageStatus === 'invalid_lead') {
                setPromptInvalidComment(true);
              }
            }}
            style={nativeFieldStyle(isDarkMode)}
          >
            <option value="">Message</option>
            <option value="not_sent">Not Sent</option>
            <option value="sent">Sent</option>
            <option value="replied">Replied</option>
            <option value="follow_up">Follow Up</option>
            <option value="negative">Negative</option>
            <option value="positive">Positive</option>
            <option value="future_lead">Future Lead</option>
            <option value="invalid_lead">Invalid Lead</option>
          </select>
          {row.messageStatus === 'future_lead' && (
            <input
              type="date"
              aria-label="Reactivate on"
              value={row.futureLeadDate || ''}
              onChange={(e) =>
                onUpdate(index, {
                  futureLeadDate: e.target.value || undefined,
                })
              }
              style={nativeFieldStyle(isDarkMode, !!errors.futureLeadDate)}
            />
          )}
        </div>
      </td>
      <td
        style={{
          borderBottom: `1px solid ${borderColor}`,
          padding: '10px',
          verticalAlign: 'top',
          minWidth: 120,
          color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)',
          fontWeight: 600,
          fontSize: '0.85rem',
        }}
      >
        {agentName}
      </td>
    </tr>
  );
});

export const BulkAddLeadsPage = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';
  const { user } = useAuth();
  const userId = user?._id || '';
  const addToast = useUIStore((s) => s.addToast);
  const bulkCreate = useBulkCreateLeads();

  const { data: icpsData } = useIcps();
  const icpsList = icpsData || [];
  const { data: profilesData } = useProfiles();
  const profileUsersList = profilesData || [];

  const [rows, setRows] = useState<BulkLeadRow[]>(() => createInitialRows());
  const [rowErrors, setRowErrors] = useState<Record<number, RowErrors>>({});
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistEnabledRef = useRef(true);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const filledCount = useMemo(
    () => rows.reduce((count, row) => count + (isRowEmpty(row) ? 0 : 1), 0),
    [rows],
  );

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!userId) {
        setDraftReady(false);
        return;
      }

      setDraftReady(false);
      try {
        const draft = await loadBulkAddLeadsDraft(userId);
        if (cancelled) return;
        const restored = draft ? normalizeDraftRows(draft.rows) : null;
        if (restored) {
          setRows(restored);
          setDraftRestored(restored.some((row) => !isRowEmpty(row)));
        } else {
          setRows(createInitialRows());
          setDraftRestored(false);
        }
      } catch {
        if (!cancelled) {
          setRows(createInitialRows());
          setDraftRestored(false);
        }
      } finally {
        if (!cancelled) setDraftReady(true);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!draftReady || !userId || !persistEnabledRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!persistEnabledRef.current) return;
      setDraftSaving(true);
      const hasData = rows.some((row) => !isRowEmpty(row));
      const persist = hasData
        ? saveBulkAddLeadsDraft(userId, rows)
        : clearBulkAddLeadsDraft(userId);

      void persist
        .then(() => {
          if (persistEnabledRef.current) setDraftRestored(hasData);
        })
        .catch(() => {
          // Keep editing even if local persistence fails.
        })
        .finally(() => {
          setDraftSaving(false);
        });
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [rows, draftReady, userId]);

  const ensureRows = useCallback((index: number) => {
    setRows((prev) => {
      if (index < prev.length - GROW_THRESHOLD) return prev;
      return [...prev, ...createInitialRows(GROW_BY)];
    });
  }, []);

  const updateRow = useCallback(
    (index: number, patch: Partial<BulkLeadRow>) => {
      setRows((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...patch };
        return next;
      });
      setRowErrors((prev) => {
        if (!prev[index]) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
      ensureRows(index);
    },
    [ensureRows],
  );

  const handleCsvFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;

      setCsvImporting(true);
      try {
        const { rows: imported, mismatched } = await parseBulkAddLeadsFile(file, {
          icpNames: icpsList.map((item) => item.name),
          profileNames: profileUsersList.map((item) => item.name),
        });

        const mapped = normalizeDraftRows(imported) ?? imported.map((row) => ({
          prospectName: [row.firstName, row.lastName].filter(Boolean).join(' ').trim(),
          email: row.email,
          icp: row.icp,
          profile: row.profile,
          connectionStatus: row.connectionStatus,
          messageStatus: row.messageStatus,
          linkedinMsg: row.linkedinMsg,
          futureLeadDate: row.futureLeadDate,
        }));

        const nextRows =
          mapped.length < INITIAL_ROWS
            ? [...mapped, ...createInitialRows(INITIAL_ROWS - mapped.length)]
            : mapped;

        setRows(nextRows);
        setRowErrors({});

        const mismatchParts: string[] = [];
        if (mismatched.icp) mismatchParts.push(`${mismatched.icp} ICP`);
        if (mismatched.profile) mismatchParts.push(`${mismatched.profile} Profile`);
        if (mismatched.connectionStatus) {
          mismatchParts.push(`${mismatched.connectionStatus} Connection`);
        }
        if (mismatched.messageStatus) {
          mismatchParts.push(`${mismatched.messageStatus} Message`);
        }

        addToast({
          message:
            mismatchParts.length > 0
              ? `Loaded ${imported.length} row(s). Unmatched left blank: ${mismatchParts.join(', ')}.`
              : `Loaded ${imported.length} row(s) into the sheet.`,
          severity: mismatchParts.length > 0 ? 'warning' : 'success',
        });
      } catch (err) {
        addToast({
          message: err instanceof Error ? err.message : 'Failed to read CSV file.',
          severity: 'error',
        });
      } finally {
        setCsvImporting(false);
        if (csvInputRef.current) csvInputRef.current.value = '';
      }
    },
    [addToast, icpsList, profileUsersList],
  );

  const handleSubmit = () => {
    const filled: { index: number; row: BulkLeadRow }[] = [];
    rows.forEach((row, index) => {
      if (!isRowEmpty(row)) filled.push({ index, row });
    });

    if (filled.length === 0) {
      addToast({ message: 'Enter at least one lead before submitting.', severity: 'error' });
      return;
    }

    const errors: Record<number, RowErrors> = {};
    let hasFutureDateError = false;
    let hasCommentError = false;
    for (const { index, row } of filled) {
      const rowErr = validateRow(row);
      if (Object.keys(rowErr).length > 0) {
        errors[index] = rowErr;
        if (rowErr.futureLeadDate) hasFutureDateError = true;
        if (rowErr.leadComment) hasCommentError = true;
      }
    }

    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);
      addToast({
        message: hasFutureDateError
          ? 'Please select a Future Lead date for all Future Lead rows.'
          : hasCommentError
            ? 'Please add a reason comment for all Invalid Lead rows.'
            : 'Please fill in all required fields on highlighted rows.',
        severity: 'error',
      });
      const firstErrorIndex = Number(Object.keys(errors)[0]);
      document
        .getElementById(`bulk-lead-row-${firstErrorIndex}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const leads: Partial<Lead>[] = filled.map(({ row }) => {
      const nameParts = splitProspectName(row.prospectName);
      const connectionStatus = (row.connectionStatus || 'pending') as ConnectionStatus;
      const messageStatus = (row.messageStatus || 'not_sent') as MessageStatus;
      return {
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        prospectName: nameParts.prospectName.trim(),
        email: row.email.trim(),
        icp: row.icp.trim(),
        profile: row.profile.trim(),
        connectionStatus,
        messageStatus,
        linkedinMsg: row.linkedinMsg || messageStatus,
        ...(messageStatus === 'future_lead' && row.futureLeadDate
          ? { futureLeadDate: row.futureLeadDate }
          : {}),
        ...(row.leadComment ? { leadComment: row.leadComment } : {}),
      };
    });

    bulkCreate.mutate(
      { leads, updateDuplicates: false },
      {
        onSuccess: async (res) => {
          const data = res.data?.data;
          const created = data?.created ?? 0;
          const skipped = data?.skipped ?? data?.duplicates ?? 0;

          persistEnabledRef.current = false;
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

          if (userId) {
            try {
              await clearBulkAddLeadsDraft(userId);
            } catch {
              // Draft clear failure should not block success UX.
            }
          }
          setDraftRestored(false);

          addToast({
            message:
              skipped > 0
                ? `${created} lead(s) created. ${skipped} duplicate(s) skipped.`
                : `${created} lead(s) created successfully.`,
            severity: 'success',
          });
          navigate('/sales');
        },
        onError: (err: any) => {
          const errorMsg = err?.response?.data?.error?.message || 'Failed to create leads';
          addToast({ message: errorMsg, severity: 'error' });
        },
      },
    );
  };

  const borderColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const headerBg = isDarkMode ? 'rgba(0,0,0,0.35)' : '#fff';
  const footerBg = isDarkMode ? 'rgba(15,15,20,0.95)' : 'rgba(255,255,255,0.96)';
  const tableHeaderBg = isDarkMode ? 'rgba(20,20,28,0.98)' : '#fafafa';
  const agentName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 88px)', minHeight: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: `1px solid ${borderColor}`,
          bgcolor: headerBg,
          position: 'sticky',
          top: 0,
          zIndex: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/sales')}
            sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Add Multiple Leads
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Fill any rows below — empty rows are skipped. Or upload a CSV to load into this sheet.
              Assigned to{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {agentName}
              </Box>
              {' · '}Draft auto-saves in this browser until successfully submitted.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={(e) => void handleCsvFile(e.target.files?.[0])}
          />
          <Button
            variant="outlined"
            startIcon={
              csvImporting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <UploadFileIcon sx={{ fontSize: 18 }} />
              )
            }
            onClick={() => csvInputRef.current?.click()}
            disabled={!draftReady || csvImporting}
            sx={{
              textTransform: 'none',
              borderRadius: '24px',
              fontWeight: 700,
              px: 2.5,
              height: 40,
            }}
          >
            {csvImporting ? 'Loading…' : 'Upload CSV'}
          </Button>
          <Button
            variant="text"
            startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
            onClick={downloadBulkAddSampleCsv}
            sx={{ textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
          >
            Sample CSV
          </Button>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {filledCount} filled · {rows.length} rows
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              {!draftReady
                ? 'Restoring draft…'
                : draftSaving
                  ? 'Saving draft…'
                  : draftRestored || filledCount > 0
                    ? 'Draft saved locally'
                    : 'No local draft'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: { xs: 1, md: 2 } }}>
        {!draftReady ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={28} aria-label="Loading draft" />
          </Box>
        ) : (
        <table
          style={{
            width: '100%',
            minWidth: 1100,
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              {['#', 'Contact', 'ICP / Profile', 'Connection', 'Message', 'Agent'].map((label) => (
                <th
                  key={label}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    textAlign: 'left',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
                    background: tableHeaderBg,
                    borderBottom: `1px solid ${borderColor}`,
                    padding: '12px 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <BulkLeadRowView
                key={index}
                index={index}
                row={row}
                errors={rowErrors[index] || EMPTY_ERRORS}
                isDarkMode={isDarkMode}
                borderColor={borderColor}
                agentName={agentName}
                icpsList={icpsList}
                profileUsersList={profileUsersList}
                onUpdate={updateRow}
              />
            ))}
          </tbody>
        </table>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          px: { xs: 2, md: 3 },
          py: 2,
          borderTop: `1px solid ${borderColor}`,
          bgcolor: footerBg,
          position: 'sticky',
          bottom: 0,
          zIndex: 3,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Required: Prospect Name, ICP, Profile
          {filledCount > 0 ? ` · Ready to submit ${filledCount} lead(s)` : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/sales')}
            disabled={bulkCreate.isPending}
            sx={{
              textTransform: 'none',
              borderRadius: '24px',
              fontWeight: 700,
              px: 3,
              height: 42,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={
              bulkCreate.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckIcon sx={{ fontSize: 18 }} />
              )
            }
            onClick={handleSubmit}
            disabled={bulkCreate.isPending}
            sx={{
              textTransform: 'none',
              borderRadius: '24px',
              fontWeight: 700,
              px: 3,
              height: 42,
              bgcolor: tokens.brand.primary,
              '&:hover': { bgcolor: tokens.brand.primary, filter: 'brightness(0.92)' },
            }}
          >
            {bulkCreate.isPending ? 'Adding…' : 'Add All Leads'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default BulkAddLeadsPage;
