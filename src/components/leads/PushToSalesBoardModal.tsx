import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Divider,
  Chip,
  useTheme,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSalesBoards, usePushLeadToSalesBoard } from '@/hooks/api/useKanban';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import { showApiError } from '@/utils/apiError';
import type { KanbanBoard, KanbanColumn, Lead, SalesBoardPlacement } from '@/types';

interface PushToSalesBoardModalProps {
  open: boolean;
  lead: Lead;
  onClose: () => void;
  onSuccess?: (boardId: string) => void;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
};

export const PushToSalesBoardModal = ({ open, lead, onClose, onSuccess }: PushToSalesBoardModalProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);

  const { data: salesBoards = [], isLoading: boardsLoading } = useSalesBoards({ enabled: open });
  const pushMutation = usePushLeadToSalesBoard();

  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const selectedBoard: KanbanBoard | undefined = salesBoards.find((b) => b._id === selectedBoardId);
  const columns: KanbanColumn[] = selectedBoard?.columns ?? [];

  useEffect(() => { setSelectedColumnId(''); }, [selectedBoardId]);
  useEffect(() => { if (!open) { setSelectedBoardId(''); setSelectedColumnId(''); setShowHistory(false); } }, [open]);

  const handlePush = async () => {
    if (!selectedBoardId || !selectedColumnId) return;
    try {
      await pushMutation.mutateAsync({ leadId: lead._id, boardId: selectedBoardId, columnId: selectedColumnId });
      addToast({ message: 'Lead pushed to sales board successfully!', severity: 'success' });
      onSuccess?.(selectedBoardId);
      onClose();
    } catch (err: any) { showApiError(err); }
  };

  const placements: SalesBoardPlacement[] = lead.salesBoardPlacements ?? [];
  const isPending = pushMutation.isPending;

  const borderColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const panelBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const fieldBg = isDarkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)';

  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDarkMode ? 'rgba(18,18,22,0.97)' : 'rgba(255,255,255,0.99)',
          backdropFilter: 'blur(30px)',
          border: `1px solid ${borderColor}`,
          boxShadow: isDarkMode
            ? '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset'
            : '0 40px 80px rgba(0,0,0,0.1)',
          backgroundImage: 'none',
          overflow: 'hidden',
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 3, py: 2, borderBottom: `1px solid ${borderColor}`,
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(93,26,137,0.12) 0%, rgba(0,0,0,0) 100%)'
            : 'linear-gradient(135deg, rgba(93,26,137,0.04) 0%, rgba(0,0,0,0) 100%)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: '12px', flexShrink: 0,
              background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.primary} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(93,26,137,0.3)',
            }}>
              <DashboardIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850, color: tokens.text.primary, letterSpacing: '-0.02em', lineHeight: 1.2, fontSize: '1rem' }}>
                Push to Sales Board
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.text.secondary, fontSize: '0.78rem', mt: 0.2 }}>
                {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Lead'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} disabled={isPending} size="small" sx={{
            color: tokens.text.muted,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' },
          }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pb: 2 }}>
        {/* ── Step 1: Board ── */}
        <Typography variant="caption" sx={{
          color: tokens.text.muted, fontWeight: 750, textTransform: 'uppercase',
          letterSpacing: '0.07em', fontSize: '0.68rem', display: 'block', mb: 0.75,
        }}>
          1 · Select sales board
        </Typography>

        {boardsLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
            <CircularProgress size={18} sx={{ color: tokens.brand.primary }} />
            <Typography variant="body2" sx={{ color: tokens.text.secondary }}>Loading boards…</Typography>
          </Box>
        ) : salesBoards.length === 0 ? (
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: panelBg, border: `1px dashed ${borderColor}`, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: tokens.text.muted }}>
              No sales boards found. Create a board with category <strong>Sales</strong> first.
            </Typography>
          </Box>
        ) : (
          <FormControl fullWidth size="small">
            <Select
              displayEmpty
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              disabled={isPending}
              sx={{
                borderRadius: '14px', bgcolor: fieldBg,
                '& fieldset': { border: 'none' },
                '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                '&.Mui-focused': { boxShadow: `0 0 0 2px ${tokens.brand.primary}44` },
                fontWeight: 600,
              }}
              renderValue={(val) => {
                if (!val) return <span style={{ color: tokens.text.muted }}>Choose a board…</span>;
                return salesBoards.find((b) => b._id === val)?.name ?? val;
              }}
            >
              {salesBoards.map((board) => (
                <MenuItem key={board._id} value={board._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <DashboardIcon sx={{ fontSize: 16, color: tokens.brand.accent }} />
                    <span>{board.name}</span>
                    <Chip label={`${board.columns.length} col`} size="small" sx={{
                      ml: 'auto', height: 18, fontSize: '0.65rem',
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    }} />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* ── Step 2: Column ── */}
        <Collapse in={!!selectedBoardId && columns.length > 0} timeout={220}>
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{
              color: tokens.text.muted, fontWeight: 750, textTransform: 'uppercase',
              letterSpacing: '0.07em', fontSize: '0.68rem', display: 'block', mb: 1.25,
            }}>
              2 · Pick a column
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {columns.map((col, idx) => {
                const isSelected = selectedColumnId === col._id;
                return (
                  <Box
                    key={col._id}
                    onClick={() => !isPending && setSelectedColumnId(col._id!)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      px: 1.75, py: 1, borderRadius: '14px',
                      cursor: isPending ? 'default' : 'pointer',
                      border: `1.5px solid ${isSelected ? tokens.brand.primary : borderColor}`,
                      bgcolor: isSelected ? (isDarkMode ? 'rgba(93,26,137,0.18)' : 'rgba(93,26,137,0.06)') : panelBg,
                      boxShadow: isSelected ? `0 0 0 3px ${tokens.brand.primary}22` : 'none',
                      transition: 'all 0.18s ease',
                      '&:hover': isPending ? {} : {
                        borderColor: tokens.brand.primary,
                        bgcolor: isDarkMode ? 'rgba(93,26,137,0.12)' : 'rgba(93,26,137,0.04)',
                      },
                      flex: '0 0 auto',
                    }}
                  >
                    <Box sx={{
                      width: 22, height: 22, borderRadius: '7px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: isSelected ? tokens.brand.primary : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'),
                      color: isSelected ? '#fff' : tokens.text.muted,
                      fontSize: '0.68rem', fontWeight: 800, flexShrink: 0,
                      transition: 'all 0.18s ease',
                    }}>
                      {idx + 1}
                    </Box>
                    <Typography variant="body2" sx={{
                      fontWeight: isSelected ? 750 : 600,
                      color: isSelected ? tokens.brand.primary : tokens.text.primary,
                      fontSize: '0.85rem', whiteSpace: 'nowrap', transition: 'color 0.18s ease',
                    }}>
                      {col.name}
                    </Typography>
                    {isSelected && <CheckCircleIcon sx={{ fontSize: 15, color: tokens.brand.primary, ml: 0.25 }} />}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Collapse>

        {/* ── Push history ── */}
        {placements.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 1.5, borderColor }} />
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', mb: showHistory ? 1.25 : 0 }}
              onClick={() => setShowHistory((v) => !v)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <HistoryIcon sx={{ fontSize: 16, color: tokens.text.muted }} />
                <Typography variant="body2" sx={{ color: tokens.text.secondary, fontWeight: 650, fontSize: '0.8rem' }}>
                  Push history ({placements.length})
                </Typography>
              </Box>
              <ExpandMoreIcon sx={{
                fontSize: 18, color: tokens.text.muted,
                transform: showHistory ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }} />
            </Box>
            <Collapse in={showHistory}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {[...placements].reverse().map((p, i) => (
                  <Box key={p._id ?? i} sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 1.5, py: 0.875, borderRadius: '12px',
                    bgcolor: panelBg, border: `1px solid ${borderColor}`,
                  }}>
                    <ArrowForwardIcon sx={{ fontSize: 13, color: tokens.brand.accent, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.text.primary, fontSize: '0.82rem', lineHeight: 1.3 }} noWrap>
                        {p.boardName ?? p.boardId}
                        {p.columnName && (
                          <Box component="span" sx={{ color: tokens.text.muted, fontWeight: 500, ml: 0.5 }}>
                            → {p.columnName}
                          </Box>
                        )}
                      </Typography>
                      <Typography variant="caption" sx={{ color: tokens.text.muted, fontSize: '0.7rem' }}>
                        {formatDate(p.pushedAt)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: `1px solid ${borderColor}`, bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.01)', gap: 1 }}>
        <Button onClick={onClose} disabled={isPending} sx={{ color: tokens.text.secondary, fontWeight: 700, borderRadius: '12px', px: 2.5, py: 0.75, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handlePush}
          variant="contained"
          disabled={isPending || !selectedBoardId || !selectedColumnId}
          startIcon={isPending ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <ArrowForwardIcon />}
          sx={{
            fontWeight: 800, borderRadius: '12px', px: 3, py: 0.75, textTransform: 'none', fontSize: '0.9rem',
            background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.primary} 100%)`,
            boxShadow: '0 6px 16px rgba(93,26,137,0.28)',
            transition: 'all 0.25s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${tokens.brand.accentDark} 0%, ${tokens.brand.accent} 100%)`,
              boxShadow: '0 8px 20px rgba(93,26,137,0.38)',
            },
            '&:disabled': { opacity: 0.5, background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.primary} 100%)`, color: '#fff' },
          }}
        >
          {isPending ? 'Pushing…' : 'Push to Board'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PushToSalesBoardModal;
