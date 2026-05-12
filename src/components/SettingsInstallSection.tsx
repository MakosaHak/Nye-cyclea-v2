import { useState } from 'react';
import { Smartphone, Rocket, Download, ChevronRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { toast } from 'sonner';

interface SettingsInstallSectionProps {
  isDetailsOpen: boolean;
  onDetailsToggle: (open: boolean) => void;
}

export function SettingsInstallSection({
  isDetailsOpen,
  onDetailsToggle,
}: SettingsInstallSectionProps) {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const handleInstallApp = async () => {
    if (isInstallable) {
      const success = await installApp();
      if (success) {
        toast.success("L'installation a commencé !");
      }
    } else {
      // If not automatically installable (e.g. iOS or already stashed), show the manual guide
      onDetailsToggle(true);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        toast.info('Sur iPhone : cliquez sur "Partager" puis "Sur l\'écran d\'accueil"');
      } else {
        toast.info('Installation manuelle requise via le menu du navigateur.');
      }
    }
  };

  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="w-5 h-5 text-purple-600" />
        <h3 className="text-gray-700 font-semibold text-lg">Application</h3>
      </div>

      <div className="flex flex-col gap-3">
        {!isInstalled && (
          <button
            onClick={handleInstallApp}
            className="group active:scale-95 transition-all flex items-center justify-center gap-2.5 mx-auto"
            style={{
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              color: 'white',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              padding: '10px 20px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(244,63,94,0.15)',
              width: 'auto',
            }}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>INSTALLER</span>
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
            onToggle={(e) => onDetailsToggle((e.target as HTMLDetailsElement).open)}
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
                  <p>
                    Allez dans le menu navigateur (<strong>...</strong> ou <strong>Partage</strong>
                    ).
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-black text-indigo-600">2.</span>
                  <p>
                    Cliquez sur <strong>"Installer l'application"</strong>.
                  </p>
                </div>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
