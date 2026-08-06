const DB_NAME = 'leapsoft-sales';
const STORE_NAME = 'bulkAddLeadsDrafts';
const DB_VERSION = 1;

export type BulkAddLeadsDraftRecord = {
  userId: string;
  rows: unknown[];
  updatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function runStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = action(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));

        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error('IndexedDB transaction failed'));
        };
      }),
  );
}

export async function loadBulkAddLeadsDraft(
  userId: string,
): Promise<BulkAddLeadsDraftRecord | null> {
  if (!userId) return null;
  const record = await runStore<BulkAddLeadsDraftRecord | undefined>('readonly', (store) =>
    store.get(userId),
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
  await runStore('readwrite', (store) => store.put(record));
}

export async function clearBulkAddLeadsDraft(userId: string): Promise<void> {
  if (!userId) return;
  await runStore('readwrite', (store) => store.delete(userId));
}
