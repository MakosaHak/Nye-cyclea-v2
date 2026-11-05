import { CycleEntry } from '../types';

export interface CycleAnalysis {
  isIrregular: boolean;
  irregularityType:
    | 'none'
    | 'length_variance'
    | 'period_variance'
    | 'missed_cycles'
    | 'very_long'
    | 'very_short';
  severity: 'low' | 'medium' | 'high';
  insights: string[];
  recommendations: string[];
  /** Vrai si un avis médical est conseillé */
  shouldConsult: boolean;
  confidence: number;
}

export interface CyclePattern {
  /** Nombre de cycles complets mesurés (intervalle entre deux débuts de règles) */
  cycleCount: number;
  /** Longueur de chaque cycle, du plus ancien au plus récent */
  lengths: number[];
  averageLength: number;
  /** Écart-type de la longueur des cycles, en jours */
  lengthStdDev: number;
  shortestLength: number;
  longestLength: number;
  /** Écart entre le cycle le plus long et le plus court, en jours */
  lengthRange: number;
  averagePeriodLength: number;
  /** Écart-type de la durée des règles, en jours */
  periodStdDev: number;
  /** 0-100 : 100 = parfaitement régulier */
  regularityScore: number;
  /** 0-100 : part des cycles qui s'écartent de plus de 3 jours du cycle médian */
  irregularityRate: number;
  trends: {
    lengthTrend: 'increasing' | 'decreasing' | 'stable';
    periodTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface CycleChartPoint {
  /** Libellé court du début du cycle, ex. « 12 mai » */
  label: string;
  cycleLength: number;
  periodLength?: number;
}

export interface DashboardAnalysis {
  summary: string;
  pattern: CyclePattern;
  analysis: CycleAnalysis;
  chartData: CycleChartPoint[];
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Un intervalle hors de ces bornes est presque toujours un oubli de saisie, pas un vrai cycle */
const MIN_PLAUSIBLE_CYCLE = 10;
const MAX_PLAUSIBLE_CYCLE = 90;

/** Tolérance autour du cycle médian avant de compter un cycle comme « irrégulier » */
const DEVIATION_TOLERANCE_DAYS = 3;

/** Repères médicaux usuels (FIGO) : cycle normal entre 24 et 38 jours, écart max de 7 à 9 jours */
const NORMAL_MIN_LENGTH = 24;
const NORMAL_MAX_LENGTH = 38;
const IRREGULAR_RANGE_DAYS = 8;
const HIGH_RANGE_DAYS = 15;
/** Au-delà de cette part de cycles décalés, l'irrégularité est jugée forte */
const HIGH_IRREGULARITY_RATE = 70;

function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseLocalDate(toIso).getTime() - parseLocalDate(fromIso).getTime()) / DAY_MS);
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - avg) ** 2)));
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function trendOf(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 4) return 'stable';
  const half = Math.floor(values.length / 2);
  const diff = mean(values.slice(half)) - mean(values.slice(0, half));
  if (Math.abs(diff) < 2) return 'stable';
  return diff > 0 ? 'increasing' : 'decreasing';
}

function sortByStart(cycles: CycleEntry[]): CycleEntry[] {
  return [...cycles].sort(
    (a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime()
  );
}

function periodLengthOf(cycle: CycleEntry): number | undefined {
  if (!cycle.endDate) return undefined;
  const length = daysBetween(cycle.startDate, cycle.endDate) + 1;
  return length > 0 && length < 15 ? length : undefined;
}

/**
 * Analyse locale des cycles : calculs statistiques faits sur l'appareil, sans réseau.
 * Sert de base à l'analyse IA et de repli quand l'IA n'est pas disponible.
 */
export class CycleAnalysisService {
  static calculatePattern(cycles: CycleEntry[]): CyclePattern {
    const sorted = sortByStart(cycles);

    const lengths: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const length = daysBetween(sorted[i].startDate, sorted[i + 1].startDate);
      if (length >= MIN_PLAUSIBLE_CYCLE && length <= MAX_PLAUSIBLE_CYCLE) lengths.push(length);
    }

    const periodLengths = sorted
      .map(periodLengthOf)
      .filter((length): length is number => length !== undefined);

    const lengthStdDev = stdDev(lengths);
    const periodStdDev = stdDev(periodLengths);
    const shortest = lengths.length ? Math.min(...lengths) : 0;
    const longest = lengths.length ? Math.max(...lengths) : 0;

    const mid = median(lengths);
    const deviating = lengths.filter((l) => Math.abs(l - mid) > DEVIATION_TOLERANCE_DAYS).length;
    const irregularityRate = lengths.length ? Math.round((deviating / lengths.length) * 100) : 0;

    // 100 = aucun écart. Un écart-type de 2 jours reste « bon » (≈ 82), 8 jours tombe vers 30.
    const regularityScore = Math.max(
      0,
      Math.min(100, Math.round(100 - lengthStdDev * 9 - periodStdDev * 5))
    );

    return {
      cycleCount: lengths.length,
      lengths,
      averageLength: lengths.length ? Math.round(mean(lengths)) : 28,
      lengthStdDev: round1(lengthStdDev),
      shortestLength: shortest,
      longestLength: longest,
      lengthRange: longest - shortest,
      averagePeriodLength: periodLengths.length ? Math.round(mean(periodLengths)) : 5,
      periodStdDev: round1(periodStdDev),
      regularityScore,
      irregularityRate,
      trends: {
        lengthTrend: trendOf(lengths),
        periodTrend: trendOf(periodLengths),
      },
    };
  }

  static analyzeCycles(cycles: CycleEntry[], pattern = this.calculatePattern(cycles)): CycleAnalysis {
    if (pattern.cycleCount < 1) {
      return {
        isIrregular: false,
        irregularityType: 'none',
        severity: 'low',
        insights: ['Pas encore assez de cycles pour mesurer ta régularité.'],
        recommendations: ['Enregistre tes prochaines règles : l’analyse se précisera à chaque cycle.'],
        shouldConsult: false,
        confidence: 0,
      };
    }

    const insights: string[] = [];
    const recommendations: string[] = [];
    let irregularityType: CycleAnalysis['irregularityType'] = 'none';
    let severity = 'low' as CycleAnalysis['severity'];
    const raise = (level: CycleAnalysis['severity']) => {
      if (level === 'high' || (level === 'medium' && severity === 'low')) severity = level;
    };

    if (pattern.cycleCount >= 2 && pattern.lengthRange >= IRREGULAR_RANGE_DAYS) {
      irregularityType = 'length_variance';
      raise(
        pattern.lengthRange >= HIGH_RANGE_DAYS || pattern.irregularityRate >= HIGH_IRREGULARITY_RATE
          ? 'high'
          : 'medium'
      );
      insights.push(
        `Tes cycles vont de ${pattern.shortestLength} à ${pattern.longestLength} jours, soit ${pattern.lengthRange} jours d’écart entre le plus court et le plus long.`
      );
      insights.push(
        `${pattern.irregularityRate} % de tes cycles s’écartent de plus de ${DEVIATION_TOLERANCE_DAYS} jours de ton cycle habituel.`
      );
      recommendations.push(
        'Note les événements qui précèdent un cycle décalé (stress, voyage, maladie, changement de poids ou de sommeil).'
      );
    }

    if (pattern.averageLength > NORMAL_MAX_LENGTH) {
      if (irregularityType === 'none') irregularityType = 'very_long';
      raise('medium');
      insights.push(
        `Ton cycle moyen (${pattern.averageLength} jours) est plus long que la plage habituelle de ${NORMAL_MIN_LENGTH} à ${NORMAL_MAX_LENGTH} jours.`
      );
    } else if (pattern.averageLength < NORMAL_MIN_LENGTH) {
      if (irregularityType === 'none') irregularityType = 'very_short';
      raise('medium');
      insights.push(
        `Ton cycle moyen (${pattern.averageLength} jours) est plus court que la plage habituelle de ${NORMAL_MIN_LENGTH} à ${NORMAL_MAX_LENGTH} jours.`
      );
    }

    if (pattern.periodStdDev > 1.5) {
      if (irregularityType === 'none') irregularityType = 'period_variance';
      raise('medium');
      insights.push(
        `La durée de tes règles varie aussi (environ ± ${pattern.periodStdDev.toFixed(1)} jour autour de ${pattern.averagePeriodLength} jours).`
      );
    }

    if (pattern.trends.lengthTrend !== 'stable') {
      insights.push(
        pattern.trends.lengthTrend === 'increasing'
          ? 'Sur la période, tes cycles ont tendance à s’allonger.'
          : 'Sur la période, tes cycles ont tendance à raccourcir.'
      );
    }

    const isIrregular = irregularityType !== 'none';
    const shouldConsult = severity === 'high' || pattern.longestLength > 45;

    if (isIrregular) {
      recommendations.push(
        'Les prédictions de règles et d’ovulation sont moins fiables avec des cycles irréguliers : ne t’y fie pas comme moyen de contraception.'
      );
      recommendations.push(
        shouldConsult
          ? 'Avec des écarts de cette ampleur, parle-en à un·e professionnel·le de santé (sage-femme, gynécologue) en montrant ton historique.'
          : 'Si ces variations durent plus de trois mois ou s’accompagnent de douleurs fortes, demande un avis médical.'
      );
    } else {
      insights.push(
        `Tes cycles sont réguliers : ils restent proches de ${pattern.averageLength} jours (± ${pattern.lengthStdDev.toFixed(1)} jour).`
      );
      recommendations.push('Continue à enregistrer tes règles pour garder des prédictions fiables.');
    }

    return {
      isIrregular,
      irregularityType,
      severity,
      insights,
      recommendations,
      shouldConsult,
      confidence: Math.min(0.95, 0.35 + pattern.cycleCount * 0.1),
    };
  }

  static generateDashboardAnalysis(cycles: CycleEntry[]): DashboardAnalysis {
    const pattern = this.calculatePattern(cycles);
    const analysis = this.analyzeCycles(cycles, pattern);
    return {
      summary: this.generateSummary(pattern, analysis),
      pattern,
      analysis,
      chartData: this.generateChartData(cycles),
    };
  }

  private static generateChartData(cycles: CycleEntry[]): CycleChartPoint[] {
    const sorted = sortByStart(cycles);
    const data: CycleChartPoint[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const cycleLength = daysBetween(sorted[i].startDate, sorted[i + 1].startDate);
      if (cycleLength < MIN_PLAUSIBLE_CYCLE || cycleLength > MAX_PLAUSIBLE_CYCLE) continue;
      data.push({
        label: parseLocalDate(sorted[i].startDate).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        }),
        cycleLength,
        periodLength: periodLengthOf(sorted[i]),
      });
    }
    return data;
  }

  private static generateSummary(pattern: CyclePattern, analysis: CycleAnalysis): string {
    const base = `Sur tes ${pattern.cycleCount} derniers cycles mesurés`;
    if (!analysis.isIrregular) {
      return `${base}, ta régularité est bonne : cycle moyen de ${pattern.averageLength} jours, score de ${pattern.regularityScore}/100.`;
    }
    const level = analysis.severity === 'high' ? 'forte' : 'modérée';
    return `${base}, l’irrégularité est ${level} : taux d’irrégularité de ${pattern.irregularityRate} %, score de régularité de ${pattern.regularityScore}/100.`;
  }
}
