import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { RichTextEditor } from '@/components/chat/RichTextEditor';
import { leadCommentLevelTokens } from '@/styles/tokens';
import type { LeadCommentFormat, LeadCommentLevel, User } from '@/types';

const LEVELS: { value: LeadCommentLevel; label: string }[] = [
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'red', label: 'Red' },
];

export type LeadCommentDraft = {
  text: string;
  level: LeadCommentLevel;
  format: LeadCommentFormat;
};

type Props = {
  value: LeadCommentDraft;
  onChange: (next: LeadCommentDraft) => void;
  error?: boolean;
  helperText?: string;
  requireReason?: boolean;
  mentionableUsers?: User[];
};

export function LeadCommentComposer({
  value,
  onChange,
  error,
  helperText,
  requireReason,
  mentionableUsers = [],
}: Props) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Stack spacing={1.5}>
      <Box>
        <Box
          sx={{
            borderRadius: '12px',
            border: error
              ? `1px solid ${theme.palette.error.main}`
              : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
            overflow: 'hidden',
          }}
        >
          <RichTextEditor
            value={value.text}
            onChange={(html) => onChange({ ...value, text: html, format: 'html' })}
            submitOnEnter={false}
            alwaysShowToolbar
            minHeight="100px"
            maxHeight="300px"
            placeholder={requireReason ? 'Explain why this lead is invalid…' : 'Add a comment…'}
            autoFocus
            mentionableUsers={mentionableUsers}
          />
        </Box>
        {(helperText || error) && (
          <Typography
            variant="caption"
            sx={{ mt: 0.75, display: 'block', color: error ? 'error.main' : 'text.secondary' }}
          >
            {helperText ?? ' '}
          </Typography>
        )}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block' }}>
          Priority level
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {LEVELS.map((l) => (
            <Button
              key={l.value}
              size="small"
              variant={value.level === l.value ? 'contained' : 'outlined'}
              onClick={() => onChange({ ...value, level: l.value })}
              startIcon={
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: leadCommentLevelTokens[l.value],
                  }}
                />
              }
              sx={{
                minWidth: 0,
                px: 1,
                borderColor: leadCommentLevelTokens[l.value],
                color: value.level === l.value ? '#fff' : leadCommentLevelTokens[l.value],
                bgcolor: value.level === l.value ? leadCommentLevelTokens[l.value] : 'transparent',
                '&:hover': {
                  bgcolor: value.level === l.value ? leadCommentLevelTokens[l.value] : 'rgba(0,0,0,0.04)',
                },
              }}
            >
              {l.label}
            </Button>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

export const emptyCommentDraft = (level: LeadCommentLevel = 'yellow'): LeadCommentDraft => ({
  text: '',
  level,
  format: 'html',
});
