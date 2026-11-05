import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { CycleEntry } from '../types';
import { CycleAnalysisService, type CyclePattern } from './cycleAnalysisService';
import { PredictionService } from './predictionService';
import { StorageService } from './storageService';

/*
 * Rapport PDF d'un cycle.
 *
 * Les polices intégrées à jsPDF ne couvrent que le jeu de caractères Windows-1252 :
 * pas de flèches, pas d'émojis, pas d'apostrophes typographiques dans les textes ci-dessous.
 */

type DayKind = 'period' | 'fertile' | 'ovulation' | 'next-period' | 'cycle' | 'outside';

const COLORS = {
  primary: '#db2777',
  primaryDark: '#9d174d',
  primarySoft: '#fdf2f8',
  accent: '#a855f7',
  ink: '#1e293b',
  body: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#e2e8f0',
  white: '#ffffff',
};

const DAY_STYLES: Record<DayKind, { fill: string; text: string; border?: string }> = {
  period: { fill: '#fb7185', text: '#ffffff' },
  fertile: { fill: '#fce7f3', text: '#9d174d' },
  ovulation: { fill: '#a855f7', text: '#ffffff' },
  'next-period': { fill: '#ffffff', text: '#be123c', border: '#fb7185' },
  cycle: { fill: '#f1f5f9', text: '#475569' },
  outside: { fill: '#ffffff', text: '#cbd5e1' },
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** L'ovulation survient en moyenne 14 jours avant les règles suivantes */
const OVULATION_BEFORE_NEXT_PERIOD = 14;
const FERTILE_DAYS_BEFORE = 4;
const FERTILE_DAYS_AFTER = 1;
/** Écart, en jours, en dessous duquel un cycle est considéré « dans la moyenne » */
const AVERAGE_TOLERANCE_DAYS = 3;
/** Au-delà, un cycle sans règles suivantes enregistrées n'est plus présenté comme « en cours » */
const MAX_ONGOING_DAYS = 60;

const PAGE = { width: 210, height: 297, margin: 15 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

export interface CycleReportInput {
  cycles: CycleEntry[];
  /** Cycle détaillé dans le rapport ; par défaut, le plus récent */
  targetCycle?: CycleEntry;
  username?: string;
  /** Date de génération (injectable pour les tests) */
  now?: Date;
  /** Logo en data-URL PNG, optionnel */
  logo?: string;
}

interface CycleFacts {
  start: Date;
  periodEnd: Date;
  periodLength: number;
  periodEndEstimated: boolean;
  /** Début des règles suivantes : réel si enregistré, sinon estimé */
  nextStart: Date;
  nextStartEstimated: boolean;
  cycleLength: number;
  ovulation: Date;
  fertileStart: Date;
  fertileEnd: Date;
  /** Jour du cycle atteint aujourd'hui, si le cycle est en cours */
  currentDay?: number;
  /** Vrai si les règles suivantes n'ont jamais été enregistrées alors que le cycle est ancien */
  incomplete: boolean;
}

function parseDay(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function sameDay(a: Date, b: Date): boolean {
  return diffDays(a, b) === 0;
}

function longDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count > 1 ? 's' : ''}`;
}

function computeFacts(
  target: CycleEntry,
  sorted: CycleEntry[],
  pattern: CyclePattern,
  now: Date
): CycleFacts {
  const start = parseDay(target.startDate);
  const index = sorted.findIndex((c) => c.id === target.id);
  const next = index >= 0 ? sorted[index + 1] : undefined;

  const periodEndEstimated = !target.endDate;
  const periodEnd = target.endDate
    ? parseDay(target.endDate)
    : addDays(start, pattern.averagePeriodLength - 1);

  const nextStartEstimated = !next;
  const nextStart = next ? parseDay(next.startDate) : addDays(start, pattern.averageLength);
  const ovulation = addDays(nextStart, -OVULATION_BEFORE_NEXT_PERIOD);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayNumber = diffDays(start, today) + 1;

  return {
    start,
    periodEnd,
    periodLength: diffDays(start, periodEnd) + 1,
    periodEndEstimated,
    nextStart,
    nextStartEstimated,
    cycleLength: diffDays(start, nextStart),
    ovulation,
    fertileStart: addDays(ovulation, -FERTILE_DAYS_BEFORE),
    fertileEnd: addDays(ovulation, FERTILE_DAYS_AFTER),
    currentDay:
      nextStartEstimated && dayNumber >= 1 && dayNumber <= MAX_ONGOING_DAYS ? dayNumber : undefined,
    incomplete: nextStartEstimated && dayNumber > MAX_ONGOING_DAYS,
  };
}

function kindOfDay(date: Date, facts: CycleFacts): DayKind {
  if (date < facts.start || date > facts.nextStart) return 'outside';
  if (sameDay(date, facts.nextStart)) return 'next-period';
  if (date <= facts.periodEnd) return 'period';
  if (sameDay(date, facts.ovulation)) return 'ovulation';
  if (date >= facts.fertileStart && date <= facts.fertileEnd) return 'fertile';
  return 'cycle';
}

/** Compare ce cycle à la moyenne de l'utilisatrice */
function verdictOf(facts: CycleFacts, pattern: CyclePattern): { label: string; color: string } {
  if (facts.incomplete) return { label: 'Cycle incomplet', color: COLORS.muted };
  if (facts.nextStartEstimated) return { label: 'Cycle en cours', color: COLORS.accent };
  if (pattern.cycleCount < 2) return { label: 'Premier cycle mesuré', color: COLORS.accent };
  const diff = facts.cycleLength - pattern.averageLength;
  if (Math.abs(diff) <= AVERAGE_TOLERANCE_DAYS) {
    return { label: 'Dans ta moyenne', color: '#059669' };
  }
  return diff > 0
    ? { label: 'Plus long que ta moyenne', color: '#d97706' }
    : { label: 'Plus court que ta moyenne', color: '#d97706' };
}

/** Résumé rédigé du cycle : c'est le coeur du rapport */
function buildSummary(target: CycleEntry, facts: CycleFacts, pattern: CyclePattern): string[] {
  const paragraphs: string[] = [];
  const hasAverage = pattern.cycleCount >= 2;

  if (facts.incomplete) {
    paragraphs.push(
      `Ce cycle a commencé le ${longDate(facts.start)}. Les règles suivantes n'ont pas été enregistrées : sa durée réelle n'est donc pas connue. ` +
        `Les dates ci-dessous sont calculées avec un cycle type de ${pattern.averageLength} jours.`
    );
  } else if (facts.nextStartEstimated) {
    const dayText = facts.currentDay ? ` Tu en es au jour ${facts.currentDay}.` : '';
    paragraphs.push(
      `Ce cycle a commencé le ${longDate(facts.start)} et il est encore en cours.${dayText} ` +
        `D'après ta moyenne de ${pattern.averageLength} jours, tes prochaines règles sont attendues vers le ${longDate(facts.nextStart)}.`
    );
  } else {
    let comparison = '';
    if (hasAverage) {
      const diff = facts.cycleLength - pattern.averageLength;
      if (Math.abs(diff) <= AVERAGE_TOLERANCE_DAYS) {
        comparison = `, ce qui est dans ta moyenne (${pattern.averageLength} jours)`;
      } else {
        comparison = `, soit ${plural(Math.abs(diff), 'jour')} de ${diff > 0 ? 'plus' : 'moins'} que ta moyenne de ${pattern.averageLength} jours`;
      }
    }
    paragraphs.push(
      `Ce cycle a commencé le ${longDate(facts.start)} et s'est terminé avec l'arrivée des règles suivantes le ${longDate(facts.nextStart)}. ` +
        `Il a duré ${plural(facts.cycleLength, 'jour')}${comparison}.`
    );
  }

  const periodDiff = facts.periodLength - pattern.averagePeriodLength;
  const periodComparison =
    !hasAverage || facts.periodEndEstimated
      ? ''
      : periodDiff === 0
        ? ", comme d'habitude"
        : `, soit ${plural(Math.abs(periodDiff), 'jour')} de ${periodDiff > 0 ? 'plus' : 'moins'} que d'habitude`;
  const periodText = facts.periodEndEstimated
    ? `La fin des règles n'a pas été notée : leur durée est estimée à ${plural(facts.periodLength, 'jour')}.`
    : `Les règles ont duré ${plural(facts.periodLength, 'jour')}${periodComparison}.`;
  const symptoms = target.symptoms?.filter(Boolean) ?? [];
  const symptomText = symptoms.length
    ? ` Symptômes notés : ${symptoms.join(', ').toLowerCase()}.`
    : " Aucun symptôme n'a été noté pour ce cycle.";
  paragraphs.push(periodText + symptomText);

  const estimate = facts.nextStartEstimated ? 'est estimée' : 'a été estimée';
  paragraphs.push(
    `L'ovulation ${estimate} autour du ${longDate(facts.ovulation)}, avec une fenêtre fertile du ${shortDate(facts.fertileStart)} au ${shortDate(facts.fertileEnd)}. ` +
      (pattern.cycleCount >= 2 && pattern.lengthRange >= 8
        ? `Comme tes cycles varient de ${pattern.shortestLength} à ${pattern.longestLength} jours, ces dates restent approximatives.`
        : 'Ces dates sont des estimations calculées, pas une mesure.')
  );

  return paragraphs;
}

export class PDFService {
  /** Génère et télécharge le rapport PDF d'un cycle */
  static generateCyclePDF(targetCycle?: CycleEntry): void {
    void PDFService.loadLogo().then((logo) => {
      try {
        const doc = PDFService.buildCycleReport({
          cycles: StorageService.getCycles(),
          targetCycle,
          username: StorageService.getAuth()?.username,
          logo,
        });
        const day = (targetCycle?.startDate ?? PredictionService.dateToISO(new Date())).slice(
          0,
          10
        );
        doc.save(`Nye-Cyclea-rapport-cycle-${day}.pdf`);
        toast.success('Rapport PDF téléchargé');
      } catch (error) {
        console.error('Erreur de génération du PDF :', error);
        toast.error('Impossible de générer le PDF. Veuillez réessayer.');
      }
    });
  }

  /** Charge le logo en data-URL ; sans réseau ni cache, le rapport utilise un monogramme */
  private static async loadLogo(): Promise<string | undefined> {
    try {
      const response = await fetch('/icons/pwa-192x192.png');
      if (!response.ok) return undefined;
      const blob = await response.blob();
      return await new Promise<string | undefined>((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(typeof reader.result === 'string' ? reader.result : undefined);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(blob);
      });
    } catch {
      return undefined;
    }
  }

  /** Construit le document sans le télécharger (testable hors navigateur) */
  static buildCycleReport(input: CycleReportInput): jsPDF {
    const now = input.now ?? new Date();
    const sorted = [...input.cycles].sort(
      (a, b) => parseDay(a.startDate).getTime() - parseDay(b.startDate).getTime()
    );
    const target = input.targetCycle ?? sorted[sorted.length - 1];
    if (!target) throw new Error('Aucun cycle à exporter');

    const pattern = CycleAnalysisService.calculatePattern(sorted);
    const analysis = CycleAnalysisService.analyzeCycles(sorted, pattern);
    const facts = computeFacts(target, sorted, pattern, now);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const { margin } = PAGE;
    let y = 0;

    // --- Outils de dessin ---
    const rgb = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const fill = (hex: string) => doc.setFillColor(...rgb(hex));
    const stroke = (hex: string, width = 0.2) => {
      doc.setDrawColor(...rgb(hex));
      doc.setLineWidth(width);
    };
    const font = (
      hex: string,
      size: number,
      style: 'normal' | 'bold' | 'italic' = 'normal',
      family: 'helvetica' | 'times' = 'helvetica'
    ) => {
      doc.setFont(family, style);
      doc.setFontSize(size);
      doc.setTextColor(...rgb(hex));
    };
    const ensureSpace = (needed: number) => {
      if (y + needed > PAGE.height - 16) {
        doc.addPage();
        y = 20;
      }
    };
    const sectionTitle = (title: string) => {
      ensureSpace(14);
      fill(COLORS.primary);
      doc.roundedRect(margin, y - 3.6, 1.6, 5, 0.8, 0.8, 'F');
      font(COLORS.ink, 11.5, 'bold');
      doc.text(title, margin + 4.5, y);
      y += 7;
    };

    // --- Bandeau d'en-tête ---
    fill(COLORS.primary);
    doc.rect(0, 0, PAGE.width, 31, 'F');
    fill('#ec4899');
    doc.circle(PAGE.width - 12, 2, 26, 'F');
    fill('#f472b6');
    doc.circle(PAGE.width - 2, 26, 11, 'F');

    fill(COLORS.white);
    doc.roundedRect(margin, 7, 17, 17, 4, 4, 'F');
    let logoDrawn = false;
    if (input.logo) {
      try {
        doc.addImage(input.logo, 'PNG', margin + 2, 9, 13, 13);
        logoDrawn = true;
      } catch {
        /* logo indisponible : on dessine le monogramme ci-dessous */
      }
    }
    if (!logoDrawn) {
      font(COLORS.primary, 13, 'bold', 'times');
      doc.text('N', margin + 8.5, 18.4, { align: 'center' });
    }

    font(COLORS.white, 19, 'bold', 'times');
    doc.text('Nye Cyclea', margin + 22, 15.5);
    font(COLORS.white, 9.5);
    doc.text('Rapport de cycle', margin + 22, 21.5);

    font(COLORS.white, 8.5);
    doc.text(`Généré le ${longDate(now)}`, PAGE.width - margin, 14, { align: 'right' });
    if (input.username) {
      doc.text(`Compte : ${input.username}`, PAGE.width - margin, 19.5, { align: 'right' });
    }

    // --- Titre du cycle ---
    y = 43;
    font(COLORS.ink, 17, 'bold');
    doc.text(`Cycle du ${longDate(facts.start)}`, margin, y);

    const verdict = verdictOf(facts, pattern);
    font(COLORS.white, 8, 'bold');
    const pillWidth = doc.getTextWidth(verdict.label) + 7;
    fill(verdict.color);
    doc.roundedRect(PAGE.width - margin - pillWidth, y - 5, pillWidth, 7, 3.5, 3.5, 'F');
    doc.text(verdict.label, PAGE.width - margin - pillWidth / 2, y - 0.3, { align: 'center' });

    y += 6;
    font(COLORS.muted, 9.5);
    doc.text(
      facts.incomplete
        ? `À partir du ${longDate(facts.start)} · règles suivantes non enregistrées`
        : facts.nextStartEstimated
          ? `Du ${longDate(facts.start)} à aujourd'hui · prochaines règles attendues vers le ${shortDate(facts.nextStart)}`
          : `Du ${longDate(facts.start)} au ${longDate(addDays(facts.nextStart, -1))}`,
      margin,
      y
    );

    // --- Chiffres clés ---
    y += 6;
    const tiles = [
      {
        label: 'DURÉE DU CYCLE',
        value: facts.nextStartEstimated
          ? facts.currentDay
            ? `Jour ${facts.currentDay}`
            : '-'
          : `${facts.cycleLength} j`,
        sub: facts.incomplete
          ? 'non connue'
          : facts.nextStartEstimated
            ? 'cycle en cours'
            : `moyenne : ${pattern.averageLength} j`,
      },
      {
        label: 'DURÉE DES RÈGLES',
        value: `${facts.periodLength} j`,
        sub: facts.periodEndEstimated ? 'estimée' : `moyenne : ${pattern.averagePeriodLength} j`,
      },
      {
        label: 'OVULATION ESTIMÉE',
        value: shortDate(facts.ovulation),
        sub: `jour ${diffDays(facts.start, facts.ovulation) + 1} du cycle`,
      },
      {
        label: 'FENÊTRE FERTILE',
        value: `${shortDate(facts.fertileStart)} - ${shortDate(facts.fertileEnd)}`,
        sub: plural(FERTILE_DAYS_BEFORE + FERTILE_DAYS_AFTER + 1, 'jour'),
      },
    ];
    const tileGap = 4;
    const tileWidth = (CONTENT_WIDTH - tileGap * (tiles.length - 1)) / tiles.length;
    const tileHeight = 22;
    tiles.forEach((tile, i) => {
      const x = margin + i * (tileWidth + tileGap);
      fill(COLORS.primarySoft);
      stroke('#fbcfe8', 0.25);
      doc.roundedRect(x, y, tileWidth, tileHeight, 3, 3, 'FD');
      font(COLORS.muted, 6.5, 'bold');
      doc.text(tile.label, x + 4, y + 6.2);
      const valueSize = tile.value.length > 11 ? 10.5 : 14;
      font(COLORS.primaryDark, valueSize, 'bold');
      doc.text(tile.value, x + 4, y + 14);
      font(COLORS.muted, 7.5);
      doc.text(tile.sub, x + 4, y + 19.3);
    });
    y += tileHeight + 10;

    // --- Résumé rédigé ---
    sectionTitle('Résumé du cycle');
    font(COLORS.body, 10);
    buildSummary(target, facts, pattern).forEach((paragraph) => {
      const lines: string[] = doc.splitTextToSize(paragraph, CONTENT_WIDTH);
      ensureSpace(lines.length * 5 + 3);
      font(COLORS.body, 10);
      doc.text(lines, margin, y, { lineHeightFactor: 1.42 });
      y += lines.length * 5 + 2.5;
    });

    // --- Symptômes et notes ---
    const symptoms = target.symptoms?.filter(Boolean) ?? [];
    const notes = target.notes?.trim();
    if (symptoms.length || notes) {
      y += 3;
      sectionTitle('Symptômes et notes');
      if (symptoms.length) {
        let x = margin;
        symptoms.forEach((symptom) => {
          font(COLORS.primaryDark, 8.5, 'bold');
          const width = doc.getTextWidth(symptom) + 7;
          if (x + width > PAGE.width - margin) {
            x = margin;
            y += 8;
          }
          fill('#fce7f3');
          doc.roundedRect(x, y - 4.4, width, 6.6, 3.3, 3.3, 'F');
          doc.text(symptom, x + 3.5, y);
          x += width + 2.5;
        });
        y += 8;
      }
      if (notes) {
        const lines: string[] = doc.splitTextToSize(notes, CONTENT_WIDTH - 6);
        ensureSpace(lines.length * 4.8 + 4);
        fill(COLORS.line);
        doc.rect(margin, y - 3.2, 0.8, lines.length * 4.8 + 0.6, 'F');
        font(COLORS.muted, 9.5, 'italic');
        doc.text(lines, margin + 4, y, { lineHeightFactor: 1.4 });
        y += lines.length * 4.8 + 3;
      }
    }

    // --- Calendrier du cycle + repères ---
    y += 3;
    const firstDow = (facts.start.getDay() + 6) % 7; // lundi = 0
    const gridStart = addDays(facts.start, -firstDow);
    const weeks = Math.min(8, Math.ceil((diffDays(gridStart, facts.nextStart) + 1) / 7));
    const cellHeight = 7.6;
    ensureSpace(weeks * cellHeight + 30);
    sectionTitle('Calendrier du cycle');

    const gridWidth = 106;
    const cellWidth = gridWidth / 7;
    const calendarTop = y;
    font(COLORS.faint, 6.5, 'bold');
    ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].forEach((label, i) => {
      doc.text(label, margin + i * cellWidth + cellWidth / 2, y, { align: 'center' });
    });
    y += 2.5;
    for (let week = 0; week < weeks; week++) {
      for (let dow = 0; dow < 7; dow++) {
        const date = addDays(gridStart, week * 7 + dow);
        const kind = kindOfDay(date, facts);
        const style = DAY_STYLES[kind];
        const cx = margin + dow * cellWidth + 0.7;
        const cy = y + week * cellHeight + 0.7;
        const w = cellWidth - 1.4;
        const h = cellHeight - 1.4;
        fill(style.fill);
        if (style.border) {
          stroke(style.border, 0.45);
          doc.roundedRect(cx, cy, w, h, 1.6, 1.6, 'FD');
        } else {
          doc.roundedRect(cx, cy, w, h, 1.6, 1.6, 'F');
        }
        const showMonth = date.getDate() === 1 || sameDay(date, facts.start);
        font(style.text, 8, kind === 'outside' ? 'normal' : 'bold');
        doc.text(String(date.getDate()), cx + w / 2, cy + (showMonth ? 3.2 : 4.2), {
          align: 'center',
        });
        if (showMonth) {
          font(style.text, 5);
          doc.text(
            date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
            cx + w / 2,
            cy + 5.5,
            { align: 'center' }
          );
        }
      }
    }
    const calendarBottom = y + weeks * cellHeight;

    // Repères, à droite du calendrier
    const sideX = margin + gridWidth + 9;
    let sideY = calendarTop + 1;
    const milestones: { kind: DayKind; label: string; value: string }[] = [
      { kind: 'period', label: 'Début des règles', value: longDate(facts.start) },
      {
        kind: 'period',
        label: facts.periodEndEstimated ? 'Fin des règles (estimée)' : 'Fin des règles',
        value: longDate(facts.periodEnd),
      },
      {
        kind: 'fertile',
        label: 'Fenêtre fertile',
        value: `${shortDate(facts.fertileStart)} au ${shortDate(facts.fertileEnd)}`,
      },
      { kind: 'ovulation', label: 'Ovulation estimée', value: longDate(facts.ovulation) },
      {
        kind: 'next-period',
        label: facts.incomplete
          ? 'Règles suivantes (théoriques)'
          : facts.nextStartEstimated
            ? 'Règles suivantes (prévues)'
            : 'Règles suivantes',
        value: longDate(facts.nextStart),
      },
    ];
    milestones.forEach((item) => {
      const style = DAY_STYLES[item.kind];
      fill(style.fill);
      if (style.border) {
        stroke(style.border, 0.45);
        doc.roundedRect(sideX, sideY - 2.6, 3.6, 3.6, 1, 1, 'FD');
      } else {
        doc.roundedRect(sideX, sideY - 2.6, 3.6, 3.6, 1, 1, 'F');
      }
      font(COLORS.muted, 7.5);
      doc.text(item.label, sideX + 6, sideY);
      font(COLORS.ink, 9.5, 'bold');
      doc.text(item.value, sideX + 6, sideY + 4.6);
      sideY += 10.6;
    });
    y = Math.max(calendarBottom, sideY - 5) + 6;

    // --- Suivi global ---
    const recent = pattern.lengths.slice(-8);
    ensureSpace(recent.length >= 2 ? 47 : 18);
    sectionTitle('Ce cycle dans ton suivi');

    if (recent.length >= 2) {
      // Graphique : longueur des derniers cycles, celui du rapport mis en avant
      const chartX = margin;
      const chartWidth = 104;
      const chartHeight = 25;
      const chartTop = y + 1;
      const maxLength = Math.max(...recent, pattern.averageLength) + 4;
      const barGap = 3;
      const barWidth = Math.min(11, (chartWidth - barGap * (recent.length - 1)) / recent.length);
      const offset = sorted.length - 1 - recent.length; // index du cycle de la première barre
      const targetIndex = sorted.findIndex((c) => c.id === target.id);

      const averageY = chartTop + chartHeight - (pattern.averageLength / maxLength) * chartHeight;
      // Ligne de moyenne tracée avant les barres : elle passe derrière
      const chartRight = chartX + recent.length * (barWidth + barGap) - barGap;
      stroke(COLORS.accent, 0.35);
      doc.setLineDashPattern([1.4, 1.2], 0);
      doc.line(chartX, averageY, chartRight + 2, averageY);
      doc.setLineDashPattern([], 0);
      font(COLORS.accent, 6.5, 'bold');
      doc.text(`moyenne ${pattern.averageLength} j`, chartRight + 3.5, averageY + 0.9);
      recent.forEach((length, i) => {
        const height = (length / maxLength) * chartHeight;
        const x = chartX + i * (barWidth + barGap);
        const isTarget = offset + i === targetIndex;
        fill(isTarget ? COLORS.primary : '#f9a8d4');
        doc.roundedRect(x, chartTop + chartHeight - height, barWidth, height, 1.4, 1.4, 'F');
        // Valeur écrite dans la barre : elle ne chevauche jamais la ligne de moyenne
        font(isTarget ? COLORS.white : COLORS.primaryDark, 7.5, 'bold');
        doc.text(String(length), x + barWidth / 2, chartTop + chartHeight - height + 4.2, {
          align: 'center',
        });
        const cycleStart = sorted[offset + i];
        if (cycleStart) {
          font(COLORS.faint, 6);
          doc.text(
            shortDate(parseDay(cycleStart.startDate)),
            x + barWidth / 2,
            chartTop + chartHeight + 3.6,
            {
              align: 'center',
            }
          );
        }
      });
      font(COLORS.faint, 6.5);
      const targetHasBar = targetIndex >= offset && targetIndex < offset + recent.length;
      doc.text(
        targetHasBar
          ? 'Longueur des derniers cycles, en jours (ce cycle en foncé)'
          : 'Longueur des derniers cycles terminés, en jours',
        chartX,
        chartTop + chartHeight + 8.5
      );

      // Chiffres du suivi, à droite
      const statsX = sideX;
      let statsY = y + 1;
      const stats: [string, string][] = [
        ['Cycle moyen', `${pattern.averageLength} jours (${pattern.cycleCount} cycles mesurés)`],
        [
          'Du plus court au plus long',
          `${pattern.shortestLength} à ${pattern.longestLength} jours`,
        ],
        ['Score de régularité', `${pattern.regularityScore}/100`],
        ["Taux d'irrégularité", `${pattern.irregularityRate} %`],
      ];
      stats.forEach(([label, value]) => {
        font(COLORS.muted, 7.5);
        doc.text(label, statsX, statsY);
        font(COLORS.ink, 9.5, 'bold');
        doc.text(value, statsX, statsY + 4.4);
        statsY += 9.4;
      });
      y = Math.max(chartTop + chartHeight + 11, statsY - 3) + 1;

      if (analysis.isIrregular) {
        const text =
          analysis.severity === 'high'
            ? 'Cycles nettement irréguliers : prédictions moins fiables, avis médical conseillé si cela dure.'
            : 'Irrégularité modérée de tes cycles : les prédictions restent indicatives.';
        const lines: string[] = doc.splitTextToSize(text, CONTENT_WIDTH - 10);
        const boxHeight = lines.length * 4.6 + 5;
        ensureSpace(boxHeight);
        fill('#fff7ed');
        stroke('#fed7aa', 0.25);
        doc.roundedRect(margin, y, CONTENT_WIDTH, boxHeight, 2.5, 2.5, 'FD');
        font('#9a3412', 8.8);
        doc.text(lines, margin + 5, y + 5.6, { lineHeightFactor: 1.35 });
        y += boxHeight + 4;
      }
    } else {
      font(COLORS.muted, 9.5, 'italic');
      doc.text(
        'Enregistre au moins trois débuts de règles pour comparer ce cycle aux précédents.',
        margin,
        y + 2
      );
      y += 10;
    }

    // --- Pied de page sur chaque page ---
    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);
      stroke(COLORS.line, 0.25);
      doc.line(margin, PAGE.height - 14, PAGE.width - margin, PAGE.height - 14);
      font(COLORS.faint, 7.5);
      doc.text(
        'Nye Cyclea - document personnel. Informations éducatives : ne remplace pas un avis médical.',
        margin,
        PAGE.height - 9
      );
      doc.text(`Page ${page}/${pageCount}`, PAGE.width - margin, PAGE.height - 9, {
        align: 'right',
      });
    }

    return doc;
  }
}
