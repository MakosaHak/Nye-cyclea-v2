import { Calendar } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsCycleSectionProps {
    settings: UserSettings;
    onSettingChange: (key: keyof UserSettings, value: number) => void;
}

export function SettingsCycleSection({ settings, onSettingChange }: SettingsCycleSectionProps) {
    return (
        <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-gray-700 mb-3 flex items-center gap-2 font-semibold">
                <Calendar className="w-5 h-5 text-purple-600" />
                Paramètres du cycle
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-700 mb-2">
                        Durée par défaut du cycle (jours)
                    </label>
                    <input
                        type="number"
                        min="21"
                        max="35"
                        value={settings.defaultCycleLength}
                        onChange={(e) => onSettingChange('defaultCycleLength', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-700 mb-2">
                        Durée par défaut des règles (jours)
                    </label>
                    <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.defaultPeriodLength}
                        onChange={(e) => onSettingChange('defaultPeriodLength', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
            </div>
        </div>
    );
}
