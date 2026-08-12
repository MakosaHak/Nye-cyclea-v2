import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Home,
  HeartPulse,
  Settings as SettingsIcon,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { ProBadge } from './ProBadge';

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
    { key: 'chat', label: 'NyeAI', icon: MessageSquare, path: '/chat' },
    { key: 'hub', label: 'Espace Santé', icon: HeartPulse, path: '/hub' },
    { key: 'settings', label: 'Réglages', icon: SettingsIcon, path: '/settings' },
  ];

  function isActive(key: string): boolean {
    if (key === 'dashboard') return currentView === '' || currentView === 'dashboard';
    if (key === 'hub') return currentView === 'hub' || currentView === 'history';
    return currentView === key;
  }

  return (
    <div className="min-h-screen">
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
                {isPremium && <ProBadge />}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddCycle}
            className="w-12 h-12 rounded-full bg-pink-50 ring-1 ring-pink-200 flex items-center justify-center hover:bg-pink-100 active:scale-95 transition-all shadow-md"
            title="Ajouter un cycle"
          >
            <Plus className="w-6 h-6 text-pink-600" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 z-50 shadow-2xl"
        aria-label="Navigation principale"
      >
        <div className="max-w-3xl mx-auto flex items-stretch justify-between gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map(({ key, label, icon: Icon, path }) => {
            const active = isActive(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(path)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl transition-all ${
                  active
                    ? 'bg-pink-50 text-pink-600 scale-105'
                    : 'text-gray-400 hover:bg-pink-50 hover:text-pink-500 active:scale-95'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                <span
                  className={`text-[10px] leading-none text-center ${active ? 'font-bold' : 'font-medium'}`}
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
