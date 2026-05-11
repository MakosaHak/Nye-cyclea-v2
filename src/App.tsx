import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthData } from './types';
import { NotificationService } from './services/notificationService';
import { StorageService } from './services/storageService';
import { SubscriptionService } from './services/subscriptionService';
import { supabase } from './lib/supabase';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster, toast } from 'sonner';
import { ConfirmDialog } from './components/ConfirmDialog';
import { SplashScreen } from './components/SplashScreen';

// Lazy loaded components
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Calendar = lazy(() => import('./components/Calendar').then(m => ({ default: m.Calendar })));
const CycleHistory = lazy(() => import('./components/CycleHistory').then(m => ({ default: m.CycleHistory })));
const AddCycle = lazy(() => import('./components/AddCycle').then(m => ({ default: m.AddCycle })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const MedicalInfo = lazy(() => import('./components/MedicalInfo').then(m => ({ default: m.MedicalInfo })));
const AuthScreen = lazy(() => import('./components/AuthScreen').then(m => ({ default: m.AuthScreen })));
const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })));
const SubscriptionScreen = lazy(() => import('./components/SubscriptionScreen').then(m => ({ default: m.SubscriptionScreen })));

const LoadingFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff5f7' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #fda4af', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />
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
      // Artificial delay to show the beautiful splash screen (2 seconds)
      const splashPromise = new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        await Promise.all([
            StorageService.ensureReady(),
            splashPromise
        ]);
      } catch (e) {
        // If IndexedDB fails (e.g. private mode on iOS), continue anyway
        console.warn('Storage init failed, continuing:', e);
      }

      const data = StorageService.getAuth();
      if (data) {
        setIsAuthenticated(true);
        setAuthData(data);
        setIsPremium(SubscriptionService.isPremium(data.subscriptionType));
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

  // Show professional Splash Screen while app initializes
  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <AuthScreen onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      <Suspense fallback={<SplashScreen />}>
        <Routes>
          <Route element={<Layout onAddCycle={() => setShowAddCycle(true)} isPremium={isPremium} />}>
            <Route path="/" element={<Dashboard onAddCycle={() => setShowAddCycle(true)} />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/calendar" element={<Calendar onAddCycle={() => setShowAddCycle(true)} />} />
            <Route path="/history" element={<CycleHistory />} />
            <Route path="/medical" element={<MedicalInfo />} />
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
