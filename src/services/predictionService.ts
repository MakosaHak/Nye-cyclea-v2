import { CycleEntry, Prediction, UserStats } from '../types';
import { StorageService } from './storageService';

export class PredictionService {
  private static readonly DEFAULT_CYCLE_LENGTH = 28;
  private static readonly DEFAULT_PERIOD_LENGTH = 5;
  private static readonly OVULATION_OFFSET = 14; // days before next period
  private static readonly FERTILE_WINDOW_BEFORE = 4;
  private static readonly FERTILE_WINDOW_AFTER = 1;
  private static readonly MIN_RANGE_DAYS = 1;
  private static readonly MAX_RANGE_DAYS = 6;

  /**
   * Get user settings for default cycle and period lengths
   */
  private static getUserDefaults(): {
    cycleLength: number;
    periodLength: number;
  } {
    const settings = StorageService.getSettings();
    return {
      cycleLength: settings.defaultCycleLength || this.DEFAULT_CYCLE_LENGTH,
      periodLength: settings.defaultPeriodLength || this.DEFAULT_PERIOD_LENGTH,
    };
  }

  /**
   * Calculate user statistics from cycle history
   * Uses real cycle data when available (2+ cycles), otherwise falls back to user defaults
   */
  static calculateUserStats(cycles: CycleEntry[]): UserStats {
    const userDefaults = this.getUserDefaults();

    if (cycles.length === 0) {
      return {
        averageCycleLength: userDefaults.cycleLength,
        averagePeriodLength: userDefaults.periodLength,
        last3Cycles: [],
        predictionConfidence: 0,
      };
    }

    // Sort cycles by start date
    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Calculate cycle lengths (time between start of one cycle and start of next)
    // Need at least 2 cycles to calculate one interval
    const cycleLengths: number[] = [];
    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const start = new Date(sortedCycles[i].startDate);
      const nextStart = new Date(sortedCycles[i + 1].startDate);
      const length = Math.round((nextStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (length >= 15 && length <= 50) {
        // Standard clinical range for regular/irregular cycles
        cycleLengths.push(length);
      }
    }

    // Calculate period lengths (duration of bleeding)
    // Can calculate from a single cycle if endDate is provided
    const periodLengths: number[] = sortedCycles
      .filter((cycle) => cycle.endDate)
      .map((cycle) => {
        const start = new Date(cycle.startDate);
        const end = new Date(cycle.endDate!);
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      })
      .filter((length) => length > 0 && length < 15); // Sanity check

    // Use calculated averages if we have real data, otherwise use user defaults
    // For cycle length: need at least 2 cycles (1 interval)
    // For period length: need at least 1 cycle with endDate
    const avgCycle =
      cycleLengths.length > 0
        ? cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
        : userDefaults.cycleLength;

    const avgPeriod =
      periodLengths.length > 0
        ? periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
        : userDefaults.periodLength;

    // Calculate confidence based on number of cycles and consistency
    let confidence = 0;
    if (cycleLengths.length >= 3) {
      const stdDev = this.calculateStdDev(cycleLengths);
      // Higher confidence with more data and lower variation
      const consistencyFactor = Math.max(0, 1 - stdDev / 10);
      const dataFactor = Math.min(1, cycleLengths.length / 6);
      confidence = consistencyFactor * 0.7 + dataFactor * 0.3;
    } else if (cycleLengths.length > 0) {
      confidence = 0.3 + cycleLengths.length * 0.1;
    }

    return {
      averageCycleLength: Math.round(avgCycle),
      averagePeriodLength: Math.round(avgPeriod),
      last3Cycles: cycleLengths.slice(-3),
      predictionConfidence: Math.min(0.95, confidence), // Cap at 95%
    };
  }

  /**
   * Generate prediction for next cycle
   */
  static predictNextCycle(
    cycles: CycleEntry[],
    customSettings?: { cycleLength: number; periodLength: number }
  ): Prediction {
    const stats = this.calculateUserStats(cycles);
    const userDefaults = this.getUserDefaults();

    // Use custom settings if provided, otherwise use calculated stats
    const cycleLength = customSettings?.cycleLength || stats.averageCycleLength;
    const periodLength = customSettings?.periodLength || stats.averagePeriodLength;

    // Find last cycle start date
    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    // Calculate how many cycle intervals we have (need 2 cycles for 1 interval)
    const cycleIntervals = Math.max(0, sortedCycles.length - 1);

    let basis = '';
    let lastStart: Date;

    if (sortedCycles.length === 0) {
      // No cycles yet, use today as reference
      lastStart = new Date();
      basis = 'Estimation par défaut (aucun cycle enregistré)';
    } else if (sortedCycles.length === 1) {
      lastStart = new Date(sortedCycles[0].startDate);
      // Check if we're using calculated period length or default
      const usingRealPeriod = stats.averagePeriodLength !== userDefaults.periodLength;
      basis = `Estimation basée sur 1 cycle${usingRealPeriod ? ' (durée des règles calculée)' : ' et valeurs par défaut'}`;
    } else if (cycleIntervals === 1) {
      // 2 cycles = 1 interval calculated
      lastStart = new Date(sortedCycles[0].startDate);
      basis = 'Estimation basée sur votre cycle réel (2 cycles enregistrés)';
    } else {
      // 3+ cycles = multiple intervals, using average
      lastStart = new Date(sortedCycles[0].startDate);
      const cycleCount = Math.min(3, stats.last3Cycles.length);
      basis = `Moyenne calculée à partir de ${cycleCount} cycle${cycleCount > 1 ? 's' : ''} réel${cycleCount > 1 ? 's' : ''}`;
    }

    // Calculate predictions
    const predictedStartDate = this.parseISOLocal(this.dateToISO(lastStart));
    predictedStartDate.setDate(predictedStartDate.getDate() + cycleLength);

    const predictedEndDate = new Date(predictedStartDate);
    predictedEndDate.setDate(predictedEndDate.getDate() + periodLength - 1);

    // Ovulation is typically 14 days before next period
    const ovulationDate = new Date(predictedStartDate);
    ovulationDate.setDate(ovulationDate.getDate() - this.OVULATION_OFFSET);

    // Fertile window: 4 days before ovulation to 1 day after (will be widened by uncertainty logic)
    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - this.FERTILE_WINDOW_BEFORE);

    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + this.FERTILE_WINDOW_AFTER);

    // Build uncertainty ranges based on variability
    // Compute cycle lengths locally (intervals between starts)
    const sortedByStartAsc = [...cycles].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const cycleLengths: number[] = [];
    for (let i = 0; i < sortedByStartAsc.length - 1; i++) {
      const start = new Date(sortedByStartAsc[i].startDate);
      const nextStart = new Date(sortedByStartAsc[i + 1].startDate);
      const len = Math.round((nextStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (len >= 15 && len <= 50) {
        cycleLengths.push(len);
      }
    }

    const sigma = cycleLengths.length > 0 ? this.calculateStdDev(cycleLengths) : 0;
    // Choose k factor based on confidence (lower confidence -> larger k)
    let k = 1.0;
    if (stats.predictionConfidence >= 0.75) {
      k = 0.8;
    } else if (stats.predictionConfidence >= 0.6) {
      k = 1.0;
    } else if (stats.predictionConfidence >= 0.4) {
      k = 1.2;
    } else {
      k = 1.5;
    }

    // Fallback range baseline when not enough data
    const fallback = 2; // Reduced from 4
    const rawWidth = sigma > 0 ? Math.ceil(k * sigma) : fallback;
    const rangeWidth = Math.max(this.MIN_RANGE_DAYS, Math.min(3, rawWidth)); // Reduced MAX_RANGE from 6 to 3

    // Construct ranges
    const startMin = new Date(predictedStartDate);
    startMin.setDate(startMin.getDate() - rangeWidth);
    const startMax = new Date(predictedStartDate);
    startMax.setDate(startMax.getDate() + rangeWidth);

    const ovuMin = new Date(ovulationDate);
    const ovHalf = Math.max(1, Math.ceil(rangeWidth / 2));
    ovuMin.setDate(ovuMin.getDate() - ovHalf);
    const ovuMax = new Date(ovulationDate);
    ovuMax.setDate(ovuMax.getDate() + ovHalf);

    // Widen fertile window to cover ovulation range
    const fertileRangeStart = new Date(ovuMin);
    fertileRangeStart.setDate(fertileRangeStart.getDate() - this.FERTILE_WINDOW_BEFORE);
    const fertileRangeEnd = new Date(ovuMax);
    fertileRangeEnd.setDate(fertileRangeEnd.getDate() + this.FERTILE_WINDOW_AFTER);

    return {
      predictedStart: this.dateToISO(predictedStartDate),
      predictedEnd: this.dateToISO(predictedEndDate),
      ovulationDate: this.dateToISO(ovulationDate),
      fertileWindow: [this.dateToISO(fertileRangeStart), this.dateToISO(fertileRangeEnd)],
      confidence: stats.predictionConfidence,
      basis,
      predictedStartRange: [this.dateToISO(startMin), this.dateToISO(startMax)],
      ovulationWindow: [this.dateToISO(ovuMin), this.dateToISO(ovuMax)],
    };
  }

  /**
   * Generate predictions for next 6 months
   */
  static predictNext6Months(cycles: CycleEntry[]): Prediction[] {
    const predictions: Prediction[] = [];
    const stats = this.calculateUserStats(cycles);

    // Start from last cycle or today
    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    let currentDate = sortedCycles.length > 0 ? new Date(sortedCycles[0].startDate) : new Date();

    for (let i = 0; i < 6; i++) {
      // Create a temporary cycle to feed into prediction
      const tempCycle: CycleEntry = {
        id: `temp-${i}`,
        userId: 'temp',
        startDate: this.dateToISO(currentDate),
        source: 'manual',
        createdAt: new Date().toISOString(),
      };

      const prediction = this.predictNextCycle([...cycles, tempCycle]);
      predictions.push(prediction);

      // Move to next cycle
      currentDate = new Date(prediction.predictedStart);
    }

    return predictions;
  }

  /**
   * Get current cycle phase
   */
  static getCurrentPhase(
    cycles: CycleEntry[],
    currentDate: Date = new Date()
  ): {
    phase: 'menstruation' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';
    dayOfCycle: number;
    description: string;
  } {
    if (cycles.length === 0) {
      return {
        phase: 'unknown',
        dayOfCycle: 0,
        description: 'Ajoutez votre premier cycle pour voir votre phase actuelle',
      };
    }

    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    const lastCycle = sortedCycles[0];
    const lastStart = this.parseISOLocal(lastCycle.startDate);
    const daysSinceStart = Math.floor(
      (currentDate.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const stats = this.calculateUserStats(cycles);
    const cycleLength = stats.averageCycleLength;

    if (daysSinceStart < 0) {
      return {
        phase: 'unknown',
        dayOfCycle: 0,
        description: 'Date invalide',
      };
    }

    // Determine phase
    let phase: 'menstruation' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';
    let description: string;

    const isCurrentlyBleeding = lastCycle.endDate
      ? currentDate <= new Date(lastCycle.endDate)
      : daysSinceStart < stats.averagePeriodLength;

    if (isCurrentlyBleeding && daysSinceStart < 10) {
      // Safety cap for menstruation phase
      phase = 'menstruation';
      description = 'Période de menstruation';
    } else if (daysSinceStart < cycleLength - 14 - 3) {
      phase = 'follicular';
      description = 'Phase folliculaire';
    } else if (daysSinceStart >= cycleLength - 14 - 3 && daysSinceStart <= cycleLength - 14 + 1) {
      phase = 'ovulation';
      description = 'Pic de fertilité (Ovulation)';
    } else if (daysSinceStart < cycleLength) {
      phase = 'luteal';
      description = 'Phase lutéale';
    } else {
      // Past expected cycle length - might be late or pregnant
      phase = 'unknown';
      description = 'Cycle inhabituel - Retard possible';
    }

    return {
      phase,
      dayOfCycle: daysSinceStart + 1,
      description,
    };
  }

  // Helper methods
  static parseISOLocal(iso: string): Date {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private static calculateStdDev(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  public static dateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
