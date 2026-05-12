import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Home,
  History,
  Settings as SettingsIcon,
  BookOpen,
  Plus,
  Sparkles,
} from 'lucide-react';

interface LayoutProps {
  onAddCycle: () => void;
  isPremium?: boolean;
}

export function Layout({ onAddCycle, isPremium }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.slice(1) || 'dashboard';

  const navItems = [
    { key: 'dashboard', label: 'Accueil', icon: Home, path: '/' },
    { key: 'calendar', label: 'Calendrier', icon: CalendarDays, path: '/calendar' },
    { key: 'history', label: 'Historique', icon: History, path: '/history' },
    { key: 'medical', label: 'Conseils', icon: BookOpen, path: '/medical' },
    { key: 'settings', label: 'Réglages', icon: SettingsIcon, path: '/settings' },
  ];

  return (
    <div className="min-h-screen">
      {/* Original solid white header */}
      <header className="bg-white border-b border-pink-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/pwa-192x192.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col">
              <h1
                className="text-pink-600 text-2xl font-bold leading-none flex items-center gap-2"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                Nye Cyclea
                {isPremium && (
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white"
                    style={{
                      background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                      boxShadow: '0 2px 10px rgba(245,158,11,0.35)',
                    }}
                  >
                    <Sparkles className="w-3 h-3 fill-white" /> Pro
                  </span>
                )}
              </h1>
            </div>
          </div>

          <button
            onClick={onAddCycle}
            className="w-12 h-12 rounded-full bg-pink-50 ring-1 ring-pink-200 flex items-center justify-center hover:bg-pink-100 active:scale-95 transition-all shadow-md"
            title="Ajouter un cycle"
          >
            <Plus className="w-6 h-6 text-pink-600" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-28">
        <Outlet />
      </main>

      {/* Original solid white bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 z-50 shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-stretch justify-between gap-1 px-2 py-2">
          {navItems.map(({ key, label, icon: Icon, path }) => {
            const active = currentView === key || (key === 'dashboard' && currentView === '');
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl transition-all ${
                  active
                    ? 'bg-pink-50 text-pink-600 scale-105'
                    : 'text-gray-400 hover:bg-pink-50 hover:text-pink-500 active:scale-95'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                <span
                  className={`text-[10px] leading-none ${active ? 'font-bold' : 'font-medium'}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
