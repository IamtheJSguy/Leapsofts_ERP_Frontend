import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { tokens } from '@/styles/tokens';
import {
  cellStatusTooltip,
  formatDoneTargetPair,
  type TaskDisplay,
  type WeekTableCell,
  type WeekTableModel,
} from '@/lib/memberKpiWeekTable';

const statusColors = (display: TaskDisplay) => {
  if (display.isOverdue) {
    return {
      color: tokens.semantic.error,
      bg: 'rgba(239, 68, 68, 0.12)',
    };
  }
  if (!display.isCompleted || display.isCompletedLate) {
    return {
      color: tokens.semantic.warning,
      bg: 'rgba(245, 158, 11, 0.14)',
    };
  }
  return {
    color: tokens.semantic.success,
    bg: 'rgba(16, 185, 129, 0.12)',
  };
};

const ValueCell = ({ cell, isDarkMode }: { cell: WeekTableCell; isDarkMode: boolean }) => {
  const { color, bg } = statusColors(cell.display);
  const pair = formatDoneTargetPair(cell.done, cell.target);
  const label = cellStatusTooltip(cell.display.statusLabel, cell.done, cell.target);
  return (
    <TableCell
      colSpan={cell.colSpan}
      align="center"
      sx={{
        bgcolor: bg,
        color,
        fontWeight: 700,
        fontSize: '0.82rem',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        whiteSpace: 'nowrap',
      }}
    >
      <Tooltip title={label}>
        <Box component="span" sx={{ cursor: 'default' }}>
          {pair ?? cell.display.statusLabel}
        </Box>
      </Tooltip>
    </TableCell>
  );
};

export function MemberKpiWeekTable({
  model,
  isDarkMode,
  title,
}: {
  model: WeekTableModel;
  isDarkMode: boolean;
  title?: string;
}) {
  if (model.workingDays.length === 0 || model.rows.length === 0) return null;

  const emptySx = {
    color: 'text.disabled',
    bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    fontWeight: 600,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {title && (
        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isDarkMode ? '#fff' : tokens.text.primary }}>
          {title}
        </Typography>
      )}
      <TableContainer
        sx={{
          borderRadius: '16px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          overflowX: 'auto',
        }}
      >
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 800,
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff',
                  minWidth: 160,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }}
              >
                KPI
              </TableCell>
              {model.columnLabels.map((label) => (
                <TableCell
                  key={label}
                  align="center"
                  sx={{
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  {label}
                </TableCell>
              ))}
              <TableCell
                align="center"
                sx={{
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }}
              >
                Week total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {model.rows.map((row) => {
              const totalColors = statusColors(row.totalDisplay);
              const totalPair = formatDoneTargetPair(row.totalDone, row.totalTarget);
              const totalLabel = cellStatusTooltip(
                row.totalDisplay.statusLabel,
                row.totalDone,
                row.totalTarget,
              );
              return (
                <TableRow key={row.id}>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {row.name}
                  </TableCell>
                  {row.cells.map((cell, idx) => {
                    if (cell === 'covered') return null;
                    if (!cell) {
                      return (
                        <TableCell key={`${row.id}-${idx}`} align="center" sx={emptySx}>
                          —
                        </TableCell>
                      );
                    }
                    return <ValueCell key={`${row.id}-${idx}`} cell={cell} isDarkMode={isDarkMode} />;
                  })}
                  <TableCell
                    align="center"
                    sx={{
                      bgcolor: totalColors.bg,
                      color: totalColors.color,
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Tooltip title={totalLabel}>
                      <Box component="span" sx={{ cursor: 'default' }}>
                        {totalPair ?? row.totalDisplay.statusLabel}
                      </Box>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
