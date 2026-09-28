import type { ImportSourcePerson, MatchableUser } from './types';

const firstNameToken = (value: string): string => {
  const token = value.trim().toLowerCase().split(/\s+/)[0] || '';
  return token.replace(/[._,-]+/g, '');
};

export const suggestUserId = (
  person: ImportSourcePerson,
  users: MatchableUser[],
): string | null => {
  if (!users.length) return null;

  const sourceFirst = firstNameToken(person.displayName);
  if (!sourceFirst) return null;

  const matches = users.filter((user) => {
    const userFirst = firstNameToken(user.firstName || '');
    return Boolean(userFirst) && userFirst === sourceFirst;
  });

  if (matches.length !== 1) return null;
  return matches[0]._id;
};

export const autoMatchPeople = (
  people: ImportSourcePerson[],
  users: MatchableUser[],
): Record<string, string> => {
  const mapping: Record<string, string> = {};
  for (const person of people) {
    const userId = suggestUserId(person, users);
    if (userId) mapping[person.id] = userId;
  }
  return mapping;
};

/** Mapped system user ids for a card. Unmapped source people are omitted (never the importer). */
export const resolveMappedUserIds = (
  sourcePersonIds: string[],
  mapping: Record<string, string>,
): string[] => {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const personId of sourcePersonIds) {
    const userId = mapping[personId];
    if (!userId || seen.has(userId)) continue;
    seen.add(userId);
    ids.push(userId);
  }
  return ids;
};
