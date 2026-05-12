import { useMemo } from 'react';
import { Sparkles, Droplets, Heart } from 'lucide-react';
import { PredictionService } from '../services/predictionService';
import { CycleEntry, UserStats, Prediction } from '../types';

interface CycleSummaryCardProps {
  stats?: UserStats | null;
  nextPrediction?: Prediction | null;
  recentCycles: CycleEntry[];
}

interface CycleSegment {
  key: string;
  value: number;
  color: string;
  lightColor: string;
  text: string;
  date: string;
  icon: any;
  isCircle?: boolean;
}

function formatShort(iso?: string): string {
  if (!iso) return '-- --';
  return PredictionService.parseISOLocal(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function formatShortRange(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return '-- --';
  return `${formatShort(startIso)} - ${formatShort(endIso)}`;
}

function daysBetween(startIso?: string, endIso?: string): number {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso);
  const end = new Date(endIso);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

const DONUT_SIZE = 220;
const DONUT_RADIUS = 85;
const DONUT_STROKE_TRACK = 22;
const DONUT_STROKE_MAIN = 20;

export function CycleSummaryCard({ stats, nextPrediction, recentCycles }: CycleSummaryCardProps) {
  const cycleSummaryData = useMemo(() => {
    const cycleLen = stats?.averageCycleLength || 28;
    const avgPeriodLen = stats?.averagePeriodLength || 5;

    const periodLen = nextPrediction
      ? daysBetween(nextPrediction.predictedStart, nextPrediction.predictedEnd)
      : avgPeriodLen;

    const fertileLen = nextPrediction
      ? daysBetween(nextPrediction.fertileWindow[0], nextPrediction.fertileWindow[1])
      : 5;

    const ovulationLen = 1;
    const safeLen = Math.max(0, cycleLen - (periodLen + fertileLen + ovulationLen));

    const lastCycle = recentCycles[0];
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

    const segments: CycleSegment[] = [
      {
        key: 'Règles',
        value: avgPeriodLen,
        color: '#fda4af',
        lightColor: '#fda4af1a',
        text: '#881337',
        icon: Droplets,
        date: currentPeriodStart ? formatShortRange(currentPeriodStart, currentPeriodEnd) : '--',
      },
      {
        key: 'Fenêtre Fertile',
        value: fertileLen,
        color: '#d8b4fe',
        lightColor: '#f3e8ff',
        text: '#6b21a8',
        icon: Heart,
        date: nextPrediction
          ? formatShortRange(nextPrediction.fertileWindow[0], nextPrediction.fertileWindow[1])
          : '--',
      },
      {
        key: 'Ovulation',
        value: ovulationLen,
        color: '#5eead4',
        lightColor: '#99f6e4',
        text: '#115e59',
        icon: Sparkles,
        date: nextPrediction?.ovulationWindow
          ? formatShortRange(nextPrediction.ovulationWindow[0], nextPrediction.ovulationWindow[1])
          : formatShort(nextPrediction?.ovulationDate),
      },
      {
        key: 'Jours Sûrs',
        value: safeLen,
        color: '#dcfce7',
        lightColor: '#f0fdf4',
        text: '#15803d',
        icon: null,
        isCircle: true,
        date: 'Période calme',
      },
    ].filter((segment) => segment.value > 0);

    const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
    return { segments, total, cycleLen };
  }, [stats, nextPrediction, recentCycles]);

  const { segments, total, cycleLen } = cycleSummaryData;
  const cx = DONUT_SIZE / 2;
  const cy = DONUT_SIZE / 2;
  const circumference = 2 * Math.PI * DONUT_RADIUS;

  return (
    <div className="cycle-summary-wrapper">
      <style>{`
                .glass-container {
                    background: linear-gradient(135deg, 
                        rgba(255, 255, 255, 0.8) 0%, 
                        rgba(255, 241, 242, 0.6) 50%, 
                        rgba(251, 113, 133, 0.15) 100%
                    );
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1.5px solid rgba(255, 255, 255, 0.8);
                    border-radius: 3rem;
                    padding: 2rem;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05),
                                inset 0 0 30px rgba(255, 255, 255, 0.5);
                    position: relative;
                    overflow: hidden;
                }

                /* Shine effect */
                .glass-container::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        45deg,
                        transparent 0%,
                        rgba(255, 255, 255, 0) 45%,
                        rgba(255, 255, 255, 0.2) 50%,
                        rgba(255, 255, 255, 0) 55%,
                        transparent 100%
                    );
                    transform: rotate(-45deg);
                    animation: shine 8s infinite linear;
                    pointer-events: none;
                }

                @keyframes shine {
                    0% { transform: translateX(-100%) rotate(-45deg); }
                    100% { transform: translateX(100%) rotate(-45deg); }
                }

                .bg-orb {
                    position: absolute;
                    width: 280px;
                    height: 280px;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                    opacity: 0.15;
                }

                .orb-rose {
                    top: -60px;
                    right: -60px;
                    background: #fb7185;
                    animation: float-slow 15s infinite alternate;
                }

                .orb-white {
                    bottom: -80px;
                    left: -80px;
                    background: #ffffff;
                    animation: float-slow 20s infinite alternate-reverse;
                }

                @keyframes float-slow {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(40px, 50px); }
                }

                .chart-container {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 1rem 0;
                }

                .donut-inner {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(15px);
                    border-radius: 50%;
                    width: 125px;
                    height: 125px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05),
                                inset 0 0 10px rgba(255, 255, 255, 1);
                    border: 1px solid rgba(255, 255, 255, 1);
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.875rem 1.25rem;
                    border-radius: 1.5rem;
                    background: rgba(255, 255, 255, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    margin-bottom: 0.625rem;
                    transition: all 0.3s ease;
                }

                .legend-item:hover {
                    background: rgba(255, 255, 255, 0.7);
                    transform: scale(1.02);
                }

                .segment-icon-box {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 0.875rem;
                }

                .safe-circle {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background-color: #16a34a;
                }
                
                .summary-title, .summary-icon {
                    color: #db2777 !important;
                }
                
                .text-shadow-sm {
                    text-shadow: 0 2px 4px rgba(0,0,0,0.15);
                }
            `}</style>

      <div className="glass-container">
        {/* Background Orbs */}
        <div className="bg-orb orb-rose" />
        <div className="bg-orb orb-white" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6 px-1">
            <Sparkles className="summary-icon w-5 h-5 text-rose-600" />
            <h3 className="summary-title text-lg font-bold text-shadow-sm">
              Résumé de votre cycle
            </h3>
          </div>

          <div className="chart-container">
            <svg
              width={DONUT_SIZE}
              height={DONUT_SIZE}
              viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Base track */}
              <circle
                cx={cx}
                cy={cy}
                r={DONUT_RADIUS}
                fill="none"
                stroke="rgba(255, 255, 255, 0.5)"
                strokeWidth={DONUT_STROKE_TRACK}
              />

              {/* Colored segments */}
              {(() => {
                let offset = 0;
                return segments.map((seg) => {
                  const segLen = (seg.value / total) * circumference;
                  const segOffset = circumference - offset;
                  offset += segLen;
                  return (
                    <circle
                      key={seg.key}
                      cx={cx}
                      cy={cy}
                      r={DONUT_RADIUS}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={DONUT_STROKE_MAIN}
                      strokeDasharray={`${segLen} ${circumference - segLen}`}
                      strokeDashoffset={segOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  );
                });
              })()}
            </svg>

            <div className="donut-inner">
              <span className="text-4xl font-black text-gray-800 tracking-tighter leading-none">
                {cycleLen}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Jours
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-2.5">
            {segments.map((seg) => {
              const Icon = seg.icon;
              return (
                <div key={seg.key} className="legend-item">
                  <div className="flex items-center">
                    <div
                      className="segment-icon-box"
                      style={{ background: seg.lightColor, color: seg.text }}
                    >
                      {Icon ? <Icon size={18} /> : <div className="safe-circle" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{seg.key}</span>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                        {seg.date}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-black text-gray-800 leading-none block">
                        {seg.value}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Jours</span>
                    </div>
                    <div
                      className="w-1.5 h-7 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
