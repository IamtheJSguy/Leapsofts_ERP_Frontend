import { ROLES } from '@/lib/constants';

export const routePermissions: Record<string, string[]> = {
  '/': [ROLES.ADMIN, ROLES.USER],
  '/leads': [ROLES.ADMIN, ROLES.USER],
  '/projects': [ROLES.ADMIN, ROLES.USER],
  '/reports': [ROLES.ADMIN, ROLES.USER],
  '/meetings': [ROLES.ADMIN, ROLES.USER],
  '/chat': [ROLES.ADMIN, ROLES.USER],
  '/admin': [ROLES.ADMIN],
};
