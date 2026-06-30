import type { User } from '@/types';
import { getDisplayName } from '@/utils/formatters';

export const MENTION_STORAGE_REGEX = /@\[([a-f0-9]{24})\]/g;

export const formatMentionsForDisplay = (text: string, users: User[]): string => {
  const userMap = new Map(users.map((user) => [user._id, user]));
  return text.replace(MENTION_STORAGE_REGEX, (_, id) => {
    const user = userMap.get(id);
    return user ? `@${getDisplayName(user)}` : '@User';
  });
};

export const parseDisplayToStorage = (text: string, users: User[]): string => {
  const sortedUsers = [...users].sort(
    (a, b) => getDisplayName(b).length - getDisplayName(a).length,
  );

  let result = text;
  for (const user of sortedUsers) {
    const label = `@${getDisplayName(user)}`;
    const token = `@\[${user._id}\]`;
    result = result.split(label).join(token);
  }

  return result;
};
