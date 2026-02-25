import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Trash2, LogOut, ChevronDown } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { SubscriptionService } from '../services/subscriptionService';
import { UserSettings } from '../types';
import { toast } from 'sonner';
import { SettingsInstallSection } from './SettingsInstallSection';
import { SettingsAccountSection } from './SettingsAccountSection';
import { SettingsCycleSection } from './SettingsCycleSection';
import { SettingsBackupSection } from './SettingsBackupSection';
import { SettingsNotificationsSection } from './SettingsNotificationsSection';

// ─── Privacy Policy Accordion Content ────────────────────────────────────────

function PrivacyPolicyContent() {
  return (
    <div
      className="border-t border-pink-100/60 animate-in slide-in-from-top-2 fade-in duration-300"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif", lineHeight: '1.8' }}
    >
      <div className="px-6 pt-5 pb-8 space-y-6">

        {/* Title Block */}
        <div className="text-center pb-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Nye Cyclea</h1>
          <p className="text-xs text-gray-500 italic">Application de suivi du cycle menstruel</p>
          <p className="text-[11px] text-gray-400 mt-2">
            Version : 1.0 &nbsp;|&nbsp; En vigueur depuis le 13 janvier 2026
          </p>
        </div>

        {/* Préambule */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight uppercase">Préambule</h2>
          <p className="text-sm text-gray-600">
            La présente Politique de Confidentialité décrit la manière dont <strong>Nye Cyclea</strong> collecte, utilise et protège les informations personnelles de ses utilisatrices, conformément à la loi togolaise n°2019-014 relative à la protection des données personnelles et aux recommandations de l'IPDCP.
          </p>
        </section>

        {/* 1 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight">1. Responsable du traitement</h2>
          <p className="text-sm text-gray-600">
            Le responsable du traitement est l'équipe <strong>Nye Cyclea</strong>.<br />
            Contact : <span className="text-pink-600 font-medium">contact@nyecyclea.com</span>
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight">2. Données collectées</h2>
          <p className="text-sm text-gray-600 mb-2">Les données suivantes peuvent être collectées, uniquement si vous les saisissez :</p>
          <div className="bg-pink-50/50 rounded-xl p-3.5 text-sm text-gray-600 space-y-1">
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span>Dates de début et de fin des règles</span></div>
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span>Durée habituelle du cycle</span></div>
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span>Identifiant de compte (pseudonyme)</span></div>
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span>Statut d'abonnement (Gratuit / Premium)</span></div>
          </div>
          <p className="text-[11px] text-gray-400 italic mt-2">Toutes les données de santé sont facultatives et ne quittent jamais votre appareil.</p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight">3. Base légale du traitement</h2>
          <p className="text-sm text-gray-600">
            Le traitement repose sur votre <strong>consentement explicite</strong> donné lors de l'utilisation de l'application. Vous pouvez le retirer à tout moment en supprimant vos données ou en désinstallant l'application.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight">4. Finalité du traitement</h2>
          <p className="text-sm text-gray-600 mb-2">Vos données sont utilisées exclusivement pour :</p>
          <div className="bg-pink-50/50 rounded-xl p-3.5 text-sm text-gray-600 space-y-1">
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span>Calculer et afficher vos prédictions de cycle</span></div>
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span>Personnaliser votre expérience dans l'application</span></div>
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span>Gérer votre accès aux fonctionnalités Premium</span></div>
          </div>
          <p className="text-[11px] text-rose-500 font-semibold mt-2">Vos données ne sont jamais vendues, cédées ou partagées à des fins commerciales.</p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight">5. Stockage et localisation</h2>
          <p className="text-sm text-gray-600 mb-1.5">
            Nye Cyclea applique une architecture <strong>Offline-First</strong> : toutes vos données de santé sont stockées <strong>localement sur votre appareil</strong>, sans synchronisation cloud.
          </p>
          <p className="text-sm text-gray-600">
            Seules les données de compte sont hébergées sur des serveurs sécurisés (<strong>Supabase</strong>), protégés par chiffrement TLS.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight">6. Durée de conservation</h2>
          <p className="text-sm text-gray-600">
            Les données de santé sont conservées jusqu'à ce que vous les supprimiez dans les Paramètres. Les données de compte sont supprimées définitivement sur demande.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight">7. Sécurité des données</h2>
          <p className="text-sm text-gray-600">
            Des mesures techniques et organisationnelles adaptées protègent vos données contre tout accès non autorisé, perte ou altération. Nous vous recommandons également de sécuriser votre téléphone par un code PIN ou un verrou biométrique.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight">8. Vos droits</h2>
          <p className="text-sm text-gray-600 mb-2">Conformément à la loi n°2019-014, vous disposez des droits suivants :</p>
          <div className="bg-pink-50/50 rounded-xl p-3.5 text-sm text-gray-600 space-y-1">
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span><strong>Accès</strong> : consulter les données vous concernant</span></div>
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span><strong>Rectification</strong> : modifier vos données</span></div>
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span><strong>Effacement</strong> : supprimer toutes vos données</span></div>
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span><strong>Portabilité</strong> : exporter vos données (format JSON)</span></div>
            <div className="flex gap-2"><span className="text-pink-400 font-bold flex-shrink-0">—</span><span><strong>Opposition</strong> : cesser l'utilisation à tout moment</span></div>
          </div>
          <p className="text-[11px] text-gray-400 italic mt-2">Pour exercer vos droits : contact@nyecyclea.com</p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-1.5 tracking-tight">9. Mises à jour</h2>
          <p className="text-sm text-gray-600">
            Cette politique peut évoluer. Toute modification significative sera notifiée dans l'application.
          </p>
        </section>

        {/* Footer */}
        <div className="text-center pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-600">Nye Cyclea — Un espace sûr, intime et respectueux.</p>
          <p className="text-[10px] uppercase tracking-widest text-pink-400 font-bold mt-1">Votre corps. Vos données. Votre choix.</p>
        </div>

      </div>
    </div>
  );
}

// ─── Settings (Orchestrateur) ──────────────────────────────────────────────

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
    return () => { cancelled = true; };
  }, [auth?.id]);

  const handleSettingChange = async (key: keyof UserSettings, value: UserSettings[keyof UserSettings]) => {
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

  const handleDeleteAllData = async () => {
    const firstConfirm = confirm('ATTENTION : Cette action supprimera TOUTES vos données de manière irréversible. Êtes-vous absolument sûre ?');
    if (!firstConfirm) return;
    const secondConfirm = confirm('Dernière confirmation : voulez-vous vraiment supprimer toutes vos données ?');
    if (!secondConfirm) return;
    await StorageService.clearAllData();
    toast.success('Toutes vos données ont été supprimées');
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-gray-800 mb-6 font-bold text-xl">Paramètres</h2>

        <SettingsInstallSection
          isDetailsOpen={isDetailsOpen}
          onDetailsToggle={setIsDetailsOpen}
        />

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

        {/* Delete data */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-gray-700 mb-3 flex items-center gap-2 font-semibold">
            <Trash2 className="w-5 h-5 text-red-600" />
            Supprimer mes données
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 mb-3">
              <strong>Attention :</strong> Cette action supprimera définitivement tous vos cycles et paramètres enregistrés.
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

      {/* Privacy Policy Accordion */}
      <div
        className="overflow-hidden rounded-3xl shadow-md border border-pink-100/60 transition-all duration-300"
        style={{ background: 'linear-gradient(135deg, #fff8f9 0%, #fff0f3 100%)' }}
      >
        {/* Trigger */}
        <button
          onClick={() => setIsPolicyOpen((prev) => !prev)}
          className="group w-full flex items-center justify-between gap-4 px-6 py-5 hover:bg-white/50 transition-all duration-300"
          aria-expanded={isPolicyOpen}
        >
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #fda4af 0%, #f43f5e 100%)' }}
            >
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-pink-400 font-bold mb-0.5">Légal</p>
              <h4 className="text-gray-800 font-bold text-base leading-tight">Politique de confidentialité</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                {isPolicyOpen ? 'Cliquez pour refermer' : 'Cliquez pour consulter'}
              </p>
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
            style={{ background: isPolicyOpen ? 'rgba(244,63,94,0.1)' : 'rgba(253,164,175,0.2)' }}
          >
            <ChevronDown
              className="w-4 h-4 text-pink-500 transition-transform duration-300"
              style={{ transform: isPolicyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>
        </button>

        {/* Accordion Content */}
        {isPolicyOpen && <PrivacyPolicyContent />}
      </div>
    </div>
  );
}
