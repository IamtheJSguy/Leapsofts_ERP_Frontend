import type { ImportSourcePerson, ParsedImportBoard, ParsedImportCard } from './types';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_IMPORT_CARDS,
  MAX_TITLE_LENGTH,
  isDoneColumnName,
  mapPriority,
  truncate,
} from './types';

const parseCsvRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      pushField();
      continue;
    }
    if (char === '\n') {
      pushField();
      rows.push(row);
      row = [];
      continue;
    }
    if (char === '\r') continue;
    field += char;
  }

  if (field.length || row.length) {
    pushField();
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
};

const headerIndex = (headers: string[], aliases: string[]): number => {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
};

const cell = (row: string[], index: number): string =>
  index >= 0 ? (row[index] || '').trim() : '';

const parseJiraDate = (raw: string): string | undefined => {
  if (!raw) return undefined;
  const isoTry = Date.parse(raw);
  if (!Number.isNaN(isoTry)) return new Date(isoTry).toISOString();

  const match = raw.match(
    /^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/,
  );
  if (!match) return undefined;
  const months: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  const day = Number(match[1]);
  const month = months[match[2].toLowerCase()];
  if (month == null) return undefined;
  let year = Number(match[3]);
  if (year < 100) year += 2000;
  let hours = match[4] ? Number(match[4]) : 0;
  const minutes = match[5] ? Number(match[5]) : 0;
  const mer = (match[6] || '').toUpperCase();
  if (mer === 'PM' && hours < 12) hours += 12;
  if (mer === 'AM' && hours === 12) hours = 0;
  const date = new Date(Date.UTC(year, month, day, hours, minutes));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

export const parseJiraCsvText = (text: string): ParsedImportBoard => {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    throw new Error('Jira CSV must include a header row and at least one issue.');
  }

  const headers = rows[0];
  const summaryIdx = headerIndex(headers, ['summary']);
  const statusIdx = headerIndex(headers, ['status']);
  const descriptionIdx = headerIndex(headers, ['description']);
  const priorityIdx = headerIndex(headers, ['priority']);
  const dueIdx = headerIndex(headers, ['due date', 'duedate', 'due']);
  const assigneeIdx = headerIndex(headers, ['assignee']);
  const assigneeIdIdx = headerIndex(headers, ['assignee id', 'assigneeid']);
  const projectNameIdx = headerIndex(headers, ['project name', 'project']);
  const issueKeyIdx = headerIndex(headers, ['issue key', 'issuekey', 'key']);

  if (summaryIdx === -1 || statusIdx === -1) {
    throw new Error('Jira CSV must include Summary and Status columns.');
  }

  const columnNames: string[] = [];
  const seenColumns = new Set<string>();
  const peopleById = new Map<string, ImportSourcePerson>();
  const parsedCards: ParsedImportCard[] = [];
  let boardName = 'Imported Jira board';

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const summary = cell(row, summaryIdx);
    const status = cell(row, statusIdx);
    if (!summary || !status) continue;

    if (!seenColumns.has(status)) {
      seenColumns.add(status);
      columnNames.push(status);
    }

    const projectName = cell(row, projectNameIdx);
    if (projectName) boardName = projectName;

    const assigneeName = cell(row, assigneeIdx);
    const assigneeIdRaw = cell(row, assigneeIdIdx);
    const sourcePersonIds: string[] = [];
    if (assigneeName || assigneeIdRaw) {
      const id = assigneeIdRaw || `name:${assigneeName}`;
      sourcePersonIds.push(id);
      if (!peopleById.has(id)) {
        peopleById.set(id, {
          id,
          displayName: assigneeName || assigneeIdRaw,
          username: assigneeName,
        });
      }
    }

    parsedCards.push({
      sourceId: cell(row, issueKeyIdx) || `row-${i}`,
      title: truncate(summary, MAX_TITLE_LENGTH),
      description: truncate(cell(row, descriptionIdx), MAX_DESCRIPTION_LENGTH) || undefined,
      columnName: status,
      sourcePersonIds,
      priority: mapPriority(cell(row, priorityIdx)),
      dueDate: parseJiraDate(cell(row, dueIdx)),
      isDone: isDoneColumnName(status),
    });
  }

  if (!parsedCards.length) {
    throw new Error('Jira CSV has no importable issues.');
  }
  if (parsedCards.length > MAX_IMPORT_CARDS) {
    throw new Error(`Import is limited to ${MAX_IMPORT_CARDS} cards.`);
  }

  return {
    source: 'jira',
    name: boardName,
    columns: columnNames.map((name, order) => ({ name, order })),
    cards: parsedCards,
    people: [...peopleById.values()],
  };
};
