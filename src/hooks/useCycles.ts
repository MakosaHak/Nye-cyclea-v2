import { useCyclesContext } from '../contexts/CyclesContext';

export function useCycles() {
  const { cycles, loading, addCycle, updateCycle, deleteCycle, refreshData } = useCyclesContext();

  return {
    cycles,
    loading,
    addCycle,
    updateCycle,
    deleteCycle,
    refreshCycles: refreshData,
  };
}
