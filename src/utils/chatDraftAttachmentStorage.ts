/**
 * Persistent storage for chat file/image draft attachments using browser IndexedDB.
 * Unlike localStorage which is limited to 5MB and only supports plain strings,
 * IndexedDB natively stores binary Blob/File objects with virtually unlimited capacity,
 * surviving page reloads, browser restarts, and route navigation.
 */

const DB_NAME = 'leapsoft-chat-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'draft_attachments';

/** Time-to-live for draft attachments: 24 hours (1 day). */
export const DRAFT_ATTACHMENT_TTL_MS = 24 * 60 * 60 * 1000;

export function isAttachmentExpired(updatedAt: number): boolean {
  if (!updatedAt || typeof updatedAt !== 'number') return false;
  return Date.now() - updatedAt > DRAFT_ATTACHMENT_TTL_MS;
}

export interface StoredDraftAttachment {
  conversationId: string;
  blob: Blob | File;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  updatedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'conversationId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function runStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, mode);
          const store = tx.objectStore(STORE_NAME);
          const req = action(store);

          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));

          tx.oncomplete = () => db.close();
          tx.onerror = () => {
            db.close();
            reject(tx.error ?? new Error('IndexedDB transaction failed'));
          };
        } catch (err) {
          db.close();
          reject(err);
        }
      })
  );
}

/**
 * Saves an attached file or image for a conversation to browser IndexedDB.
 */
export async function saveDraftAttachment(conversationId: string, file: File): Promise<void> {
  if (!conversationId || !file || typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const record: StoredDraftAttachment = {
      conversationId,
      blob: file,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified || Date.now(),
      updatedAt: Date.now(),
    };
    await runStore('readwrite', (store) => store.put(record));
  } catch (err) {
    console.warn('Failed to save draft attachment in IndexedDB', err);
  }
}

/**
 * Loads the saved draft attachment for a conversation from browser IndexedDB.
 * Automatically cleans up and discards the attachment if it is older than 24 hours.
 */
export async function loadDraftAttachment(conversationId: string): Promise<File | null> {
  if (!conversationId || typeof window === 'undefined' || !window.indexedDB) return null;
  try {
    const record = await runStore<StoredDraftAttachment | undefined>('readonly', (store) =>
      store.get(conversationId)
    );
    if (!record || !record.blob) return null;

    // Check 1-day (24h) auto-expiry
    if (isAttachmentExpired(record.updatedAt)) {
      void removeDraftAttachment(conversationId);
      return null;
    }

    if (record.blob instanceof File) {
      return record.blob;
    }
    return new File([record.blob], record.name, {
      type: record.type,
      lastModified: record.lastModified,
    });
  } catch (err) {
    console.warn('Failed to load draft attachment from IndexedDB', err);
    return null;
  }
}

/**
 * Removes the saved draft attachment for a conversation from browser IndexedDB.
 */
export async function removeDraftAttachment(conversationId: string): Promise<void> {
  if (!conversationId || typeof window === 'undefined' || !window.indexedDB) return;
  try {
    await runStore('readwrite', (store) => store.delete(conversationId));
  } catch (err) {
    console.warn('Failed to remove draft attachment from IndexedDB', err);
  }
}

/**
 * Loads all active draft attachments from browser IndexedDB.
 * Automatically discards and purges any attachments older than 24 hours (1 day).
 */
export async function loadAllDraftAttachments(): Promise<Record<string, File>> {
  if (typeof window === 'undefined' || !window.indexedDB) return {};
  try {
    const records = await runStore<StoredDraftAttachment[]>('readonly', (store) => store.getAll());
    const result: Record<string, File> = {};
    const expiredIds: string[] = [];

    for (const record of records || []) {
      if (record?.conversationId && record.blob) {
        if (isAttachmentExpired(record.updatedAt)) {
          expiredIds.push(record.conversationId);
          continue;
        }

        if (record.blob instanceof File) {
          result[record.conversationId] = record.blob;
        } else {
          result[record.conversationId] = new File([record.blob], record.name, {
            type: record.type,
            lastModified: record.lastModified,
          });
        }
      }
    }

    // Auto-clean any expired attachments found in background
    if (expiredIds.length > 0) {
      void Promise.all(expiredIds.map((id) => removeDraftAttachment(id))).catch(() => {
        /* ignore */
      });
    }

    return result;
  } catch (err) {
    console.warn('Failed to load all draft attachments from IndexedDB', err);
    return {};
  }
}

/**
 * Manually cleans up all draft attachments older than 24 hours from IndexedDB.
 */
export async function cleanupExpiredDraftAttachments(): Promise<number> {
  if (typeof window === 'undefined' || !window.indexedDB) return 0;
  try {
    const records = await runStore<StoredDraftAttachment[]>('readonly', (store) => store.getAll());
    const expiredIds = (records || [])
      .filter((r) => r && isAttachmentExpired(r.updatedAt))
      .map((r) => r.conversationId);

    await Promise.all(expiredIds.map((id) => removeDraftAttachment(id)));
    return expiredIds.length;
  } catch (err) {
    console.warn('Failed to cleanup expired draft attachments', err);
    return 0;
  }
}
