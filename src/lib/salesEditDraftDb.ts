import type { EditableLeadData } from '@/hooks/useLeadAutoSync';
import { runStore, SALES_EDIT_DRAFTS_STORE } from '@/lib/leapsoftSalesDb';

export type SalesEditDraftRecord = {
  userId: string;
  isEditAllMode: boolean;
  editingLeads: Record<string, EditableLeadData>;
  snapshot: Record<string, EditableLeadData>;
  updatedAt: number;
};

export async function loadSalesEditDraft(
  userId: string,
): Promise<SalesEditDraftRecord | null> {
  if (!userId) return null;
  const record = await runStore<SalesEditDraftRecord | undefined>(
    SALES_EDIT_DRAFTS_STORE,
    'readonly',
    (store) => store.get(userId),
  );
  return record ?? null;
}

export async function saveSalesEditDraft(
  userId: string,
  payload: {
    isEditAllMode: boolean;
    editingLeads: Record<string, EditableLeadData>;
    snapshot: Record<string, EditableLeadData>;
  },
): Promise<void> {
  if (!userId) return;
  const record: SalesEditDraftRecord = {
    userId,
    isEditAllMode: payload.isEditAllMode,
    editingLeads: payload.editingLeads,
    snapshot: payload.snapshot,
    updatedAt: Date.now(),
  };
  await runStore(SALES_EDIT_DRAFTS_STORE, 'readwrite', (store) => store.put(record));
}

export async function clearSalesEditDraft(userId: string): Promise<void> {
  if (!userId) return;
  await runStore(SALES_EDIT_DRAFTS_STORE, 'readwrite', (store) => store.delete(userId));
}
