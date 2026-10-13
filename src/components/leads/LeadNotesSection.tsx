import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { RichTextEditor } from '@/components/chat/RichTextEditor';
import { RichTextContent, toPlainText } from '@/components/common/RichTextContent';
import { tokens } from '@/styles/tokens';
import type { User } from '@/types';

export interface LeadNotesSectionProps {
  notes: string;
  onNotesChange: (value: string) => void;
  onSaveInline?: (value: string) => Promise<void>;
  mentionableUsers?: User[];
  disabled?: boolean;
  isDarkMode?: boolean;
}

export function LeadNotesSection({
  notes,
  onNotesChange,
  onSaveInline,
  mentionableUsers = [],
  disabled = false,
  isDarkMode: propIsDarkMode,
}: LeadNotesSectionProps) {
  const theme = useTheme();
  const isDarkMode = propIsDarkMode ?? theme.palette.mode === 'dark';

  const hasContent = !!toPlainText(notes).trim();
  const [isEditing, setIsEditing] = useState<boolean>(!hasContent);
  const [draft, setDraft] = useState<string>(notes || '');
  const [saving, setSaving] = useState<boolean>(false);

  // Sync draft whenever external notes prop changes (e.g. modal opens or updates)
  useEffect(() => {
    setDraft(notes || '');
    if (!toPlainText(notes).trim()) {
      setIsEditing(true);
    }
  }, [notes]);

  const handleStartEdit = () => {
    setDraft(notes || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(notes || '');
    // If there is existing content, switch back to view mode; otherwise keep editor open
    if (hasContent) {
      setIsEditing(false);
    }
  };

  const handleSave = async () => {
    const cleanContent = toPlainText(draft).trim() ? draft : '';
    onNotesChange(cleanContent);

    if (onSaveInline) {
      setSaving(true);
      try {
        await onSaveInline(cleanContent);
        if (toPlainText(cleanContent).trim()) {
          setIsEditing(false);
        }
      } finally {
        setSaving(false);
      }
    } else {
      if (toPlainText(cleanContent).trim()) {
        setIsEditing(false);
      }
    }
  };

  const handleClear = async () => {
    onNotesChange('');
    setDraft('');
    if (onSaveInline) {
      setSaving(true);
      try {
        await onSaveInline('');
        setIsEditing(true);
      } finally {
        setSaving(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 750,
            color: tokens.text.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <DescriptionIcon sx={{ fontSize: 18 }} /> Notes
        </Typography>

        {!isEditing && hasContent && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Button
              size="small"
              startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
              onClick={handleStartEdit}
              disabled={disabled || saving}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                color: tokens.brand.primary,
                py: 0.25,
                px: 1,
              }}
            >
              Edit note
            </Button>
            <Tooltip title="Clear notes">
              <span>
                <IconButton
                  size="small"
                  onClick={handleClear}
                  disabled={disabled || saving}
                  sx={{
                    color: 'text.secondary',
                    p: 0.5,
                    '&:hover': { color: 'error.main' },
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}
      </Box>

      {/* View Mode: Saved Rich Text Result */}
      {!isEditing && hasContent ? (
        <Box
          sx={{
            p: 1.75,
            borderRadius: '14px',
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.015)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            },
          }}
        >
          <RichTextContent
            content={notes}
            mentionableUsers={mentionableUsers}
            fallbackText="No notes provided."
            sx={{
              fontSize: '0.88rem',
              lineHeight: 1.6,
              '& p': { m: 0, mb: 0.75 },
              '& p:last-child': { mb: 0 },
            }}
          />
        </Box>
      ) : (
        /* Edit Mode: Rich Text Editor */
        <Box
          sx={{
            borderRadius: '14px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
            overflow: 'hidden',
            transition: 'border-color 0.2s ease',
            '&:focus-within': {
              borderColor: tokens.brand.primary,
              boxShadow: `0 0 0 2px ${tokens.brand.primary}22`,
            },
          }}
        >
          <RichTextEditor
            value={draft}
            onChange={(html) => {
              setDraft(html);
              onNotesChange(html);
            }}
            submitOnEnter={false}
            alwaysShowToolbar
            minHeight="90px"
            maxHeight="240px"
            placeholder="Add lead notes (supports bold, lists, colors, @mentions)..."
            mentionableUsers={mentionableUsers}
          />

          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            alignItems="center"
            sx={{
              p: 1,
              px: 1.5,
              borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            }}
          >
            {hasContent && (
              <Button
                size="small"
                onClick={handleCancel}
                disabled={disabled || saving}
                sx={{
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={disabled || saving}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{
                textTransform: 'none',
                fontWeight: 750,
                fontSize: '0.8rem',
                borderRadius: '10px',
                bgcolor: tokens.brand.primary,
                '&:hover': { bgcolor: tokens.brand.primaryLight },
              }}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
