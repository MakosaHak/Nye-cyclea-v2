import { Shield, Crown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthData } from '../types';

interface SettingsAccountSectionProps {
    auth: AuthData | null;
    isPremium: boolean;
}

export function SettingsAccountSection({ auth, isPremium }: SettingsAccountSectionProps) {
    const navigate = useNavigate();

    return (
        <div className="mb-6 pb-6 border-b border-gray-200">
            {/* Premium upgrade banner (free users only) */}
            {!isPremium && (
                <div className="mb-8 px-1">
                    <button
                        onClick={() => navigate('/subscribe')}
                        className="relative w-full rounded-2xl active:scale-[0.98] transition-all group overflow-hidden"
                        style={{ backgroundColor: '#FEF3C7', border: '1.5px solid #F59E0B' }}
                    >
                        <div className="relative px-5 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F59E0B' }}>
                                    <Crown className="w-6 h-6" style={{ color: '#ffffff' }} />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-black text-base tracking-tight leading-none" style={{ color: '#92400E' }}>
                                            Nye Cyclea Pro
                                        </h4>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F59E0B', color: '#ffffff' }}>
                                            PRO
                                        </span>
                                    </div>
                                    <p style={{ color: '#B45309' }} className="text-[11px] font-semibold">
                                        Débloquez toutes les fonctionnalités ✨
                                    </p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 group-hover:translate-x-1 transition-transform" style={{ backgroundColor: '#F59E0B' }}>
                                <ChevronRight className="w-4 h-4" style={{ color: '#ffffff' }} />
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* Account details */}
            <h3 className="text-gray-700 mb-3 flex items-center gap-2 font-semibold">
                <Shield className="w-5 h-5 text-purple-600" />
                Compte
            </h3>
            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                {auth?.isAnonymous ? (
                    <p className="text-sm text-gray-700">
                        <strong>Mode anonyme</strong>
                        <br />
                        Vos données restent stockées sur votre téléphone. Aucune donnée de cycle ne quitte cet appareil.
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-gray-700 flex justify-between">
                            <span><strong>Identifiant :</strong></span>
                            <span className="font-mono">{auth?.username || '—'}</span>
                        </p>
                        <p className="text-sm text-gray-700 flex justify-between">
                            <span><strong>Abonnement :</strong></span>
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
    );
}
