import { useState, useMemo } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderOffOutlinedIcon from '@mui/icons-material/FolderOffOutlined';
import { tokens } from '@/styles/tokens';
import { usePermissions } from '@/hooks/usePermissions';
import { InvoiceSettingsButton } from '@/components/invoices/InvoiceSettingsButton';
import { useInvoiceLeave } from '@/components/invoices/InvoiceLeaveGuard';
import { InvoiceClientFields } from '@/components/invoices/InvoiceClientFields';
import { apiErrorMessage, useInvoiceClients, useInvoiceMutations } from '@/hooks/api/useInvoices';
import { emptyClientForm, type InvoiceClientForm } from '@/types/invoice';

const headerButtonSx = {
  textTransform: 'none',
  height: 42,
  minHeight: 42,
  py: 0,
  px: 2,
  fontWeight: 750,
  fontSize: '0.85rem',
  borderRadius: '12px',
};

const InvoicesPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const clients = useInvoiceClients(includeArchived);
  const mutations = useInvoiceMutations();
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InvoiceClientForm>(emptyClientForm());
  const [baseline, setBaseline] = useState(JSON.stringify(emptyClientForm()));

  const startCreate = () => {
    const next = emptyClientForm();
    setError('');
    setForm(next);
    setBaseline(JSON.stringify(next));
    setOpen(true);
  };

  const save = async (): Promise<boolean> => {
    setError('');
    try {
      await mutations.createClient.mutateAsync(form);
      setBaseline(JSON.stringify(form));
      setOpen(false);
      return true;
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the client'));
      return false;
    }
  };

  const { dialog } = useInvoiceLeave(
    open && JSON.stringify(form) !== baseline,
    save,
    mutations.createClient.isPending,
  );

  const rawList = clients.data || [];

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawList;
    return rawList.filter((client) => {
      const name = (client.name || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const ntn = (client.ntn || '').toLowerCase();
      const industry = (client.industry || '').toLowerCase();
      const location = (client.location || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        ntn.includes(q) ||
        industry.includes(q) ||
        location.includes(q)
      );
    });
  }, [rawList, searchQuery]);

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6 }}>
      {dialog}
      
      {/* Page Header */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 850,
              letterSpacing: '-0.025em',
              color: isDarkMode ? '#fff' : tokens.text.primary,
              mb: 0.5,
            }}
          >
            Invoices & Clients
          </Typography>
          <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary, fontWeight: 500 }}>
            Choose a client to manage their invoice history, or add a company you bill.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={includeArchived}
                onChange={(event) => setIncludeArchived(event.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: tokens.brand.primary,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: tokens.brand.primary,
                  },
                }}
              />
            }
            label="Show archived"
            sx={{
              mr: 0.5,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              px: 1.5,
              py: 0.5,
              borderRadius: '12px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
              m: 0,
              '& .MuiFormControlLabel-label': { fontSize: '0.8125rem', fontWeight: 650, color: 'text.secondary' },
            }}
          />

          {isAdmin && <InvoiceSettingsButton isDarkMode={isDarkMode} />}

          <Button
            variant="contained"
            onClick={startCreate}
            startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
            sx={{
              ...headerButtonSx,
              bgcolor: tokens.brand.primary,
              boxShadow: isDarkMode ? '0 4px 14px rgba(155,107,184,0.3)' : '0 4px 14px rgba(93,26,137,0.25)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                transform: 'translateY(-1px)',
                boxShadow: isDarkMode ? '0 6px 20px rgba(155,107,184,0.45)' : '0 6px 20px rgba(93,26,137,0.35)',
              },
            }}
          >
            Add client
          </Button>
        </Box>
      </Box>

      {/* Modern Capsule Search Bar & Results Counter */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by client name, email, NTN, or city..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 420, md: 460 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              height: 44,
              px: 1,
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : '#ffffff',
              border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93, 26, 137, 0.12)'}`,
              boxShadow: isDarkMode ? 'none' : '0 4px 16px rgba(93, 26, 137, 0.04)',
              transition: 'all 0.2s ease',
              '& fieldset': { border: 'none' },
              '&:hover': {
                borderColor: tokens.brand.primary,
                boxShadow: isDarkMode
                  ? '0 4px 20px rgba(155, 107, 184, 0.15)'
                  : '0 4px 20px rgba(93, 26, 137, 0.08)',
              },
              '&.Mui-focused': {
                borderColor: tokens.brand.primary,
                boxShadow: `0 0 0 3px ${isDarkMode ? 'rgba(155,107,184,0.25)' : 'rgba(93,26,137,0.12)'}`,
              }
            },
            '& .MuiOutlinedInput-input': {
              fontSize: '0.875rem',
              fontWeight: 500,
              color: isDarkMode ? '#ffffff' : tokens.text.primary,
              '&::placeholder': {
                color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.42)',
                opacity: 1,
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: 0.5 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.15)' : 'rgba(93, 26, 137, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tokens.brand.primary,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 18 }} />
                </Box>
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  sx={{
                    p: 0.5,
                    color: 'text.secondary',
                    '&:hover': { color: tokens.brand.primary },
                  }}
                >
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <Chip
          label={`${filteredList.length} ${filteredList.length === 1 ? 'Client' : 'Clients'}`}
          size="small"
          sx={{
            height: 28,
            px: 1,
            fontWeight: 750,
            fontSize: '0.78rem',
            bgcolor: isDarkMode ? 'rgba(155, 107, 184, 0.12)' : 'rgba(93, 26, 137, 0.06)',
            color: isDarkMode ? '#E9D5FF' : tokens.brand.primary,
            borderRadius: '999px',
            border: `1px solid ${isDarkMode ? 'rgba(155, 107, 184, 0.25)' : 'rgba(93, 26, 137, 0.12)'}`,
          }}
        />
      </Box>

      {error && !open && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '14px' }}>{error}</Alert>}
      {clients.isError && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '14px' }}>{apiErrorMessage(clients.error, 'Could not load clients')}</Alert>}

      {clients.isLoading ? (
        <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={36} sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : filteredList.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 7,
            px: 3,
            textAlign: 'center',
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
            border: `1.5px dashed ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '18px',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(93,26,137,0.04)',
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderOffOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDarkMode ? '#fff' : tokens.text.primary, mb: 0.5 }}>
              {searchQuery ? 'No matching clients found' : 'No clients added yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto', fontWeight: 500 }}>
              {searchQuery
                ? `We couldn't find any clients matching "${searchQuery}". Try adjusting your search term.`
                : 'Click "Add client" above to start registering client profiles and generating invoices.'}
            </Typography>
          </Box>
          {searchQuery ? (
            <Button
              size="small"
              onClick={() => setSearchQuery('')}
              sx={{ textTransform: 'none', fontWeight: 700, mt: 1, color: tokens.brand.primary }}
            >
              Clear Search Filter
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={startCreate}
              startIcon={<AddIcon />}
              sx={{
                mt: 1,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 750,
                bgcolor: tokens.brand.primary,
              }}
            >
              Add First Client
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {filteredList.map((client) => {
            const initial = (client.name?.charAt(0) || 'C').toUpperCase();
            return (
              <Card
                key={client._id}
                onClick={() => navigate(`/invoices/clients/${client._id}`)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderRadius: '18px',
                  bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.55)' : '#ffffff',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(26, 22, 37, 0.03)',
                  transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: isDarkMode ? 'rgba(155, 107, 184, 0.4)' : tokens.brand.primaryMuted,
                    boxShadow: isDarkMode
                      ? '0 10px 24px -4px rgba(93, 26, 137, 0.3)'
                      : '0 10px 24px -4px rgba(93, 26, 137, 0.1)',
                    '& .card-arrow-icon': {
                      color: tokens.brand.primary,
                      transform: 'translateX(3px)',
                    }
                  },
                }}
              >
                {/* Header: Company Avatar + Name + Status Chip */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '12px',
                        background: isDarkMode
                          ? 'linear-gradient(135deg, rgba(93, 26, 137, 0.45) 0%, rgba(155, 107, 184, 0.25) 100%)'
                          : 'linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)',
                        border: `1.2px solid ${isDarkMode ? 'rgba(149, 99, 184, 0.35)' : 'rgba(93, 26, 137, 0.15)'}`,
                        color: isDarkMode ? '#E9D5FF' : tokens.brand.primary,
                        fontWeight: 850,
                        fontSize: '0.95rem',
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        noWrap
                        sx={{
                          fontWeight: 800,
                          color: isDarkMode ? '#ffffff' : tokens.text.primary,
                          letterSpacing: '-0.01em',
                          fontSize: '0.92rem',
                          lineHeight: 1.25,
                        }}
                      >
                        {client.name}
                      </Typography>
                      {client.industry && (
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            color: tokens.brand.primary,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            display: 'block',
                            mt: 0.1,
                          }}
                        >
                          {client.industry}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Chip
                    size="small"
                    label={client.isArchived ? 'Archived' : 'Active'}
                    sx={{
                      height: 20,
                      px: 0.25,
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      bgcolor: client.isArchived
                        ? isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                        : isDarkMode ? 'rgba(45, 138, 94, 0.18)' : 'rgba(45, 138, 94, 0.1)',
                      color: client.isArchived
                        ? 'text.secondary'
                        : tokens.semantic.success,
                      border: `1px solid ${
                        client.isArchived
                          ? isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                          : 'rgba(45, 138, 94, 0.28)'
                      }`,
                      borderRadius: '6px',
                      flexShrink: 0,
                    }}
                  />
                </Box>

                {/* Compact Metadata Rows */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85, minWidth: 0 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 15, color: tokens.brand.primary, flexShrink: 0, opacity: 0.85 }} />
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontSize: '0.8rem',
                        color: isDarkMode ? 'rgba(255,255,255,0.8)' : tokens.text.primary,
                        fontWeight: 550,
                      }}
                    >
                      {client.email}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {client.ntn && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ReceiptLongOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}
                        >
                          NTN: <strong>{client.ntn}</strong>
                        </Typography>
                      </Box>
                    )}

                    {(client.location || client.phone) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {client.ntn && <Typography variant="caption" sx={{ color: 'text.disabled' }}>•</Typography>}
                        <LocationOnOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 550 }}
                        >
                          {[client.location, client.phone].filter(Boolean).join(' · ')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Card Footer CTA Bar */}
                <Box
                  sx={{
                    pt: 1,
                    borderTop: `1px dashed ${isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      color: tokens.brand.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Manage Billing
                  </Typography>

                  <ChevronRightIcon
                    className="card-arrow-icon"
                    sx={{
                      fontSize: 16,
                      color: 'text.secondary',
                      transition: 'transform 0.2s ease, color 0.2s ease',
                    }}
                  />
                </Box>
              </Card>
            );

          })}
        </Box>
      )}


      {/* New Client Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDarkMode ? 'rgba(24, 21, 30, 0.98)' : '#FFFFFF',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: isDarkMode ? '0 24px 48px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle
          sx={{
            py: 2.5,
            px: 3.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 850, color: isDarkMode ? '#ffffff' : tokens.text.primary, fontSize: '1.2rem', lineHeight: 1.2 }}>
              New client profile
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mt: 0.25 }}>
              Register billing details and business metadata for invoice generation.
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            sx={{
              color: 'text.secondary',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', color: tokens.brand.primary },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            py: 3,
            px: 3.5,
            maxHeight: 'calc(85vh - 140px)',
            overflowY: 'auto',
            scrollbarWidth: 'none', /* Firefox */
            '&::-webkit-scrollbar': { display: 'none' }, /* Chrome, Safari, Edge, Brave */
            msOverflowStyle: 'none', /* IE/Edge */
          }}
        >
          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>{error}</Alert>}
          <InvoiceClientFields value={form} onChange={setForm} />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3.5,
            py: 2,
            gap: 1.25,
            borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.3)' : 'rgba(248, 250, 252, 0.6)',
          }}
        >
          <Button
            onClick={() => setOpen(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '12px',
              color: 'text.secondary',
              px: 2.5,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            variant="contained"
            disabled={mutations.createClient.isPending}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '12px',
              bgcolor: tokens.brand.primary,
              px: 3.5,
              py: 0.9,
              fontSize: '0.875rem',
              boxShadow: isDarkMode ? '0 4px 14px rgba(155,107,184,0.3)' : '0 4px 14px rgba(93,26,137,0.25)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                transform: 'translateY(-1px)',
              }
            }}
          >
            {mutations.createClient.isPending ? 'Saving client...' : 'Save client'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoicesPage;

