import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { User } from '@/types';
import { getDisplayName } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';
import { MENTION_STORAGE_REGEX } from '@/utils/mentionUtils';

interface CommentTextProps {
  text: string;
  users?: User[];
}

export const CommentText = ({ text, users = [] }: CommentTextProps) => {
  const userMap = useMemo(
    () => new Map(users.map((user) => [user._id, user])),
    [users],
  );

  const parts = useMemo(() => {
    const segments: Array<{ type: 'text' | 'mention'; value: string }> = [];
    let lastIndex = 0;
    const regex = new RegExp(MENTION_STORAGE_REGEX.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }

      const user = userMap.get(match[1]);
      segments.push({
        type: 'mention',
        value: user ? getDisplayName(user) : 'User',
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return segments.length > 0 ? segments : [{ type: 'text' as const, value: text }];
  }, [text, userMap]);

  return (
    <Typography
      component="span"
      variant="body2"
      sx={{ wordBreak: 'break-word' }}
    >
      {parts.map((part, index) =>
        part.type === 'mention' ? (
          <Box
            key={`mention-${index}`}
            component="span"
            sx={{
              color: tokens.brand.primary,
              fontWeight: 700,
            }}
          >
            @{part.value}
          </Box>
        ) : (
          <span key={`text-${index}`}>{part.value}</span>
        ),
      )}
    </Typography>
  );
};
