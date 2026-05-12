import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { PredictionService } from '../services/predictionService';
import { CycleEntry, Prediction, UserStats } from '../types';

interface CyclesContextType {
  cycles: CycleEntry[];
  predictions: Prediction[];
  stats: UserStats;
  loading: boolean;
  addCycle: (cycle: CycleEntry) => Promise<void>;
  updateCycle: (id: string, updates: Partial<CycleEntry>) => Promise<void>;
  deleteCycle: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const CyclesContext = createContext<CyclesContextType | undefined>(undefined);

export const CyclesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await StorageService.ensureReady();
      const loadedCycles = await StorageService.getCyclesAsync();
      setCycles(loadedCycles);
    } catch (error) {
      console.error('[CyclesContext] Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const predictions = useMemo(() => {
    if (cycles.length === 0) return [];
    return PredictionService.predictNext6Months(cycles);
  }, [cycles]);

  const stats = useMemo(() => {
    return PredictionService.calculateUserStats(cycles);
  }, [cycles]);

  const addCycle = useCallback(async (cycle: CycleEntry) => {
    await StorageService.addCycle(cycle);
    setCycles((prev) => [...prev, cycle]);
  }, []);

  const updateCycle = useCallback(async (id: string, updates: Partial<CycleEntry>) => {
    await StorageService.updateCycle(id, updates);
    setCycles((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCycle = useCallback(async (id: string) => {
    await StorageService.deleteCycle(id);
    setCycles((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      cycles,
      predictions,
      stats,
      loading,
      addCycle,
      updateCycle,
      deleteCycle,
      refreshData,
    }),
    [cycles, predictions, stats, loading, addCycle, updateCycle, deleteCycle, refreshData]
  );

  return <CyclesContext.Provider value={value}>{children}</CyclesContext.Provider>;
};

export const useCyclesContext = () => {
  const context = useContext(CyclesContext);
  if (context === undefined) {
    throw new Error('useCyclesContext must be used within a CyclesProvider');
  }
  return context;
};
