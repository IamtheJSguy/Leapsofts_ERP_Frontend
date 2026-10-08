import type { QueryClient } from '@tanstack/react-query';
import type { Lead, LeadsListResponse, User } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

export interface LeadUpdateScope {
  userId?: string;
  organizationId?: string;
}
export const getLeadUpdateScope = (): LeadUpdateScope => {
  const user = useAuthStore.getState().user;
  return { userId: user?._id, organizationId: user?.organizationId };
};

const sameScope = (scope: LeadUpdateScope): boolean => {
  const current = useAuthStore.getState();
  return current.isAuthenticated && !!scope.userId && current.user?._id === scope.userId &&
    current.user?.organizationId === scope.organizationId;
};

const responseLead = (saved: Lead, previous?: Lead): Lead => {
  // A slower mutation response must not overwrite a later acknowledged update.
  const priorRevision = (previous as (Lead & { __v?: number }) | undefined)?.__v;
  const savedRevision = (saved as Lead & { __v?: number }).__v;
  const revisionDiffers = typeof priorRevision === 'number' && typeof savedRevision === 'number' && priorRevision !== savedRevision;
  const older = revisionDiffers ? priorRevision > savedRevision :
    previous?.updatedAt && saved.updatedAt && Date.parse(previous.updatedAt) > Date.parse(saved.updatedAt);
  if (older && previous) return previous;
  // Keep display names when an unchanged reference is serialized as an ID.
  const populatedUser = (value: string | User, old?: string | User): string | User =>
    typeof value === 'string' && old && typeof old === 'object' && old._id === value ? old : value;
  const next = { ...saved };
  if (next.assignedTo) next.assignedTo = populatedUser(next.assignedTo, previous?.assignedTo);
  if (next.sharedWith) {
    const prior = new Map((previous?.sharedWith ?? []).map((value) => [typeof value === 'string' ? value : value._id, value]));
    next.sharedWith = next.sharedWith.map((value) => populatedUser(value, prior.get(typeof value === 'string' ? value : value._id))) as Lead['sharedWith'];
  }
  return next;
};

/** Publish the authoritative PUT response before starting any background refetch. */
export const applyLeadUpdateResponse = async (
  client: QueryClient, saved: Lead, scope: LeadUpdateScope,
): Promise<boolean> => {
  if (!saved?._id || !sameScope(scope)) return false;
  const detailKey = ['lead', saved._id, scope.organizationId];
  const listKey = ['leads', scope.organizationId];
  // Cancel pre-response GETs so they cannot revert or overwrite the saved record.
  await Promise.all([
    client.cancelQueries({ queryKey: detailKey, exact: true }),
    client.cancelQueries({ queryKey: listKey }),
  ]);
  if (!sameScope(scope)) return false;
  client.setQueryData<Lead>(detailKey, (old) => responseLead(saved, old));
  client.setQueriesData<LeadsListResponse>({ queryKey: listKey }, (old) => {
    if (!old?.data.some((lead) => lead._id === saved._id)) return old;
    return { ...old, data: old.data.map((lead) => lead._id === saved._id ? responseLead(saved, lead) : lead) };
  });
  return true;
};
