import { Droplets, Heart, Sparkles } from 'lucide-react';

interface LegendItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    borderClass?: string;
}

function LegendItem({ icon, title, description, borderClass = 'border' }: LegendItemProps) {
    return (
        <div className="flex gap-4 items-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${borderClass}`}>
                {icon}
            </div>
            <div>
                <p className="font-bold text-gray-800 text-sm">{title}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{description}</p>
            </div>
        </div>
    );
}

export function CalendarLegend() {
    return (
        <div className="p-8 pt-2 bg-gradient-to-b from-white to-rose-50/30">
            <h3 className="text-gray-800 font-bold mb-6 text-lg text-center">
                Comprendre votre cycle
            </h3>
            <div className="space-y-4">
                <LegendItem
                    icon={<Droplets className="w-5 h-5" />}
                    title="Menstruation"
                    description="Jours de règles (rouge)."
                    borderClass="border cal-day-period shadow-sm"
                />
                <LegendItem
                    icon={<Droplets className="w-5 h-5 opacity-80" />}
                    title="Règles Prévues"
                    description="Date estimée du prochain cycle."
                    borderClass="border-2 border-dashed cal-day-predicted"
                />
                <LegendItem
                    icon={<Sparkles className="w-5 h-5" />}
                    title="Ovulation"
                    description="Pic de fertilité (vert)."
                    borderClass="border cal-day-ovulation shadow-sm"
                />
                <LegendItem
                    icon={<Heart className="w-5 h-5" />}
                    title="Fenêtre Fertile"
                    description="Période où la conception est possible."
                    borderClass="border cal-day-fertile"
                />
                <LegendItem
                    icon={<div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                    title="Jours Sûrs"
                    description="Faible probabilité."
                    borderClass="border cal-day-safe"
                />
            </div>
        </div>
    );
}
