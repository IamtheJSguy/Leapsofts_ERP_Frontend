import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography } from '@mui/material';
import { RichTextContent } from '@/components/common/RichTextContent';
import type { LeadCommentFormat, User } from '@/types';

type Props = {
  text: string;
  format?: LeadCommentFormat;
  variant?: 'body2' | 'caption';
  mentionableUsers?: User[];
};

export function LeadCommentBody({
  text,
  format = 'plain',
  variant = 'body2',
  mentionableUsers = [],
}: Props) {
  if (format === 'html') {
    return (
      <RichTextContent
        content={text}
        mentionableUsers={mentionableUsers}
        sx={{
          fontSize: variant === 'caption' ? '0.75rem' : '0.875rem',
          '& p': { m: 0, mb: 0.75 },
          '& p:last-child': { mb: 0 },
        }}
      />
    );
  }

  if (format === 'markdown') {
    return (
      <Box
        sx={{
          '& p': { m: 0, mb: 0.75 },
          '& p:last-child': { mb: 0 },
          '& ul, & ol': { pl: 2, my: 0.5 },
          '& a': { color: 'primary.main' },
          fontSize: variant === 'caption' ? '0.75rem' : '0.875rem',
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </Box>
    );
  }

  return (
    <Typography variant={variant} sx={{ whiteSpace: 'pre-wrap' }}>
      {text}
    </Typography>
  );
}

/** @deprecated Use LeadCommentBody */
export const LeadCommentMarkdownBody = LeadCommentBody;
