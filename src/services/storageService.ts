import { CycleEntry, UserSettings, AuthData } from '../types';
import { KBEntry } from './chatLocalKB';

const DB_NAME = 'menstrual_cycle_app';
const DB_VERSION = 2; // Incremented version to add chat stores

const STORES = {
  AUTH: 'auth',
  CYCLES: 'cycles',
  SETTINGS: 'settings',
  KB: 'knowledge_base',
  FALLBACK: 'fallback_messages',
};

// In-memory cache for synchronous access
const cache = {
  auth: null as AuthData | null,
  cycles: [] as CycleEntry[],
  settings: null as UserSettings | null,
  initialized: false,
};

let db: IDBDatabase | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Low-level IndexedDB initialization
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // User Data Stores
      if (!database.objectStoreNames.contains(STORES.AUTH)) {
        database.createObjectStore(STORES.AUTH, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(STORES.CYCLES)) {
        const cycleStore = database.createObjectStore(STORES.CYCLES, { keyPath: 'id' });
        cycleStore.createIndex('startDate', 'startDate', { unique: false });
      }
      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }

      // Chat Data Stores (migrated from female_health_bot DB)
      if (!database.objectStoreNames.contains(STORES.KB)) {
        const kbStore = database.createObjectStore(STORES.KB, { keyPath: 'id' });
        kbStore.createIndex('category', 'category', { unique: false });
      }
      if (!database.objectStoreNames.contains(STORES.FALLBACK)) {
        database.createObjectStore(STORES.FALLBACK, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Migration logic from older versions or localStorage
 */
async function migrateIfNeeded(): Promise<void> {
  if (typeof localStorage === 'undefined') return;

  const MIGRATION_KEY = 'menstrual_app_migrated_v2';
  if (localStorage.getItem(MIGRATION_KEY)) return;

  try {
    const authData = localStorage.getItem('menstrual_app_auth');
    const cyclesData = localStorage.getItem('menstrual_app_cycles');
    const settingsData = localStorage.getItem('menstrual_app_settings');

    const database = await initDB();
    const tx = database.transaction([STORES.AUTH, STORES.CYCLES, STORES.SETTINGS], 'readwrite');

    if (authData) {
      const auth = JSON.parse(authData);
      tx.objectStore(STORES.AUTH).put({ ...auth, _id: auth.id, id: 'current' });
    }
    if (settingsData)
      tx.objectStore(STORES.SETTINGS).put({ id: 'current', ...JSON.parse(settingsData) });
    if (cyclesData) {
      const cycles = JSON.parse(cyclesData);
      if (Array.isArray(cycles)) {
        const store = tx.objectStore(STORES.CYCLES);
        cycles.forEach((c) => store.put(c));
      }
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (e) {
    console.error('[Storage] Migration failed:', e);
  }
}

/**
 * Ensure the service is ready and cache is populated
 */
async function ensureInitialized(): Promise<void> {
  if (cache.initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await initDB();
      await migrateIfNeeded();

      // Parallel loading of all primary data
      const [auth, cycles, settings] = await Promise.all([
        getStoreItem<AuthData>(STORES.AUTH, 'current'),
        getStoreAll<CycleEntry>(STORES.CYCLES),
        getStoreItem<UserSettings>(STORES.SETTINGS, 'current'),
      ]);

      cache.auth = auth;
      cache.cycles = cycles;
      cache.settings = settings;
      cache.initialized = true;
    } catch (e) {
      console.error('[Storage] Initialization failed:', e);
      // Fallback
      cache.initialized = true;
    }
  })();

  return initPromise;
}

// Low-level IndexedDB helpers
async function getStoreItem<T>(storeName: string, key: string): Promise<T | null> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const request = database.transaction([storeName], 'readonly').objectStore(storeName).get(key);
    request.onsuccess = () => {
      if (!request.result) return resolve(null);
      const { id, _id, ...data } = request.result;
      // Restore real ID if it was stored as _id
      const finalData = _id ? { ...data, id: _id } : data;
      resolve(finalData as T);
    };
    request.onerror = () => reject(request.error);
  });
}

async function getStoreAll<T>(storeName: string): Promise<T[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const request = database.transaction([storeName], 'readonly').objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Main Storage Service
 */
export class StorageService {
  static async ensureReady(): Promise<void> {
    await ensureInitialized();
  }

  // --- Auth ---
  static getAuth(): AuthData | null {
    return cache.auth;
  }

  static async setAuth(auth: AuthData): Promise<void> {
    cache.auth = auth;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('menstrual_app_auth', JSON.stringify(auth));
    }
    const database = await initDB();
    database
      .transaction([STORES.AUTH], 'readwrite')
      .objectStore(STORES.AUTH)
      .put({ ...auth, _id: auth.id, id: 'current' });
  }

  static async clearAuth(): Promise<void> {
    cache.auth = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('menstrual_app_auth');
    }
    const database = await initDB();
    database.transaction([STORES.AUTH], 'readwrite').objectStore(STORES.AUTH).delete('current');
  }

  // --- Cycles ---
  static getCycles(): CycleEntry[] {
    return [...cache.cycles];
  }

  static async getCyclesAsync(): Promise<CycleEntry[]> {
    await ensureInitialized();
    return [...cache.cycles];
  }

  static async saveCycles(cycles: CycleEntry[]): Promise<void> {
    cache.cycles = [...cycles];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('menstrual_app_cycles', JSON.stringify(cycles));
    }

    const database = await initDB();
    const tx = database.transaction([STORES.CYCLES], 'readwrite');
    const store = tx.objectStore(STORES.CYCLES);
    store.clear();
    cycles.forEach((c) => store.put(c));
  }

  static async addCycle(cycle: CycleEntry): Promise<void> {
    const cycles = [...cache.cycles, cycle];
    await this.saveCycles(cycles);
  }

  static async updateCycle(id: string, updates: Partial<CycleEntry>): Promise<void> {
    const cycles = cache.cycles.map((c) => (c.id === id ? { ...c, ...updates } : c));
    await this.saveCycles(cycles);
  }

  static async deleteCycle(id: string): Promise<void> {
    const cycles = cache.cycles.filter((c) => c.id !== id);
    await this.saveCycles(cycles);
  }

  // --- Settings ---
  static getSettings(): UserSettings {
    return cache.settings || this.getDefaultSettings();
  }

  static async getSettingsAsync(): Promise<UserSettings> {
    await ensureInitialized();
    return cache.settings || this.getDefaultSettings();
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    cache.settings = settings;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('menstrual_app_settings', JSON.stringify(settings));
    }
    const database = await initDB();
    database
      .transaction([STORES.SETTINGS], 'readwrite')
      .objectStore(STORES.SETTINGS)
      .put({ id: 'current', ...settings });
  }

  static getDefaultSettings(): UserSettings {
    return {
      notificationsOn: true,
      privacyMode: false,
      shareAnonymousStats: false,
      defaultPeriodLength: 5,
      defaultCycleLength: 28,
    };
  }

  // --- Chat & Knowledge Base ---
  static async initChatDB(initialData: KBEntry[]): Promise<void> {
    const database = await initDB();

    // Check if data already exists to avoid redundant writes
    const existing = await getStoreAll<KBEntry>(STORES.KB);
    if (existing.length > 0) return;

    return new Promise((resolve, reject) => {
      const tx = database.transaction([STORES.KB, STORES.FALLBACK], 'readwrite');
      const kbStore = tx.objectStore(STORES.KB);
      const fbStore = tx.objectStore(STORES.FALLBACK);

      initialData.forEach((entry) => kbStore.put(entry));
      fbStore.put({ id: 'fb_01', message: 'Je ne comprends pas. Peux-tu reformuler ?' });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async searchChatKB(): Promise<KBEntry[]> {
    return getStoreAll<KBEntry>(STORES.KB);
  }

  static async getChatFallback(): Promise<string> {
    const item = await getStoreItem<{ message: string }>(STORES.FALLBACK, 'fb_01');
    return item?.message || 'Je ne comprends pas. Peux-tu reformuler ?';
  }

  // --- Maintenance ---
  static async clearAllData(): Promise<void> {
    cache.auth = null;
    cache.cycles = [];
    cache.settings = null;

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('menstrual_app_auth');
      localStorage.removeItem('menstrual_app_cycles');
      localStorage.removeItem('menstrual_app_settings');
    }

    const database = await initDB();
    const tx = database.transaction(
      [STORES.AUTH, STORES.CYCLES, STORES.SETTINGS, STORES.KB, STORES.FALLBACK],
      'readwrite'
    );
    tx.objectStore(STORES.AUTH).clear();
    tx.objectStore(STORES.CYCLES).clear();
    tx.objectStore(STORES.SETTINGS).clear();
    tx.objectStore(STORES.KB).clear();
    tx.objectStore(STORES.FALLBACK).clear();
  }

  static exportData(): string {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        auth: cache.auth ? { ...cache.auth, id: '[REDACTED]' } : null,
        cycles: cache.cycles,
        settings: cache.settings,
      },
      null,
      2
    );
  }

  static async importData(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (data.cycles) await this.saveCycles(data.cycles);
      if (data.settings) await this.saveSettings(data.settings);
      return true;
    } catch (e) {
      console.error('[Storage] Import failed:', e);
      return false;
    }
  }
}
