import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@/types';
import { fetchUserById } from '@/hooks/api/useUsers';

export type AssignerInfo = {
  name: string;
  email: string;
  initial: string;
  jobTitle?: string;
};

const infoFromUser = (u: User): AssignerInfo => {
  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Admin';
  const initial = name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'A';
  const jobTitle = u.jobTitle || (u.role === 'admin' ? 'Administrator' : 'Agent');
  return { name, email: u.email || 'N/A', initial, jobTitle };
};

const fallbackInfo: AssignerInfo = {
  name: 'Admin',
  email: 'N/A',
  initial: 'A',
  jobTitle: 'Administrator',
};

export function buildAssignerInfoFromPopulatedUsers(
  apiAssignments: Array<{ assignedBy?: unknown; userId?: unknown }>,
): Record<string, AssignerInfo> {
  const fromApi: Record<string, AssignerInfo> = {};
  apiAssignments.forEach((a) => {
    [a.assignedBy, a.userId].forEach((u) => {
      if (u && typeof u === 'object' && '_id' in u && typeof (u as User)._id === 'string') {
        const user = u as User;
        if (!fromApi[user._id]) {
          fromApi[user._id] = infoFromUser(user);
        }
      }
    });
  });
  return fromApi;
}

/** Resolve assigner display info from populated API objects, roster, or per-id fetch. */
export function useAssignerNames(
  assignerIds: string[],
  dbUsers: User[],
  populatedFromApi: Record<string, AssignerInfo>,
) {
  const [fetched, setFetched] = useState<Record<string, AssignerInfo>>({});
  const inFlightRef = useRef(new Set<string>());

  const rosterMap = useMemo(() => {
    const map: Record<string, AssignerInfo> = {};
    dbUsers.forEach((u) => {
      map[u._id] = infoFromUser(u);
    });
    return map;
  }, [dbUsers]);

  const idsKey = assignerIds.filter(Boolean).sort().join(',');

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) return;

    let cancelled = false;

    const load = async () => {
      for (const id of ids) {
        if (cancelled) return;
        if (populatedFromApi[id] || rosterMap[id] || inFlightRef.current.has(id)) continue;
        inFlightRef.current.add(id);

        try {
          const u = await fetchUserById(id);
          if (cancelled) return;
          setFetched((prev) => (prev[id] ? prev : { ...prev, [id]: infoFromUser(u) }));
        } catch {
          if (cancelled) return;
          setFetched((prev) => (prev[id] ? prev : { ...prev, [id]: fallbackInfo }));
        } finally {
          inFlightRef.current.delete(id);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [idsKey, populatedFromApi, rosterMap]);

  return useMemo(() => ({ ...fetched, ...rosterMap, ...populatedFromApi }), [fetched, rosterMap, populatedFromApi]);
}
