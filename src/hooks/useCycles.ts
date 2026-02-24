import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storageService';
import { CycleEntry } from '../types';

export function useCycles() {
    const [cycles, setCycles] = useState<CycleEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCycles = useCallback(() => {
        setLoading(true);
        const loadedCycles = StorageService.getCycles();
        setCycles(loadedCycles);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadCycles();
        // Support cross-tab sync if needed
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'menstrual_app_cycles') {
                loadCycles();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadCycles]);

    const addCycle = async (cycle: CycleEntry) => {
        await StorageService.addCycle(cycle);
        loadCycles();
    };

    const updateCycle = async (id: string, updates: Partial<CycleEntry>) => {
        await StorageService.updateCycle(id, updates);
        loadCycles();
    };

    const deleteCycle = async (id: string) => {
        await StorageService.deleteCycle(id);
        loadCycles();
    };

    return {
        cycles,
        loading,
        addCycle,
        updateCycle,
        deleteCycle,
        refreshCycles: loadCycles
    };
}
