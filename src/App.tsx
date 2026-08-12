import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthData } from './types';
import { NotificationService } from './services/notificationService';
import { StorageService } from './services/storageService';
import { SubscriptionService } from './services/subscriptionService';
import { supabase, ensureSupabaseSession } from './lib/supabase';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster, toast } from 'sonner';
import { ConfirmDialog } from './components/ConfirmDialog';

// Lazy loaded components
const Dashboard = lazy(() =>
  import('./components/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const Calendar = lazy(() => import('./components/Calendar').then((m) => ({ default: m.Calendar })));
const AddCycle = lazy(() => import('./components/AddCycle').then((m) => ({ default: m.AddCycle })));
const Settings = lazy(() => import('./components/Settings').then((m) => ({ default: m.Settings })));
const MedicalInfo = lazy(() =>
  import('./components/MedicalInfo').then((m) => ({ default: m.MedicalInfo }))
);
const AuthScreen = lazy(() =>
  import('./components/AuthScreen').then((m) => ({ default: m.AuthScreen }))
);
const Layout = lazy(() => import('./components/Layout').then((m) => ({ default: m.Layout })));
const SubscriptionScreen = lazy(() =>
  import('./components/SubscriptionScreen').then((m) => ({ default: m.SubscriptionScreen }))
);
const NyeAiChat = lazy(() =>
  import('./components/NyeAiChat').then((m) => ({ default: m.NyeAiChat }))
);
const HealthHub = lazy(() => import('./components/HealthHub').then((m) => ({ default: m.HealthHub })));

const LoadingFallback = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff5f7',
    }}
  >
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '3px solid #fda4af',
        borderTopColor: '#f43f5e',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for StorageService to initialize (IndexedDB is async on iOS)
    const init = async () => {
      try {
        await StorageService.ensureReady();
      } catch (e) {
        // If IndexedDB fails (e.g. private mode on iOS), continue anyway
        console.warn('Storage init failed, continuing:', e);
      }

      // Check for local auth session FIRST (Offline First)
      const data = StorageService.getAuth();
      if (data) {
        setIsAuthenticated(true);
        setAuthData(data);
        setIsPremium(SubscriptionService.isPremium(data.subscriptionType));

        // Rafraîchir session Supabase + statut Pro (requis pour NyeAI cloud)
        if (!data.isAnonymous) {
          await ensureSupabaseSession();
          try {
            const sub = await SubscriptionService.getSubscriptionStatus(data.id);
            const refreshedAuth: AuthData = {
              ...data,
              subscriptionType: sub.subscription_type as AuthData['subscriptionType'],
              subscriptionExpiry: sub.subscription_expiry ?? undefined,
            };
            await StorageService.setAuth(refreshedAuth);
            setAuthData(refreshedAuth);
            setIsPremium(SubscriptionService.isPremium(refreshedAuth.subscriptionType));
          } catch (e) {
            console.warn('Subscription refresh failed:', e);
          }
        }
      } else {
        // Optionally verify Supabase session if online
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const user = sessionData.session.user;
          // Reconstruct auth data from Supabase session
          const sub = await SubscriptionService.getSubscriptionStatus(user.id);
          const restoredAuth: AuthData = {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
            isAnonymous: false,
            createdAt: user.created_at,
            subscriptionType: sub.subscription_type as any,
            subscriptionExpiry: sub.subscription_expiry,
          };
          
          await StorageService.setAuth(restoredAuth);
          setAuthData(restoredAuth);
          setIsPremium(SubscriptionService.isPremium(restoredAuth.subscriptionType));
          setIsAuthenticated(true);
        }
      }

      setIsLoading(false);

      // Vérifier les notifications quotidiennes au démarrage
      NotificationService.checkDailyNotification();
    };

    init();
  }, []);

  const handleLogin = () => {
    const data = StorageService.getAuth();
    if (data) {
      setAuthData(data);
      setIsPremium(SubscriptionService.isPremium(data.subscriptionType));
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await supabase.auth.signOut();
    StorageService.clearAuth();
    setIsAuthenticated(false);
    setAuthData(null);
    setIsPremium(false);
    toast.success('Déconnexion réussie ✓');
    navigate('/');
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AuthScreen onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            element={<Layout onAddCycle={() => setShowAddCycle(true)} isPremium={isPremium} />}
          >
            <Route path="/" element={<Dashboard onAddCycle={() => setShowAddCycle(true)} />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route
              path="/calendar"
              element={<Calendar onAddCycle={() => setShowAddCycle(true)} />}
            />
            <Route path="/hub" element={<HealthHub />} />
            <Route path="/history" element={<Navigate to="/hub?tab=history" replace />} />
            <Route path="/medical" element={<MedicalInfo />} />
            <Route path="/analytics" element={<Navigate to="/hub" replace />} />
            <Route path="/chat" element={<NyeAiChat />} />
            <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
          </Route>
          <Route path="/subscribe" element={<SubscriptionScreen />} />
        </Routes>

        {/* Add Cycle Modal */}
        {showAddCycle && <AddCycle onClose={() => setShowAddCycle(false)} />}

        {/* Logout Confirm Dialog */}
        <ConfirmDialog
          isOpen={showLogoutConfirm}
          title="Se déconnecter ?"
          message="Vous allez être déconnectée. Vos données locales restent sur cet appareil."
          confirmLabel="Se déconnecter"
          cancelLabel="Rester connectée"
          variant="warning"
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
