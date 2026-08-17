import { memo, useState } from 'react';
import {
  Box,
  IconButton,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { tokens } from '@/styles/tokens';
import type { EditableLeadData } from '@/hooks/useLeadAutoSync';
import type { ConnectionStatus, LeadComment, MessageStatus } from '@/types';
import { composeProspectName, splitProspectName } from '@/utils/formatters';
import { nativeFieldStyle } from './nativeFieldStyles';
import { LeadCommentButton } from './LeadCommentButton';

type OptionItem = { _id: string; name: string };

type SalesEditRowProps = {
  leadId: string;
  editData: EditableLeadData;
  isDarkMode: boolean;
  icpsList: OptionItem[];
  profileUsersList: OptionItem[];
  assignedName: string;
  addedLabel: string;
  followUpCount?: number;
  showFollowUpSelect: boolean;
  followUpPending?: boolean;
  onUpdate: (id: string, patch: Partial<EditableLeadData>) => void;
  onSave: (id: string) => void;
  onCancel: (id: string) => void;
  onFollowUpChange?: (id: string, number: number) => void;
};

export const SalesEditRow = memo(function SalesEditRow({
  leadId,
  editData,
  isDarkMode,
  icpsList,
  profileUsersList,
  assignedName,
  addedLabel,
  followUpCount,
  showFollowUpSelect,
  followUpPending,
  onUpdate,
  onSave,
  onCancel,
  onFollowUpChange,
}: SalesEditRowProps) {
  const field = nativeFieldStyle(isDarkMode);
  const [promptInvalidComment, setPromptInvalidComment] = useState(false);
  const prospectNameValue =
    editData.prospectName !== undefined && editData.prospectName !== null
      ? editData.prospectName
      : composeProspectName(editData);

  return (
    <TableRow
      sx={{
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        borderBottom: `2px solid ${tokens.brand.primary}`,
      }}
    >
      <TableCell sx={{ py: 2, pl: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', flex: 1 }}>
            <input
              placeholder="Prospect Name"
              value={prospectNameValue}
              onChange={(e) => onUpdate(leadId, splitProspectName(e.target.value))}
              style={field}
            />
            <input
              placeholder="Email"
              value={editData.email}
              onChange={(e) => onUpdate(leadId, { email: e.target.value })}
              style={field}
            />
          </Box>
          <LeadCommentButton
            comment={editData.leadComment}
            onSave={(comment) => onUpdate(leadId, { leadComment: comment })}
            promptOpen={promptInvalidComment}
            onPromptHandled={() => setPromptInvalidComment(false)}
            requireReason={editData.messageStatus === 'invalid_lead'}
          />
        </Box>
      </TableCell>
      <TableCell sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <select
            value={editData.icp || ''}
            onChange={(e) => onUpdate(leadId, { icp: e.target.value })}
            style={field}
          >
            <option value="">No ICP</option>
            {icpsList.map((icp) => (
              <option key={icp._id} value={icp.name}>
                {icp.name}
              </option>
            ))}
          </select>
          <select
            value={editData.profile || ''}
            onChange={(e) => onUpdate(leadId, { profile: e.target.value })}
            style={field}
          >
            <option value="">No Profile</option>
            {profileUsersList.map((p) => (
              <option key={p._id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </Box>
      </TableCell>
      <TableCell sx={{ py: 2 }}>
        <select
          value={editData.connectionStatus}
          onChange={(e) =>
            onUpdate(leadId, { connectionStatus: e.target.value as ConnectionStatus })
          }
          style={field}
        >
          <option value="pending">Conn: Pending</option>
          <option value="accepted">Conn: Accepted</option>
          <option value="declined">Conn: Declined</option>
          <option value="no_response">Conn: No Response</option>
        </select>
      </TableCell>
      <TableCell sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <select
            value={editData.messageStatus}
            onChange={(e) => {
              const messageStatus = e.target.value as MessageStatus;
              onUpdate(leadId, {
                messageStatus,
                linkedinMsg: messageStatus,
                ...(messageStatus !== 'future_lead' ? { futureLeadDate: undefined } : {}),
              });
              if (messageStatus === 'invalid_lead') {
                setPromptInvalidComment(true);
              }
            }}
            style={field}
          >
            <option value="not_sent">Msg: Not Sent</option>
            <option value="sent">Msg: Sent</option>
            <option value="replied">Msg: Replied</option>
            <option value="follow_up">Msg: Follow Up</option>
            <option value="negative">Msg: Negative</option>
            <option value="positive">Msg: Positive</option>
            <option value="future_lead">Msg: Future Lead</option>
            <option value="invalid_lead">Msg: Invalid Lead</option>
          </select>
          {editData.messageStatus === 'future_lead' && (
            <input
              type="date"
              aria-label="Reactivate on"
              value={editData.futureLeadDate || ''}
              onChange={(e) =>
                onUpdate(leadId, { futureLeadDate: e.target.value || undefined })
              }
              style={field}
            />
          )}
          {showFollowUpSelect && (
            <select
              value={followUpCount || ''}
              disabled={followUpPending}
              onChange={(e) => {
                const number = Number(e.target.value);
                if (!number || number === (followUpCount ?? 0)) return;
                onFollowUpChange?.(leadId, number);
              }}
              style={{ ...field, minWidth: 130, fontWeight: 700, fontSize: '0.75rem' }}
            >
              <option value="" disabled>
                FollowUp #
              </option>
              {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  FollowUp #{n}
                </option>
              ))}
            </select>
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ py: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {assignedName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Added: {addedLabel}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ py: 2, pr: 3 }}>
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <IconButton
            onClick={() => onSave(leadId)}
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' },
            }}
          >
            <CheckIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            onClick={() => onCancel(leadId)}
            sx={{
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
});

type SalesInlineAddRowProps = {
  data: {
    firstName?: string;
    lastName?: string;
    prospectName?: string;
    email?: string;
    icp?: string;
    profile?: string;
    connectionStatus?: ConnectionStatus | string;
    messageStatus?: MessageStatus | string;
    futureLeadDate?: string;
    leadComment?: LeadComment | null;
  };
  errors: Record<string, boolean>;
  isDarkMode: boolean;
  icpsList: OptionItem[];
  profileUsersList: OptionItem[];
  agentName: string;
  onUpdate: (patch: Record<string, unknown>) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const SalesInlineAddRow = memo(function SalesInlineAddRow({
  data,
  errors,
  isDarkMode,
  icpsList,
  profileUsersList,
  agentName,
  onUpdate,
  onSave,
  onCancel,
}: SalesInlineAddRowProps) {
  const prospectNameValue =
    data.prospectName !== undefined && data.prospectName !== null
      ? data.prospectName
      : composeProspectName(data);
  const prospectNameError = !!(errors.prospectName || errors.firstName || errors.lastName);
  const [promptInvalidComment, setPromptInvalidComment] = useState(false);

  return (
    <TableRow
      sx={{
        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        borderBottom: `2px solid ${tokens.brand.primary}`,
      }}
    >
      <TableCell sx={{ py: 2, pl: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', flex: 1 }}>
            <input
              placeholder="Prospect Name *"
              value={prospectNameValue}
              onChange={(e) => onUpdate(splitProspectName(e.target.value))}
              style={nativeFieldStyle(isDarkMode, prospectNameError)}
            />
            <input
              placeholder="Email"
              value={data.email || ''}
              onChange={(e) => onUpdate({ email: e.target.value })}
              style={nativeFieldStyle(isDarkMode)}
            />
          </Box>
          <LeadCommentButton
            comment={data.leadComment}
            onSave={(comment) => onUpdate({ leadComment: comment })}
            promptOpen={promptInvalidComment}
            onPromptHandled={() => setPromptInvalidComment(false)}
            requireReason={data.messageStatus === 'invalid_lead'}
          />
        </Box>
      </TableCell>
      <TableCell sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <select
            value={data.icp || ''}
            onChange={(e) => onUpdate({ icp: e.target.value })}
            style={nativeFieldStyle(isDarkMode, !!errors.icp)}
          >
            <option value="">No ICP</option>
            {icpsList.map((icp) => (
              <option key={icp._id} value={icp.name}>
                {icp.name}
              </option>
            ))}
          </select>
          <select
            value={data.profile || ''}
            onChange={(e) => onUpdate({ profile: e.target.value })}
            style={nativeFieldStyle(isDarkMode, !!errors.profile)}
          >
            <option value="">No Profile</option>
            {profileUsersList.map((p) => (
              <option key={p._id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </Box>
      </TableCell>
      <TableCell sx={{ py: 2 }}>
        <select
          value={data.connectionStatus || 'pending'}
          onChange={(e) => onUpdate({ connectionStatus: e.target.value })}
          style={nativeFieldStyle(isDarkMode)}
        >
          <option value="pending">Conn: Pending</option>
          <option value="accepted">Conn: Accepted</option>
          <option value="declined">Conn: Declined</option>
          <option value="no_response">Conn: No Response</option>
        </select>
      </TableCell>
      <TableCell sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <select
            value={data.messageStatus || 'not_sent'}
            onChange={(e) => {
              const messageStatus = e.target.value as MessageStatus;
              onUpdate({
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
            <option value="not_sent">Msg: Not Sent</option>
            <option value="sent">Msg: Sent</option>
            <option value="replied">Msg: Replied</option>
            <option value="follow_up">Msg: Follow Up</option>
            <option value="negative">Msg: Negative</option>
            <option value="positive">Msg: Positive</option>
            <option value="future_lead">Msg: Future Lead</option>
            <option value="invalid_lead">Msg: Invalid Lead</option>
          </select>
          {data.messageStatus === 'future_lead' && (
            <input
              type="date"
              aria-label="Reactivate on"
              value={data.futureLeadDate || ''}
              onChange={(e) =>
                onUpdate({ futureLeadDate: e.target.value || undefined })
              }
              style={nativeFieldStyle(isDarkMode, !!errors.futureLeadDate)}
            />
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ py: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {agentName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Just now
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ py: 2, pr: 3 }}>
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <IconButton
            onClick={onSave}
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' },
            }}
          >
            <CheckIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            onClick={onCancel}
            sx={{
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
});
