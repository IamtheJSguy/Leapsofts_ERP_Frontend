export type ImportPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ImportSourcePerson = {
  id: string;
  displayName: string;
  username?: string;
  email?: string;
};

export type ParsedImportCard = {
  sourceId: string;
  title: string;
  description?: string;
  columnName: string;
  sourcePersonIds: string[];
  priority: ImportPriority;
  dueDate?: string;
  isDone: boolean;
};

export type ParsedImportBoard = {
  source: 'trello' | 'jira';
  name: string;
  columns: { name: string; order: number }[];
  cards: ParsedImportCard[];
  people: ImportSourcePerson[];
};

export type MatchableUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
};

export const MAX_IMPORT_CARDS = 2000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const DONE_COLUMN_KEYWORDS = ['done', 'resolved', 'complete'];

export const isDoneColumnName = (columnName: string): boolean => {
  const lower = columnName.toLowerCase();
  return DONE_COLUMN_KEYWORDS.some((keyword) => lower.includes(keyword));
};

export const truncate = (value: string, max: number): string => {
  if (value.length <= max) return value;
  return value.slice(0, max);
};

export const mapPriority = (raw: string | undefined | null): ImportPriority => {
  const value = (raw || '').trim().toLowerCase();
  if (value === 'low' || value === 'lowest' || value === 'trivial' || value === 'minor') return 'low';
  if (value === 'high' || value === 'major') return 'high';
  if (value === 'urgent' || value === 'highest' || value === 'critical' || value === 'blocker') return 'urgent';
  return 'medium';
};
