import jsPDF from 'jspdf';
import { CycleEntry } from '../types';
import { StorageService } from './storageService';
import { PredictionService } from './predictionService';
import { toast } from 'sonner';

export class PDFService {
  /**
   * Generates a professional editorial-style report from scratch.
   * Completely reconstructed for premium quality.
   */
  static generateCyclePDF(targetCycle?: CycleEntry): void {
    try {
      const cycles = StorageService.getCycles();
      const stats = PredictionService.calculateUserStats(cycles);
      const prediction = cycles.length > 0 ? PredictionService.predictNextCycle(cycles) : null;

      // --- THEME DEFINITION ---
      const theme = {
        primary: '#db2777', // pink-600 (Nye Cyclea Brand)
        slate: '#1e293b', // slate-800 (Pure dark)
        muted: '#64748b', // slate-500 (Subtle)
        border: '#f1f5f9', // slate-100 (Thin lines)
        phases: {
          period: '#fb7185', // rose-400
          follicular: '#a78bfa', // violet-400
          ovulation: '#34d399', // emerald-400
          luteal: '#22c55e', // green-500
        },
      };

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let curY = 30;

      // --- INTERNAL HELPERS ---
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
      };

      const useSerif = (
        size: number,
        color = theme.slate,
        style: 'normal' | 'bold' | 'italic' = 'normal'
      ) => {
        doc.setFont('times', style);
        doc.setFontSize(size);
        const rgb = hexToRgb(color);
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
      };

      const useSans = (size: number, color = theme.slate, style: 'normal' | 'bold' = 'normal') => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        const rgb = hexToRgb(color);
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
      };

      const drawLine = (y: number, color = theme.border, width = 0.2) => {
        const rgb = hexToRgb(color);
        doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        doc.setLineWidth(width);
        doc.line(margin, y, pageWidth - margin, y);
      };

      const formatDate = (date: string | Date | undefined) => {
        if (!date) {
          return '-';
        }
        return new Date(date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      };

      // --- 1. HEADER (EDITORIAL STYLE) ---
      try {
        doc.addImage('/icons/pwa-192x192.png', 'PNG', margin, 12, 12, 12);
      } catch (e) {}

      useSerif(22, theme.primary, 'bold');
      doc.text('Nye Cyclea', margin + 16, 21);

      useSans(7, theme.muted, 'normal');
      doc.text('RAPPORT DE BIEN-ÊTRE FÉMININ', margin + 16, 26);

      useSerif(9, theme.muted, 'italic');
      const today = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.text(`Édition du ${today}`, pageWidth - margin, 21, {
        align: 'right',
      });

      drawLine(32, theme.primary, 0.5);
      curY = 55;

      // --- 2. TITRE PRINCIPAL ---
      useSerif(20, theme.slate, 'bold');
      const title = targetCycle
        ? `ANALYSE DU CYCLE : ${formatDate(targetCycle.startDate)}`
        : 'SYNTHÈSE GLOBALE DES CYCLES';
      doc.text(title.toUpperCase(), margin, curY);
      curY += 18;

      // --- 3. SECTION I: INDICATEURS ---
      useSerif(11, theme.primary, 'bold');
      doc.text('I. INDICATEURS DE SANTÉ', margin, curY);
      curY += 5;
      drawLine(curY, theme.slate, 0.1);
      curY += 12;

      const colW = (pageWidth - margin * 2) / 3;

      useSerif(8, theme.muted, 'italic');
      doc.text('Moyenne du Cycle', margin, curY);
      doc.text('Moyenne des Règles', margin + colW, curY);
      doc.text('Nombre de Cycles', margin + colW * 2, curY);

      curY += 8;
      useSans(15, theme.slate, 'bold');
      doc.text(`${stats.averageCycleLength} j`, margin, curY);
      doc.text(`${stats.averagePeriodLength} j`, margin + colW, curY);
      doc.text(`${cycles.length}`, margin + colW * 2, curY);

      curY += 28;

      // --- 4. SECTION II: CALENDRIER ÉTAPES CLÉS ---
      useSerif(11, theme.primary, 'bold');
      doc.text('II. CALENDRIER ET ÉTAPES CLÉS', margin, curY);
      curY += 5;
      drawLine(curY, theme.slate, 0.1);
      curY += 12;

      // Date Calculations
      let dStart = '-';
      let dEnd = '-';
      let dOvulation = '-';
      let dNext = '-';

      if (targetCycle) {
        dStart = formatDate(targetCycle.startDate);
        dEnd = targetCycle.endDate
          ? formatDate(targetCycle.endDate)
          : `${formatDate(new Date(new Date(targetCycle.startDate).getTime() + (stats.averagePeriodLength - 1) * 86400000))} (Est.)`;

        const sorted = [...cycles].sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        const idx = sorted.findIndex((c) => c.id === targetCycle.id);
        const next = idx !== -1 ? sorted[idx + 1] : null;

        if (next) {
          dOvulation = formatDate(new Date(new Date(next.startDate).getTime() - 14 * 86400000));
          dNext = formatDate(next.startDate);
        } else if (prediction) {
          dOvulation = formatDate(prediction.ovulationDate);
          dNext = formatDate(prediction.predictedStart);
        }
      } else if (cycles.length > 0) {
        const last = [...cycles].sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )[0];
        dStart = formatDate(last.startDate);
        dEnd = last.endDate ? formatDate(last.endDate) : 'En cours';
        if (prediction) {
          dOvulation = formatDate(prediction.ovulationDate);
          dNext = formatDate(prediction.predictedStart);
        }
      }

      const milestones = [
        { label: 'DÉBUT DES RÈGLES', date: dStart, color: theme.phases.period },
        { label: 'FIN DES RÈGLES', date: dEnd, color: theme.phases.period },
        {
          label: "JOUR D'OVULATION",
          date: dOvulation,
          color: theme.phases.ovulation,
        },
        { label: 'PROCHAINES RÈGLES', date: dNext, color: theme.phases.period },
      ];

      milestones.forEach((m, i) => {
        const rgb = hexToRgb(m.color);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.circle(margin + 2, curY - 1, 1.5, 'F');
        if (i < milestones.length - 1) {
          doc.setDrawColor(theme.border);
          doc.line(margin + 2, curY + 1, margin + 2, curY + 14);
        }
        useSerif(9, theme.muted, 'italic');
        doc.text(m.label, margin + 8, curY);
        useSans(11, theme.slate, 'bold');
        doc.text(m.date.toUpperCase(), margin + 65, curY);
        curY += 15;
      });

      curY += 10;

      // --- 5. SECTION III: NOTES ---
      if (targetCycle && targetCycle.notes) {
        if (curY > pageHeight - 40) {
          doc.addPage();
          curY = 30;
        }
        useSerif(11, theme.primary, 'bold');
        doc.text('III. OBSERVATIONS ET NOTES', margin, curY);
        curY += 5;
        drawLine(curY, theme.slate, 0.1);
        curY += 12;

        useSerif(10, theme.slate, 'normal');
        const notes = doc.splitTextToSize(targetCycle.notes, pageWidth - margin * 2);
        doc.text(notes, margin, curY);
        curY += notes.length * 6 + 20;
      }

      // --- 6. LÉGENDE ---
      if (curY > pageHeight - 50) {
        doc.addPage();
        curY = 30;
      }

      const legendY = pageHeight - 40;
      drawLine(legendY, theme.border, 0.1);

      useSerif(9, theme.muted, 'bold');
      doc.text('LÉGENDE DES PHASES', margin, legendY + 10);

      const items = [
        { label: 'Règles', color: theme.phases.period },
        { label: 'Folliculaire', color: theme.phases.follicular },
        { label: 'Ovulation', color: theme.phases.ovulation },
        { label: 'Lutéale', color: theme.phases.luteal },
      ];

      let lx = margin;
      items.forEach((p) => {
        const rgb = hexToRgb(p.color);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.rect(lx, legendY + 16, 3, 3, 'F');
        useSerif(9, theme.slate, 'normal');
        doc.text(p.label, lx + 6, legendY + 18.5);
        lx += (pageWidth - margin * 2) / 4;
      });

      // --- FOOTER ---
      useSans(7, theme.muted, 'normal');
      doc.text(
        'Nye Cyclea | Document de suivi personnel et confidentiel.',
        margin,
        pageHeight - 10
      );
      doc.text(`PAGE 1 SUR 1`, pageWidth - margin, pageHeight - 10, {
        align: 'right',
      });

      // FINAL SAVE
      const finalName = targetCycle
        ? `Nye-Cyclea-${targetCycle.startDate.split('T')[0]}.pdf`
        : `Nye-Cyclea-Complet.pdf`;
      doc.save(finalName);
    } catch (error) {
      console.error('Fatal PDF Error:', error);
      toast.error('Impossible de générer le PDF. Veuillez réessayer.');
    }
  }
}
