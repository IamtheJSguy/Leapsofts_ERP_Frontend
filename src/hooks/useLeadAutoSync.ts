import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '@/lib/axios';
import type { ConnectionStatus, Lead, MessageStatus } from '@/types';

export type EditableLeadData = {
  firstName: string;
  lastName: string;
  email: string;
  icp: string;
  profile: string;
  connectionStatus: ConnectionStatus;
  messageStatus: MessageStatus;
  linkedinMsg: string;
  futureLeadDate?: string;
};

export type LeadSyncStats = {
  lastSyncAt: Date | null;
  syncedCount: number;
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
};

const EDITABLE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'icp',
  'profile',
  'connectionStatus',
  'messageStatus',
  'linkedinMsg',
  'futureLeadDate',
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

const emptyStats = (): LeadSyncStats => ({
  lastSyncAt: null,
  syncedCount: 0,
  pendingCount: 0,
  failedCount: 0,
  isSyncing: false,
});

const normalizeValue = (field: EditableField, value: unknown): string => {
  if (field === 'futureLeadDate') {
    if (!value) return '';
    try {
      return format(new Date(String(value)), 'yyyy-MM-dd');
    } catch {
      return String(value);
    }
  }
  return value == null ? '' : String(value);
};

export const buildEditDataFromProspect = (prospect: Lead | Record<string, any>): EditableLeadData => ({
  firstName: prospect.firstName || '',
  lastName: prospect.lastName || '',
  email: prospect.email || '',
  icp: prospect.icp || '',
  profile: prospect.profile || '',
  connectionStatus: (prospect.connectionStatus || 'pending') as ConnectionStatus,
  messageStatus: (prospect.messageStatus || 'not_sent') as MessageStatus,
  linkedinMsg: prospect.linkedinMsg || '',
  futureLeadDate: prospect.futureLeadDate
    ? format(new Date(prospect.futureLeadDate), 'yyyy-MM-dd')
    : undefined,
});

export const cloneEditData = (data: EditableLeadData): EditableLeadData => ({
  ...data,
  futureLeadDate: data.futureLeadDate || undefined,
});

export const isLeadEditEqual = (a?: EditableLeadData, b?: EditableLeadData): boolean => {
  if (!a || !b) return false;
  return EDITABLE_FIELDS.every(
    (field) => normalizeValue(field, a[field]) === normalizeValue(field, b[field]),
  );
};

export const getChangedLeadIds = (
  current: Record<string, EditableLeadData>,
  snapshot: Record<string, EditableLeadData>,
): string[] =>
  Object.keys(current).filter((id) => {
    const row = current[id];
    if (!row) return false;
    const snap = snapshot[id];
    if (!snap) return true;
    return !isLeadEditEqual(row, snap);
  });

const isValidForSync = (data: EditableLeadData): boolean => {
  if (data.messageStatus === 'future_lead' && !data.futureLeadDate) return false;
  return true;
};

type UseLeadAutoSyncOptions = {
  editingLeads: Record<string, EditableLeadData>;
  setEditingLeads: Dispatch<SetStateAction<Record<string, EditableLeadData>>>;
  intervalMs?: number;
};

export const useLeadAutoSync = ({
  editingLeads,
  setEditingLeads,
  intervalMs = 30_000,
}: UseLeadAutoSyncOptions) => {
  const queryClient = useQueryClient();
  const [isEditAllMode, setIsEditAllMode] = useState(false);
  const [stats, setStats] = useState<LeadSyncStats>(emptyStats);

  const snapshotRef = useRef<Record<string, EditableLeadData>>({});
  const editingLeadsRef = useRef(editingLeads);
  const isSyncingRef = useRef(false);
  const failedIdsRef = useRef<Set<string>>(new Set());
  const syncedCountRef = useRef(0);

  editingLeadsRef.current = editingLeads;

  const recomputePending = useCallback((current: Record<string, EditableLeadData>) => {
    const pendingCount = getChangedLeadIds(current, snapshotRef.current).length;
    setStats((prev) => ({
      ...prev,
      pendingCount,
      failedCount: failedIdsRef.current.size,
      syncedCount: syncedCountRef.current,
    }));
  }, []);

  useEffect(() => {
    if (!isEditAllMode) return;
    recomputePending(editingLeads);
  }, [editingLeads, isEditAllMode, recomputePending]);

  const invalidateLeadQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['salesPipelineStats'] });
    queryClient.invalidateQueries({ queryKey: ['salesKpis'] });
    queryClient.invalidateQueries({ queryKey: ['salesKpiSummary'] });
  }, [queryClient]);

  const syncChanged = useCallback(
    async (options?: { exitAfter?: boolean }): Promise<{ synced: number; failed: number; skipped: number }> => {
      if (isSyncingRef.current) {
        return { synced: 0, failed: 0, skipped: 0 };
      }

      const current = editingLeadsRef.current;
      const changedIds = getChangedLeadIds(current, snapshotRef.current);

      if (changedIds.length === 0) {
        setStats((prev) => ({
          ...prev,
          lastSyncAt: new Date(),
          pendingCount: 0,
          failedCount: failedIdsRef.current.size,
          isSyncing: false,
        }));
        if (options?.exitAfter) {
          setIsEditAllMode(false);
          setEditingLeads({});
          snapshotRef.current = {};
          failedIdsRef.current.clear();
          syncedCountRef.current = 0;
          setStats(emptyStats());
        }
        return { synced: 0, failed: 0, skipped: 0 };
      }

      isSyncingRef.current = true;
      setStats((prev) => ({ ...prev, isSyncing: true }));

      let synced = 0;
      let failed = 0;
      let skipped = 0;
      let anySuccess = false;

      await Promise.all(
        changedIds.map(async (id) => {
          const data = current[id];
          if (!data) return;

          if (!isValidForSync(data)) {
            skipped += 1;
            return;
          }

          try {
            await api.put(`/leads/${id}`, data);
            snapshotRef.current[id] = cloneEditData(data);
            failedIdsRef.current.delete(id);
            synced += 1;
            syncedCountRef.current += 1;
            anySuccess = true;
          } catch {
            failedIdsRef.current.add(id);
            failed += 1;
          }
        }),
      );

      if (anySuccess) {
        invalidateLeadQueries();
      }

      isSyncingRef.current = false;

      const pendingAfter = getChangedLeadIds(editingLeadsRef.current, snapshotRef.current).length;

      setStats({
        lastSyncAt: new Date(),
        syncedCount: syncedCountRef.current,
        pendingCount: pendingAfter,
        failedCount: failedIdsRef.current.size,
        isSyncing: false,
      });

      // Save All exits only when every changeable row synced (or there was nothing left).
      // Failed / invalid rows stay editable so the next sync/Save All can retry.
      if (options?.exitAfter && failed === 0 && skipped === 0) {
        setIsEditAllMode(false);
        setEditingLeads({});
        snapshotRef.current = {};
        failedIdsRef.current.clear();
        syncedCountRef.current = 0;
        setStats(emptyStats());
      }

      return { synced, failed, skipped };
    },
    [invalidateLeadQueries, setEditingLeads],
  );

  useEffect(() => {
    if (!isEditAllMode) return undefined;

    const timer = window.setInterval(() => {
      void syncChanged();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [isEditAllMode, intervalMs, syncChanged]);

  const enterEditAll = useCallback(
    (prospects: Array<Lead | Record<string, any>>) => {
      setEditingLeads((prev) => {
        const next: Record<string, EditableLeadData> = { ...prev };
        const nextSnapshot: Record<string, EditableLeadData> = { ...snapshotRef.current };

        for (const prospect of prospects) {
          const id = String(prospect._id);
          if (!next[id]) {
            const data = buildEditDataFromProspect(prospect);
            next[id] = data;
            nextSnapshot[id] = cloneEditData(data);
          } else if (!nextSnapshot[id]) {
            nextSnapshot[id] = cloneEditData(next[id]);
          }
        }

        snapshotRef.current = nextSnapshot;
        return next;
      });

      failedIdsRef.current.clear();
      syncedCountRef.current = 0;
      setIsEditAllMode(true);
      setStats({
        ...emptyStats(),
        lastSyncAt: null,
        pendingCount: 0,
      });
    },
    [setEditingLeads],
  );

  /** Keep newly loaded/visible leads editable while Edit All is active. */
  const ensureProspectsEditable = useCallback(
    (prospects: Array<Lead | Record<string, any>>) => {
      if (!isEditAllMode || prospects.length === 0) return;

      setEditingLeads((prev) => {
        let changed = false;
        const next = { ...prev };
        const nextSnapshot = { ...snapshotRef.current };

        for (const prospect of prospects) {
          const id = String(prospect._id);
          if (!next[id]) {
            const data = buildEditDataFromProspect(prospect);
            next[id] = data;
            nextSnapshot[id] = cloneEditData(data);
            changed = true;
          }
        }

        if (changed) {
          snapshotRef.current = nextSnapshot;
          return next;
        }
        return prev;
      });
    },
    [isEditAllMode, setEditingLeads],
  );

  const saveAll = useCallback(async () => {
    return syncChanged({ exitAfter: true });
  }, [syncChanged]);

  const cancelEditAll = useCallback(() => {
    setIsEditAllMode(false);
    setEditingLeads({});
    snapshotRef.current = {};
    failedIdsRef.current.clear();
    syncedCountRef.current = 0;
    isSyncingRef.current = false;
    setStats(emptyStats());
  }, [setEditingLeads]);

  const removeFromSnapshot = useCallback(
    (id: string) => {
      delete snapshotRef.current[id];
      failedIdsRef.current.delete(id);
      if (isEditAllMode) {
        recomputePending(editingLeadsRef.current);
      }
    },
    [isEditAllMode, recomputePending],
  );

  return {
    isEditAllMode,
    syncStats: stats,
    enterEditAll,
    ensureProspectsEditable,
    saveAll,
    cancelEditAll,
    syncNow: syncChanged,
    removeFromSnapshot,
  };
};
