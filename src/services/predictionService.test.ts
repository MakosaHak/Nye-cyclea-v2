import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PredictionService } from './predictionService';
import { StorageService } from './storageService';
import { CycleEntry } from '../types';

// Mock StorageService
vi.mock('./storageService', () => ({
    StorageService: {
        getSettings: vi.fn(() => ({})),
    },
}));

describe('PredictionService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('calculateUserStats', () => {
        it('returns default values when no cycles are provided', () => {
            const stats = PredictionService.calculateUserStats([]);
            expect(stats.averageCycleLength).toBe(28);
            expect(stats.averagePeriodLength).toBe(5);
            expect(stats.predictionConfidence).toBe(0);
        });

        it('calculates averages correctly with real data', () => {
            const cycles: CycleEntry[] = [
                {
                    id: '1',
                    userId: 'u1',
                    startDate: '2024-01-01',
                    endDate: '2024-01-05',
                    source: 'manual',
                    createdAt: '',
                },
                {
                    id: '2',
                    userId: 'u1',
                    startDate: '2024-01-29',
                    endDate: '2024-02-02',
                    source: 'manual',
                    createdAt: '',
                },
                {
                    id: '3',
                    userId: 'u1',
                    startDate: '2024-02-26',
                    endDate: '2024-03-01',
                    source: 'manual',
                    createdAt: '',
                },
            ];

            const stats = PredictionService.calculateUserStats(cycles);

            // Cycle 1 to 2: 28 days
            // Cycle 2 to 3: 28 days
            // Period lengths: 5, 5, 5
            expect(stats.averageCycleLength).toBe(28);
            expect(stats.averagePeriodLength).toBe(5);
            expect(stats.predictionConfidence).toBeGreaterThan(0.3);
        });
    });

    describe('date helpers', () => {
        it('formats date to ISO string correctly', () => {
            const date = new Date(2024, 0, 15); // Jan 15
            expect(PredictionService.dateToISO(date)).toBe('2024-01-15');
        });

        it('parses ISO local string correctly', () => {
            const date = PredictionService.parseISOLocal('2024-05-20');
            expect(date.getFullYear()).toBe(2024);
            expect(date.getMonth()).toBe(4); // May is 4
            expect(date.getDate()).toBe(20);
        });
    });

    describe('getCurrentPhase', () => {
        it('identifies menstruation phase correctly', () => {
            const cycles: CycleEntry[] = [
                {
                    id: '1',
                    userId: 'u1',
                    startDate: '2024-01-01',
                    source: 'manual',
                    createdAt: '',
                },
            ];
            // Test on Day 3
            const today = new Date(2024, 0, 3);
            const phase = PredictionService.getCurrentPhase(cycles, today);
            expect(phase.phase).toBe('menstruation');
            expect(phase.dayOfCycle).toBe(3);
        });

        it('identifies follicular phase correctly', () => {
            const cycles: CycleEntry[] = [
                {
                    id: '1',
                    userId: 'u1',
                    startDate: '2024-01-01',
                    source: 'manual',
                    createdAt: '',
                },
            ];
            // Test on Day 10 (28 day cycle, ovulation around day 14)
            const today = new Date(2024, 0, 10);
            const phase = PredictionService.getCurrentPhase(cycles, today);
            expect(phase.phase).toBe('follicular');
        });
    });
});
