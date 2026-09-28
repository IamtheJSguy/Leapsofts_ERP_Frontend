import type { ImportSourcePerson, ParsedImportBoard, ParsedImportCard } from './types';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_IMPORT_CARDS,
  MAX_TITLE_LENGTH,
  isDoneColumnName,
  truncate,
} from './types';

type TrelloMember = {
  id?: string;
  fullName?: string;
  username?: string;
  email?: string;
};

type TrelloList = {
  id?: string;
  name?: string;
  closed?: boolean;
  pos?: number;
};

type TrelloCard = {
  id?: string;
  name?: string;
  desc?: string;
  due?: string | null;
  closed?: boolean;
  idList?: string;
  idMembers?: unknown;
  members?: unknown;
};

type TrelloBoardJson = {
  name?: string;
  lists?: TrelloList[];
  cards?: TrelloCard[];
  members?: TrelloMember[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Card assignees only — idMembers / members[].id. Never idMemberCreator or board memberships. */
const trelloCardAssigneeIds = (card: TrelloCard): string[] => {
  const ids: string[] = [];
  const seen = new Set<string>();
  const push = (raw: unknown) => {
    if (raw == null || raw === '') return;
    if (typeof raw === 'string' || typeof raw === 'number') {
      const id = String(raw).trim();
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
      return;
    }
    if (isRecord(raw) && raw.id != null) push(raw.id);
  };

  const collect = (value: unknown) => {
    if (value == null || value === '') return;
    if (typeof value === 'string') {
      value.split(/[,\s]+/).forEach((part) => push(part));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    push(value);
  };

  collect(card.idMembers);
  collect(card.members);
  return ids;
};

export const parseTrelloJson = (raw: unknown): ParsedImportBoard => {
  if (!isRecord(raw)) {
    throw new Error('Trello file must be a JSON object.');
  }

  const data = raw as TrelloBoardJson;
  const lists = Array.isArray(data.lists) ? data.lists : [];
  const cards = Array.isArray(data.cards) ? data.cards : [];
  const members = Array.isArray(data.members) ? data.members : [];

  if (!lists.length) {
    throw new Error('Trello JSON is missing open lists.');
  }

  const openLists = lists
    .filter((list) => list && list.closed !== true && list.id && list.name)
    .slice()
    .sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));

  if (!openLists.length) {
    throw new Error('Trello JSON has no open lists to import.');
  }

  const columns = openLists.map((list, index) => ({
    name: String(list.name).trim() || `Column ${index + 1}`,
    order: index,
  }));
  const listNameById = new Map(
    openLists.map((list, index) => [String(list.id), columns[index].name]),
  );

  const peopleById = new Map<string, ImportSourcePerson>();
  for (const member of members) {
    if (!member?.id) continue;
    peopleById.set(String(member.id), {
      id: String(member.id),
      displayName: (member.fullName || member.username || String(member.id)).trim(),
      username: member.username,
      email: member.email,
    });
  }

  const parsedCards: ParsedImportCard[] = [];
  for (const card of cards) {
    if (!card || card.closed === true) continue;
    const columnName = card.idList ? listNameById.get(String(card.idList)) : undefined;
    if (!columnName) continue;
    const title = truncate((card.name || '').trim() || 'Untitled card', MAX_TITLE_LENGTH);
    const memberIds = trelloCardAssigneeIds(card);
    for (const memberId of memberIds) {
      if (!peopleById.has(memberId)) {
        peopleById.set(memberId, {
          id: memberId,
          displayName: memberId,
        });
      }
    }
    parsedCards.push({
      sourceId: String(card.id || `${columnName}-${parsedCards.length}`),
      title,
      description: card.desc ? truncate(String(card.desc), MAX_DESCRIPTION_LENGTH) : undefined,
      columnName,
      sourcePersonIds: memberIds,
      priority: 'medium',
      dueDate: card.due ? String(card.due) : undefined,
      isDone: isDoneColumnName(columnName),
    });
  }

  if (parsedCards.length > MAX_IMPORT_CARDS) {
    throw new Error(`Import is limited to ${MAX_IMPORT_CARDS} cards.`);
  }

  return {
    source: 'trello',
    name: (data.name || 'Imported Trello board').trim(),
    columns,
    cards: parsedCards,
    people: [...peopleById.values()],
  };
};

export const parseTrelloJsonText = (text: string): ParsedImportBoard => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }
  return parseTrelloJson(parsed);
};
