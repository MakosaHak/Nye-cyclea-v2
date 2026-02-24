import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2, Edit, TrendingUp, Clock, Download, Lock } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { PredictionService } from '../services/predictionService';
import { CycleEntry } from '../types';
import { PDFService } from '../services/pdfService';
import { SubscriptionService } from '../services/subscriptionService';
import { toast } from 'sonner';

export function CycleHistory() {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [sortedCycles, setSortedCycles] = useState<CycleEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCycles();
    // Listen for storage changes to refresh when settings change
    const handleStorageChange = () => {
      loadCycles();
      setRefreshKey((prev) => prev + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically (every 2 seconds) for settings changes
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadCycles = () => {
    const loadedCycles = StorageService.getCycles();
    const sorted = [...loadedCycles].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    setCycles(loadedCycles);
    setSortedCycles(sorted);
  };

  const handleDelete = async (cycleId: string) => {
    if (confirm('Êtes-vous sûre de vouloir supprimer ce cycle ?')) {
      await StorageService.deleteCycle(cycleId);
      toast.success('Cycle supprimé avec succès');
      loadCycles();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getCycleDuration = (cycle: CycleEntry, nextCycle?: CycleEntry) => {
    if (!nextCycle) {
      return null;
    }
    const start = new Date(cycle.startDate);
    const nextStart = new Date(nextCycle.startDate);
    return Math.round((nextStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPeriodDuration = (cycle: CycleEntry) => {
    if (!cycle.endDate) {
      return null;
    }
    const start = new Date(cycle.startDate);
    const end = new Date(cycle.endDate);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Recalculate stats whenever cycles change
  const stats = PredictionService.calculateUserStats(cycles);

  // Check if we're using calculated values or defaults
  const cyclesWithEndDate = cycles.filter((c) => c.endDate).length;
  const cycleIntervals = Math.max(0, cycles.length - 1);
  const usingCalculatedPeriod = cyclesWithEndDate > 0;
  const usingCalculatedCycle = cycleIntervals > 0;

  if (cycles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pb-24">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-purple-500" />
          </div>
          <h2 className="text-gray-800 mb-2">Aucun cycle enregistré</h2>
          <p className="text-gray-600">
            Commencez à enregistrer vos cycles pour voir votre historique et vos statistiques.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Statistics */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-gray-800 mb-4 font-bold text-xl">Statistiques</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-700">Durée moyenne du cycle</span>
            </div>
            <p className="text-3xl text-purple-900">{stats.averageCycleLength}</p>
            <p className="text-sm text-gray-600">jours</p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-pink-600" />
              <span className="text-sm text-gray-700">Durée moyenne des règles</span>
            </div>
            <p className="text-3xl text-pink-900">{stats.averagePeriodLength}</p>
            <p className="text-sm text-gray-600">jours</p>
            {!usingCalculatedPeriod && (
              <p className="text-xs text-gray-500 mt-1">
                (Valeur par défaut - ajoutez des dates de fin pour calculer la moyenne réelle)
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">Cycles enregistrés</span>
            </div>
            <p className="text-3xl text-blue-900">{cycles.length}</p>
            <p className="text-sm text-gray-600">total</p>
          </div>
        </div>

        {stats.predictionConfidence > 0 && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">Précision des prédictions</span>
              <span className="text-sm text-purple-600">
                {Math.round(stats.predictionConfidence * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.predictionConfidence * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Plus vous enregistrez de cycles, plus les prédictions sont précises
            </p>
          </div>
        )}
      </div>

      {/* Cycle List */}
      <div className="space-y-3">
        <h2 className="text-gray-800 px-1 font-bold text-xl">Historique des cycles</h2>

        {sortedCycles.map((cycle, index) => {
          const nextCycle = sortedCycles[index + 1];
          const cycleDuration = getCycleDuration(cycle, nextCycle);
          const periodDuration = getPeriodDuration(cycle);

          return (
            <div
              key={cycle.id}
              className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h3 className="text-gray-800 font-semibold">{formatDate(cycle.startDate)}</h3>
                  </div>
                  {cycle.endDate && (
                    <p className="text-sm text-gray-600 ml-7">Fin : {formatDate(cycle.endDate)}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const auth = StorageService.getAuth();
                      if (SubscriptionService.isPremium(auth?.subscriptionType)) {
                        PDFService.generateCyclePDF(cycle);
                      } else {
                        navigate('/subscribe');
                      }
                    }}
                    className="relative w-9 h-9 rounded-lg hover:bg-pink-50 flex items-center justify-center transition-colors group border border-pink-100/50"
                    aria-label={
                      SubscriptionService.isPremium(StorageService.getAuth()?.subscriptionType)
                        ? 'Télécharger le rapport PDF pour ce cycle'
                        : 'Passer à la version Pro pour les rapports PDF'
                    }
                    title={
                      SubscriptionService.isPremium(StorageService.getAuth()?.subscriptionType)
                        ? 'Télécharger le rapport pour ce cycle'
                        : 'Passer à Nye Cyclea Pro pour débloquer les rapports PDF'
                    }
                  >
                    <Download
                      className={`w-4 h-4 ${SubscriptionService.isPremium(StorageService.getAuth()?.subscriptionType) ? 'text-pink-400 group-hover:text-pink-600' : 'text-gray-400'}`}
                    />
                    {!SubscriptionService.isPremium(StorageService.getAuth()?.subscriptionType) && (
                      <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white">
                        <Lock className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(cycle.id)}
                    className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors group"
                    aria-label="Supprimer ce cycle"
                    title="Supprimer ce cycle"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                  </button>
                </div>
              </div>

              {/* Durations */}
              <div className="flex gap-4 mb-3">
                {periodDuration && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-gray-600">Durée</p>
                      <p className="text-pink-600">{periodDuration} jours</p>
                    </div>
                  </div>
                )}

                {cycleDuration && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-gray-600">Cycle</p>
                      <p className="text-purple-600">{cycleDuration} jours</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Symptoms */}
              {cycle.symptoms && cycle.symptoms.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Symptômes :</p>
                  <div className="flex flex-wrap gap-2">
                    {cycle.symptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {cycle.notes && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">Notes :</p>
                  <p className="text-sm text-gray-700">{cycle.notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
