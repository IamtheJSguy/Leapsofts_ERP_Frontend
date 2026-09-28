import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import DOMPurify from 'dompurify';
import linkifyHtml from 'linkify-html';
import type { User } from '@/types';
import { formatMentionsForDisplay } from '@/utils/mentionUtils';
import { tokens } from '@/styles/tokens';
import { CHAT_HTML_PURIFY_ADD_ATTR, chatMentionSx } from '@/utils/chatHtml';

/** Strips all HTML tags and entities, converting rich text HTML to clean single-line or readable plain text for previews. */
export const toPlainText = (value?: string): string => {
  if (!value) return '';
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

/** Sanitize HTML string safely for rich display. */
export const sanitizeRichTextHtml = (content: string, mentionableUsers: User[] = []): string => {
  if (!content) return '';
  return linkifyHtml(
    formatMentionsForDisplay(
      DOMPurify.sanitize(content, {
        ADD_ATTR: CHAT_HTML_PURIFY_ADD_ATTR,
      }),
      mentionableUsers,
    ),
    { target: '_blank', rel: 'noopener noreferrer' },
  );
};

export interface RichTextContentProps {
  content?: string;
  sx?: SxProps<Theme>;
  className?: string;
  mentionableUsers?: User[];
  fallbackText?: string;
}

export const RichTextContent: React.FC<RichTextContentProps> = ({
  content,
  sx,
  className = 'prose tiptap-content',
  mentionableUsers = [],
  fallbackText = 'No description provided.',
}) => {
  if (!content || !content.trim()) {
    return (
      <Box
        component="span"
        sx={{
          color: 'text.disabled',
          fontStyle: 'italic',
          fontSize: '0.9rem',
          ...sx,
        }}
      >
        {fallbackText}
      </Box>
    );
  }

  const html = sanitizeRichTextHtml(content, mentionableUsers);

  return (
    <Box
      className={className}
      sx={{
        fontSize: '0.9rem',
        fontWeight: 400,
        lineHeight: 1.6,
        wordBreak: 'break-word',
        color: 'text.primary',
        '& p': { m: 0, mb: 0.75, '&:last-child': { mb: 0 } },
        '& ul': { m: '0.25rem 0', pl: 2.5, listStyleType: 'disc' },
        '& ol': { m: '0.25rem 0', pl: 2.5, listStyleType: 'decimal' },
        '& li': { mb: 0.25 },
        '& a': {
          color: tokens.brand.primary,
          textDecoration: 'underline',
        },
        '& mark': {
          backgroundColor: '#ffcc00',
          color: '#000',
          borderRadius: '2px',
          padding: '0 3px',
        },
        '& strong': {
          fontWeight: 700,
        },
        '& em': {
          fontStyle: 'italic',
        },
        '& u': {
          textDecoration: 'underline',
        },
        '& s': {
          textDecoration: 'line-through',
        },
        ...chatMentionSx,
        ...sx,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default RichTextContent;
