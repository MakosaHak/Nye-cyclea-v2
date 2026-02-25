import { useState } from 'react';
import { Smartphone, Rocket, Download, ChevronRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { toast } from 'sonner';

interface SettingsInstallSectionProps {
    isDetailsOpen: boolean;
    onDetailsToggle: (open: boolean) => void;
}

export function SettingsInstallSection({ isDetailsOpen, onDetailsToggle }: SettingsInstallSectionProps) {
    const { isInstallable, isInstalled, installApp } = usePWAInstall();

    const handleInstallApp = async () => {
        if (isInstallable) {
            await installApp();
        } else {
            onDetailsToggle(true);
            toast.info('Installation manuelle requise sur cet appareil.');
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
                        className="active:scale-95 transition-all flex items-center justify-center gap-3"
                        style={{
                            backgroundColor: '#4338ca',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            padding: '12px 20px',
                            border: '2px solid #3730a3',
                            cursor: 'pointer',
                            width: 'fit-content',
                            minWidth: '200px',
                            margin: '0 auto 10px auto',
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
    );
}
