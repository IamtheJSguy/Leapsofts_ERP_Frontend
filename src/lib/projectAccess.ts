import { ROLES } from '@/lib/constants';

/** Resolve member userId whether plain id string or populated User doc (matches backend). */
export const memberUserId = (userId: unknown): string => {
  if (userId == null) return '';
  if (typeof userId === 'string') return userId;
  if (typeof userId === 'object') {
    const doc = userId as { _id?: { toString?: () => string } | string };
    if (doc._id != null) {
      return typeof doc._id === 'string' ? doc._id : doc._id.toString?.() ?? String(doc._id);
    }
  }
  return String(userId);
};

export const userIdsEqual = (a: unknown, b: unknown): boolean =>
  memberUserId(a) !== '' && memberUserId(a) === memberUserId(b);

/** Same rules as backend `isProjectAdmin` / POST `/projects/:id/members`. */
export const canManageProjectMembers = (
  user: { _id?: string; role?: string } | null | undefined,
  project: { ownerId?: unknown; members?: { userId: unknown; role: string }[] } | null | undefined,
): boolean => {
  if (!user?._id || !project) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (userIdsEqual(project.ownerId, user._id)) return true;
  return (project.members ?? []).some(
    (m) =>
      userIdsEqual(m.userId, user._id) &&
      (m.role === 'owner' || m.role === 'admin'),
  );
};

/** Board team roles: board owner/admin or project admin (backend `isBoardAdminOrProjectAdmin`). */
export const canManageBoardTeam = (
  user: { _id?: string; role?: string } | null | undefined,
  project: { ownerId?: unknown; members?: { userId: unknown; role: string }[] } | null | undefined,
  board: { ownerId?: unknown; members?: { userId: unknown; role: string }[] } | null | undefined,
): boolean => {
  if (!user?._id || !board) return false;
  if (userIdsEqual(board.ownerId, user._id)) return true;
  if (canManageProjectMembers(user, project)) return true;
  return (board.members ?? []).some(
    (m) => userIdsEqual(m.userId, user._id) && m.role === 'admin',
  );
};
