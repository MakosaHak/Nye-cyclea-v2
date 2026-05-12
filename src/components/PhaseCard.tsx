import { Droplets, Plus } from 'lucide-react';
import { Prediction } from '../types';

interface PhaseCardProps {
  phase?: string;
  dayOfCycle?: number;
  nextPrediction?: Prediction | null;
  onAddCycle: () => void;
}

function getPhaseStyles(phase?: string, nextPrediction?: Prediction | null) {
  switch (phase) {
    case 'menstruation':
      return { label: 'Phase des règles' };
    case 'follicular':
      return { label: 'Phase folliculaire' };
    case 'ovulation':
      return { label: 'Ovulation' };
    case 'luteal':
      return { label: 'Phase lutéale' };
    default:
      return { label: nextPrediction ? 'Prévu bientôt' : 'Bonjour' };
  }
}

function getPhaseColors(phase?: string) {
  switch (phase) {
    case 'menstruation':
      return { background: 'rgba(251, 113, 133, 0.88)', shadow: 'rgba(251, 113, 133, 0.42)' };
    case 'follicular':
      return { background: 'rgba(167, 139, 250, 0.90)', shadow: 'rgba(167, 139, 250, 0.45)' };
    case 'ovulation':
      return { background: 'rgba(45, 212, 191, 0.90)', shadow: 'rgba(45, 212, 191, 0.45)' };
    case 'luteal':
      return { background: 'rgba(251, 191, 36, 0.90)', shadow: 'rgba(251, 191, 36, 0.45)' };
    default:
      return { background: 'rgba(244, 63, 94, 0.90)', shadow: 'rgba(244, 63, 94, 0.45)' };
  }
}

function daysUntilDate(iso?: string): number | null {
  if (!iso) return null;
  const today = new Date();
  const targetDate = new Date(iso);
  return Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

export function PhaseCard({ phase, dayOfCycle, nextPrediction, onAddCycle }: PhaseCardProps) {
  const { label } = getPhaseStyles(phase, nextPrediction);
  const phaseColors = getPhaseColors(phase);
  const today = new Date();
  const isKnownPhase = phase && phase !== 'unknown';

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 shadow-xl transition-all duration-500 backdrop-blur-xl border border-white/30"
      style={{
        background: phaseColors.background,
        boxShadow: `0 8px 32px 0 ${phaseColors.shadow}`,
      }}
    >
      {/* Glass shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="relative flex flex-col gap-6">
        {/* Phase info header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-3.5 border border-white/40 shadow-lg">
              <Droplets className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <h2 className="text-xl font-bold text-white leading-tight drop-shadow-md">{label}</h2>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-white/80 font-medium block mb-1 drop-shadow">
              Aujourd'hui
            </span>
            <p className="font-semibold text-sm text-white drop-shadow">
              {today.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>

        {/* Cycle day / status */}
        <div>
          <p className="text-4xl font-bold text-white leading-tight drop-shadow-lg">
            {isKnownPhase
              ? `Jour ${dayOfCycle}`
              : nextPrediction
                ? `Cycle dans ${daysUntilDate(nextPrediction.predictedStartRange?.[0] || nextPrediction.predictedStart)} j`
                : 'Commencez votre suivi'}
          </p>
          <p className="text-sm text-white/80 mt-2">
            {isKnownPhase
              ? 'du cycle en cours'
              : nextPrediction
                ? 'Ajoutez vos ressentis pour affiner les prédictions'
                : 'Ajoutez vos premières règles pour lancer les calculs.'}
          </p>
        </div>

        {/* Add cycle button */}
        <div className="flex justify-center">
          <button
            onClick={onAddCycle}
            aria-label="Ajouter un cycle"
            className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-md border border-white/40 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/20 to-purple-400/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="bg-white rounded-full p-1.5 shadow-sm group-hover:rotate-90 transition-transform duration-500">
              <Plus className="w-4 h-4 text-pink-600" strokeWidth={3} />
            </div>
            <span className="text-sm font-bold text-white tracking-wide drop-shadow-sm">
              Ajouter un cycle
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
