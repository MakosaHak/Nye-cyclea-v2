import jsPDF from 'jspdf';
import { CycleEntry, Prediction } from '../types';
import { StorageService } from './storageService';
import { PredictionService } from './predictionService';
import { toast } from 'sonner';

type DayType = ReturnType<typeof PredictionService.getDayInfo>['type'];

const DAY_STYLES: Record<
  DayType,
  { fill: string; text: string; border?: string }
> = {
  period: { fill: '#fb7185', text: '#ffffff' },
  'predicted-period': { fill: '#ffe4e6', text: '#9d174d', border: '#fda4af' },
  ovulation: { fill: '#a78bfa', text: '#ffffff' },
  fertile: { fill: '#fce7f3', text: '#9d174d' },
  safe: { fill: '#ecfdf5', text: '#047857' },
  normal: { fill: '#f8fafc', text: '#64748b' },
};

export class PDFService {
  static generateCyclePDF(targetCycle?: CycleEntry): void {
    try {
      const cycles = StorageService.getCycles();
      const stats = PredictionService.calculateUserStats(cycles);
      const predictions =
        cycles.length > 0 ? PredictionService.predictNext6Months(cycles) : [];
      const nextPrediction =
        cycles.length > 0 ? PredictionService.predictNextCycle(cycles) : null;

      const calendarDate = targetCycle
        ? new Date(targetCycle.startDate)
        : new Date();

      const theme = {
        primary: '#db2777',
        slate: '#1e293b',
        muted: '#64748b',
        border: '#e2e8f0',
      };

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 16;
      let curY = 22;

      const hexToRgb = (hex: string) => ({
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
      });

      const setFill = (hex: string) => {
        const { r, g, b } = hexToRgb(hex);
        doc.setFillColor(r, g, b);
      };

      const setDraw = (hex: string, width = 0.15) => {
        const { r, g, b } = hexToRgb(hex);
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(width);
      };

      const setText = (
        hex: string,
        size: number,
        font: 'helvetica' | 'times' = 'helvetica',
        style: 'normal' | 'bold' | 'italic' = 'normal'
      ) => {
        doc.setFont(font, style);
        doc.setFontSize(size);
        const { r, g, b } = hexToRgb(hex);
        doc.setTextColor(r, g, b);
      };

      const formatDate = (date: string | Date | undefined) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      };

      const formatShort = (date: Date) =>
        date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

      const drawLine = (y: number, color = theme.border, width = 0.2) => {
        setDraw(color, width);
        doc.line(margin, y, pageWidth - margin, y);
      };

      const ensureSpace = (needed: number) => {
        if (curY + needed > pageHeight - 18) {
          doc.addPage();
          curY = 22;
        }
      };

      try {
        doc.addImage('/icons/pwa-192x192.png', 'PNG', margin, 10, 11, 11);
      } catch {
        /* logo optionnel */
      }

      setText(theme.primary, 16, 'times', 'bold');
      doc.text('Nye Cyclea', margin + 14, 17);
      setText(theme.muted, 7, 'helvetica');
      doc.text('RAPPORT DE CYCLE', margin + 14, 21);

      const editionDate = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      setText(theme.muted, 8, 'times', 'italic');
      doc.text(`Généré le ${editionDate}`, pageWidth - margin, 17, { align: 'right' });

      drawLine(26, theme.primary, 0.35);
      curY = 38;

      setText(theme.slate, 14, 'times', 'bold');
      const title = targetCycle
        ? `Cycle du ${formatDate(targetCycle.startDate)}`
        : 'Synthèse de ton suivi';
      doc.text(title, margin, curY);
      curY += 10;

      setText(theme.primary, 10, 'helvetica', 'bold');
      doc.text('Résumé général', margin, curY);
      curY += 6;
      drawLine(curY);
      curY += 8;

      const summaryLines: string[] = [
        `• Durée moyenne du cycle : ${stats.averageCycleLength} jours`,
        `• Durée moyenne des règles : ${stats.averagePeriodLength} jours`,
        `• Cycles enregistrés : ${cycles.length}`,
      ];

      if (nextPrediction) {
        summaryLines.push(
          `• Prochaines règles prévues : ${formatDate(nextPrediction.predictedStart)}`,
          `• Ovulation estimée : ${formatDate(nextPrediction.ovulationDate)}`
        );
      }

      if (targetCycle) {
        const endLabel = targetCycle.endDate
          ? formatDate(targetCycle.endDate)
          : `~${stats.averagePeriodLength} j (estimée)`;
        summaryLines.push(
          `• Période analysée : ${formatDate(targetCycle.startDate)} → ${endLabel}`
        );
      }

      setText(theme.slate, 9, 'helvetica');
      summaryLines.forEach((line) => {
        ensureSpace(6);
        doc.text(line, margin + 2, curY);
        curY += 5.5;
      });
      curY += 6;

      const monthLabel = calendarDate.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });

      setText(theme.primary, 10, 'helvetica', 'bold');
      doc.text(
        `Calendrier — ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`,
        margin,
        curY
      );
      curY += 6;
      drawLine(curY);
      curY += 8;

      curY = PDFService.drawMonthCalendar(
        doc,
        calendarDate,
        cycles,
        predictions,
        margin,
        pageWidth - margin,
        curY,
        setFill,
        setDraw,
        setText
      );
      curY += 10;

      ensureSpace(40);
      setText(theme.primary, 10, 'helvetica', 'bold');
      doc.text('Étapes repérées ce mois-ci', margin, curY);
      curY += 6;
      drawLine(curY);
      curY += 8;

      const monthEvents = PDFService.collectMonthEvents(calendarDate, cycles, predictions);
      if (monthEvents.length === 0) {
        setText(theme.muted, 9, 'helvetica', 'italic');
        doc.text('Aucune étape marquée pour ce mois.', margin, curY);
        curY += 8;
      } else {
        monthEvents.slice(0, 14).forEach((ev) => {
          ensureSpace(7);
          const style = DAY_STYLES[ev.type];
          setFill(style.fill);
          doc.circle(margin + 2, curY - 1.2, 1.8, 'F');
          setText(theme.muted, 8, 'helvetica', 'bold');
          doc.text(formatShort(ev.date).toUpperCase(), margin + 7, curY);
          setText(theme.slate, 9, 'helvetica');
          doc.text(ev.label, margin + 32, curY);
          curY += 6;
        });
        if (monthEvents.length > 14) {
          setText(theme.muted, 8, 'helvetica', 'italic');
          doc.text(`… et ${monthEvents.length - 14} autre(s) jour(s)`, margin, curY);
          curY += 6;
        }
      }
      curY += 6;

      if (targetCycle?.notes?.trim()) {
        ensureSpace(30);
        setText(theme.primary, 10, 'helvetica', 'bold');
        doc.text('Notes', margin, curY);
        curY += 6;
        drawLine(curY);
        curY += 8;
        setText(theme.slate, 9, 'times', 'normal');
        const notes = doc.splitTextToSize(targetCycle.notes.trim(), pageWidth - margin * 2);
        notes.forEach((line: string) => {
          ensureSpace(5);
          doc.text(line, margin, curY);
          curY += 5;
        });
        curY += 4;
      }

      const legendY = Math.min(curY + 4, pageHeight - 28);
      drawLine(legendY, theme.border);
      setText(theme.muted, 8, 'helvetica', 'bold');
      doc.text('Légende', margin, legendY + 6);

      const legendItems: { label: string; type: DayType }[] = [
        { label: 'Règles', type: 'period' },
        { label: 'Règles prévues', type: 'predicted-period' },
        { label: 'Ovulation', type: 'ovulation' },
        { label: 'Fenêtre fertile', type: 'fertile' },
        { label: 'Phase calme', type: 'safe' },
      ];

      let lx = margin;
      legendItems.forEach((item) => {
        const style = DAY_STYLES[item.type];
        setFill(style.fill);
        doc.roundedRect(lx, legendY + 9, 3.5, 3.5, 0.6, 0.6, 'F');
        setText(theme.slate, 7.5, 'helvetica');
        doc.text(item.label, lx + 5, legendY + 11.8);
        lx += 36;
      });

      setText(theme.muted, 7, 'helvetica');
      doc.text(
        'Nye Cyclea — document personnel. Ne remplace pas un avis médical.',
        margin,
        pageHeight - 8
      );

      const fileName = targetCycle
        ? `Nye-Cyclea-${targetCycle.startDate.split('T')[0]}.pdf`
        : `Nye-Cyclea-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Fatal PDF Error:', error);
      toast.error('Impossible de générer le PDF. Veuillez réessayer.');
    }
  }

  private static drawMonthCalendar(
    doc: jsPDF,
    monthDate: Date,
    cycles: CycleEntry[],
    predictions: Prediction[],
    x0: number,
    x1: number,
    startY: number,
    setFill: (hex: string) => void,
    setDraw: (hex: string, width?: number) => void,
    setText: (
      hex: string,
      size: number,
      font?: 'helvetica' | 'times',
      style?: 'normal' | 'bold' | 'italic'
    ) => void
  ): number {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

    const gridW = x1 - x0;
    const cellW = gridW / 7;
    const cellH = 13;
    let y = startY;

    const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    setText('#94a3b8', 7, 'helvetica', 'bold');
    weekdays.forEach((label, i) => {
      const cx = x0 + i * cellW + cellW / 2;
      doc.text(label, cx, y, { align: 'center' });
    });
    y += 5;

    setDraw('#f1f5f9', 0.2);
    setFill('#fafafa');
    doc.roundedRect(x0, y, gridW, cellH * 6 + 4, 2, 2, 'FD');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dayNum = 1;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const cellIndex = row * 7 + col;
        if (cellIndex < firstDayIndex || dayNum > daysInMonth) continue;

        const date = new Date(year, month, dayNum);
        date.setHours(0, 0, 0, 0);
        const { type } = PredictionService.getDayInfo(date, cycles, predictions);
        const style = DAY_STYLES[type];

        const px = x0 + col * cellW + 1.2;
        const py = y + row * cellH + 2;

        setFill(style.fill);
        if (style.border) {
          setDraw(style.border, 0.25);
          doc.roundedRect(px, py, cellW - 2.4, cellH - 1.5, 1.2, 1.2, 'FD');
        } else {
          doc.roundedRect(px, py, cellW - 2.4, cellH - 1.5, 1.2, 1.2, 'F');
        }

        const isToday = date.getTime() === today.getTime();
        setText(isToday ? '#db2777' : style.text, 8, 'helvetica', isToday ? 'bold' : 'normal');
        doc.text(String(dayNum), px + (cellW - 2.4) / 2, py + 5.5, { align: 'center' });

        if (isToday) {
          setDraw('#db2777', 0.35);
          doc.roundedRect(px, py, cellW - 2.4, cellH - 1.5, 1.2, 1.2, 'S');
        }

        dayNum += 1;
      }
    }

    return y + cellH * 6 + 8;
  }

  private static collectMonthEvents(
    monthDate: Date,
    cycles: CycleEntry[],
    predictions: Prediction[]
  ): { date: Date; type: DayType; label: string }[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const events: { date: Date; type: DayType; label: string }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const info = PredictionService.getDayInfo(date, cycles, predictions);
      if (info.type === 'normal' || info.type === 'safe') continue;
      events.push({ date, type: info.type, label: info.label });
    }

    return events;
  }
}
