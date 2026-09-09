import DOMPurify from 'dompurify';
import linkifyHtml from 'linkify-html';
import type { User } from '@/types';
import { formatMentionsForDisplay } from '@/utils/mentionUtils';
import { tokens } from '@/styles/tokens';

export const CHAT_HTML_PURIFY_ADD_ATTR = [
  'target',
  'class',
  'data-id',
  'data-type',
  'data-label',
  'data-mention-suggestion-char',
];

/** Sanitize chat HTML, keep mention attrs, resolve `@[id]` tokens, then linkify URLs. */
export const sanitizeChatHtml = (content: string, mentionableUsers: User[] = []): string =>
  linkifyHtml(
    formatMentionsForDisplay(
      DOMPurify.sanitize(content || '', {
        ADD_ATTR: CHAT_HTML_PURIFY_ADD_ATTR,
      }),
      mentionableUsers,
    ),
    { target: '_blank', rel: 'noopener noreferrer' },
  );

export const chatMentionSx = {
  '& .mention, & span[data-type="mention"]': {
    color: tokens.brand.primary,
    fontWeight: 700,
  },
} as const;
