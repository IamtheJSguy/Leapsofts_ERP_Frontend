import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { PriorityBadge } from '@/components/kpi/PriorityBadge';
import { SalesKpiAssignmentsPanel } from '@/components/kpi/SalesKpiAssignmentsPanel';
import { SalesKpiTemplateForm } from '@/components/kpi/SalesKpiTemplateForm';
import { useAssignSalesKpiTemplate, useDeleteSalesKpiTemplate, useSalesKpiTemplates } from '@/hooks/api/useSalesKpis';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { SALES_KPI_METRIC_LABELS } from '@/lib/constants';
import { formatWeekdays } from '@/lib/salesKpi';
import { useUIStore } from '@/store/useUIStore';
import { showApiError } from '@/utils/apiError';
import { tokens } from '@/styles/tokens';
import type { SalesKpiTemplate, User } from '@/types';

export const SalesKpiPanel = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);

  const { data: templates = [], isLoading } = useSalesKpiTemplates();
  const assignableUsers = useAssignableUsers();
  const deleteMutation = useDeleteSalesKpiTemplate();
  const assignMutation = useAssignSalesKpiTemplate();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SalesKpiTemplate | null>(null);
  const [assignTarget, setAssignTarget] = useState<SalesKpiTemplate | null>(null);
  const [assignUsers, setAssignUsers] = useState<User[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SalesKpiTemplate | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, template: SalesKpiTemplate) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedTemplate(null);
  };

  const handleMenuAssign = () => {
    if (selectedTemplate) {
      setAssignTarget(selectedTemplate);
      setAssignUsers([]);
    }
    handleCloseMenu();
  };

  const handleMenuEdit = () => {
    if (selectedTemplate) {
      setEditing(selectedTemplate);
      setFormOpen(true);
    }
    handleCloseMenu();
  };

  const handleMenuDelete = () => {
    if (selectedTemplate) {
      handleDelete(selectedTemplate._id);
    }
    handleCloseMenu();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ message: 'Sales KPI template deleted.', severity: 'success' });
    } catch (err) {
      showApiError(err);
    }
  };

  const handleAssign = async () => {
    if (!assignTarget || assignUsers.length === 0) return;
    try {
      await assignMutation.mutateAsync({ id: assignTarget._id, userIds: assignUsers.map((u) => u._id) });
      addToast({ message: 'Sales KPI template assigned.', severity: 'success' });
      setAssignTarget(null);
      setAssignUsers([]);
    } catch (err) {
      showApiError(err);
    }
  };

  const sectionHeading = (title: string, subtitle: string) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary, fontWeight: 500 }}>
        {subtitle}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: { xs: 2.5, sm: 3 } }}>
          {sectionHeading('Sales KPI Templates', 'Weekday-scheduled tasks that generate and progress themselves from pipeline activity.')}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditing(null); setFormOpen(true); }}
            sx={{
              textTransform: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              boxShadow: 'none',
              bgcolor: tokens.brand.solid,
              '&:hover': { bgcolor: tokens.brand.solid },
              width: { xs: '100%', sm: 'auto' },
              whiteSpace: 'nowrap',
            }}
          >
            Create Template
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : templates.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '24px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, boxShadow: 'none' }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.disabled' }}>No sales KPI templates yet.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {templates.map((template) => (
              <Card
                key={template._id}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: '20px',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': { borderColor: tokens.brand.primary },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ minWidth: 0, flex: 1, pr: 0.5 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 800,
                        color: isDarkMode ? '#fff' : tokens.text.primary,
                        wordBreak: 'break-word',
                        lineHeight: 1.35,
                        fontSize: { xs: '0.98rem', sm: '1.05rem' },
                      }}
                    >
                      {template.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDarkMode ? 'rgba(255,255,255,0.6)' : tokens.text.secondary,
                        fontWeight: 500,
                        wordBreak: 'break-word',
                        mt: 0.25,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      }}
                    >
                      {template.description || `${template.items?.length ?? 0} item${(template.items?.length ?? 0) === 1 ? '' : 's'}`}
                    </Typography>
                  </Box>

                  <Tooltip title="Actions" arrow placement="top">
                    <IconButton
                      size="small"
                      aria-label="template actions"
                      aria-haspopup="true"
                      onClick={(e) => handleOpenMenu(e, template)}
                      sx={{
                        color: isDarkMode ? 'rgba(255,255,255,0.65)' : tokens.text.secondary,
                        borderRadius: '10px',
                        p: 0.75,
                        flexShrink: 0,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                          color: tokens.brand.primary,
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93, 26, 137, 0.08)',
                          transform: 'scale(1.08)',
                        },
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  {(template.items ?? []).map((item, index) => (
                    <Box
                      key={item._id ?? index}
                      sx={{
                        display: 'flex',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                        p: { xs: 1.25, sm: 1.25 },
                        borderRadius: '14px',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 750, minWidth: { xs: 'auto', sm: 140 }, wordBreak: 'break-word' }}>
                        {item.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={SALES_KPI_METRIC_LABELS[item.metric] ?? item.metric}
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(93, 26, 137, 0.08)', color: tokens.brand.primary }}
                        />
                        <Chip
                          label={item.scheduleMode === 'span' ? 'Single task' : 'Per day'}
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: 'text.secondary' }}
                        />
                        <PriorityBadge priority={item.priority} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {formatWeekdays(item.daysOfWeek)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          · {item.targetMode === 'manual' ? `Target ${item.targetValue ?? '—'}` : 'Target from pipeline'}
                        </Typography>
                        {(item.startTime || item.endTime) && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            · {item.startTime || 'start of day'} – {item.endTime || 'end of day'}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <Box>
        {sectionHeading('Assignees', 'Edit a member’s weekdays, times, target or priority — changes apply to tasks generated from tomorrow.')}
        <SalesKpiAssignmentsPanel />
      </Box>

      {formOpen && (
        <SalesKpiTemplateForm open onClose={() => setFormOpen(false)} template={editing} />
      )}

      {/* 3-dots Actions Menu */}
      <Menu
        id="template-action-menu"
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1,
              minWidth: 160,
              borderRadius: '16px',
              bgcolor: isDarkMode ? 'rgba(28, 25, 34, 0.98)' : '#fff',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDarkMode ? '0 12px 32px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.08)',
              p: 0.75,
            },
          },
        }}
      >
        <MenuItem
          onClick={handleMenuAssign}
          sx={{
            py: 1,
            px: 1.5,
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: tokens.brand.primary,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.2)' : 'rgba(93, 26, 137, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: tokens.brand.primary }}>
            <PersonAddAlt1Icon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }}>
            Assign
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={handleMenuEdit}
          sx={{
            py: 1,
            px: 1.5,
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: isDarkMode ? '#fff' : tokens.text.primary,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary }}>
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Edit
          </ListItemText>
        </MenuItem>

        <MenuItem
          disabled={deleteMutation.isPending}
          onClick={handleMenuDelete}
          sx={{
            py: 1,
            px: 1.5,
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: tokens.semantic.error,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: tokens.semantic.error }}>
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600, color: tokens.semantic.error }}>
            Delete
          </ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            m: { xs: 2, sm: 4 },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' },
            borderRadius: '20px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Assign “{assignTarget?.name}”</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Autocomplete
            multiple
            options={assignableUsers}
            getOptionLabel={(u) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email}
            value={assignUsers}
            onChange={(_, v) => setAssignUsers(v)}
            renderInput={(params) => <TextField {...params} label="Assign to users" autoFocus />}
            sx={{ '& .MuiChip-root': { borderRadius: '8px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAssignTarget(null)} sx={{ textTransform: 'none', fontWeight: 700, color: tokens.text.secondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={assignUsers.length === 0 || assignMutation.isPending}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', boxShadow: 'none', bgcolor: tokens.brand.solid, '&:hover': { bgcolor: tokens.brand.solid } }}
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
