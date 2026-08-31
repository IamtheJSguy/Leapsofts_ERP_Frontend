import { DEPARTMENT, ROLES } from '@/lib/constants';
import type { Role, UserPermissions } from '@/types';

export const PERMISSION_KEYS = [
  'viewSalesPage',
  'accessTeam',
  'viewAllAttendance',
  'manageSystemSettings',
  'manageSalesSettings',
  'createProjectsAndBoards',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  viewSalesPage: 'View Sales page',
  accessTeam: 'Access Team page',
  viewAllAttendance: 'View all attendance',
  manageSystemSettings: 'Manage system settings',
  manageSalesSettings: 'Manage sales settings',
  createProjectsAndBoards: 'Create projects and boards',
};

export const DEFAULT_SHIFT_START = '09:00';
export const DEFAULT_SHIFT_END = '17:00';

export const emptyPermissions = (): UserPermissions => ({
  viewSalesPage: false,
  accessTeam: false,
  viewAllAttendance: false,
  manageSystemSettings: false,
  manageSalesSettings: false,
  createProjectsAndBoards: false,
});

export const coercePermissions = (stored?: Partial<UserPermissions> | null): UserPermissions => {
  const next = emptyPermissions();
  if (!stored) return next;
  for (const key of PERMISSION_KEYS) {
    if (typeof stored[key] === 'boolean') next[key] = stored[key];
  }
  return next;
};

export const isSalesDepartment = (department?: string | null) =>
  department === DEPARTMENT.SALES;

export const requiresViewSalesPage = (department?: string | null) =>
  department === DEPARTMENT.SALES || department === DEPARTMENT.MARKETING;

/** Flags that cannot be turned off for this role/department. */
export const getLockedPermissionKeys = (
  role: Role,
  department?: string | null,
): Set<PermissionKey> => {
  const locked = new Set<PermissionKey>();

  if (role === ROLES.ADMIN) {
    PERMISSION_KEYS.forEach((key) => locked.add(key));
    return locked;
  }

  if (role === ROLES.MANAGER) {
    locked.add('accessTeam');
    locked.add('manageSalesSettings');
    locked.add('createProjectsAndBoards');
  }

  if (requiresViewSalesPage(department)) {
    locked.add('viewSalesPage');
  }

  return locked;
};

export const isPermissionLocked = (
  role: Role,
  department: string | null | undefined,
  key: PermissionKey,
) => getLockedPermissionKeys(role, department).has(key);

export const permissionLockHelperText = (
  role: Role,
  department: string | null | undefined,
  key: PermissionKey,
): string | undefined => {
  if (!isPermissionLocked(role, department, key)) return undefined;
  if (key === 'viewSalesPage' && requiresViewSalesPage(department) && role !== ROLES.ADMIN) {
    return department === DEPARTMENT.MARKETING
      ? 'Required for Marketing department'
      : 'Required for Sales department';
  }
  if (role === ROLES.ADMIN) return 'Required for Admin';
  if (role === ROLES.MANAGER) return 'Required for Manager';
  return 'Required for this role';
};

/** Union stored flags with locked presets (same rules as backend). */
export const resolvePermissions = (
  role: Role | undefined,
  department?: string | null,
  stored?: Partial<UserPermissions> | null,
): UserPermissions => {
  const merged = coercePermissions(stored);
  if (!role) return merged;

  for (const key of getLockedPermissionKeys(role, department)) {
    merged[key] = true;
  }

  return merged;
};
