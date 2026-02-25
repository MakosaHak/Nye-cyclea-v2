import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useCycles } from '../hooks/useCycles';
import { usePredictions } from '../hooks/usePredictions';
import { PhaseCard } from './PhaseCard';
import { CycleSummaryCard } from './CycleSummaryCard';

interface DashboardProps {
  onAddCycle: () => void;
}

export function Dashboard({ onAddCycle }: DashboardProps) {
  const { cycles } = useCycles();
  const { stats, nextPrediction, currentPhase } = usePredictions(cycles);
  const recentCycles = useMemo(() => cycles.slice(0, 3), [cycles]);

  return (
    <div className="space-y-6 pb-12">
      <PhaseCard
        phase={currentPhase?.phase}
        dayOfCycle={currentPhase?.dayOfCycle}
        nextPrediction={nextPrediction}
        onAddCycle={onAddCycle}
      />

      <CycleSummaryCard
        stats={stats}
        nextPrediction={nextPrediction}
        recentCycles={recentCycles}
      />

      {recentCycles.length === 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-xs text-gray-600">
            Ajoutez au moins 3 cycles pour une meilleure précision des prédictions.
          </p>
        </div>
      )}
    </div>
  );
}
