import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Heart, Sparkles, Plus } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { PredictionService } from '../services/predictionService';
import { CycleEntry, Prediction } from '../types';
import { CalendarLegend } from './CalendarLegend';

interface CalendarProps {
  onAddCycle: () => void;
}

export function Calendar({ onAddCycle }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedCycles = StorageService.getCycles();
    setCycles(loadedCycles);

    if (loadedCycles.length > 0) {
      const futurePredictions = PredictionService.predictNext6Months(loadedCycles);
      setPredictions(futurePredictions);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7 for European week (Monday = 1)
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getDayType = (
    day: number
  ): {
    type: 'period' | 'fertile' | 'ovulation' | 'predicted-period' | 'safe' | 'normal';
    label: string;
  } => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const checkDate = new Date(year, month, day);
    checkDate.setHours(0, 0, 0, 0);

    // Check actual recorded cycles
    for (const cycle of cycles) {
      const start = PredictionService.parseISOLocal(cycle.startDate);
      start.setHours(0, 0, 0, 0);

      if (cycle.endDate) {
        const end = PredictionService.parseISOLocal(cycle.endDate);
        end.setHours(0, 0, 0, 0);
        if (checkDate >= start && checkDate <= end) {
          return { type: 'period', label: 'Règles' };
        }
      } else {
        const stats = PredictionService.calculateUserStats(cycles);
        const estimatedEnd = new Date(start);
        estimatedEnd.setDate(estimatedEnd.getDate() + (stats.averagePeriodLength - 1));
        if (checkDate >= start && checkDate <= estimatedEnd) {
          return { type: 'period', label: 'Règles' };
        }
      }
    }

    // Check predictions
    for (const prediction of predictions) {
      const pStart = PredictionService.parseISOLocal(prediction.predictedStart);
      pStart.setHours(0, 0, 0, 0);
      const pEnd = PredictionService.parseISOLocal(prediction.predictedEnd);
      pEnd.setHours(0, 0, 0, 0);

      // Central Prediction (The most likely days)
      if (checkDate >= pStart && checkDate <= pEnd) {
        return { type: 'predicted-period', label: 'Règles prévues' };
      }

      if (prediction.predictedStartRange) {
        // Uncertainty window — no distinct styling, used by logic only
      }

      // Ovulation: prefer window if available
      if (prediction.ovulationWindow) {
        const ovStart = PredictionService.parseISOLocal(prediction.ovulationWindow[0]);
        ovStart.setHours(0, 0, 0, 0);
        const ovEnd = PredictionService.parseISOLocal(prediction.ovulationWindow[1]);
        ovEnd.setHours(0, 0, 0, 0);
        if (checkDate >= ovStart && checkDate <= ovEnd) {
          return { type: 'ovulation', label: 'Ovulation' };
        }
      } else {
        const ovulation = PredictionService.parseISOLocal(prediction.ovulationDate);
        ovulation.setHours(0, 0, 0, 0);
        if (checkDate.getTime() === ovulation.getTime()) {
          return { type: 'ovulation', label: 'Ovulation' };
        }
      }

      const fertileStart = PredictionService.parseISOLocal(prediction.fertileWindow[0]);
      fertileStart.setHours(0, 0, 0, 0);
      const fertileEnd = PredictionService.parseISOLocal(prediction.fertileWindow[1]);
      fertileEnd.setHours(0, 0, 0, 0);

      if (checkDate >= fertileStart && checkDate <= fertileEnd) {
        return { type: 'fertile', label: 'Fenêtre fertile' };
      }
    }

    return { type: 'safe', label: 'Jour sûr' };
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const renderDayContent = (day: number, type: string) => {
    switch (type) {
      case 'period':
        return <Droplets className="w-3 h-3 mt-1" />;
      case 'predicted-period':
        return <Droplets className="w-3 h-3 mt-1 opacity-40" />;
      case 'ovulation':
        return <Sparkles className="w-3 h-3 mt-1" />;
      case 'fertile':
        return <Heart className="w-3 h-3 mt-1" />;
      case 'safe':
        return <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2" />;
      default:
        return null;
    }
  };

  const getDayClass = (type: string) => {
    switch (type) {
      case 'period':
        return 'cal-day-period';
      case 'predicted-period':
        return 'cal-day-predicted';
      case 'ovulation':
        return 'cal-day-ovulation';
      case 'fertile':
        return 'cal-day-fertile';
      case 'safe':
        return 'cal-day-safe';
      default:
        return 'cal-day-base';
    }
  };

  const monthName = currentDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayInfo = getDayType(day);
    const today = isToday(day);
    const customClass = getDayClass(dayInfo.type);

    days.push(
      <button
        key={day}
        onClick={() =>
          setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
        }
        className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ${customClass} ${today ? 'cal-day-today' : 'hover:opacity-80'}`}
      >
        <span className="text-sm font-bold">{day}</span>
        {renderDayContent(day, dayInfo.type)}
      </button>
    );
  }

  return (
    <div className="space-y-8 pb-24 max-w-lg mx-auto">
      {/* Elegant Header */}
      <div className="flex items-center justify-between px-4 pt-2">
        <button
          onClick={previousMonth}
          className="p-3 rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 transition-all font-bold"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 capitalize tracking-tight">
            {monthName}
          </h2>
          <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mt-1">
            Votre Cycle
          </p>
        </div>
        <button
          onClick={nextMonth}
          className="p-3 rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 transition-all font-bold"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5" />
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
          <div className="grid grid-cols-7 gap-2 sm:gap-3">{days}</div>
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
