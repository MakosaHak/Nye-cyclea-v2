import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
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

const DONUT_SIZE = 200;
const DONUT_RADIUS = 80;
const DONUT_STROKE_TRACK = 26;
const DONUT_STROKE_MAIN = 24;

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
                lightColor: '#ffe4e6',
                text: '#881337',
                date: currentPeriodStart ? formatShortRange(currentPeriodStart, currentPeriodEnd) : '--',
            },
            {
                key: 'Fenêtre fertile',
                value: fertileLen,
                color: '#f3e8ff',
                lightColor: '#f3e8ff',
                text: '#6b21a8',
                date: nextPrediction
                    ? formatShortRange(nextPrediction.fertileWindow[0], nextPrediction.fertileWindow[1])
                    : '--',
            },
            {
                key: 'Ovulation',
                value: ovulationLen,
                color: '#99f6e4',
                lightColor: '#ccfbf1',
                text: '#115e59',
                date: nextPrediction?.ovulationWindow
                    ? formatShortRange(nextPrediction.ovulationWindow[0], nextPrediction.ovulationWindow[1])
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
        ].filter((segment) => segment.value > 0);

        const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
        return { segments, total, cycleLen };
    }, [stats, nextPrediction, recentCycles]);

    const { segments, total, cycleLen } = cycleSummaryData;
    const cx = DONUT_SIZE / 2;
    const cy = DONUT_SIZE / 2;
    const circumference = 2 * Math.PI * DONUT_RADIUS;

    return (
        <div className="space-y-4">
            <div
                className="relative rounded-[3.5rem] p-8 shadow-2xl backdrop-blur-2xl border border-pink-100/40 overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #FFF5F6 0%, #FFF1F2 100%)',
                    boxShadow: '0 20px 50px -12px rgba(251, 113, 133, 0.12)',
                }}
            >
                {/* Decorative background orbs */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-200/20 rounded-full blur-3xl" />

                <div className="relative">
                    <h3 className="text-xl font-bold text-pink-600 mb-8 px-1 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-pink-500" />
                        Résumé de votre cycle
                    </h3>

                    <div className="flex flex-col gap-10">
                        {/* Donut Chart */}
                        <div className="flex justify-center items-center py-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-pink-400/10 rounded-full blur-3xl group-hover:bg-pink-400/15 transition-all duration-700" />
                                <svg
                                    width={DONUT_SIZE}
                                    height={DONUT_SIZE}
                                    viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
                                    className="transform -rotate-90 relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
                                >
                                    <defs>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                        <radialGradient id="innerGradient">
                                            <stop offset="70%" stopColor="#fff" stopOpacity="0" />
                                            <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1" />
                                        </radialGradient>
                                        <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                                            <stop offset="50%" stopColor="#fff" stopOpacity="0" />
                                            <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
                                        </linearGradient>
                                    </defs>

                                    {/* Track background */}
                                    <circle cx={cx} cy={cy} r={DONUT_RADIUS} fill="none" stroke="#F8FAFC" strokeWidth={DONUT_STROKE_TRACK} />

                                    {/* Glow shadow segments */}
                                    {(() => {
                                        let offset = 0;
                                        return segments.map((seg) => {
                                            const segLen = (seg.value / total) * circumference;
                                            const segOffset = circumference - offset;
                                            offset += segLen;
                                            return (
                                                <circle
                                                    key={`shadow-${seg.key}`}
                                                    cx={cx} cy={cy} r={DONUT_RADIUS}
                                                    fill="none"
                                                    stroke={seg.color}
                                                    strokeWidth={DONUT_STROKE_TRACK}
                                                    strokeDasharray={`${segLen} ${circumference - segLen}`}
                                                    strokeDashoffset={segOffset}
                                                    strokeLinecap="round"
                                                    opacity="0.2"
                                                    filter="url(#glow)"
                                                />
                                            );
                                        });
                                    })()}

                                    {/* Main colored segments */}
                                    {(() => {
                                        let offset = 0;
                                        return segments.map((seg) => {
                                            const segLen = (seg.value / total) * circumference;
                                            const segOffset = circumference - offset;
                                            offset += segLen;
                                            return (
                                                <circle
                                                    key={seg.key}
                                                    cx={cx} cy={cy} r={DONUT_RADIUS}
                                                    fill="none"
                                                    stroke={seg.color}
                                                    strokeWidth={DONUT_STROKE_MAIN}
                                                    strokeDasharray={`${segLen} ${circumference - segLen}`}
                                                    strokeDashoffset={segOffset}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                    style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
                                                />
                                            );
                                        });
                                    })()}

                                    <circle cx={cx} cy={cy} r={DONUT_RADIUS - 12} fill="url(#innerGradient)" />
                                    <circle cx={cx} cy={cy} r={DONUT_RADIUS + 12} fill="none" stroke="url(#shine)" strokeWidth={1} />
                                </svg>

                                {/* Center label */}
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

                        {/* Legend bands */}
                        <div className="grid grid-cols-1 gap-4">
                            {segments.map((seg) => {
                                const percentage = Math.round((seg.value / total) * 100);
                                return (
                                    <div
                                        key={seg.key}
                                        className="group relative overflow-hidden rounded-2xl flex items-center transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                                        style={{ background: seg.lightColor }}
                                    >
                                        <div className="w-1.5 self-stretch" style={{ backgroundColor: seg.color }} />
                                        <div className="flex-1 flex items-center justify-between p-4 pl-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase tracking-wider mb-0.5" style={{ color: seg.text }}>
                                                    {seg.key}
                                                </span>
                                                <span className="text-sm font-medium text-gray-600">{seg.date}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-black text-gray-900 leading-none">{seg.value}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Jours</span>
                                                </div>
                                                <div className="h-8 w-px bg-gray-200" />
                                                <span className="text-sm font-black text-gray-900 w-10 text-right">{percentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
