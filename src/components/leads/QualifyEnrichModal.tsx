import React, { useEffect, useState, useCallback, memo } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, CircularProgress,
  TextField, IconButton, Divider, useTheme, Fade,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import DescriptionIcon from '@mui/icons-material/Description';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useLead, useQualifyLead } from '@/hooks/api/useLeads';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type { Lead } from '@/types';

interface QualifyEnrichModalProps {
  open: boolean;
  leadId: string;
  onClose: () => void;
  onSuccess: (boardId?: string, projectId?: string) => void;
}

const DEFAULT_SECTIONS = [
  { key: 'companyDetails', label: 'Company Details', icon: <BusinessCenterIcon sx={{ fontSize: 18 }} /> },
  { key: 'painPoints', label: 'Pain Points', icon: <AutoAwesomeIcon sx={{ fontSize: 18 }} /> },
  { key: 'budget', label: 'Budget', icon: <MonetizationOnIcon sx={{ fontSize: 18 }} /> },
  { key: 'decisionTimeline', label: 'Decision Timeline', icon: <AccessTimeIcon sx={{ fontSize: 18 }} /> },
];

// --- Subcomponent: Lead Summary Column (Left) ---
const LeadSummaryColumn = memo(({ 
  leadData, onChange, isPending, errors, isDarkMode, avatarChar 
}: any) => {
  
  const renderField = (label: string, field: keyof Lead, placeholder?: string) => {
    const errorText = errors[field];
    return (
      <Box sx={{ mb: 3, position: 'relative' }}>
        <Typography variant="caption" sx={{ 
          color: errorText ? tokens.semantic.error : tokens.text.muted, 
          fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.06em',
          display: 'block', mb: 0.8, pl: 1
        }}>
          {label}
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          value={leadData[field] || ''}
          onChange={(e) => onChange(field, e.target.value)}
          disabled={isPending}
          InputProps={{
            sx: {
              borderRadius: '16px',
              bgcolor: errorText 
                ? (isDarkMode ? 'rgba(196, 69, 69, 0.08)' : 'rgba(196, 69, 69, 0.04)')
                : (isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'),
              transition: 'all 0.2s ease',
              fontSize: '0.95rem',
              fontWeight: 500,
              color: errorText ? tokens.semantic.error : tokens.text.primary,
              '& fieldset': { border: 'none' },
              '&:hover': {
                bgcolor: errorText 
                  ? (isDarkMode ? 'rgba(196, 69, 69, 0.12)' : 'rgba(196, 69, 69, 0.08)')
                  : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
              },
              '&.Mui-focused': {
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                boxShadow: errorText 
                  ? `0 0 0 2px ${tokens.semantic.error}33`
                  : `0 0 0 2px ${tokens.brand.primary}33`,
              }
            }
          }}
        />
        {/* Elegant absolute positioned error to prevent layout shifting */}
        {errorText && (
          <Typography variant="caption" sx={{ 
            color: tokens.semantic.error, fontWeight: 600, 
            position: 'absolute', bottom: -20, left: 12, fontSize: '0.75rem'
          }}>
            {errorText}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ 
      flex: '0 0 380px', p: 5, 
      maxHeight: '75vh', overflowY: 'auto',
      bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.01)',
      borderRight: { md: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}` },
      borderBottom: { xs: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}`, md: 'none' }
    }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ 
          width: 72, height: 72, borderRadius: '24px', flexShrink: 0,
          background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.primary} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '2rem', fontWeight: 800,
          boxShadow: '0 12px 24px rgba(93, 26, 137, 0.15)'
        }}>
          {avatarChar}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>{renderField('First Name', 'firstName')}</Box>
          <Box sx={{ flex: 1 }}>{renderField('Last Name', 'lastName')}</Box>
        </Box>
        {renderField('Job Title', 'title')}
        {renderField('Company', 'company')}
        {renderField('Email', 'email')}
        {renderField('Phone', 'phone')}
        {renderField('LinkedIn', 'linkedInUrl')}
        {renderField('Industry', 'industry')}
        {renderField('Company Size', 'companySize')}
        {renderField('Location', 'location')}
      </Box>
    </Box>
  );
});

// --- Subcomponent: Enrichment Column (Right) ---
const EnrichmentColumn = memo(({ 
  sections, onSectionChange, notes, onNotesChange, isPending, isDarkMode 
}: any) => {
  return (
    <Box sx={{ flex: 1, p: 5, maxHeight: '75vh', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ fontWeight: 850, color: tokens.text.primary, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AutoAwesomeIcon sx={{ color: tokens.brand.accent, fontSize: 22 }} /> Profile Enrichment
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {DEFAULT_SECTIONS.map((sec) => (
          <Box key={sec.key}>
            <Typography variant="body2" sx={{ fontWeight: 750, color: tokens.text.secondary, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              {sec.icon} {sec.label}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={sec.key === 'painPoints' ? 3 : 2}
              placeholder={`Add ${sec.label.toLowerCase()} details...`}
              value={sections[sec.key] || ''}
              onChange={(e) => onSectionChange(sec.key, e.target.value)}
              disabled={isPending}
              InputProps={{
                sx: {
                  borderRadius: '20px',
                  bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.015)',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  '& fieldset': { border: 'none' },
                  '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
                  '&.Mui-focused': { 
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    boxShadow: `0 0 0 2px ${tokens.brand.primary}22` 
                  },
                }
              }}
            />
          </Box>
        ))}

        <Divider sx={{ my: 2, borderColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 750, color: tokens.text.secondary, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            <DescriptionIcon sx={{ fontSize: 18 }} /> General Notes
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Any additional context or strategic notes..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            disabled={isPending}
            InputProps={{
              sx: {
                borderRadius: '20px',
                bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.015)',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                '& fieldset': { border: 'none' },
                '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
                '&.Mui-focused': { 
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  boxShadow: `0 0 0 2px ${tokens.brand.primary}22` 
                },
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
});

// --- Main Modal Component ---
export const QualifyEnrichModal = ({ open, leadId, onClose, onSuccess }: QualifyEnrichModalProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const { data: lead, isLoading: isLeadLoading } = useLead(open ? leadId : undefined);
  const qualifyLead = useQualifyLead();
  const addToast = useUIStore((s) => s.addToast);

  const [leadData, setLeadData] = useState<Partial<Lead>>({});
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<{ email?: string; linkedInUrl?: string }>({});

  const validateEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateLinkedIn = (url: string) => {
    if (!url) return true;
    return /^https?:\/\/(www\.)?linkedin\.com\/.*$/.test(url);
  };

  useEffect(() => {
    if (lead && open) {
      setLeadData({
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        title: lead.title || '',
        company: lead.company || '',
        email: lead.email || '',
        industry: lead.industry || '',
        phone: lead.phone || '',
        companySize: lead.companySize || '',
        linkedInUrl: lead.linkedInUrl || '',
        location: lead.location || '',
      });
      setNotes(lead.notes || '');
      const newSections: Record<string, string> = {
        companyDetails: '', painPoints: '', budget: '', decisionTimeline: ''
      };
      if (lead.profileSections) {
        lead.profileSections.forEach((sec) => {
          const matched = DEFAULT_SECTIONS.find(d => d.label.toLowerCase() === sec.title.toLowerCase());
          if (matched) {
            newSections[matched.key] = sec.content;
          }
        });
      }
      setSections(newSections);
      setErrors({});
    }
  }, [lead, open]);

  // Use callbacks to prevent re-rendering subcomponents unnecessarily
  const handleLeadDataChange = useCallback((field: keyof Lead, value: string) => {
    setLeadData(prev => ({ ...prev, [field]: value }));
    if (field === 'email' || field === 'linkedInUrl') {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const handleSectionChange = useCallback((key: string, value: string) => {
    setSections(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
  }, []);

  const handlePush = async () => {
    if (!leadId) return;

    let hasError = false;
    const newErrors: { email?: string; linkedInUrl?: string } = {};

    if (!validateEmail(leadData.email || '')) {
      newErrors.email = 'Invalid email format';
      hasError = true;
    }
    if (!validateLinkedIn(leadData.linkedInUrl || '')) {
      newErrors.linkedInUrl = 'Must be a valid LinkedIn URL';
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;
    
    try {
      const profileSections = DEFAULT_SECTIONS.map((sec) => ({
        title: sec.label,
        content: sections[sec.key] || ''
      })).filter(sec => sec.content.trim() !== '');

      const { title, email, linkedInUrl, ...restLeadData } = leadData;
      const res: any = await qualifyLead.mutateAsync({
        id: leadId,
        ...restLeadData,
        ...(title ? { jobTitle: title } : {}),
        ...(email?.trim() ? { email: email.trim() } : {}),
        ...(linkedInUrl?.trim() ? { linkedInUrl: linkedInUrl.trim() } : {}),
        ...(notes?.trim() ? { notes } : {}),
        profileSections,
      });
      const board = res?.data?.data?.board || res?.data?.board;
      
      onSuccess(board?._id, board?.projectId || 'leads');
    } catch (err: any) {
      console.error('Failed to enrich and qualify lead:', err);
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to enrich and qualify lead.';
      addToast({ message: msg, severity: 'error' });
    }
  };

  const isPending = qualifyLead.isPending;

  return (
    <Dialog 
      open={open} 
      onClose={isPending ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '32px',
          bgcolor: isDarkMode ? 'rgba(20, 20, 24, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(30px)',
          border: 'none',
          boxShadow: isDarkMode 
            ? '0 32px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05) inset' 
            : '0 32px 64px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.02) inset',
          backgroundImage: 'none',
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 5, py: 4, borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}` }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 850, color: tokens.text.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
              Qualify Lead
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.text.secondary, fontWeight: 500 }}>
              Review and enrich the profile before pushing it to the pipeline.
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose} 
            disabled={isPending} 
            sx={{ 
              color: tokens.text.muted, 
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              p: 1.5,
              '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' } 
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {isLeadLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 10 }}>
            <CircularProgress sx={{ color: tokens.brand.primary }} size={48} thickness={4} />
          </Box>
        ) : !lead ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Typography color="error" sx={{ fontSize: '1.2rem', fontWeight: 600 }}>Failed to load lead details.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
            <LeadSummaryColumn 
              leadData={leadData} 
              onChange={handleLeadDataChange} 
              isPending={isPending} 
              errors={errors} 
              isDarkMode={isDarkMode}
              avatarChar={lead.firstName?.charAt(0) || lead.prospectName?.charAt(0) || '?'}
            />
            <EnrichmentColumn 
              sections={sections} 
              onSectionChange={handleSectionChange} 
              notes={notes} 
              onNotesChange={handleNotesChange} 
              isPending={isPending} 
              isDarkMode={isDarkMode} 
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 4, px: 5, 
        borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}`, 
        bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.01)' 
      }}>
        <Button 
          onClick={onClose} 
          disabled={isPending}
          sx={{ 
            color: tokens.text.secondary, fontWeight: 750, borderRadius: '16px', px: 4, py: 1.5, textTransform: 'none', fontSize: '1rem'
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handlePush} 
          disabled={isPending || !lead}
          variant="contained"
          sx={{ 
            bgcolor: tokens.brand.primary, color: '#fff', fontWeight: 800, borderRadius: '16px', px: 6, py: 1.5, textTransform: 'none', fontSize: '1rem',
            background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.primary} 100%)`,
            boxShadow: '0 8px 24px rgba(93, 26, 137, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${tokens.brand.accentDark} 0%, ${tokens.brand.accent} 100%)`,
              boxShadow: '0 12px 32px rgba(93, 26, 137, 0.4)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          {isPending ? 'Processing...' : 'Qualify & Push'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
