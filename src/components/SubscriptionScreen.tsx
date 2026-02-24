import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Shield, Lock, FileText, Zap, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storageService';

export function SubscriptionScreen() {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Abonnement Mensuel',
      price: '500 FCFA',
      period: 'par mois',
      description: 'Accès complet aux fonctions Pro',
      features: [
        'Rapports PDF illimités',
        'IA Intelligente (Bientôt)',
        'Sauvegarde & Exportation',
        'Historique illimité',
        'Zéro publicité',
      ],
      btnText: "S'abonner au mois",
      primaryColor: '#f472b6', // pink-400
      secondaryColor: '#fdf2f8', // pink-50
    },
    {
      id: 'yearly',
      name: 'Abonnement Annuel',
      price: '5 000 FCFA',
      period: 'par an',
      description: 'Le meilleur rapport qualité/prix',
      features: [
        'Économisez 1 000 FCFA',
        'Rapports PDF illimités',
        'IA Intelligente (Bientôt)',
        'Sauvegarde & Exportation',
        'Historique illimité',
        'Support prioritaire',
      ],
      btnText: "S'abonner à l'année",
      primaryColor: '#fb7185', // rose-400
      secondaryColor: '#fff1f2', // rose-50
      isPopular: true,
    },
  ];

  const auth = StorageService.getAuth();

  const handleSubscribe = async (planId: string) => {
    if (!auth) {
      alert('Veuillez vous connecter pour vous abonner.');
      navigate('/auth');
      return;
    }

    try {
      setLoadingPlan(planId);

      alert(`Le paiement est temporairement désactivé.\n\nPlan sélectionné : ${planId}`);
    } catch (error: any) {
      console.error('Erreur lors du paiement:', error);
      alert(`Erreur lors du paiement: ${error.message}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 animate-in fade-in duration-500">
      {/* Header / Navbar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all active:scale-90"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/icons/pwa-192x192.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span
              className="text-xl text-pink-600 font-bold"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              Nye Cyclea Pro
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Intro Section */}
        <div className="text-center mb-10 space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
            Passez à la version <span className="text-pink-600">Nye Cyclea Pro</span>
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-[320px] mx-auto">
            Débloquez les rapports PDF et les fonctions avancées pour un suivi serein.
          </p>
        </div>

        {/* Vertical Rectangle Cards */}
        <div className="space-y-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative flex flex-col bg-white border-2 rounded-2xl overflow-hidden shadow-sm transition-transform active:scale-[0.99]"
              style={{ borderColor: plan.primaryColor }}
            >
              {plan.isPopular && (
                <div
                  className="absolute top-0 right-0 px-4 py-1 text-[10px] font-black uppercase text-white tracking-widest"
                  style={{ backgroundColor: plan.primaryColor }}
                >
                  Populaire
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 uppercase tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">{plan.price}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {plan.period}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: plan.secondaryColor }}
                      >
                        <Check
                          className="w-3 h-3"
                          style={{ color: plan.primaryColor }}
                          strokeWidth={3}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null}
                  className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: plan.primaryColor }}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    plan.btnText
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-12 p-6 bg-slate-50 rounded-2xl flex justify-between items-center text-center">
          <div className="flex flex-col items-center gap-1">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Sécurisé
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex flex-col items-center gap-1">
            <Lock className="w-5 h-5 text-pink-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Confidentialité
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex flex-col items-center gap-1">
            <FileText className="w-5 h-5 text-sky-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Rapports
            </span>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-[10px] text-slate-300 font-medium px-6 leading-relaxed">
            Nye Cyclea Pro est un projet indépendant. Votre abonnement nous aide à rester sans
            publicité et à protéger vos données.
          </p>
          <div className="flex items-center justify-center gap-6">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-pink-600 transition-colors">
              CGV/CGU
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-pink-600 transition-colors"
            >
              Vie Privée
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
