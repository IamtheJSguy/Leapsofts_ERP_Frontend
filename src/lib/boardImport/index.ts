import { parseJiraCsvText } from './parseJiraCsv';
import { parseTrelloJsonText } from './parseTrello';
import type { ParsedImportBoard } from './types';

export * from './types';
export * from './matchUsers';
export { parseTrelloJson, parseTrelloJsonText } from './parseTrello';
export { parseJiraCsvText } from './parseJiraCsv';

export const parseBoardImportFile = async (file: File): Promise<ParsedImportBoard> => {
  const name = file.name.toLowerCase();
  const text = await file.text();

  if (name.endsWith('.json') || file.type === 'application/json') {
    return parseTrelloJsonText(text);
  }
  if (name.endsWith('.csv') || file.type === 'text/csv') {
    return parseJiraCsvText(text);
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    return parseTrelloJsonText(text);
  }
  return parseJiraCsvText(text);
};
