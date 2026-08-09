import { BULK_ADD_LEADS_STORE, runStore } from '@/lib/leapsoftSalesDb';

export type BulkAddLeadsDraftRecord = {
  userId: string;
  rows: unknown[];
  updatedAt: number;
};

export async function loadBulkAddLeadsDraft(
  userId: string,
): Promise<BulkAddLeadsDraftRecord | null> {
  if (!userId) return null;
  const record = await runStore<BulkAddLeadsDraftRecord | undefined>(
    BULK_ADD_LEADS_STORE,
    'readonly',
    (store) => store.get(userId),
  );
  return record ?? null;
}

export async function saveBulkAddLeadsDraft(userId: string, rows: unknown[]): Promise<void> {
  if (!userId) return;
  const record: BulkAddLeadsDraftRecord = {
    userId,
    rows,
    updatedAt: Date.now(),
  };
  await runStore(BULK_ADD_LEADS_STORE, 'readwrite', (store) => store.put(record));
}

export async function clearBulkAddLeadsDraft(userId: string): Promise<void> {
  if (!userId) return;
  await runStore(BULK_ADD_LEADS_STORE, 'readwrite', (store) => store.delete(userId));
}
