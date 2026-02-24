import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Bell,
  Lock,
  Trash2,
  LogOut,
  Shield,
  Calendar,
  FileText,
  ChevronRight,
  X,
  Mail,
  Smartphone,
  Eye,
  Heart,
  Sparkles,
  Rocket,
  Crown,
  Download,
  Upload,
  Database,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { UserSettings } from '../types';
import { PDFService } from '../services/pdfService';
import { NotificationService } from '../services/notificationService';
import { SubscriptionService } from '../services/subscriptionService';
import { toast } from 'sonner';

function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[80vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-pink-500" />
            <span className="font-bold text-gray-800">Politique de confidentialité</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 text-sm text-gray-600 leading-relaxed">
          <div className="text-center pb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Nye Cyclea</h2>
            <p className="text-xs text-gray-400 font-medium tracking-wider">
              Dernière mise à jour : 13/01/2026
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              🌸 Votre vie privée avant tout
            </h3>
            <p>
              Nye Cyclea respecte votre intimité. Cette application a été conçue pour vous aider à
              mieux comprendre votre cycle menstruel sans compromettre vos données personnelles.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-gray-800">📌 Quelles données sont utilisées ?</h3>
            <p>Vous pouvez saisir, si vous le souhaitez :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dates de vos règles</li>
              <li>Durée du cycle</li>
            </ul>
            <p className="italic text-xs text-pink-400">👉 Ces informations sont facultatives.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-gray-800">📱 Où sont stockées vos données ?</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vos données de cycles restent sur votre téléphone (Stockage Local)</li>
              <li>L’application fonctionne sans Internet pour le suivi quotidien</li>
              <li>
                <strong>Zéro Sauvegarde Cloud</strong> : Pour garantir votre anonymat total, nous ne
                synchronisons pas vos cycles sur nos serveurs.
              </li>
              <li>
                Seul votre pseudonyme et votre statut "Premium" sont sauvegardés sur nos serveurs
                sécurisés pour garantir vos accès payants.
              </li>
            </ul>
            <p className="italic text-xs text-pink-400">👉 Vous êtes la seule à y avoir accès.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-gray-800">🎯 À quoi servent vos données ?</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Suivre votre cycle</li>
              <li>Vous donner des indications utiles</li>
              <li>Améliorer votre expérience</li>
            </ul>
            <p className="italic font-bold text-rose-500">
              ❌ Elles ne sont jamais vendues ni partagées.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-gray-800">🔒 Sécurité & confidentialité</h3>
            <p>
              Nous protégeons vos données contre l’accès non autorisé, la perte ou la modification.
            </p>
            <p className="italic text-xs text-amber-600">
              👉 Pensez aussi à sécuriser votre téléphone (code, mot de passe).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-gray-800">🩺 Données sensibles</h3>
            <p>
              Les données liées aux menstruations sont personnelles et sensibles. Nye Cyclea les
              traite avec discrétion et respect.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-gray-800">🤝 Partage des données</h3>
            <p>Aucune donnée personnelle n’est partagée.</p>
            <p>
              À l’avenir, seules des données anonymes pourront servir à des statistiques de santé
              publique (impossible de vous identifier).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-gray-800">🧾 Vos droits</h3>
            <p>
              Vous pouvez à tout moment : Modifier vos données, Supprimer vos informations, Arrêter
              d’utiliser l’application.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-gray-800">🔄 Mises à jour</h3>
            <p>
              Cette politique peut évoluer. Toute modification sera indiquée dans l’application.
            </p>
          </section>

          <section className="space-y-2 pb-6">
            <h3 className="font-bold text-gray-800 text-center pt-4 border-t border-gray-100">
              📩 Contact
            </h3>
            <p className="text-center">
              Une question ? <br />{' '}
              <span className="font-bold text-pink-500">contact@nyecyclea.com</span>
            </p>
          </section>

          <div className="text-center pt-8 border-t border-gray-100">
            <p className="font-bold text-gray-900">
              🌿 Nye Cyclea, c’est un espace sûr, intime et respectueux.
            </p>
            <p className="text-xs uppercase tracking-widest text-pink-400 font-bold mt-1">
              Votre corps. Vos données. Votre choix.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const loadedSettings = StorageService.getSettings();
    setSettings(loadedSettings);
  }, []);

  const handleInstallApp = async () => {
    if (isInstallable) {
      await installApp();
    } else {
      setIsDetailsOpen(true);
      toast.info("Installation manuelle requise sur cet appareil.");
    }
  };

  const handleSettingChange = async (key: keyof UserSettings, value: any) => {
    // Si on active les notifications, demander la permission
    if (key === 'notificationsOn' && value === true) {
      // Import dynamique pour éviter les cycles si nécessaire, ou utiliser l'import global
      // Ici on suppose que NotificationService est dispo ou on l'importera
      const { NotificationService } = await import('../services/notificationService');
      const granted = await NotificationService.requestPermission();
      if (!granted) {
        toast.error("Les notifications n'ont pas été autorisées par le navigateur.");
        return; // On ne change pas le setting
      }
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  };

  const handleDeleteAllData = async () => {
    if (
      confirm(
        '⚠️ ATTENTION : Cette action supprimera TOUTES vos données de manière irréversible. Êtes-vous absolument sûre ?'
      )
    ) {
      if (confirm('Dernière confirmation : voulez-vous vraiment supprimer toutes vos données ?')) {
        await StorageService.clearAllData();
        toast.success('Toutes vos données ont été supprimées');
        setTimeout(() => window.location.reload(), 1500);
      }
    }
  };

  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const auth = StorageService.getAuth();
  const isPremium = SubscriptionService.isPremium(auth?.subscriptionType);

  useEffect(() => {
    let cancelled = false;

    const refreshSubscription = async () => {
      if (!auth || auth.isAnonymous) return;

      const sub = await SubscriptionService.getSubscriptionStatus(auth.id);
      if (cancelled) return;

      const nextAuth = {
        ...auth,
        subscriptionType: sub.subscription_type as any,
        subscriptionExpiry: sub.subscription_expiry,
      };

      await StorageService.setAuth(nextAuth);
    };

    refreshSubscription();

    return () => {
      cancelled = true;
    };
  }, [auth?.id]);

  const handleExport = () => {
    if (!isPremium) {
      navigate('/subscribe');
      return;
    }
    try {
      const data = StorageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nye-cyclea-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      navigate('/subscribe');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const success = await StorageService.importData(json);
        if (success) {
          setImportStatus({
            type: 'success',
            message: 'Données importées avec succès !',
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setImportStatus({
            type: 'error',
            message: "Échec de l'importation. Fichier invalide.",
          });
        }
      } catch (error) {
        setImportStatus({
          type: 'error',
          message: 'Erreur lors de la lecture du fichier.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-gray-800 mb-6 font-bold text-xl">Paramètres</h2>

        {!isPremium && (
          <div className="mb-8 px-1">
            <button
              onClick={() => navigate('/subscribe')}
              className="relative w-full rounded-2xl active:scale-[0.98] transition-all group overflow-hidden"
              style={{
                backgroundColor: '#FEF3C7',
                border: '1.5px solid #F59E0B',
              }}
            >
              <div className="relative px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Gold Crown Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#F59E0B' }}
                  >
                    <Crown className="w-6 h-6" style={{ color: '#ffffff' }} />
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4
                        className="font-black text-base tracking-tight leading-none"
                        style={{ color: '#92400E' }}
                      >
                        Nye Cyclea Pro
                      </h4>
                      <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#F59E0B', color: '#ffffff' }}
                      >
                        PRO
                      </span>
                    </div>
                    <p
                      style={{ color: '#B45309' }}
                      className="text-[11px] font-semibold"
                    >
                      Débloquez toutes les fonctionnalités ✨
                    </p>
                  </div>
                </div>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 group-hover:translate-x-1 transition-transform"
                  style={{ backgroundColor: '#F59E0B' }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: '#ffffff' }} />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Installation Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <h3 className="text-gray-700 font-semibold text-lg">Application</h3>
          </div>

          <div className="flex flex-col gap-3">
            {!isInstalled && (
              <button
                onClick={handleInstallApp}
                className="active:scale-95 transition-all flex items-center justify-center gap-3"
                style={{
                  backgroundColor: '#4338ca', // Indigo-700 (darker)
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  padding: '12px 20px',
                  border: '2px solid #3730a3',
                  cursor: 'pointer',
                  width: 'fit-content',
                  minWidth: '200px',
                  margin: '0 auto 10px auto'
                }}
              >
                <Download style={{ width: '18px', height: '18px', color: 'white' }} />
                <span>TÉLÉCHARGER L'APPLI</span>
              </button>
            )}

            {isInstalled && (
              <div className="flex justify-center mb-2">
                <span className="text-[10px] font-black text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200 uppercase tracking-widest">
                  Déjà installée ✨
                </span>
              </div>
            )}

            {!isInstalled && (
              <details
                className="group border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30"
                open={isDetailsOpen}
                onToggle={(e) => setIsDetailsOpen((e.target as HTMLDetailsElement).open)}
              >
                <summary className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-gray-100/50 transition-colors list-none">
                  <span className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-indigo-400" />
                    Guide d'installation
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 pt-1 text-[11px] text-gray-600 space-y-3 animate-in fade-in duration-300">
                  <p className="opacity-80">Si le téléchargement automatique ne se lance pas :</p>
                  <div className="space-y-2 bg-white/60 p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex gap-3">
                      <span className="font-black text-indigo-600">1.</span>
                      <p>Allez dans le menu navigateur (<strong>...</strong> ou <strong>Partage</strong>).</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-black text-indigo-600">2.</span>
                      <p>Cliquez sur <strong>"Installer l'application"</strong>.</p>
                    </div>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-gray-700 mb-3 flex items-center gap-2 font-semibold">
            <Shield className="w-5 h-5 text-purple-600" />
            Compte
          </h3>
          <div className="bg-purple-50 rounded-lg p-4 space-y-2">
            {auth?.isAnonymous ? (
              <p className="text-sm text-gray-700">
                <strong>Mode anonyme</strong>
                <br />
                Vos données restent stockées sur votre téléphone. Aucune donnée de cycle ne quitte
                cet appareil.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-700 flex justify-between">
                  <span>
                    <strong>Identifiant :</strong>
                  </span>
                  <span className="font-mono">{auth?.username || '—'}</span>
                </p>
                <p className="text-sm text-gray-700 flex justify-between">
                  <span>
                    <strong>Abonnement :</strong>
                  </span>
                  <span className="font-bold text-purple-600">
                    {auth?.subscriptionType === 'yearly'
                      ? 'Annuel (Or)'
                      : auth?.subscriptionType === 'monthly'
                        ? 'Mensuel'
                        : 'Gratuit'}
                  </span>
                </p>
                {auth?.subscriptionExpiry && (
                  <p className="text-[10px] text-gray-400 text-right italic">
                    Expire le : {new Date(auth.subscriptionExpiry).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cycle Settings */}
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
                onChange={(e) =>
                  handleSettingChange('defaultCycleLength', parseInt(e.target.value))
                }
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
                onChange={(e) =>
                  handleSettingChange('defaultPeriodLength', parseInt(e.target.value))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Backup & Portability */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-gray-700 mb-3 flex items-center gap-2 font-semibold">
            <Database className="w-5 h-5 text-purple-600" />
            Données & Sauvegarde
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Comme vos données sont 100% locales, utilisez ces outils pour les transférer sur un
            autre appareil.
          </p>

          {importStatus && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${importStatus.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}
            >
              {importStatus.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-100 hover:opacity-80 transition-all font-bold text-sm"
              style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}
            >
              {isPremium ? (
                <Download className="w-4 h-4" />
              ) : (
                <Lock className="w-3.5 h-3.5 opacity-80" />
              )}
              Exporter (JSON)
            </button>

            <div className="relative">
              {!isPremium ? (
                <button
                  onClick={() => navigate('/subscribe')}
                  className="w-full h-full flex items-center justify-center gap-2 p-3 rounded-xl border border-green-100 hover:opacity-80 transition-all font-bold text-sm"
                  style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}
                >
                  <Lock className="w-3.5 h-3.5 opacity-80" />
                  Importer
                </button>
              ) : (
                <label
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border border-green-100 hover:opacity-80 transition-all font-bold text-sm cursor-pointer"
                  style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}
                >
                  <Upload className="w-4 h-4" />
                  Importer
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
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
              onChange={(e) => handleSettingChange('notificationsOn', e.target.checked)}
              className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
            />
          </label>

          {settings.notificationsOn && (
            <div className="mt-4 space-y-3">
              <button
                onClick={async () => {
                  const success = await NotificationService.triggerTestNotification();
                  if (success) {
                    toast.success('Demande de test envoyée !');
                  } else {
                    toast.error('Échec de l\'envoi. Vérifiez que l\'app est installée.');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 hover:bg-pink-100 transition-colors text-sm font-bold"
              >
                <Sparkles className="w-4 h-4" />
                TESTER LA NOTIFICATION
              </button>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  <strong>💡 Aide :</strong> Si vous ne recevez rien :
                  <br />
                  1. Vérifiez que l'application est bien <strong>ajoutée à votre écran d'accueil</strong>.
                  <br />
                  2. Allez dans les réglages de votre téléphone &gt; Notifications &gt; Nye Cyclea et vérifiez que les alertes sont autorisées.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Delete Data */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-gray-700 mb-3 flex items-center gap-2 font-semibold">
            <Trash2 className="w-5 h-5 text-red-600" />
            Supprimer mes données
          </h3>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 mb-3">
              ⚠️ <strong>Attention :</strong> Cette action supprimera définitivement tous vos cycles
              et paramètres enregistrés.
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

      {/* Privacy Notice Card - Interactive Trigger */}
      <button
        onClick={() => setShowPrivacyPolicy(true)}
        className="group w-full text-left bg-white border border-pink-100 rounded-[2rem] p-6 shadow-md hover:shadow-xl hover:bg-pink-50/30 transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-pink-100/50 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h4 className="text-gray-800 font-bold">Politique de confidentialité</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Cliquez pour consulter l'intégralité du document
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-pink-300 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && <PrivacyPolicyModal onClose={() => setShowPrivacyPolicy(false)} />}
    </div>
  );
}
