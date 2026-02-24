import { CycleEntry, UserSettings, AuthData } from '../types';
import { initDB, migrateFromLocalStorage } from './indexedDBService';

const STORES = {
  AUTH: 'auth',
  CYCLES: 'cycles',
  SETTINGS: 'settings',
};

// In-memory cache for synchronous access
const cache = {
  auth: null as AuthData | null,
  cycles: [] as CycleEntry[],
  settings: null as UserSettings | null,
  initialized: false,
  initError: false,
};

// Initialize IndexedDB and load data into cache
let initPromise: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (cache.initialized) {
    return Promise.resolve();
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await initDB();
      await migrateFromLocalStorage();

      // Load all data into cache
      const db = await initDB();

      // Load auth
      const authTransaction = db.transaction([STORES.AUTH], 'readonly');
      const authStore = authTransaction.objectStore(STORES.AUTH);
      const authRequest = authStore.get('current');
      await new Promise<void>((resolve) => {
        authRequest.onsuccess = () => {
          const result = authRequest.result;
          if (result && result.id === 'current') {
            const { id, ...authData } = result;
            cache.auth = authData as AuthData;
          } else {
            cache.auth = result || null;
          }
          resolve();
        };
        authRequest.onerror = () => resolve();
      });

      // Load cycles
      const cyclesTransaction = db.transaction([STORES.CYCLES], 'readonly');
      const cyclesStore = cyclesTransaction.objectStore(STORES.CYCLES);
      const cyclesRequest = cyclesStore.getAll();
      await new Promise<void>((resolve) => {
        cyclesRequest.onsuccess = () => {
          cache.cycles = cyclesRequest.result || [];
          resolve();
        };
        cyclesRequest.onerror = () => resolve();
      });

      // Load settings
      const settingsTransaction = db.transaction([STORES.SETTINGS], 'readonly');
      const settingsStore = settingsTransaction.objectStore(STORES.SETTINGS);
      const settingsRequest = settingsStore.get('current');
      await new Promise<void>((resolve) => {
        settingsRequest.onsuccess = () => {
          const result = settingsRequest.result;
          if (result && result.id === 'current') {
            const { id, ...settingsData } = result;
            cache.settings = settingsData as UserSettings;
          } else {
            cache.settings = result || null;
          }
          resolve();
        };
        settingsRequest.onerror = () => resolve();
      });

      cache.initialized = true;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      cache.initError = true;
      cache.initialized = true;
    }
  })();

  return initPromise;
}

// Initialize on module load
ensureInitialized();

// Helper to save to IndexedDB (async, fire and forget)
async function saveToIndexedDB(storeName: string, key: string, value: any): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ id: key, ...value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error saving to ${storeName}:`, error);
  }
}

async function deleteFromIndexedDB(storeName: string, key: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error deleting from ${storeName}:`, error);
    // Ne pas rejeter pour éviter de bloquer l'application si IndexedDB échoue
    // Le localStorage est déjà nettoyé
  }
}

async function clearIndexedDBStore(storeName: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error clearing ${storeName}:`, error);
    // Ne pas rejeter pour éviter de bloquer l'application si IndexedDB échoue
    // Le localStorage est déjà nettoyé
  }
}

export class StorageService {
  // Ensure initialization before use (public so App.tsx can await it on iOS)
  static async ensureReady(): Promise<void> {
    await ensureInitialized();
  }

  // Auth methods
  static getAuth(): AuthData | null {
    if (cache.auth) {
      return cache.auth;
    }

    // Fallback to localStorage if not in cache or if init failed
    const data = localStorage.getItem('menstrual_app_auth');
    if (data) {
      try {
        const auth = JSON.parse(data);
        if (!cache.auth) {
          cache.auth = auth;
        }
        return auth;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  static async setAuth(auth: AuthData): Promise<void> {
    cache.auth = auth;
    // Save to localStorage first (sync backup)
    localStorage.setItem('menstrual_app_auth', JSON.stringify(auth));
    // Save to IndexedDB asynchronously
    await saveToIndexedDB(STORES.AUTH, 'current', auth);
  }

  static clearAuth(): void {
    try {
      console.log('clearAuth: Starting to clear auth');
      cache.auth = null;
      localStorage.removeItem('menstrual_app_auth');
      console.log('clearAuth: localStorage cleared');

      // Nettoyer IndexedDB de manière asynchrone sans bloquer
      deleteFromIndexedDB(STORES.AUTH, 'current').catch((error) => {
        console.error('Error clearing auth from IndexedDB:', error);
        // Ne pas bloquer même si IndexedDB échoue, localStorage est déjà nettoyé
      });

      console.log('clearAuth: Auth cleared successfully');
    } catch (error) {
      console.error('Error in clearAuth:', error);
      // S'assurer que localStorage est nettoyé même en cas d'erreur
      localStorage.removeItem('menstrual_app_auth');
      throw error;
    }
  }

  // Cycles methods
  static getCycles(): CycleEntry[] {
    if (!cache.initialized) {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem('menstrual_app_cycles');
        return data ? JSON.parse(data) : [];
      }
      return [];
    }
    return [...cache.cycles];
  }

  static async getCyclesAsync(): Promise<CycleEntry[]> {
    await ensureInitialized();
    return [...cache.cycles];
  }

  static async saveCycles(cycles: CycleEntry[]): Promise<void> {
    cache.cycles = [...cycles];
    // Save to localStorage immediately as sync backup
    localStorage.setItem('menstrual_app_cycles', JSON.stringify(cycles));

    // Save all cycles to IndexedDB
    try {
      const db = await initDB();
      const transaction = db.transaction([STORES.CYCLES], 'readwrite');
      const store = transaction.objectStore(STORES.CYCLES);

      // Clear existing cycles
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Add all cycles
      await Promise.all(
        cycles.map((cycle) => {
          return new Promise<void>((resolve, reject) => {
            const request = store.put(cycle);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        })
      );
    } catch (error) {
      console.error('Error saving cycles to IndexedDB:', error);
    }
  }

  static async addCycle(cycle: CycleEntry): Promise<void> {
    const cycles = this.getCycles();
    cycles.push(cycle);
    await this.saveCycles(cycles);
  }

  static async updateCycle(cycleId: string, updates: Partial<CycleEntry>): Promise<void> {
    const cycles = this.getCycles();
    const index = cycles.findIndex((c) => c.id === cycleId);
    if (index !== -1) {
      cycles[index] = { ...cycles[index], ...updates };
      await this.saveCycles(cycles);
    }
  }

  static async deleteCycle(cycleId: string): Promise<void> {
    const cycles = this.getCycles();
    const filtered = cycles.filter((c) => c.id !== cycleId);
    await this.saveCycles(filtered);
    // Also delete from IndexedDB
    await deleteFromIndexedDB(STORES.CYCLES, cycleId);
  }

  // Settings methods
  static getSettings(): UserSettings {
    if (!cache.initialized) {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem('menstrual_app_settings');
        return data ? JSON.parse(data) : this.getDefaultSettings();
      }
      return this.getDefaultSettings();
    }
    return cache.settings || this.getDefaultSettings();
  }

  static async getSettingsAsync(): Promise<UserSettings> {
    await ensureInitialized();
    return cache.settings || this.getDefaultSettings();
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    cache.settings = settings;
    localStorage.setItem('menstrual_app_settings', JSON.stringify(settings));
    await saveToIndexedDB(STORES.SETTINGS, 'current', settings);
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

  // Export data
  static exportData(): string {
    const auth = this.getAuth();
    const cycles = this.getCycles();
    const settings = this.getSettings();

    const exportData = {
      exportDate: new Date().toISOString(),
      auth: auth ? { ...auth, id: '[REDACTED]' } : null,
      cycles,
      settings,
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import data
  static async importData(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);

      if (!data || typeof data !== 'object') {
        throw new Error('Format de fichier invalide');
      }

      if (data.cycles && Array.isArray(data.cycles)) {
        await this.saveCycles(data.cycles);
      }

      if (data.settings) {
        await this.saveSettings(data.settings);
      }

      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    try {
      console.log('clearAllData: Starting to clear all data');

      // Clear cache first
      cache.auth = null;
      cache.cycles = [];
      cache.settings = null;
      console.log('clearAllData: Cache cleared');

      // Clear localStorage first (synchronous, immediate)
      localStorage.removeItem('menstrual_app_cycles');
      localStorage.removeItem('menstrual_app_settings');
      localStorage.removeItem('menstrual_app_auth');
      console.log('clearAllData: localStorage cleared');

      // Clear IndexedDB in parallel (async, but don't block)
      try {
        await Promise.all([
          clearIndexedDBStore(STORES.CYCLES),
          clearIndexedDBStore(STORES.SETTINGS),
          deleteFromIndexedDB(STORES.AUTH, 'current'),
        ]);
        console.log('clearAllData: IndexedDB cleared');
      } catch (indexedDBError) {
        console.error('clearAllData: Error clearing IndexedDB (non-blocking):', indexedDBError);
        // Ne pas bloquer même si IndexedDB échoue, localStorage est déjà nettoyé
      }

      console.log('clearAllData: All data cleared successfully');
    } catch (error) {
      console.error('clearAllData: Unexpected error:', error);
      // S'assurer que localStorage est nettoyé même en cas d'erreur
      localStorage.removeItem('menstrual_app_cycles');
      localStorage.removeItem('menstrual_app_settings');
      localStorage.removeItem('menstrual_app_auth');
      throw error;
    }
  }
}
