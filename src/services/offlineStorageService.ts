import { KBEntry } from './chatLocalKB';

interface FallbackMessage {
  id: string;
  message: string;
}

const DB_NAME = 'female_health_bot';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

const openNativeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('knowledge_base')) {
        const kbStore = db.createObjectStore('knowledge_base', {
          keyPath: 'id',
        });
        kbStore.createIndex('category', 'category', { unique: false });
      }
      if (!db.objectStoreNames.contains('fallback_messages')) {
        db.createObjectStore('fallback_messages', { keyPath: 'id' });
      }
    };
  });
};

export const initOfflineDB = async (initialData: KBEntry[]) => {
  const db = await openNativeDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['knowledge_base', 'fallback_messages'], 'readwrite');
    const kbStore = tx.objectStore('knowledge_base');
    const fbStore = tx.objectStore('fallback_messages');

    tx.oncomplete = () => {
      console.log('Offline Database Initialized (Native)');
      resolve();
    };
    tx.onerror = () => reject(tx.error);

    // Seed Data
    initialData.forEach((entry) => {
      kbStore.put(entry);
    });

    // Clear or Reset Fallback
    fbStore.put({
      id: 'fb_01',
      message: '...', // Placeholder until new directives
    });
  });
};

export const searchOfflineKB = async (): Promise<KBEntry[]> => {
  const db = await openNativeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('knowledge_base', 'readonly');
    const store = tx.objectStore('knowledge_base');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getFallbackMessage = async (): Promise<string> => {
  const db = await openNativeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fallback_messages', 'readonly');
    const store = tx.objectStore('fallback_messages');
    const request = store.get('fb_01');

    request.onsuccess = () => {
      resolve(request.result?.message || 'Je ne comprends pas. Peux-tu reformuler ?');
    };
    request.onerror = () => reject(request.error);
  });
};
