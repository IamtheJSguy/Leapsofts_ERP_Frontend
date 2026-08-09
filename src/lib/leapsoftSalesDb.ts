const DB_NAME = 'leapsoft-sales';
export const DB_VERSION = 2;
export const BULK_ADD_LEADS_STORE = 'bulkAddLeadsDrafts';
export const SALES_EDIT_DRAFTS_STORE = 'salesEditDrafts';

export function openLeapsoftSalesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BULK_ADD_LEADS_STORE)) {
        db.createObjectStore(BULK_ADD_LEADS_STORE, { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains(SALES_EDIT_DRAFTS_STORE)) {
        db.createObjectStore(SALES_EDIT_DRAFTS_STORE, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export function runStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openLeapsoftSalesDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
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
