import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Heart, Sparkles, Plus } from 'lucide-react';
import { PredictionService } from '../services/predictionService';
import { useCyclesContext } from '../contexts/CyclesContext';
import { CalendarLegend } from './CalendarLegend';

interface CalendarProps {
  onAddCycle: () => void;
}

export function Calendar({ onAddCycle }: CalendarProps) {
  const { cycles, predictions, loading } = useCyclesContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthInfo = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7 for European week (Monday = 1)
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

    const monthName = currentDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

    return { daysInMonth, firstDayIndex, monthName };
  }, [currentDate]);

  const daysGrid = useMemo(() => {
    const { daysInMonth, firstDayIndex } = monthInfo;
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty slots for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayInfo = PredictionService.getDayInfo(date, cycles, predictions);
      const isToday =
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

      days.push({
        day,
        date,
        isToday,
        ...dayInfo,
        key: `day-${day}`,
      });
    }

    return days;
  }, [currentDate, cycles, predictions, monthInfo]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const renderDayContent = (type: string) => {
    switch (type) {
      case 'period':
        return <Droplets className="w-3 h-3 mt-1 text-white" />;
      case 'predicted-period':
        return <Droplets className="w-3 h-3 mt-1 opacity-40" />;
      case 'ovulation':
        return <Sparkles className="w-3 h-3 mt-1 text-white" />;
      case 'fertile':
        return <Heart className="w-3 h-3 mt-1 text-rose-500" />;
      case 'safe':
        return <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2" />;
      default:
        return null;
    }
  };

  const getDayClass = (type: string, isToday: boolean) => {
    let baseClass =
      'aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ';

    switch (type) {
      case 'period':
        baseClass += 'cal-day-period';
        break;
      case 'predicted-period':
        baseClass += 'cal-day-predicted';
        break;
      case 'ovulation':
        baseClass += 'cal-day-ovulation';
        break;
      case 'fertile':
        baseClass += 'cal-day-fertile';
        break;
      case 'safe':
        baseClass += 'cal-day-safe';
        break;
      default:
        baseClass += 'cal-day-base';
    }

    if (isToday) baseClass += ' cal-day-today';
    else baseClass += ' hover:opacity-80';

    return baseClass;
  };

  if (loading && cycles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 max-w-lg mx-auto">
      {/* Elegant Header */}
      <div className="flex items-center justify-between px-4 pt-2">
        <button
          onClick={previousMonth}
          className="p-3 rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 transition-all font-bold"
          aria-label="Passer au mois précédent"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 capitalize tracking-tight" aria-live="polite">
            {monthInfo.monthName}
          </h2>
          <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mt-1">
            Votre Cycle
          </p>
        </div>
        <button
          onClick={nextMonth}
          className="p-3 rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 transition-all font-bold"
          aria-label="Passer au mois suivant"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Unified Main Card */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-rose-100/60 overflow-hidden border border-white">
        {/* Calendar Section */}
        <div className="p-6 pb-2">
          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-black text-gray-300 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {daysGrid.map((dayObj) => {
              if (dayObj.type === 'empty') {
                return <div key={dayObj.key} className="aspect-square" />;
              }

              return (
                <button
                  key={dayObj.key}
                  onClick={() => setSelectedDate(dayObj.date || null)}
                  className={getDayClass(dayObj.type, !!dayObj.isToday)}
                  aria-label={`Jour ${dayObj.day} du mois, ${dayObj.label}`}
                >
                  <span className={`text-sm font-bold ${['period', 'ovulation'].includes(dayObj.type) ? 'text-white' : ''}`}>
                    {dayObj.day}
                  </span>
                  {renderDayContent(dayObj.type)}
                </button>
              );

            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-rose-100 to-transparent mx-8 my-4" />

        <CalendarLegend />
      </div>

      {/* Separated CTA */}
      <div className="flex justify-center pt-6 px-4">
        <button
          onClick={onAddCycle}
          aria-label="Ajouter un nouveau cycle"
          className="group relative w-full max-w-xs flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border border-pink-100 shadow-xl shadow-pink-100/50 hover:shadow-2xl hover:shadow-pink-200/50 hover:-translate-y-1 active:scale-95 transition-all duration-300 overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-rose-50 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center gap-3">
            <div className="bg-pink-100 rounded-xl p-2 group-hover:rotate-90 transition-transform duration-500">
              <Plus className="w-5 h-5 text-pink-600" strokeWidth={3} />
            </div>
            <span className="text-base font-black text-pink-600 tracking-tight">
              Ajouter un cycle
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
