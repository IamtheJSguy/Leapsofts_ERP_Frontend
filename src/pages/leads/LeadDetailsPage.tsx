import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, Chip, Avatar,
  useTheme, CircularProgress, Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EditIcon from '@mui/icons-material/Edit';
import LaunchIcon from '@mui/icons-material/Launch';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { useLead } from '@/hooks/api/useLeads';
import { QualifyEnrichModal } from '@/components/leads/QualifyEnrichModal';
import { tokens } from '@/styles/tokens';
import { useUIStore } from '@/store/useUIStore';

export const LeadDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const addToast = useUIStore((s) => s.addToast);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: lead, isLoading } = useLead(id);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  if (!lead || !id) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Lead not found</Typography>
        <Button onClick={() => navigate('/sales')} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Sales
        </Button>
      </Box>
    );
  }

  const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.prospectName || 'Unknown Lead';
  const initial = name.charAt(0).toUpperCase();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ message: 'Copied to clipboard', severity: 'success' });
  };

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 6, maxWidth: 1200, mx: 'auto' }}>
      {/* Breadcrumbs / Back button */}
      <Button
        onClick={() => navigate('/sales')}
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        sx={{
          color: 'text.secondary', fontWeight: 700, fontSize: '0.85rem', mb: 3, textTransform: 'none',
          '&:hover': { bgcolor: 'transparent', color: tokens.brand.primary },
        }}
      >
        Sales / Leads / {name}
      </Button>

      {/* Hero Section */}
      <Box sx={{
        mb: 4, display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'space-between', alignItems: 'flex-start',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
        borderRadius: '24px', p: 4, boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.2)' : '0 8px 32px rgba(0,0,0,0.03)'
      }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Avatar sx={{
            width: 80, height: 80, fontSize: '2rem', fontWeight: 800,
            bgcolor: tokens.brand.primaryMuted, color: tokens.brand.primary,
            border: `2px solid ${tokens.brand.primary}30`
          }}>
            {initial}
          </Avatar>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary', mb: 0.5 }}>
              {name}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}>
              {lead.jobTitle || 'No Title'} {lead.company ? `at ${lead.company}` : ''}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {lead.isQualified && (
                <Chip label="Qualified" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: tokens.semantic.success, fontWeight: 750 }} />
              )}
              {lead.connectionStatus === 'accepted' && (
                <Chip label="Connection: Accepted" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 750 }} />
              )}
              {lead.messageStatus === 'sent' && (
                <Chip label="Message: Sent" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: tokens.semantic.warning, fontWeight: 750 }} />
              )}
              {lead.messageStatus === 'future_lead' && (
                <Chip
                  label={
                    lead.futureLeadDate
                      ? `Future Lead · ${new Date(lead.futureLeadDate).toLocaleDateString()}`
                      : 'Future Lead'
                  }
                  size="small"
                  sx={{ bgcolor: 'rgba(93, 26, 137, 0.1)', color: tokens.brand.primary, fontWeight: 750 }}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
            onClick={() => setEditModalOpen(true)}
            sx={{
              borderRadius: '24px', textTransform: 'none', fontWeight: 700, color: 'text.primary',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }}
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4 }}>

        {/* Left Column (2/3) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

          {/* Strategic Alignment */}
          <Box sx={{
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            borderRadius: '24px', p: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              Strategic Alignment
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', mb: 1 }}>
                  Ideal Customer Profile (ICP)
                </Typography>
                <Chip label={lead.icp || 'Unassigned'} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', fontWeight: 600, color: 'text.primary' }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', mb: 1 }}>
                  Persona Profile
                </Typography>
                <Chip label={lead.profile || 'Unassigned'} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', fontWeight: 600, color: 'text.primary' }} />
              </Box>
            </Box>
          </Box>

          {/* Profile Sections & Enrichment */}
          {(!!lead.profileSections?.length || !!lead.notes) && (
            <Box sx={{
              bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
              borderRadius: '24px', p: 3
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormatListBulletedIcon /> Profile Intelligence
              </Typography>

              {lead.notes && (
                <Box sx={{ mb: 3, p: 2, bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>Notes</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>{lead.notes}</Typography>
                </Box>
              )}

              {lead.profileSections?.map((section, idx) => (
                <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: tokens.brand.primary }}>{section.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>{section.content}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Right Column (1/3) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Contact Info Card */}
          <Box sx={{
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            borderRadius: '24px', p: 3
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>Contact Info</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, '&:hover .copy-btn': { opacity: 1 } }}>
                <MailOutlineIcon sx={{ color: 'text.secondary', fontSize: 20, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>EMAIL</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.email || '-'}</Typography>
                </Box>
                {lead.email && (
                  <IconButton size="small" className="copy-btn" onClick={() => handleCopy(lead.email!)} sx={{ opacity: 0, transition: '0.2s' }}>
                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, '&:hover .copy-btn': { opacity: 1 } }}>
                <PhoneOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>PHONE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.phone || '-'}</Typography>
                </Box>
                {lead.phone && (
                  <IconButton size="small" className="copy-btn" onClick={() => handleCopy(lead.phone!)} sx={{ opacity: 0, transition: '0.2s' }}>
                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>

              {lead.linkedInUrl && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<LinkedInIcon />}
                    endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                    href={lead.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    fullWidth
                    sx={{
                      borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                      borderColor: '#0077b5', color: '#0077b5',
                      '&:hover': { bgcolor: 'rgba(0, 119, 181, 0.08)' }
                    }}
                  >
                    View LinkedIn Profile
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* Additional Metadata */}
          <Box sx={{
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.45)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            borderRadius: '24px', p: 3
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>System Data</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>COMPANY SIZE</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.companySize || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>INDUSTRY</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.industry || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>LOCATION</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.location || '-'}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>CREATED AT</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}
                </Typography>
              </Box>
            </Box>
          </Box>

        </Box>
      </Box>

      {editModalOpen && (
        <QualifyEnrichModal
          open={editModalOpen}
          leadId={id}
          mode="update"
          onSuccess={() => setEditModalOpen(false)}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </Box>
  );
};

export default LeadDetailsPage;
