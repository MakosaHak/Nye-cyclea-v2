import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from './storageService';

// Mock IndexedDB and local services
vi.mock('./indexedDBService', () => {
    const createRequest = () => {
        const req: any = { onsuccess: null, onerror: null, result: null };
        setTimeout(() => {
            if (req.onsuccess) req.onsuccess();
        }, 0);
        return req;
    };

    const mockDb = {
        transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
                get: vi.fn(createRequest),
                getAll: vi.fn(createRequest),
                put: vi.fn(createRequest),
                delete: vi.fn(createRequest),
                clear: vi.fn(createRequest),
            })),
        })),
    };
    return {
        initDB: vi.fn(() => Promise.resolve(mockDb)),
        migrateFromLocalStorage: vi.fn(() => Promise.resolve()),
    };
});

describe('StorageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Reset cache if possible, but since it's private in the module, 
        // we rely on the fact that we can clear localStorage which getCycles falls back to.
    });

    describe('Settings', () => {
        it('returns default settings when none are stored', () => {
            const settings = StorageService.getSettings();
            expect(settings.defaultCycleLength).toBe(28);
            expect(settings.notificationsOn).toBe(true);
        });

        it('saves and retrieves settings from localStorage', async () => {
            const newSettings = {
                notificationsOn: false,
                privacyMode: true,
                shareAnonymousStats: false,
                defaultPeriodLength: 7,
                defaultCycleLength: 30,
            };

            await StorageService.saveSettings(newSettings);

            const saved = StorageService.getSettings();
            expect(saved).toEqual(newSettings);
            expect(JSON.parse(localStorage.getItem('menstrual_app_settings')!)).toEqual(newSettings);
        });
    });

    describe('Cycles', () => {
        it('returns empty array when no cycles stored', () => {
            const cycles = StorageService.getCycles();
            expect(cycles).toEqual([]);
        });

        it('saves and retrieves cycles', async () => {
            const cycles = [
                {
                    id: '1',
                    userId: 'u1',
                    startDate: '2024-01-01',
                    source: 'manual' as const,
                    createdAt: new Date().toISOString(),
                }
            ];

            await StorageService.saveCycles(cycles);
            const retrieved = StorageService.getCycles();
            expect(retrieved).toHaveLength(1);
            expect(retrieved[0].startDate).toBe('2024-01-01');
        });
    });

    describe('Auth', () => {
        it('returns null when no auth stored', () => {
            expect(StorageService.getAuth()).toBeNull();
        });

        it('saves and retrieves auth data', async () => {
            const authData = {
                id: 'user123',
                username: 'Luna',
                isAnonymous: false,
                createdAt: new Date().toISOString(),
                subscriptionType: 'free' as const,
            };

            await StorageService.setAuth(authData);
            expect(StorageService.getAuth()).toEqual(authData);
        });
    });
});
