import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  autoMatchPeople,
  parseBoardImportFile,
  resolveMappedUserIds,
  type MatchableUser,
  type ParsedImportBoard,
} from '@/lib/boardImport';
import { useProjectMembers } from '@/hooks/api/useProjects';
import { getPriorityConfig } from '@/lib/priorityConfig';
import { tokens } from '@/styles/tokens';
import type { ProjectMember, User } from '@/types';

const projectMembersToUsers = (members: ProjectMember[]): User[] => {
  const users: User[] = [];
  const seen = new Set<string>();
  for (const member of members) {
    const raw = member.userId;
    if (!raw || typeof raw === 'string') continue;
    if (!raw._id || seen.has(raw._id)) continue;
    seen.add(raw._id);
    users.push(raw);
  }
  return users;
};

type ImportBoardDialogProps = {
  open: boolean;
  projectId: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    name: string;
    columns: { name: string; order: number }[];
    cards: {
      title: string;
      description?: string;
      columnName: string;
      assignedTo: string[];
      priority: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: string;
      isDone: boolean;
    }[];
    memberUserIds: string[];
  }) => void;
};

const userLabel = (user: MatchableUser) => {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name ? `${name} (${user.email || ''})` : user.email || user._id;
};

const initials = (user?: MatchableUser | null, fallback = '?') => {
  if (!user) return fallback;
  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();
  if (first || last) return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  return (user.email || fallback).slice(0, 2).toUpperCase();
};

export const ImportBoardDialog = ({
  open,
  projectId,
  isPending,
  onClose,
  onConfirm,
}: ImportBoardDialogProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: projectMembers = [] } = useProjectMembers(open ? projectId : undefined);
  const users = useMemo(() => projectMembersToUsers(projectMembers), [projectMembers]);

  const [parsed, setParsed] = useState<ParsedImportBoard | null>(null);
  const [boardName, setBoardName] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setParsed(null);
    setBoardName('');
    setMapping({});
    setParseError('');
    setFileName('');
    setDragOver(false);
  };

  const handleClose = () => {
    if (isPending) return;
    reset();
    onClose();
  };

  const applyFile = useCallback(
    async (file: File) => {
      setParseError('');
      try {
        const next = await parseBoardImportFile(file);
        setParsed(next);
        setBoardName(next.name);
        setFileName(file.name);
        setMapping(autoMatchPeople(next.people, users));
      } catch (error) {
        setParsed(null);
        setMapping({});
        setFileName(file.name);
        setParseError(error instanceof Error ? error.message : 'Could not parse this file.');
      }
    },
    [users],
  );

  useEffect(() => {
    if (!parsed) return;
    const allowed = new Set(users.map((user) => user._id));
    setMapping((prev) => {
      const kept: Record<string, string> = {};
      for (const [sourceId, userId] of Object.entries(prev)) {
        if (userId && allowed.has(userId)) kept[sourceId] = userId;
      }
      return { ...autoMatchPeople(parsed.people, users), ...kept };
    });
  }, [parsed, users]);

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of users) map.set(user._id, user);
    return map;
  }, [users]);

  const previewCards = useMemo(() => {
    if (!parsed) return [];
    return parsed.cards.map((card) => {
      const assignees = resolveMappedUserIds(card.sourcePersonIds, mapping)
        .map((userId) => usersById.get(userId))
        .filter(Boolean) as User[];
      return { ...card, assignees };
    });
  }, [mapping, parsed, usersById]);

  const handleConfirm = () => {
    if (!parsed || !boardName.trim()) return;
    const memberUserIds = [...new Set(Object.values(mapping).filter(Boolean))];
    onConfirm({
      name: boardName.trim(),
      columns: parsed.columns,
      cards: parsed.cards.map((card) => ({
        title: card.title,
        description: card.description,
        columnName: card.columnName,
        assignedTo: resolveMappedUserIds(card.sourcePersonIds, mapping),
        priority: card.priority,
        dueDate: card.dueDate,
        isDone: card.isDone,
      })),
      memberUserIds,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: '24px',
          p: 1,
          bgcolor: isDarkMode ? '#1E1B24' : '#fff',
          backgroundImage: 'none',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem' }}>Import Board</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Upload a Trello JSON export or Jira CSV, map people to members of this project, then create the board.
        </Typography>

        <Box
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void applyFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: `1.5px dashed ${
              dragOver
                ? tokens.brand.primary
                : isDarkMode
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.12)'
            }`,
            borderRadius: '16px',
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragOver
              ? isDarkMode
                ? 'rgba(93,26,137,0.16)'
                : tokens.brand.primary50
              : isDarkMode
                ? 'rgba(255,255,255,0.02)'
                : 'rgba(0,0,0,0.015)',
            mb: 2.5,
          }}
        >
          <CloudUploadIcon sx={{ color: tokens.brand.primary, mb: 1 }} />
          <Typography sx={{ fontWeight: 700 }}>Drop a .json or .csv file here</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {fileName || 'Trello board JSON or Jira issues CSV'}
          </Typography>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void applyFile(file);
              event.target.value = '';
            }}
          />
        </Box>

        {parseError && (
          <Typography sx={{ color: 'error.main', fontWeight: 600, mb: 2 }}>{parseError}</Typography>
        )}

        {parsed && (
          <>
            <TextField
              label="Board name"
              fullWidth
              size="small"
              value={boardName}
              onChange={(event) => setBoardName(event.target.value)}
              sx={{ mb: 3 }}
              InputProps={{ sx: { borderRadius: '12px' } }}
            />

            <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Map people</Typography>
            {parsed.people.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                No assignees were found in this file. Cards will be created unassigned.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                {parsed.people.map((person) => {
                  const selectedId = mapping[person.id] || '';
                  const selected = users.find((user) => user._id === selectedId) || null;
                  return (
                    <Box
                      key={person.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1.4fr' },
                        gap: 1.5,
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{person.displayName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {[person.username, person.email].filter(Boolean).join(' · ') || person.id}
                        </Typography>
                      </Box>
                      <Autocomplete
                        options={users}
                        value={selected}
                        onChange={(_, next) => {
                          setMapping((prev) => {
                            const copy = { ...prev };
                            if (next?._id) copy[person.id] = next._id;
                            else delete copy[person.id];
                            return copy;
                          });
                        }}
                        getOptionLabel={userLabel}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            label="Project member"
                            placeholder="Leave unassigned"
                            InputProps={{ ...params.InputProps, sx: { borderRadius: '12px' } }}
                          />
                        )}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}

            <Typography sx={{ fontWeight: 800, mb: 1.5 }}>
              Preview · {parsed.columns.length} columns · {parsed.cards.length} cards
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                overflowX: 'auto',
                pb: 1,
              }}
            >
              {parsed.columns.map((column) => {
                const columnCards = previewCards.filter((card) => card.columnName === column.name);
                return (
                  <Box
                    key={`${column.order}-${column.name}`}
                    sx={{
                      minWidth: 240,
                      maxWidth: 260,
                      flex: '0 0 240px',
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                      borderRadius: '16px',
                      p: 1.25,
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, mb: 1, px: 0.5 }}>
                      {column.name}
                      <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 600, ml: 0.75 }}>
                        {columnCards.length}
                      </Typography>
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {columnCards.slice(0, 12).map((card) => {
                        const priority = getPriorityConfig(card.priority);
                        return (
                          <Box
                            key={card.sourceId}
                            sx={{
                              bgcolor: isDarkMode ? '#1E1B24' : '#fff',
                              borderRadius: '12px',
                              p: 1.25,
                              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                            }}
                          >
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.75 }}>
                              {card.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                              <Chip
                                size="small"
                                label={priority.label}
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  bgcolor: priority.bg,
                                  color: priority.color,
                                }}
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {card.assignees.length === 0 ? (
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Unassigned
                                  </Typography>
                                ) : (
                                  card.assignees.map((user) => (
                                    <Avatar
                                      key={user._id}
                                      src={user.avatarUrl}
                                      sx={{ width: 22, height: 22, fontSize: '0.65rem', ml: -0.4 }}
                                    >
                                      {initials(user)}
                                    </Avatar>
                                  ))
                                )}
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                      {columnCards.length > 12 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', px: 0.5 }}>
                          +{columnCards.length - 12} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isPending}
          sx={{ color: 'text.secondary', fontWeight: 700, borderRadius: '24px', textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!parsed || !boardName.trim() || isPending}
          variant="contained"
          sx={{
            bgcolor: tokens.brand.primary,
            color: '#fff',
            fontWeight: 700,
            borderRadius: '24px',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { bgcolor: tokens.brand.primary, boxShadow: 'none' },
          }}
        >
          {isPending ? <CircularProgress size={20} color="inherit" /> : 'Create board'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
