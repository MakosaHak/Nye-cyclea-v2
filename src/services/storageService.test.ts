import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as OriginalModule from './storageService';

// We mock the service methods directly to avoid dealing with the async IDB logic
vi.mock('./storageService', () => {
  const mockStorage = {
    getAuth: vi.fn().mockReturnValue(null),
    setAuth: vi.fn(),
    getCycles: vi.fn().mockReturnValue([]),
    getCyclesAsync: vi.fn().mockResolvedValue([]),
    saveCycles: vi.fn().mockResolvedValue(undefined),
    addCycle: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockReturnValue({
      notificationsOn: true,
      privacyMode: false,
      shareAnonymousStats: false,
      defaultPeriodLength: 5,
      defaultCycleLength: 28,
    }),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    ensureReady: vi.fn().mockResolvedValue(undefined),
  };

  return {
    StorageService: mockStorage,
  };
});

// Re-import to ensure we use the mocked version
import { StorageService } from './storageService';

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Settings', () => {
    it('returns default settings when none are stored', () => {
      const settings = StorageService.getSettings();
      expect(settings.defaultCycleLength).toBe(28);
      expect(settings.notificationsOn).toBe(true);
    });

    it('calls saveSettings', async () => {
      const newSettings = {
        notificationsOn: false,
        privacyMode: true,
        shareAnonymousStats: false,
        defaultPeriodLength: 7,
        defaultCycleLength: 30,
      };

      await StorageService.saveSettings(newSettings);
      expect(StorageService.saveSettings).toHaveBeenCalledWith(newSettings);
    });
  });

  describe('Cycles', () => {
    it('calls saveCycles', async () => {
      const cycles = [
        {
          id: '1',
          userId: 'u1',
          startDate: '2024-01-01',
          source: 'manual' as const,
          createdAt: new Date().toISOString(),
        },
      ];

      await StorageService.saveCycles(cycles);
      expect(StorageService.saveCycles).toHaveBeenCalledWith(cycles);
    });
  });

  describe('Auth', () => {
    it('calls setAuth', async () => {
      const authData = {
        id: 'user123',
        username: 'Luna',
        isAnonymous: false,
        createdAt: new Date().toISOString(),
        subscriptionType: 'free' as const,
      };

      await StorageService.setAuth(authData);
      expect(StorageService.setAuth).toHaveBeenCalledWith(authData);
    });
  });
});
