import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  Typography, Box, CircularProgress, Alert, TextField,
  ToggleButton, ToggleButtonGroup, FormControlLabel, Checkbox,
  Chip, OutlinedInput, Avatar, Collapse, useTheme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import { useProjectBoards } from '@/hooks/api/useProjects';
import { useKanbanBoards } from '@/hooks/api/useKanban';
import { useUsers } from '@/hooks/api/useUsers';
import { ModernDatePicker } from '@/components/common/ModernDatePicker';
import { ModernTimePicker } from '@/components/common/ModernTimePicker';
import { RichTextEditor } from '@/components/chat/RichTextEditor';
import { tokens } from '@/styles/tokens';
import { hasDisplayableClockTime } from '@/utils/formatters';
import { showApiError } from '@/utils/apiError';
import type { KanbanBoard, User } from '@/types';
import type { MoveCopyCardMode, MoveCopyCardPayload } from '@/hooks/api/useKanban';

export type CardMoveCopySnapshot = {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assigneeIds: string[];
};

/** Card id + snapshot kept while move/copy runs so the dialog survives cache updates. */
export type TransferCardContext = CardMoveCopySnapshot & { cardId: string };

interface TransferCardDialogProps {
  open: boolean;
  onClose: () => void;
  sourceBoard: KanbanBoard;
  card: CardMoveCopySnapshot;
  onSubmit: (mode: MoveCopyCardMode, payload: MoveCopyCardPayload) => Promise<void>;
}

const DEFAULT_DUE_TIME = '23:59';

const pad2 = (n: number) => String(n).padStart(2, '0');
const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toLocalTimeStr = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const combineDueDateTime = (dateStr: string, timeStr: string): string | undefined => {
  if (!dateStr) return undefined;
  const time = timeStr || DEFAULT_DUE_TIME;
  const local = new Date(`${dateStr}T${time}:00`);
  if (Number.isNaN(local.getTime())) return dateStr;
  return local.toISOString();
};

const parseDueParts = (iso?: string) => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: String(iso).split('T')[0] || '', time: '' };
  return {
    date: toLocalDateStr(d),
    time: hasDisplayableClockTime(d) ? toLocalTimeStr(d) : '',
  };
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', dot: '#3b82f6' },
  medium: { label: 'Medium', dot: '#d97706' },
  high: { label: 'High', dot: '#ea580c' },
  urgent: { label: 'Urgent', dot: '#dc2626' },
} as const;

type PriorityKey = keyof typeof PRIORITY_CONFIG;

const getProjectId = (board?: KanbanBoard | null): string => {
  if (!board?.projectId) return '';
  if (typeof board.projectId === 'object' && (board.projectId as { _id?: string })._id) {
    return String((board.projectId as { _id: string })._id);
  }
  return String(board.projectId);
};

const boardMemberUserIds = (board: KanbanBoard): Set<string> => {
  const ids = (board.members || []).map((m) => {
    const u = m.userId;
    if (typeof u === 'object' && u !== null && '_id' in u) return String((u as { _id: string })._id);
    return String(u || '');
  }).filter(Boolean);
  if (board.ownerId) {
    const owner = board.ownerId;
    ids.push(typeof owner === 'object' && owner !== null && '_id' in owner
      ? String((owner as { _id: string })._id)
      : String(owner));
  }
  return new Set(ids);
};

const userDisplayName = (u: User) =>
  `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u._id;

export const TransferCardDialog: React.FC<TransferCardDialogProps> = ({
  open,
  onClose,
  sourceBoard,
  card,
  onSubmit,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const projectId = useMemo(() => getProjectId(sourceBoard), [sourceBoard]);
  const { data: projectBoards, isLoading: isProjectBoardsLoading } = useProjectBoards(
    open && projectId ? projectId : undefined,
  );
  const { data: allKanbanBoards, isLoading: isAllBoardsLoading } = useKanbanBoards({
    enabled: open && !projectId,
  });
  const { data: usersData } = useUsers({}, { enabled: open });
  const allUsers: User[] = Array.isArray(usersData) ? usersData : [];

  const isBoardsLoading = projectId ? isProjectBoardsLoading : isAllBoardsLoading;
  const boardsList = (projectId ? projectBoards : allKanbanBoards) || [];

  const [mode, setMode] = useState<MoveCopyCardMode>('move');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityKey>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [confirmAddMembers, setConfirmAddMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const dueParts = parseDueParts(card.dueDate);
    setMode('move');
    setSelectedBoardId('');
    setSelectedColumnId('');
    setTitle(card.title || '');
    setDescription(card.description || '');
    setPriority((card.priority as PriorityKey) || 'medium');
    setDueDate(dueParts.date);
    setDueTime(dueParts.time);
    setAssignees(card.assigneeIds || []);
    setConfirmAddMembers(false);
  }, [open, card]);

  const availableBoards = useMemo(() => {
    if (!boardsList.length) return [];
    const sourceBoardId = String(sourceBoard._id);
    return boardsList.filter((b) => {
      const bProjId = getProjectId(b);
      return (
        b.isActive !== false &&
        bProjId &&
        projectId &&
        bProjId === projectId &&
        String(b._id) !== sourceBoardId
      );
    });
  }, [boardsList, sourceBoard._id, projectId]);

  const selectedBoard = useMemo(
    () => availableBoards.find((b) => String(b._id) === String(selectedBoardId)),
    [availableBoards, selectedBoardId],
  );

  const destMemberIds = useMemo(
    () => (selectedBoard ? boardMemberUserIds(selectedBoard) : new Set<string>()),
    [selectedBoard],
  );

  const boardMembers = useMemo(() => {
    if (!selectedBoard) return [] as User[];
    const ids = [...destMemberIds];
    return ids
      .map((id) => allUsers.find((u) => u._id === id))
      .filter(Boolean) as User[];
  }, [selectedBoard, destMemberIds, allUsers]);

  const missingAssignees = useMemo(
    () => assignees.filter((id) => !destMemberIds.has(String(id))),
    [assignees, destMemberIds],
  );

  const missingAssigneeUsers = useMemo(
    () =>
      missingAssignees
        .map((id) => allUsers.find((u) => u._id === id))
        .filter(Boolean) as User[],
    [missingAssignees, allUsers],
  );

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const buildPayload = (): MoveCopyCardPayload => ({
    targetBoardId: selectedBoardId,
    targetColumnId: selectedColumnId,
    title: title.trim() || card.title,
    description,
    priority,
    dueDate: dueDate ? combineDueDateTime(dueDate, dueTime) : undefined,
    assignedTo: assignees,
    addMemberUserIds: missingAssignees.length ? missingAssignees : undefined,
  });

  const canSubmit =
    Boolean(selectedBoardId && selectedColumnId && title.trim()) &&
    (missingAssignees.length === 0 || confirmAddMembers);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit(mode, buildPayload());
      handleClose();
    } catch (err: unknown) {
      showApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = mode === 'move' ? 'Move card' : 'Copy card';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '20px' } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Move or copy to board</DialogTitle>
      <DialogContent sx={{ overflow: 'visible' }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          sx={{ mb: 2, width: '100%' }}
          disabled={isSubmitting}
        >
          <ToggleButton value="move" sx={{ flex: 1, textTransform: 'none', fontWeight: 700, gap: 1 }}>
            <DriveFileMoveIcon fontSize="small" />
            Move
          </ToggleButton>
          <ToggleButton value="copy" sx={{ flex: 1, textTransform: 'none', fontWeight: 700, gap: 1 }}>
            <ContentCopyIcon fontSize="small" />
            Copy (keep here)
          </ToggleButton>
        </ToggleButtonGroup>

        {mode === 'copy' && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
            A new card will be created on the destination board with its own daily task KPIs. Comments and subtasks are not copied.
          </Alert>
        )}

        {isBoardsLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : availableBoards.length === 0 ? (
          <Typography color="text.secondary" p={2} textAlign="center">
            No other boards available in this project.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel>Destination board</InputLabel>
              <Select
                value={selectedBoardId}
                label="Destination board"
                onChange={(e) => {
                  setSelectedBoardId(e.target.value as string);
                  setSelectedColumnId('');
                  setConfirmAddMembers(false);
                }}
                disabled={isSubmitting}
              >
                {availableBoards.map((board) => (
                  <MenuItem key={board._id} value={board._id}>
                    {board.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedBoard && (
              <FormControl fullWidth>
                <InputLabel>Destination column</InputLabel>
                <Select
                  value={selectedColumnId}
                  label="Destination column"
                  onChange={(e) => setSelectedColumnId(e.target.value as string)}
                  disabled={isSubmitting}
                >
                  {(selectedBoard.columns || [])
                    .filter((c) => c.isActive !== false)
                    .map((col) => (
                      <MenuItem key={col._id} value={col._id}>
                        {col.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            <Collapse in={Boolean(selectedBoardId && selectedColumnId)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
                <TextField
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  disabled={isSubmitting}
                />

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.75, display: 'block' }}>
                    Description
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: '14px',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'}`,
                      bgcolor: isDarkMode ? 'rgba(0,0,0,0.12)' : '#fff',
                      overflow: 'hidden',
                      '&:focus-within': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2,
                        margin: '-1px',
                      },
                    }}
                  >
                    <RichTextEditor
                      value={description}
                      onChange={setDescription}
                      submitOnEnter={false}
                      alwaysShowToolbar
                      minHeight="100px"
                      maxHeight="220px"
                      placeholder="Add details about this card…"
                      mentionableUsers={boardMembers}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={priority}
                      label="Priority"
                      onChange={(e) => setPriority(e.target.value as PriorityKey)}
                      disabled={isSubmitting}
                    >
                      {(Object.entries(PRIORITY_CONFIG) as [PriorityKey, (typeof PRIORITY_CONFIG)[PriorityKey]][]).map(
                        ([key, cfg]) => (
                          <MenuItem key={key} value={key}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cfg.dot }} />
                              {cfg.label}
                            </Box>
                          </MenuItem>
                        ),
                      )}
                    </Select>
                  </FormControl>
                  <Box sx={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <ModernDatePicker
                      label="Due date"
                      value={dueDate ? new Date(`${dueDate}T00:00:00`) : null}
                      onChange={(date) => {
                        if (date) {
                          setDueDate(toLocalDateStr(date));
                          if (!dueTime) setDueTime(DEFAULT_DUE_TIME);
                        } else {
                          setDueDate('');
                          setDueTime('');
                        }
                      }}
                    />
                    {dueDate && (
                      <ModernTimePicker
                        label="Due time"
                        value={dueTime || DEFAULT_DUE_TIME}
                        onChange={(t) => setDueTime(t)}
                      />
                    )}
                  </Box>
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel id="transfer-assign-label">Assign to</InputLabel>
                  <Select
                    labelId="transfer-assign-label"
                    multiple
                    value={assignees}
                    onChange={(e) => {
                      setAssignees(e.target.value as string[]);
                      setConfirmAddMembers(false);
                    }}
                    input={<OutlinedInput label="Assign to" />}
                    disabled={isSubmitting || !selectedBoard}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((val) => {
                          const match =
                            boardMembers.find((u) => u._id === val) || allUsers.find((u) => u._id === val);
                          return (
                            <Chip
                              key={val}
                              label={match ? userDisplayName(match) : val}
                              size="small"
                              onDelete={() => {
                                setAssignees(assignees.filter((id) => id !== val));
                                setConfirmAddMembers(false);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {boardMembers.map((u) => (
                      <MenuItem key={u._id} value={u._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={u.avatarUrl || undefined}
                            sx={{ width: 28, height: 28, bgcolor: tokens.brand.primaryMuted, fontSize: '0.72rem' }}
                          >
                            {(u.firstName?.charAt(0) || 'U').toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {userDisplayName(u)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                    Only members of the destination board can be picked from the list. Pre-filled assignees from this card stay selected until you remove them.
                  </Typography>
                </FormControl>

                {missingAssignees.length > 0 && selectedBoard && (
                  <Box>
                    <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        These assignees are not on &quot;{selectedBoard.name}&quot; yet:
                      </Typography>
                      <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
                        {missingAssigneeUsers.map((u) => (
                          <li key={u._id}>{userDisplayName(u)}</li>
                        ))}
                        {missingAssigneeUsers.length < missingAssignees.length &&
                          missingAssignees
                            .filter((id) => !missingAssigneeUsers.some((u) => u._id === id))
                            .map((id) => <li key={id}>{id}</li>)}
                      </Typography>
                    </Alert>
                    <FormControlLabel
                      sx={{
                        mt: 1.5,
                        mx: 0,
                        alignItems: 'flex-start',
                        width: '100%',
                      }}
                      control={
                        <Checkbox
                          checked={confirmAddMembers}
                          onChange={(e) => setConfirmAddMembers(e.target.checked)}
                          disabled={isSubmitting}
                          sx={{ pt: 0.25 }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ pt: 0.75 }}>
                          Add {missingAssignees.length === 1 ? 'this person' : 'these people'} to the board and assign them on this card
                        </Typography>
                      }
                    />
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting || availableBoards.length === 0}
          variant="contained"
          sx={{ fontWeight: 700, borderRadius: '24px', textTransform: 'none', px: 3 }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
