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
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PriorityBadge } from '@/components/kpi/PriorityBadge';
import { SalesKpiAssignmentsPanel } from '@/components/kpi/SalesKpiAssignmentsPanel';
import { SalesKpiTemplateForm } from '@/components/kpi/SalesKpiTemplateForm';
import { useAssignSalesKpiTemplate, useDeleteSalesKpiTemplate, useSalesKpiTemplates } from '@/hooks/api/useSalesKpis';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { SALES_KPI_METRIC_LABELS } from '@/lib/constants';
import { formatWeekdays } from '@/lib/salesKpi';
import { useUIStore } from '@/store/useUIStore';
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

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ message: 'Sales KPI template deleted.', severity: 'success' });
    } catch {
      addToast({ message: 'Failed to delete the sales KPI template.', severity: 'error' });
    }
  };

  const handleAssign = async () => {
    if (!assignTarget || assignUsers.length === 0) return;
    try {
      await assignMutation.mutateAsync({ id: assignTarget._id, userIds: assignUsers.map((u) => u._id) });
      addToast({ message: 'Sales KPI template assigned.', severity: 'success' });
      setAssignTarget(null);
      setAssignUsers([]);
    } catch {
      addToast({ message: 'Failed to assign the sales KPI template.', severity: 'error' });
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          {sectionHeading('Sales KPI Templates', 'Weekday-scheduled tasks that generate and progress themselves from pipeline activity.')}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditing(null); setFormOpen(true); }}
            sx={{ textTransform: 'none', borderRadius: '12px', fontWeight: 700, boxShadow: 'none', bgcolor: tokens.brand.primary, '&:hover': { bgcolor: tokens.brand.primary } }}
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
                  p: 2.5,
                  borderRadius: '20px',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': { borderColor: tokens.brand.primary },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary }}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : tokens.text.secondary, fontWeight: 500 }}>
                      {template.description || `${template.items?.length ?? 0} item${(template.items?.length ?? 0) === 1 ? '' : 's'}`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => { setAssignTarget(template); setAssignUsers([]); }} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', color: tokens.brand.primary }}>
                      Assign
                    </Button>
                    <Button size="small" onClick={() => { setEditing(template); setFormOpen(true); }} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', color: tokens.text.secondary, '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: tokens.text.primary } }}>
                      Edit
                    </Button>
                    <Button size="small" color="error" disabled={deleteMutation.isPending} onClick={() => handleDelete(template._id)} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', '&:hover': { bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)' } }}>
                      Delete
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  {(template.items ?? []).map((item, index) => (
                    <Box
                      key={item._id ?? index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        p: 1.25,
                        borderRadius: '14px',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 750, minWidth: 140 }}>{item.name}</Typography>
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

      <Dialog
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : '#fff', backgroundImage: 'none' } }}
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
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', boxShadow: 'none', bgcolor: tokens.brand.primary, '&:hover': { bgcolor: tokens.brand.primary } }}
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
