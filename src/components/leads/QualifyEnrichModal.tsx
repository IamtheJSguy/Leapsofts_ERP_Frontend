import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress,
  TextField, IconButton, Divider, useTheme,
  Autocomplete, Chip, Avatar, Collapse, Link,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import DescriptionIcon from '@mui/icons-material/Description';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import { useLead, useQualifyLead, useUpdateLead } from '@/hooks/api/useLeads';
import { useMeetings, useCreateMeeting } from '@/hooks/api/useMeetings';
import { useUsers } from '@/hooks/api/useUsers';
import { useUIStore } from '@/store/useUIStore';
import { tokens } from '@/styles/tokens';
import type { Lead, Meeting, User } from '@/types';
import { composeProspectName, splitProspectName } from '@/utils/formatters';

interface QualifyEnrichModalProps {
  open: boolean;
  leadId: string;
  mode?: 'update' | 'qualify';
  onClose: () => void;
  onSuccess: (boardId?: string, projectId?: string) => void;
}

const DEFAULT_SECTIONS = [
  { key: 'companyDetails', label: 'Company Details', icon: <BusinessCenterIcon sx={{ fontSize: 18 }} /> },
  { key: 'painPoints', label: 'Pain Points', icon: <AutoAwesomeIcon sx={{ fontSize: 18 }} /> },
  { key: 'budget', label: 'Budget', icon: <MonetizationOnIcon sx={{ fontSize: 18 }} /> },
  { key: 'decisionTimeline', label: 'Decision Timeline', icon: <AccessTimeIcon sx={{ fontSize: 18 }} /> },
];

const userIdOf = (u: string | User): string => (typeof u === 'string' ? u : u?._id);

const userLabel = (u: User) =>
  `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User';

/** Local datetime-local min value (yyyy-MM-dd'T'HH:mm) so past times cannot be chosen. */
const getMinDateTimeLocal = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const formatMeetingWhen = (iso: string) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso || '—';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso || '—';
  }
};

// --- Subcomponent: Lead Summary Column (Left) ---
const LeadSummaryColumn = memo(({
  leadData, onChange, isPending, errors, isDarkMode, avatarChar,
}: any) => {
  const renderField = (label: string, field: keyof Lead, placeholder?: string) => {
    const errorText = errors[field];
    return (
      <Box sx={{ mb: 3, position: 'relative' }}>
        <Typography variant="caption" sx={{
          color: errorText ? tokens.semantic.error : tokens.text.muted,
          fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.06em',
          display: 'block', mb: 0.8, pl: 1,
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
              },
            },
          }}
        />
        {errorText && (
          <Typography variant="caption" sx={{
            color: tokens.semantic.error, fontWeight: 600,
            position: 'absolute', bottom: -20, left: 12, fontSize: '0.75rem',
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
      borderBottom: { xs: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}`, md: 'none' },
    }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{
          width: 72, height: 72, borderRadius: '24px', flexShrink: 0,
          background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.primary} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '2rem', fontWeight: 800,
          boxShadow: '0 12px 24px rgba(93, 26, 137, 0.15)',
        }}>
          {avatarChar}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {renderField('Prospect Name', 'prospectName')}
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

// --- Subcomponent: Enrichment Column (Right, qualify mode) ---
const EnrichmentColumn = memo(({
  sections, onSectionChange, notes, onNotesChange, isPending, isDarkMode,
}: any) => {
  return (
    <Box sx={{ p: 5, pb: 2 }}>
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
                    boxShadow: `0 0 0 2px ${tokens.brand.primary}22`,
                  },
                },
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
                  boxShadow: `0 0 0 2px ${tokens.brand.primary}22`,
                },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
});

// --- Subcomponent: Sharing + Meetings Column (update mode / both) ---
const SharingMeetingsColumn = memo(({
  isDarkMode,
  isPending,
  dbUsers,
  sharedWith,
  onSharedWithChange,
  meetings,
  meetingsLoading,
  showMeetingForm,
  onToggleMeetingForm,
  meetingForm,
  onMeetingFormChange,
  meetingParticipants,
  onMeetingParticipantsChange,
  onCreateMeeting,
  creatingMeeting,
  notes,
  onNotesChange,
  showNotes,
}: {
  isDarkMode: boolean;
  isPending: boolean;
  dbUsers: User[];
  sharedWith: User[];
  onSharedWithChange: (users: User[]) => void;
  meetings: Meeting[] | null | undefined;
  meetingsLoading: boolean;
  showMeetingForm: boolean;
  onToggleMeetingForm: () => void;
  meetingForm: { title: string; scheduledAt: string; meetingLink: string; description: string };
  onMeetingFormChange: (field: string, value: string) => void;
  meetingParticipants: User[];
  onMeetingParticipantsChange: (users: User[]) => void;
  onCreateMeeting: () => void;
  creatingMeeting: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  showNotes: boolean;
}) => {
  const fieldSx = {
    borderRadius: '16px',
    bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.015)',
    '& fieldset': { border: 'none' },
  };
  const minDateTimeLocal = getMinDateTimeLocal();

  return (
    <Box sx={{ flex: 1, p: 5, maxHeight: '75vh', overflowY: 'auto' }}>
      {/* Shared with */}
      <Typography variant="h6" sx={{ fontWeight: 850, color: tokens.text.primary, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <PeopleIcon sx={{ color: tokens.brand.accent, fontSize: 22 }} /> Shared with
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.text.secondary, mb: 2 }}>
        Collaborators get full edit access to this lead.
      </Typography>
      <Autocomplete
        multiple
        options={dbUsers}
        value={sharedWith}
        onChange={(_e, value) => onSharedWithChange(value)}
        getOptionLabel={userLabel}
        isOptionEqualToValue={(a, b) => a._id === b._id}
        disabled={isPending}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option._id}
              avatar={<Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>{userLabel(option).charAt(0)}</Avatar>}
              label={userLabel(option)}
              size="small"
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Add collaborators..."
            InputProps={{ ...params.InputProps, sx: fieldSx }}
          />
        )}
        sx={{ mb: 4 }}
      />

      {showNotes && (
        <>
          <Divider sx={{ my: 2, borderColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
          <Typography variant="body2" sx={{ fontWeight: 750, color: tokens.text.secondary, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ fontSize: 18 }} /> Notes
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Lead notes..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            disabled={isPending}
            InputProps={{ sx: { ...fieldSx, borderRadius: '20px' } }}
            sx={{ mb: 4 }}
          />
        </>
      )}

      <Divider sx={{ my: 2, borderColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />

      {/* Meetings */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 850, color: tokens.text.primary, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EventIcon sx={{ color: tokens.brand.accent, fontSize: 22 }} /> Meetings
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onToggleMeetingForm}
          disabled={isPending || creatingMeeting}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}
        >
          {showMeetingForm ? 'Cancel' : 'Schedule Meeting'}
        </Button>
      </Box>

      <Collapse in={showMeetingForm}>
        <Box sx={{
          p: 2.5, mb: 3, borderRadius: '20px',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <TextField
            fullWidth
            label="Title"
            value={meetingForm.title}
            onChange={(e) => onMeetingFormChange('title', e.target.value)}
            disabled={creatingMeeting}
            InputProps={{ sx: fieldSx }}
          />
          <TextField
            fullWidth
            label="Date & Time"
            type="datetime-local"
            value={meetingForm.scheduledAt}
            onChange={(e) => onMeetingFormChange('scheduledAt', e.target.value)}
            disabled={creatingMeeting}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: minDateTimeLocal }}
            InputProps={{ sx: fieldSx }}
          />
          <TextField
            fullWidth
            label="Meeting Link"
            placeholder="https://meet.google.com/..."
            value={meetingForm.meetingLink}
            onChange={(e) => onMeetingFormChange('meetingLink', e.target.value)}
            disabled={creatingMeeting}
            InputProps={{ sx: fieldSx }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes"
            value={meetingForm.description}
            onChange={(e) => onMeetingFormChange('description', e.target.value)}
            disabled={creatingMeeting}
            InputProps={{ sx: fieldSx }}
          />
          <Autocomplete
            multiple
            options={dbUsers}
            value={meetingParticipants}
            onChange={(_e, value) => onMeetingParticipantsChange(value)}
            getOptionLabel={userLabel}
            isOptionEqualToValue={(a, b) => a._id === b._id}
            disabled={creatingMeeting}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option._id} label={userLabel(option)} size="small" />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Participants"
                placeholder="Add participants..."
                InputProps={{ ...params.InputProps, sx: fieldSx }}
              />
            )}
          />
          <Button
            variant="contained"
            onClick={onCreateMeeting}
            disabled={creatingMeeting || !meetingForm.title || !meetingForm.scheduledAt || !meetingForm.meetingLink}
            sx={{
              alignSelf: 'flex-end',
              textTransform: 'none',
              fontWeight: 750,
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${tokens.brand.accent} 0%, ${tokens.brand.primary} 100%)`,
            }}
          >
            {creatingMeeting ? 'Creating...' : 'Create Meeting'}
          </Button>
        </Box>
      </Collapse>

      {meetingsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : !Array.isArray(meetings) || meetings.length === 0 ? (
        <Typography variant="body2" sx={{ color: tokens.text.secondary, fontStyle: 'italic' }}>
          No meetings linked to this lead yet.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {meetings.map((m) => {
            const link = m.meetingLink || m.link;
            return (
              <Box
                key={m._id}
                sx={{
                  p: 2, borderRadius: '16px',
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: tokens.text.primary }}>
                  {m.title}
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.text.secondary, display: 'block', mt: 0.5 }}>
                  {formatMeetingWhen(m.scheduledAt)}
                </Typography>
                {m.description && (
                  <Typography variant="body2" sx={{ color: tokens.text.secondary, mt: 1, fontSize: '0.85rem' }}>
                    {m.description}
                  </Typography>
                )}
                {link && (
                  <Link
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1, fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    <LinkIcon sx={{ fontSize: 14 }} /> Join meeting
                  </Link>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
});

// --- Main Modal Component ---
export const QualifyEnrichModal = ({
  open,
  leadId,
  mode = 'qualify',
  onClose,
  onSuccess,
}: QualifyEnrichModalProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isUpdateMode = mode === 'update';

  const { data: lead, isLoading: isLeadLoading } = useLead(open ? leadId : undefined);
  const qualifyLead = useQualifyLead();
  const updateLead = useUpdateLead();
  const createMeeting = useCreateMeeting();
  const { data: usersData } = useUsers({}, { enabled: open });
  const dbUsers = Array.isArray(usersData) ? usersData : [];
  const { data: meetingsData, isLoading: meetingsLoading } = useMeetings(
    { leadId },
    { enabled: open && !!leadId },
  );
  const leadMeetings = Array.isArray(meetingsData) ? meetingsData : [];
  const addToast = useUIStore((s) => s.addToast);

  const [leadData, setLeadData] = useState<Partial<Lead>>({});
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<{ email?: string; linkedInUrl?: string }>({});
  const [sharedWith, setSharedWith] = useState<User[]>([]);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    scheduledAt: '',
    meetingLink: '',
    description: '',
  });
  const [meetingParticipants, setMeetingParticipants] = useState<User[]>([]);

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
        prospectName: composeProspectName(lead),
        title: lead.title || lead.jobTitle || '',
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
        companyDetails: '', painPoints: '', budget: '', decisionTimeline: '',
      };
      if (lead.profileSections) {
        lead.profileSections.forEach((sec) => {
          const matched = DEFAULT_SECTIONS.find((d) => d.label.toLowerCase() === sec.title.toLowerCase());
          if (matched) newSections[matched.key] = sec.content;
        });
      }
      setSections(newSections);
      setErrors({});

      const sharedIds = (Array.isArray(lead.sharedWith) ? lead.sharedWith : [])
        .map(userIdOf)
        .filter(Boolean) as string[];
      const sharedUsers = dbUsers.filter((u) => sharedIds.includes(u._id));
      // Fall back to populated user objects if users list not ready
      if (sharedUsers.length === 0 && Array.isArray(lead.sharedWith)) {
        setSharedWith(
          lead.sharedWith.filter((u): u is User => typeof u === 'object' && !!u && '_id' in u),
        );
      } else {
        setSharedWith(sharedUsers);
      }

      setShowMeetingForm(false);
      setMeetingForm({ title: '', scheduledAt: '', meetingLink: '', description: '' });
      setMeetingParticipants([]);
    }
  }, [lead, open, dbUsers]);

  const handleLeadDataChange = useCallback((field: keyof Lead, value: string) => {
    if (field === 'prospectName') {
      const parts = splitProspectName(value);
      setLeadData((prev) => ({
        ...prev,
        prospectName: parts.prospectName,
        firstName: parts.firstName,
        lastName: parts.lastName,
      }));
      return;
    }
    setLeadData((prev) => ({ ...prev, [field]: value }));
    if (field === 'email' || field === 'linkedInUrl') {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const handleSectionChange = useCallback((key: string, value: string) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
  }, []);

  const validateFields = () => {
    const newErrors: { email?: string; linkedInUrl?: string } = {};
    let hasError = false;
    if (!validateEmail(leadData.email || '')) {
      newErrors.email = 'Invalid email format';
      hasError = true;
    }
    if (!validateLinkedIn(leadData.linkedInUrl || '')) {
      newErrors.linkedInUrl = 'Must be a valid LinkedIn URL';
      hasError = true;
    }
    setErrors(newErrors);
    return !hasError;
  };

  const buildLeadPayload = () => {
    const { title, email, linkedInUrl, ...restLeadData } = leadData;
    const nameParts = splitProspectName(
      leadData.prospectName || composeProspectName(leadData),
    );
    return {
      ...restLeadData,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      prospectName: nameParts.prospectName.trim(),
      ...(title ? { jobTitle: title } : {}),
      ...(email?.trim() ? { email: email.trim() } : { email: '' }),
      ...(linkedInUrl?.trim() ? { linkedInUrl: linkedInUrl.trim() } : { linkedInUrl: '' }),
      ...(notes?.trim() ? { notes } : { notes: '' }),
      sharedWith: sharedWith.map((u) => u._id),
    };
  };

  const handleSave = async () => {
    if (!leadId || !validateFields()) return;
    try {
      await updateLead.mutateAsync({ id: leadId, data: buildLeadPayload() });
      addToast({ message: 'Lead updated successfully.', severity: 'success' });
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to update lead.';
      addToast({ message: msg, severity: 'error' });
    }
  };

  const handlePush = async () => {
    if (!leadId || !validateFields()) return;
    try {
      const profileSections = DEFAULT_SECTIONS.map((sec) => ({
        title: sec.label,
        content: sections[sec.key] || '',
      })).filter((sec) => sec.content.trim() !== '');

      const res: any = await qualifyLead.mutateAsync({
        id: leadId,
        ...buildLeadPayload(),
        profileSections,
      });
      const board = res?.data?.data?.board || res?.data?.board;
      const projectId =
        typeof board?.projectId === 'string'
          ? board.projectId
          : board?.projectId?._id || board?.projectId?.toString?.();
      onSuccess(board?._id, projectId);
    } catch (err: any) {
      console.error('Failed to enrich and qualify lead:', err);
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to enrich and qualify lead.';
      addToast({ message: msg, severity: 'error' });
    }
  };

  const handleCreateMeeting = async () => {
    if (!leadId) return;
    const scheduledDate = new Date(meetingForm.scheduledAt);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      addToast({ message: 'Cannot schedule meetings in the past.', severity: 'warning' });
      return;
    }
    try {
      const participantIds = meetingParticipants.map((u) => u._id);
      await createMeeting.mutateAsync({
        title: meetingForm.title,
        description: meetingForm.description || undefined,
        meetingLink: meetingForm.meetingLink,
        scheduledAt: scheduledDate.toISOString(),
        participants: participantIds,
        leadId,
      } as Partial<Meeting>);

      // Auto-sync meeting participants into lead sharedWith
      const existingIds = new Set(sharedWith.map((u) => u._id));
      const mergedUsers = [...sharedWith];
      for (const p of meetingParticipants) {
        if (!existingIds.has(p._id)) {
          mergedUsers.push(p);
          existingIds.add(p._id);
        }
      }
      if (mergedUsers.length !== sharedWith.length) {
        setSharedWith(mergedUsers);
        await updateLead.mutateAsync({
          id: leadId,
          data: { sharedWith: mergedUsers.map((u) => u._id) },
        });
      }

      addToast({ message: 'Meeting scheduled and linked to lead.', severity: 'success' });
      setShowMeetingForm(false);
      setMeetingForm({ title: '', scheduledAt: '', meetingLink: '', description: '' });
      setMeetingParticipants([]);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to create meeting.';
      addToast({ message: msg, severity: 'error' });
    }
  };

  const isPending = qualifyLead.isPending || updateLead.isPending;

  const sharingMeetingsProps = {
    isDarkMode,
    isPending,
    dbUsers,
    sharedWith,
    onSharedWithChange: setSharedWith,
    meetings: leadMeetings,
    meetingsLoading,
    showMeetingForm,
    onToggleMeetingForm: () => setShowMeetingForm((v) => !v),
    meetingForm,
    onMeetingFormChange: (field: string, value: string) =>
      setMeetingForm((prev) => ({ ...prev, [field]: value })),
    meetingParticipants,
    onMeetingParticipantsChange: setMeetingParticipants,
    onCreateMeeting: handleCreateMeeting,
    creatingMeeting: createMeeting.isPending,
    notes,
    onNotesChange: handleNotesChange,
  };

  // Update mode: sharing + meetings replace enrichment. Qualify mode: enrichment first, then sharing/meetings.
  const rightColumn = isUpdateMode ? (
    <SharingMeetingsColumn {...sharingMeetingsProps} showNotes />
  ) : (
    <Box sx={{ flex: 1, maxHeight: '75vh', overflowY: 'auto' }}>
      <EnrichmentColumn
        sections={sections}
        onSectionChange={handleSectionChange}
        notes={notes}
        onNotesChange={handleNotesChange}
        isPending={isPending}
        isDarkMode={isDarkMode}
      />
      <Box sx={{ '& > .MuiBox-root': { maxHeight: 'none', p: 5, pt: 0 } }}>
        <SharingMeetingsColumn {...sharingMeetingsProps} showNotes={false} />
      </Box>
    </Box>
  );

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
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 5, py: 4, borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}` }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 850, color: tokens.text.primary, letterSpacing: '-0.02em', mb: 0.5 }}>
              {isUpdateMode ? 'Update Lead' : 'Qualify Lead'}
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.text.secondary, fontWeight: 500 }}>
              {isUpdateMode
                ? 'Edit lead details, share with teammates, and schedule meetings.'
                : 'Review and enrich the profile before pushing it to the pipeline.'}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={isPending}
            sx={{
              color: tokens.text.muted,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              p: 1.5,
              '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
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
            {rightColumn}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{
        p: 4, px: 5,
        borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}`,
        bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.01)',
      }}>
        <Button
          onClick={onClose}
          disabled={isPending}
          sx={{
            color: tokens.text.secondary, fontWeight: 750, borderRadius: '16px', px: 4, py: 1.5, textTransform: 'none', fontSize: '1rem',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={isUpdateMode ? handleSave : handlePush}
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
              transform: 'translateY(-2px)',
            },
          }}
        >
          {isPending
            ? (isUpdateMode ? 'Saving...' : 'Processing...')
            : (isUpdateMode ? 'Save' : 'Qualify & Push')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
