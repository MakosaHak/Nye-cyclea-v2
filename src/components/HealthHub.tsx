import { useSearchParams } from 'react-router-dom';
import { History, BarChart3, HeartPulse } from 'lucide-react';
import { CycleHistory } from './CycleHistory';
import { DashboardAnalytique } from './DashboardAnalytique';

type TabType = 'history' | 'analytics';

const tabs = [
  {
    id: 'analytics' as TabType,
    label: 'Analyse',
    description: 'Tendances & graphiques',
    icon: BarChart3,
  },
  {
    id: 'history' as TabType,
    label: 'Historique',
    description: 'Liste de tes cycles',
    icon: History,
  },
];

export function HealthHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: TabType = searchParams.get('tab') === 'history' ? 'history' : 'analytics';
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  const setActiveTab = (tab: TabType) => {
    setSearchParams(tab === 'analytics' ? {} : { tab: 'history' }, { replace: true });
  };

  return (
    <div className="space-y-6 pb-6">
      {/* En-tête de page */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl border border-white/20"
        style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.78), rgba(168, 85, 247, 0.72))',
          boxShadow: '0 8px 32px rgba(244, 63, 94, 0.14)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <HeartPulse className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              Espace Santé
            </h1>
            <p className="text-sm text-white/85 mt-1">{activeTabMeta.description}</p>
          </div>
        </div>
      </div>

      {/* Sélecteur d'onglets — 2 boutons égaux */}
      <div className="glass-card p-1.5" role="tablist" aria-label="Sections de l'espace santé">
        <div className="grid grid-cols-2 gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 py-3.5 px-3 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-[0.98] ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50/60'
                }`}
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                        boxShadow: '0 4px 16px rgba(244, 63, 94, 0.32)',
                      }
                    : undefined
                }
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu */}
      <div role="tabpanel">
        {activeTab === 'history' && <CycleHistory />}
        {activeTab === 'analytics' && <DashboardAnalytique />}
      </div>
    </div>
  );
}
