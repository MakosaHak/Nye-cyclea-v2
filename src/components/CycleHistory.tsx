import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2, TrendingUp, Clock, Download, Lock } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { CycleEntry } from '../types';
import { PDFService } from '../services/pdfService';
import { SubscriptionService } from '../services/subscriptionService';
import { useCyclesContext } from '../contexts/CyclesContext';
import { toast } from 'sonner';
import { ConfirmDialog } from './ConfirmDialog';

export function CycleHistory() {
  const navigate = useNavigate();
  const { cycles, deleteCycle, loading } = useCyclesContext();
  const [cycleToDelete, setCycleToDelete] = useState<string | null>(null);

  const sortedCycles = useMemo(() => {
    return [...cycles].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [cycles]);

  const handleConfirmDelete = async () => {
    if (!cycleToDelete) return;
    try {
      await deleteCycle(cycleToDelete);
      toast.success('Cycle supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setCycleToDelete(null);
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

  if (loading && cycles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500" />
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-purple-500" />
        </div>
        <h2 className="text-gray-800 mb-2 font-bold text-lg">Aucun cycle enregistré</h2>
        <p className="text-gray-600 text-sm">
          Commencez à enregistrer vos cycles pour voir votre historique.
        </p>
      </div>
    );
  }

  const auth = StorageService.getAuth();
  const isPremium = SubscriptionService.isPremium(auth?.subscriptionType);

  return (
    <>
      <div className="space-y-3">
        <h2 className="text-gray-800 px-1 font-bold text-xl">Historique des cycles</h2>

        {sortedCycles.map((cycle, index) => {
          const nextCycle = sortedCycles[index + 1];
          const cycleDuration = getCycleDuration(cycle, nextCycle);
          const periodDuration = getPeriodDuration(cycle);

          return (
            <div
              key={cycle.id}
              className="glass-card p-5 hover:shadow-xl transition-shadow rounded-2xl"
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
                      if (isPremium) {
                        PDFService.generateCyclePDF(cycle);
                      } else {
                        navigate('/subscribe');
                      }
                    }}
                    className="relative w-9 h-9 rounded-lg hover:bg-pink-50 flex items-center justify-center transition-colors group border border-pink-100/50"
                    aria-label={
                      isPremium
                        ? 'Télécharger le rapport PDF pour ce cycle'
                        : 'Passer à la version Pro pour les rapports PDF'
                    }
                  >
                    <Download
                      className={`w-4 h-4 ${isPremium ? 'text-pink-400 group-hover:text-pink-600' : 'text-gray-400'}`}
                      aria-hidden="true"
                    />
                    {!isPremium && (
                      <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white" aria-hidden="true">
                        <Lock className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setCycleToDelete(cycle.id)}
                    className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors group"
                    aria-label="Supprimer ce cycle"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" aria-hidden="true" />
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

      <ConfirmDialog
        isOpen={cycleToDelete !== null}
        title="Supprimer ce cycle ?"
        message="Cette action est irréversible. Le cycle sera définitivement supprimé de votre historique."
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCycleToDelete(null)}
      />
    </>
  );
}
