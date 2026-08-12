import { CycleEntry, UserStats } from '../types';
import { PredictionService } from './predictionService';

export interface CycleAnalysis {
  isIrregular: boolean;
  irregularityType: 'none' | 'length_variance' | 'period_variance' | 'missed_cycles' | 'very_long' | 'very_short';
  severity: 'low' | 'medium' | 'high';
  insights: string[];
  recommendations: string[];
  confidence: number;
}

export interface CyclePattern {
  averageLength: number;
  lengthVariance: number;
  averagePeriodLength: number;
  periodVariance: number;
  regularityScore: number; // 0-100
  trends: {
    lengthTrend: 'increasing' | 'decreasing' | 'stable';
    periodTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

/**
 * Service d'analyse des cycles avec IA pour détecter les irrégularités
 */
export class CycleAnalysisService {
  /**
   * Analyse les cycles pour détecter les irrégularités
   */
  static analyzeCycles(cycles: CycleEntry[]): CycleAnalysis {
    if (cycles.length < 2) {
      return {
        isIrregular: false,
        irregularityType: 'none',
        severity: 'low',
        insights: ['Pas assez de données pour analyser les cycles.'],
        recommendations: ['Continuez à enregistrer vos cycles pour obtenir une analyse précise.'],
        confidence: 0,
      };
    }

    const pattern = this.calculatePattern(cycles);
    const analysis = this.detectIrregularities(pattern, cycles);
    
    return {
      ...analysis,
      confidence: Math.min(0.95, 0.3 + (cycles.length * 0.1)),
    };
  }

  /**
   * Calcule les patterns et tendances des cycles
   */
  private static calculatePattern(cycles: CycleEntry[]): CyclePattern {
    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Calculate cycle lengths
    const cycleLengths: number[] = [];
    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const start = new Date(sortedCycles[i].startDate);
      const nextStart = new Date(sortedCycles[i + 1].startDate);
      const length = Math.round((nextStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (length >= 15 && length <= 50) {
        cycleLengths.push(length);
      }
    }

    // Calculate period lengths
    const periodLengths: number[] = sortedCycles
      .filter((cycle) => cycle.endDate)
      .map((cycle) => {
        const start = new Date(cycle.startDate);
        const end = new Date(cycle.endDate!);
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      })
      .filter((length) => length > 0 && length < 15);

    const averageLength = cycleLengths.length > 0 
      ? cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length 
      : 28;
    
    const lengthVariance = cycleLengths.length > 1 
      ? this.calculateVariance(cycleLengths) 
      : 0;

    const averagePeriodLength = periodLengths.length > 0 
      ? periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length 
      : 5;
    
    const periodVariance = periodLengths.length > 1 
      ? this.calculateVariance(periodLengths) 
      : 0;

    // Calculate regularity score (0-100)
    const lengthRegularity = Math.max(0, 100 - (lengthVariance * 10));
    const periodRegularity = Math.max(0, 100 - (periodVariance * 15));
    const regularityScore = (lengthRegularity + periodRegularity) / 2;

    // Calculate trends
    const lengthTrend = this.calculateTrend(cycleLengths);
    const periodTrend = this.calculateTrend(periodLengths);

    return {
      averageLength: Math.round(averageLength),
      lengthVariance: Math.round(lengthVariance * 10) / 10,
      averagePeriodLength: Math.round(averagePeriodLength),
      periodVariance: Math.round(periodVariance * 10) / 10,
      regularityScore: Math.round(regularityScore),
      trends: {
        lengthTrend,
        periodTrend,
      },
    };
  }

  /**
   * Détecte les irrégularités basées sur les patterns
   */
  private static detectIrregularities(pattern: CyclePattern, cycles: CycleEntry[]): Omit<CycleAnalysis, 'confidence'> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    let irregularityType: CycleAnalysis['irregularityType'] = 'none';
    let severity: CycleAnalysis['severity'] = 'low';

    // Check length variance
    if (pattern.lengthVariance > 5) {
      irregularityType = 'length_variance';
      severity = pattern.lengthVariance > 10 ? 'high' : 'medium';
      insights.push(`Vos cycles varient de ${pattern.lengthVariance.toFixed(1)} jours en moyenne.`);
      recommendations.push('Une variation de plus de 5 jours peut indiquer des cycles irréguliers.');
      
      if (severity === 'high') {
        recommendations.push('Considérez de consulter un professionnel de santé pour évaluer ces variations.');
      }
    }

    // Check period variance
    if (pattern.periodVariance > 2) {
      if (irregularityType === 'none') irregularityType = 'period_variance';
      const newSeverity: CycleAnalysis['severity'] = pattern.periodVariance > 4 ? 'high' : 'medium';
      severity = severity === 'high' ? 'high' : newSeverity;
      insights.push(`La durée de vos règles varie de ${pattern.periodVariance.toFixed(1)} jours.`);
      recommendations.push('Des variations importantes dans la durée des règles peuvent mériter une attention.');
    }

    // Check for very long cycles
    if (pattern.averageLength > 35) {
      if (irregularityType === 'none') irregularityType = 'very_long';
      severity = severity === 'high' ? 'high' : 'medium';
      insights.push(`Vos cycles sont plus longs que la moyenne (${pattern.averageLength} jours).`);
      recommendations.push('Des cycles longs peuvent être normaux, mais méritent d\'être surveillés.');
    }

    // Check for very short cycles
    if (pattern.averageLength < 21) {
      if (irregularityType === 'none') irregularityType = 'very_short';
      severity = severity === 'high' ? 'high' : 'medium';
      insights.push(`Vos cycles sont plus courts que la moyenne (${pattern.averageLength} jours).`);
      recommendations.push('Des cycles courts peuvent être normaux, mais méritent d\'être surveillés.');
    }

    // Add trend insights
    if (pattern.trends.lengthTrend !== 'stable') {
      const trendText = pattern.trends.lengthTrend === 'increasing' 
        ? 's\'allongent' 
        : 'raccourcissent';
      insights.push(`Vos cycles ${trendText} progressivement.`);
      recommendations.push('Surveillez cette tendance et notez tout changement important.');
    }

    // Regularity score insight
    if (pattern.regularityScore < 60) {
      insights.push(`Score de régularité: ${pattern.regularityScore}/100`);
      recommendations.push('Un score bas indique des cycles irréguliers. Continuez à les suivre.');
    }

    // If no irregularities detected
    if (irregularityType === 'none') {
      insights.push('Vos cycles semblent réguliers.');
      recommendations.push('Continuez à les suivre pour maintenir cette régularité.');
    }

    return {
      isIrregular: irregularityType !== 'none',
      irregularityType,
      severity,
      insights,
      recommendations,
    };
  }

  /**
   * Calcule la variance d'un ensemble de valeurs
   */
  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calcule la tendance d'un ensemble de valeurs
   */
  private static calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    
    if (Math.abs(diff) < 2) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Génère une analyse détaillée pour le tableau de bord
   */
  static generateDashboardAnalysis(cycles: CycleEntry[]): {
    summary: string;
    pattern: CyclePattern;
    analysis: CycleAnalysis;
    monthlyData: Array<{ month: string; cycleLength: number; periodLength?: number }>;
  } {
    const pattern = this.calculatePattern(cycles);
    const analysis = this.analyzeCycles(cycles);
    
    // Generate monthly data for charts
    const monthlyData = this.generateMonthlyData(cycles);
    
    // Generate summary
    const summary = this.generateSummary(pattern, analysis);
    
    return {
      summary,
      pattern,
      analysis,
      monthlyData,
    };
  }

  /**
   * Génère les données mensuelles pour les graphiques
   */
  private static generateMonthlyData(cycles: CycleEntry[]): Array<{ month: string; cycleLength: number; periodLength?: number }> {
    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const data: Array<{ month: string; cycleLength: number; periodLength?: number }> = [];
    
    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const current = sortedCycles[i];
      const next = sortedCycles[i + 1];
      
      const startDate = new Date(current.startDate);
      const nextStartDate = new Date(next.startDate);
      const cycleLength = Math.round((nextStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let periodLength: number | undefined;
      if (current.endDate) {
        const endDate = new Date(current.endDate);
        periodLength = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      
      const month = startDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      
      data.push({ month, cycleLength, periodLength });
    }
    
    return data;
  }

  /**
   * Génère un résumé de l'analyse
   */
  private static generateSummary(pattern: CyclePattern, analysis: CycleAnalysis): string {
    if (analysis.isIrregular) {
      return `Vos cycles présentent des ${analysis.irregularityType === 'length_variance' ? 'variations de longueur' : 'irrégularités'} (${analysis.severity === 'high' ? 'importantes' : 'modérées'}). Score de régularité: ${pattern.regularityScore}/100.`;
    }
    return `Vos cycles sont réguliers avec une longueur moyenne de ${pattern.averageLength} jours. Score de régularité: ${pattern.regularityScore}/100.`;
  }
}
