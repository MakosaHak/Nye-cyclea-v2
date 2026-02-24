// IndexedDB Service for Menstrual Cycle Management App
// Provides async storage with better performance and capacity than localStorage

const DB_NAME = 'menstrual_cycle_app';
const DB_VERSION = 1;

const STORES = {
  AUTH: 'auth',
  CYCLES: 'cycles',
  SETTINGS: 'settings',
};

interface DBInstance {
  db: IDBDatabase | null;
  initPromise: Promise<IDBDatabase> | null;
}

const dbInstance: DBInstance = {
  db: null,
  initPromise: null,
};

// Initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  if (dbInstance.db) {
    return Promise.resolve(dbInstance.db);
  }

  if (dbInstance.initPromise) {
    return dbInstance.initPromise;
  }

  dbInstance.initPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance.db = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.AUTH)) {
        db.createObjectStore(STORES.AUTH, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CYCLES)) {
        const cycleStore = db.createObjectStore(STORES.CYCLES, {
          keyPath: 'id',
        });
        cycleStore.createIndex('startDate', 'startDate', { unique: false });
        cycleStore.createIndex('userId', 'userId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
    };
  });

  return dbInstance.initPromise;
}

// Generic get method
export async function get<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        // If result has an id property and other properties, extract them
        if (result.id === key) {
          const { id, ...data } = result;
          resolve(data as T);
        } else {
          resolve(result as T);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error getting ${key} from ${storeName}:`, error);
    return null;
  }
}

// Generic set method
export async function set<T>(storeName: string, key: string, value: T): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ id: key, ...value });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error setting ${key} in ${storeName}:`, error);
    throw error;
  }
}

// Generic delete method
async function remove(storeName: string, key: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error deleting ${key} from ${storeName}:`, error);
    throw error;
  }
}

// Get all items from a store
async function getAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error getting all from ${storeName}:`, error);
    return [];
  }
}

// Clear all items from a store
async function clear(storeName: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error clearing ${storeName}:`, error);
    throw error;
  }
}

// Migration from localStorage to IndexedDB
async function migrateFromLocalStorage(): Promise<void> {
  const MIGRATION_KEY = 'menstrual_app_migrated_to_indexeddb';

  // Check if we are in a browser environment with localStorage
  if (typeof localStorage === 'undefined') {
    return;
  }

  // Check if migration already done
  const migrated = await get<{ migrated: boolean }>(STORES.SETTINGS, MIGRATION_KEY);
  if (migrated?.migrated) {
    return;
  }

  try {
    // Migrate auth
    const authData = localStorage.getItem('menstrual_app_auth');
    if (authData) {
      try {
        const auth = JSON.parse(authData);
        await set(STORES.AUTH, 'current', auth);
      } catch (e) {
        console.error('Error migrating auth:', e);
      }
    }

    // Migrate cycles
    const cyclesData = localStorage.getItem('menstrual_app_cycles');
    if (cyclesData) {
      try {
        const cycles = JSON.parse(cyclesData);
        if (Array.isArray(cycles) && cycles.length > 0) {
          const db = await initDB();
          const transaction = db.transaction([STORES.CYCLES], 'readwrite');
          const store = transaction.objectStore(STORES.CYCLES);

          for (const cycle of cycles) {
            await new Promise<void>((resolve, reject) => {
              const request = store.put(cycle);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            });
          }
        }
      } catch (e) {
        console.error('Error migrating cycles:', e);
      }
    }

    // Migrate settings
    const settingsData = localStorage.getItem('menstrual_app_settings');
    if (settingsData) {
      try {
        const settings = JSON.parse(settingsData);
        await set(STORES.SETTINGS, 'current', settings);
      } catch (e) {
        console.error('Error migrating settings:', e);
      }
    }

    // Mark migration as done
    await set(STORES.SETTINGS, MIGRATION_KEY, { migrated: true });

    // Optionally clear localStorage after migration (commented for safety)
    // localStorage.removeItem('menstrual_app_auth');
    // localStorage.removeItem('menstrual_app_cycles');
    // localStorage.removeItem('menstrual_app_settings');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Initialize and migrate on import
initDB()
  .then(() => {
    migrateFromLocalStorage();
  })
  .catch(console.error);

export { initDB, migrateFromLocalStorage };
