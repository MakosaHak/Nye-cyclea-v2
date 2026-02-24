import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  AlertCircle,
  Droplets,
  Heart,
  Sparkles,
  ChevronRight,
  Clock,
  CalendarDays,
  Plus,
} from 'lucide-react';
import { PredictionService } from '../services/predictionService';
import { CycleEntry, UserStats, Prediction } from '../types';
import { useCycles } from '../hooks/useCycles';
import { usePredictions } from '../hooks/usePredictions';

interface DashboardProps {
  onAddCycle: () => void;
}

export function Dashboard({ onAddCycle }: DashboardProps) {
  const { cycles } = useCycles();
  const { stats, nextPrediction, currentPhase } = usePredictions(cycles);
  const recentCycles = useMemo(() => cycles.slice(0, 3), [cycles]);

  const getPhaseStyles = (phase?: string) => {
    switch (phase) {
      case 'menstruation':
        return {
          banner: 'phase-banner-menstruation',
          text: 'phase-text-menstruation',
          accent: 'phase-btn-menstruation',
          label: 'Phase des règles',
        };
      case 'follicular':
        return {
          banner: 'phase-banner-follicular',
          text: 'phase-text-follicular',
          accent: 'phase-btn-follicular',
          label: 'Phase folliculaire',
        };
      case 'ovulation':
        return {
          banner: 'phase-banner-ovulation',
          text: 'phase-text-ovulation',
          accent: 'phase-btn-ovulation',
          label: 'Ovulation',
        };
      case 'luteal':
        return {
          banner: 'phase-banner-luteal',
          text: 'phase-text-luteal',
          accent: 'phase-btn-luteal',
          label: 'Phase lutéale',
        };
      default:
        return {
          banner: 'phase-banner-default',
          text: 'phase-text-default',
          accent: 'phase-btn-default',
          label: nextPrediction ? 'Prévu bientôt' : 'Bonjour',
        };
    }
  };

  const styles = getPhaseStyles(currentPhase?.phase);

  const getPhaseExplanation = (phase?: string) => {
    switch (phase) {
      case 'menstruation':
        return 'Période de saignement (début du cycle).';
      case 'follicular':
        return "Phase avant l'ovulation, le corps se prépare (fertilité en hausse).";
      case 'ovulation':
        return "Pic de fertilité: libération de l'ovule.";
      case 'luteal':
        return "Phase après l'ovulation jusqu'aux prochaines règles.";
      default:
        return 'Ajoutez vos cycles pour des explications personnalisées.';
    }
  };

  const getPhaseColors = (phase?: string) => {
    switch (phase) {
      case 'menstruation':
        return {
          background: 'rgba(251, 113, 133, 0.88)', // Rose doux et apaisant
          shadow: 'rgba(251, 113, 133, 0.42)',
        };
      case 'follicular':
        return {
          background: 'rgba(167, 139, 250, 0.90)', // Violet plus vif
          shadow: 'rgba(167, 139, 250, 0.45)',
        };
      case 'ovulation':
        return {
          background: 'rgba(45, 212, 191, 0.90)', // Turquoise plus vif
          shadow: 'rgba(45, 212, 191, 0.45)',
        };
      case 'luteal':
        return {
          background: 'rgba(251, 191, 36, 0.90)', // Jaune/Orange plus vif
          shadow: 'rgba(251, 191, 36, 0.45)',
        };
      default:
        return {
          background: 'rgba(244, 63, 94, 0.90)', // Rose vif par défaut
          shadow: 'rgba(244, 63, 94, 0.45)',
        };
    }
  };

  const phaseColors = getPhaseColors(currentPhase?.phase);

  const today = new Date();
  const formatLong = (iso?: string) =>
    iso
      ? PredictionService.parseISOLocal(iso).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      })
      : '-- --';
  const formatShort = (iso?: string) =>
    iso
      ? PredictionService.parseISOLocal(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })
      : '-- --';
  const formatShortRange = (startIso?: string, endIso?: string) => {
    if (!startIso || !endIso) return '-- --';
    return `${formatShort(startIso)} - ${formatShort(endIso)}`;
  };
  const isLowConfidence = (p?: Prediction | null) => (p?.confidence ?? 0) < 0.6;
  const daysUntil = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Math.max(0, Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  };
  const isTodayWithin = (start?: string, end?: string) => {
    if (!start || !end) return false;
    const s = new Date(start);
    const e = new Date(end);
    const t = new Date(today.toISOString().split('T')[0]);
    return t >= s && t <= e;
  };
  const daysBetween = (startIso?: string, endIso?: string) => {
    if (!startIso || !endIso) return 0;
    const s = new Date(startIso);
    const e = new Date(endIso);
    return Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };

  const cycleSummaryData = useMemo(() => {
    const cycleLen = stats?.averageCycleLength || 28;
    const periodLen = nextPrediction
      ? daysBetween(nextPrediction.predictedStart, nextPrediction.predictedEnd)
      : stats?.averagePeriodLength || 5;
    const fertileLen = nextPrediction
      ? daysBetween(nextPrediction.fertileWindow[0], nextPrediction.fertileWindow[1])
      : 5;
    const ovulationLen = 1;
    const safeLen = Math.max(0, cycleLen - (periodLen + fertileLen + ovulationLen));

    const lastCycle = recentCycles[0];
    const avgPeriodLen = stats?.averagePeriodLength || 5;
    const currentPeriodStart = lastCycle?.startDate;
    const currentPeriodEnd =
      lastCycle?.endDate ||
      (lastCycle
        ? PredictionService.dateToISO(
          new Date(
            PredictionService.parseISOLocal(lastCycle.startDate).getTime() +
            (avgPeriodLen - 1) * 86400000
          )
        )
        : undefined);

    const data = [
      {
        key: 'Règles',
        value: avgPeriodLen,
        color: '#fda4af',
        lightColor: '#ffe4e6',
        text: '#881337',
        date: currentPeriodStart
          ? formatShortRange(currentPeriodStart, currentPeriodEnd)
          : '--',
      },
      {
        key: 'Fenêtre fertile',
        value: fertileLen,
        color: '#f3e8ff',
        lightColor: '#f3e8ff',
        text: '#6b21a8',
        date: nextPrediction
          ? formatShortRange(
            nextPrediction.fertileWindow[0],
            nextPrediction.fertileWindow[1]
          )
          : '--',
      },
      {
        key: 'Ovulation',
        value: ovulationLen,
        color: '#99f6e4',
        lightColor: '#ccfbf1',
        text: '#115e59',
        date: nextPrediction?.ovulationWindow
          ? formatShortRange(
            nextPrediction.ovulationWindow[0],
            nextPrediction.ovulationWindow[1]
          )
          : formatShort(nextPrediction?.ovulationDate),
      },
      {
        key: 'Jours sûrs',
        value: safeLen,
        color: '#f0fdf4',
        lightColor: '#f0fdf4',
        text: '#15803d',
        date: 'Période calme',
      },
    ].filter((d) => d.value > 0);

    const total = data.reduce((a, b) => a + b.value, 0) || 1;
    return { data, total, cycleLen };
  }, [stats, nextPrediction, recentCycles, daysBetween, formatShortRange, formatShort]);

  return (
    <div className="space-y-6 pb-12">
      {/* Primary Status Card - Glassmorphism Style */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 shadow-xl transition-all duration-500 backdrop-blur-xl border border-white/30"
        style={{
          background: phaseColors.background,
          boxShadow: `0 8px 32px 0 ${phaseColors.shadow}`,
        }}
      >
        {/* Glass shine effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative flex flex-col gap-6">
          {/* Infos de phase */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-3.5 border border-white/40 shadow-lg">
                <Droplets className="w-8 h-8 text-white drop-shadow-md" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight drop-shadow-md">
                  {styles.label}
                </h2>
              </div>
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

          {/* Jour du cycle */}
          <div>
            <p className="text-4xl font-bold text-white leading-tight drop-shadow-lg">
              {currentPhase && currentPhase.phase !== 'unknown'
                ? `Jour ${currentPhase.dayOfCycle}`
                : nextPrediction
                  ? `Cycle dans ${daysUntil(nextPrediction.predictedStartRange?.[0] || nextPrediction.predictedStart)} j`
                  : 'Commencez votre suivi'}
            </p>
            <p className="text-sm text-white/80 mt-2">
              {currentPhase && currentPhase.phase !== 'unknown'
                ? 'du cycle en cours'
                : nextPrediction
                  ? 'Ajoutez vos ressentis pour affiner les prédictions'
                  : 'Ajoutez vos premières règles pour lancer les calculs.'}
            </p>
          </div>

          {/* Bouton Ajouter - Solid Pink */}
          <div className="flex justify-center">
            <button
              onClick={onAddCycle}
              aria-label="Ajouter un cycle"
              className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
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

      {/* Insights Section - Directly below Banner */}
      <div className="space-y-4">
        <div
          className="relative rounded-[3.5rem] p-8 shadow-2xl backdrop-blur-2xl border border-pink-100/40 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FFF5F6 0%, #FFF1F2 100%)',
            boxShadow: '0 20px 50px -12px rgba(251, 113, 133, 0.12)',
          }}
        >
          {/* Decorative gradients */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-200/20 rounded-full blur-3xl" />

          <div className="relative">
            <h3 className="text-xl font-bold text-pink-600 mb-8 px-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Résumé de votre cycle
            </h3>

            {(() => {
              const { data, total, cycleLen } = cycleSummaryData;
              const size = 200;
              const radius = 80;
              const cx = size / 2;
              const cy = size / 2;
              const circumference = 2 * Math.PI * radius;
              let offset = 0;

              return (
                <div className="flex flex-col gap-10">
                  {/* Donut Chart with Effects */}
                  <div className="flex justify-center items-center py-6">
                    <div className="relative group">
                      {/* Background Glow Overlay */}
                      <div className="absolute inset-0 bg-pink-400/10 rounded-full blur-3xl group-hover:bg-pink-400/15 transition-all duration-700" />

                      <svg
                        width={size}
                        height={size}
                        viewBox={`0 0 ${size} ${size}`}
                        className="transform -rotate-90 relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
                      >
                        <defs>
                          {/* Glow Filter */}
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          {/* Inner Shadow / Depth Gradient */}
                          <radialGradient id="innerGradient">
                            <stop offset="70%" stopColor="#fff" stopOpacity="0" />
                            <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1" />
                          </radialGradient>
                          {/* Soft Shine */}
                          <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#fff" stopOpacity="0" />
                            <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
                          </linearGradient>
                        </defs>

                        {/* Track Background */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius}
                          fill="none"
                          stroke="#F8FAFC"
                          strokeWidth={26}
                        />

                        {/* Shadow copy for extra depth */}
                        {data.map((seg: any) => {
                          const segLen = (seg.value / total) * circumference;
                          const segOffsetValue = circumference - offset;
                          offset += segLen;
                          return (
                            <circle
                              key={`shadow-${seg.key}`}
                              cx={cx}
                              cy={cy}
                              r={radius}
                              fill="none"
                              stroke={seg.color}
                              strokeWidth={26}
                              strokeDasharray={`${segLen} ${circumference - segLen}`}
                              strokeDashoffset={segOffsetValue}
                              strokeLinecap="round"
                              opacity="0.2"
                              filter="url(#glow)"
                            />
                          );
                        })}

                        {/* Main Segments */}
                        {(() => {
                          let mainOffset = 0;
                          return data.map((seg: any) => {
                            const segLen = (seg.value / total) * circumference;
                            const segOffsetValue = circumference - mainOffset;
                            mainOffset += segLen;
                            return (
                              <circle
                                key={seg.key}
                                cx={cx}
                                cy={cy}
                                r={radius}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={24}
                                strokeDasharray={`${segLen} ${circumference - segLen}`}
                                strokeDashoffset={segOffsetValue}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                                style={{
                                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
                                }}
                              />
                            );
                          });
                        })()}

                        {/* Depth Overlay */}
                        <circle cx={cx} cy={cy} r={radius - 12} fill="url(#innerGradient)" />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius + 12}
                          fill="none"
                          stroke="url(#shine)"
                          strokeWidth={1}
                        />
                      </svg>

                      {/* Center Label Enhanced */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-white/40 backdrop-blur-md rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-inner border border-white/50">
                          <span className="text-4xl font-black text-pink-600 tracking-tighter drop-shadow-sm leading-none">
                            {cycleLen}
                          </span>
                          <span className="text-[9px] uppercase tracking-[0.2em] font-black text-pink-400 mt-1">
                            Jours
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Bands Legend */}
                  <div className="grid grid-cols-1 gap-4">
                    {data.map((seg: any) => {
                      const pct = Math.round((seg.value / total) * 100);
                      return (
                        <div
                          key={seg.key}
                          className="group relative overflow-hidden rounded-2xl flex items-center transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                          style={{ background: seg.lightColor }}
                        >
                          {/* Vertical Band Color */}
                          <div
                            className="w-1.5 self-stretch"
                            style={{ backgroundColor: seg.color }}
                          />

                          <div className="flex-1 flex items-center justify-between p-4 pl-4">
                            <div className="flex flex-col">
                              <span
                                className="text-xs font-black uppercase tracking-wider mb-0.5"
                                style={{ color: seg.text }}
                              >
                                {seg.key}
                              </span>
                              <span className="text-sm font-medium text-gray-600">{seg.date}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-black text-gray-900 leading-none">
                                  {seg.value}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">
                                  Jours
                                </span>
                              </div>
                              <div className="h-8 w-px bg-gray-200" />
                              <span className="text-sm font-black text-gray-900 w-10 text-right">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

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
