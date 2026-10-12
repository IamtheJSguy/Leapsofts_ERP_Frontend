import { toPlainText } from '@/components/common/RichTextContent';
import type { LeadCommentFormat } from '@/types';

const MARKDOWN_STRIP = /[*_`#[\]()!>|~-]/g;

const plainFromStoredText = (text: string, format?: LeadCommentFormat): string => {
  if (format === 'html') return toPlainText(text);
  if (format === 'markdown') {
    return text.replace(MARKDOWN_STRIP, ' ').replace(/\s+/g, ' ').trim();
  }
  return text.replace(/\s+/g, ' ').trim();
};

/** Plain-text preview for tooltips. */
export const leadCommentTooltipText = (
  text: string,
  maxLen = 200,
  format?: LeadCommentFormat,
): string => {
  const plain = plainFromStoredText(text, format);
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen)}…`;
};
