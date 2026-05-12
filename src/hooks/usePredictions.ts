import { useMemo } from 'react';
import { PredictionService } from '../services/predictionService';
import { CycleEntry } from '../types';

export function usePredictions(cycles: CycleEntry[]) {
  const stats = useMemo(() => {
    return PredictionService.calculateUserStats(cycles);
  }, [cycles]);

  const nextPrediction = useMemo(() => {
    return cycles.length > 0 ? PredictionService.predictNextCycle(cycles) : null;
  }, [cycles]);

  const currentPhase = useMemo(() => {
    return cycles.length > 0 ? PredictionService.getCurrentPhase(cycles) : null;
  }, [cycles]);

  const next6Months = useMemo(() => {
    return cycles.length > 0 ? PredictionService.predictNext6Months(cycles) : [];
  }, [cycles]);

  return {
    stats,
    nextPrediction,
    currentPhase,
    next6Months,
  };
}
