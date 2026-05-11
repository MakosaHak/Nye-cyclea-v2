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
import { ConfirmDialog } from './ConfirmDialog';

// ─── Privacy Policy Content (Refined & Legal) ────────────────────────────────

function PrivacyPolicyContent() {
  return (
    <div
      className="mt-6 border-t border-gray-100 pt-8 pb-4 animate-in fade-in slide-in-from-top-4 duration-700"
      style={{ 
        fontFamily: "'DM Sans', sans-serif", 
        lineHeight: '1.6',
        color: '#4B5563'
      }}
    >
      <div className="space-y-10">
        {/* Document Header */}
        <div className="text-center pb-8 border-b border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">Politique de Confidentialité</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Cadre Juridique Togo & International</p>
          <p className="text-[11px] text-gray-500 mt-2 font-medium">Dernière mise à jour : 10 mai 2026</p>
        </div>

        {/* Section 1: Legal Framework */}
        <section>
          <h2 className="text-[13px] font-black text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-pink-500 pl-3">
            01. Cadre Légal et Conformité
          </h2>
          <p className="text-sm text-justify">
            La présente politique est régie par la <strong>Loi n°2019-014</strong> du 29 octobre 2019 relative à la protection des données à caractère personnel en République Togolaise. Nye Cyclea s'engage à respecter les principes de protection édictés par l'Instance de Protection des Données à Caractère Personnel (IPDCP). 
          </p>
          <p className="text-sm mt-3 text-justify">
            Par souci de transparence et de sécurité universelle, nos protocoles sont également alignés sur les standards internationaux, notamment le <strong>Règlement Général sur la Protection des Données (RGPD)</strong> de l'Union Européenne, garantissant ainsi un niveau de protection optimal pour toutes nos utilisatrices.
          </p>
        </section>

        {/* Section 2: Data Nature */}
        <section>
          <h2 className="text-[13px] font-black text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-pink-500 pl-3">
            02. Nature des Données et Finalités
          </h2>
          <p className="text-sm mb-4 text-justify">
            Nye Cyclea traite deux types de données distincts pour assurer le bon fonctionnement du service :
          </p>
          <div className="grid gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">Données de Santé (Sensibles)</h3>
              <p className="text-xs leading-relaxed">
                Dates de cycles, symptômes et notes personnelles. Ces données sont <strong>exclusivement stockées en local</strong> sur votre terminal (Architecture Offline-First) et ne sont jamais transmises à nos serveurs.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">Données de Compte</h3>
              <p className="text-xs leading-relaxed">
                Identifiant, mot de passe (haché) et statut d'abonnement. Ces informations sont nécessaires pour la gestion de votre profil et sont hébergées sur des serveurs sécurisés bénéficiant d'un chiffrement TLS de bout en bout.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: User Rights */}
        <section>
          <h2 className="text-[13px] font-black text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-pink-500 pl-3">
            03. Droits de l'Utilisatrice
          </h2>
          <p className="text-sm mb-4 text-justify">
            Conformément à la législation togolaise et aux principes du RGPD, vous disposez des droits fondamentaux suivants :
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-3"><span className="font-bold text-pink-500">•</span> <strong>Droit d'accès :</strong> Consulter l'intégralité de vos données à tout moment.</li>
            <li className="flex gap-3"><span className="font-bold text-pink-500">•</span> <strong>Droit de rectification :</strong> Modifier vos informations personnelles.</li>
            <li className="flex gap-3"><span className="font-bold text-pink-500">•</span> <strong>Droit à l'effacement :</strong> Supprimer définitivement vos données (via le bouton "Supprimer mes données" ci-dessous).</li>
            <li className="flex gap-3"><span className="font-bold text-pink-500">•</span> <strong>Droit à la portabilité :</strong> Exporter vos données dans un format structuré (JSON).</li>
          </ul>
        </section>

        {/* Section 4: Security */}
        <section>
          <h2 className="text-[13px] font-black text-gray-900 mb-3 uppercase tracking-wider border-l-4 border-pink-500 pl-3">
            04. Sécurité et Intégrité
          </h2>
          <p className="text-sm text-justify">
            Nous mettons en œuvre des mesures techniques de pointe (chiffrement, isolation des processus) pour garantir l'intégrité de vos informations. En tant qu'utilisatrice, vous êtes responsable de la sécurité physique de votre terminal et de la confidentialité de vos identifiants.
          </p>
        </section>

        {/* Final Disclaimer */}
        <div className="pt-10 border-t border-gray-100 text-center">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-relaxed">
            Votre intimité est notre priorité absolue.<br />
            Pour toute demande : contact@nyecyclea.com
          </p>
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
