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

import { nativeFieldStyle } from '@/components/leads/nativeFieldStyles';
import { useBulkCreateLeads } from '@/hooks/api/useLeads';
import { useIcps, useProfiles } from '@/hooks/api/useSettings';
import { useAuth } from '@/hooks/useAuth';
import {
  clearBulkAddLeadsDraft,
  loadBulkAddLeadsDraft,
  saveBulkAddLeadsDraft,
} from '@/lib/bulkAddLeadsDraftDb';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type { ConnectionStatus, Lead, MessageStatus } from '@/types';
import { splitProspectName } from '@/utils/formatters';

const INITIAL_ROWS = 100;
const GROW_BY = 20;
const GROW_THRESHOLD = 5;
const DRAFT_SAVE_DEBOUNCE_MS = 1000; // 1 second

type BulkLeadRow = {
  prospectName: string;
  email: string;
  icp: string;
  profile: string;
  connectionStatus: ConnectionStatus;
  messageStatus: MessageStatus;
  linkedinMsg: string;
  futureLeadDate?: string;
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
      connectionStatus: (row.connectionStatus || 'pending') as ConnectionStatus,
      messageStatus: (row.messageStatus || 'not_sent') as MessageStatus,
      linkedinMsg:
        typeof row.linkedinMsg === 'string'
          ? row.linkedinMsg
          : String(row.messageStatus || 'not_sent'),
      futureLeadDate:
        typeof row.futureLeadDate === 'string' && row.futureLeadDate
          ? row.futureLeadDate
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            onUpdate(index, { connectionStatus: e.target.value as ConnectionStatus })
          }
          style={nativeFieldStyle(isDarkMode)}
        >
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
              const messageStatus = e.target.value as MessageStatus;
              onUpdate(index, {
                messageStatus,
                linkedinMsg: messageStatus,
                ...(messageStatus !== 'future_lead' ? { futureLeadDate: undefined } : {}),
              });
            }}
            style={nativeFieldStyle(isDarkMode)}
          >
            <option value="not_sent">Not Sent</option>
            <option value="sent">Sent</option>
            <option value="replied">Replied</option>
            <option value="follow_up">Follow Up</option>
            <option value="negative">Negative</option>
            <option value="positive">Positive</option>
            <option value="future_lead">Future Lead</option>
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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistEnabledRef = useRef(true);

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
    for (const { index, row } of filled) {
      const rowErr = validateRow(row);
      if (Object.keys(rowErr).length > 0) {
        errors[index] = rowErr;
        if (rowErr.futureLeadDate) hasFutureDateError = true;
      }
    }

    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);
      addToast({
        message: hasFutureDateError
          ? 'Please select a Future Lead date for all Future Lead rows.'
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
      return {
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        prospectName: nameParts.prospectName.trim(),
        email: row.email.trim(),
        icp: row.icp.trim(),
        profile: row.profile.trim(),
        connectionStatus: row.connectionStatus,
        messageStatus: row.messageStatus,
        linkedinMsg: row.linkedinMsg || row.messageStatus,
        ...(row.messageStatus === 'future_lead' && row.futureLeadDate
          ? { futureLeadDate: row.futureLeadDate }
          : {}),
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
              Fill any rows below — empty rows are skipped. Assigned to{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {agentName}
              </Box>
              {' · '}Draft auto-saves in this browser until successfully submitted.
            </Typography>
          </Box>
        </Box>
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
