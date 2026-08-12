import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Trash2, LogOut, ChevronDown, BookOpen, ChevronRight } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { SubscriptionService } from '../services/subscriptionService';
import { UserSettings } from '../types';
import { toast } from 'sonner';
import { SettingsInstallSection } from './SettingsInstallSection';
import { SettingsAccountSection } from './SettingsAccountSection';
import { SettingsCycleSection } from './SettingsCycleSection';
import { SettingsBackupSection } from './SettingsBackupSection';
import { SettingsNotificationsSection } from './SettingsNotificationsSection';
import { ConfirmDialog } from './ConfirmDialog';
import { PrivacyPolicyContent } from './PrivacyPolicyContent';

// ─── Settings (Orchestrateur) ──────────────────────────────────────────────

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const auth = StorageService.getAuth();
  const isPremium = SubscriptionService.isPremium(auth?.subscriptionType);

  useEffect(() => {
    setSettings(StorageService.getSettings());
  }, []);

  // Refresh subscription status from Supabase
  useEffect(() => {
    if (!auth || auth.isAnonymous) return;
    let cancelled = false;

    const refreshSubscription = async () => {
      const sub = await SubscriptionService.getSubscriptionStatus(auth.id);
      if (cancelled) return;
      const refreshedAuth = {
        ...auth,
        subscriptionType: sub.subscription_type as 'free' | 'monthly' | 'yearly',
        subscriptionExpiry: sub.subscription_expiry,
      };
      await StorageService.setAuth(refreshedAuth as Parameters<typeof StorageService.setAuth>[0]);
    };

    refreshSubscription();
    return () => {
      cancelled = true;
    };
  }, [auth?.id]);

  const handleSettingChange = async (
    key: keyof UserSettings,
    value: UserSettings[keyof UserSettings]
  ) => {
    if (key === 'notificationsOn' && value === true) {
      const { NotificationService } = await import('../services/notificationService');
      const granted = await NotificationService.requestPermission();
      if (!granted) {
        toast.error("Les notifications n'ont pas été autorisées par le navigateur.");
        return;
      }
    }
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    await StorageService.saveSettings(updatedSettings);
  };

  const handleDeleteAllData = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteAll = async () => {
    setShowDeleteConfirm(false);
    await StorageService.clearAllData();
    toast.success('Toutes vos données ont été supprimées');
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-gray-800 mb-6 font-bold text-xl">Paramètres</h2>

        <SettingsInstallSection isDetailsOpen={isDetailsOpen} onDetailsToggle={setIsDetailsOpen} />

        <SettingsAccountSection auth={auth} isPremium={isPremium} />

        <SettingsCycleSection
          settings={settings}
          onSettingChange={(key, value) => handleSettingChange(key, value)}
        />

        <SettingsBackupSection isPremium={isPremium} />

        <SettingsNotificationsSection
          settings={settings}
          onSettingChange={(key, value) => handleSettingChange(key, value)}
        />

        {/* Conseils */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={() => navigate('/medical')}
            className="w-full flex items-center justify-between group py-2"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-600" />
              <div className="text-left">
                <h3 className="text-gray-700 font-semibold text-lg">Conseils</h3>
                <p className="text-sm text-gray-500">
                  Informations sur votre cycle et conseils santé
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
          </button>
        </div>

        {/* Privacy Policy Integrated Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={() => setIsPolicyOpen(!isPolicyOpen)}
            className="w-full flex items-center justify-between group py-2"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-600" />
              <h3 className="text-gray-700 font-semibold text-lg">Politique de confidentialité</h3>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isPolicyOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isPolicyOpen && <PrivacyPolicyContent />}
        </div>

        {/* Delete data */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-gray-700 mb-3 flex items-center gap-2 font-semibold">
            <Trash2 className="w-5 h-5 text-red-600" />
            Supprimer mes données
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 mb-3">
              <strong>Attention :</strong> Cette action supprimera définitivement tous vos cycles et
              paramètres enregistrés.
            </p>
            <button
              onClick={handleDeleteAllData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer toutes mes données
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer toutes les données ?"
        message="ATTENTION : Cette action supprimera définitivement TOUS vos cycles, paramètres et historique. Cette opération est irréversible."
        confirmLabel="Oui, tout supprimer"
        cancelLabel="Non, garder mes données"
        variant="danger"
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
