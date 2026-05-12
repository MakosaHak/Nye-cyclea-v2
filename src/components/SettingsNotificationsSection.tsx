import { Bell, Sparkles } from 'lucide-react';
import { NotificationService } from '../services/notificationService';
import { UserSettings } from '../types';
import { toast } from 'sonner';

interface SettingsNotificationsSectionProps {
  settings: UserSettings;
  onSettingChange: (key: keyof UserSettings, value: boolean) => void;
}

export function SettingsNotificationsSection({
  settings,
  onSettingChange,
}: SettingsNotificationsSectionProps) {
  const handleTestNotification = async () => {
    const success = await NotificationService.triggerTestNotification();
    if (success) {
      toast.success('Demande de test envoyée !');
    } else {
      toast.error("Échec de l'envoi. Vérifiez que l'app est installée.");
    }
  };

  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <h3 className="text-gray-700 mb-3 flex items-center gap-2 font-semibold">
        <Bell className="w-5 h-5 text-purple-600" />
        Notifications
      </h3>

      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
        <span className="text-sm text-gray-700">Activer les notifications quotidiennes</span>
        <input
          type="checkbox"
          checked={settings.notificationsOn}
          onChange={(e) => onSettingChange('notificationsOn', e.target.checked)}
          className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
        />
      </label>

      {settings.notificationsOn && (
        <div className="mt-4 space-y-3">
          <button
            onClick={handleTestNotification}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 hover:bg-pink-100 transition-colors text-sm font-bold"
          >
            <Sparkles className="w-4 h-4" />
            TESTER LA NOTIFICATION
          </button>

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
            <p className="text-[11px] text-blue-700 leading-relaxed">
              <strong>💡 Aide :</strong> Si vous ne recevez rien :<br />
              1. Vérifiez que l'application est bien{' '}
              <strong>ajoutée à votre écran d'accueil</strong>.<br />
              2. Allez dans les réglages de votre téléphone &gt; Notifications &gt; Nye Cyclea et
              vérifiez que les alertes sont autorisées.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
