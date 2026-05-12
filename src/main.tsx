import { createRoot } from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { NotificationService } from './services/notificationService';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

// Register Service Worker with automatic updates
registerSW({
  onNeedRefresh() {
    toast('🆕 Une nouvelle version est disponible !', {
      action: {
        label: 'Mettre à jour',
        onClick: () => window.location.reload(),
      },
      duration: Infinity,
    });
  },
  onOfflineReady() {
    console.log("L'application est prête pour le mode hors-ligne.");
  },
});

// Register periodic background sync for notifications
NotificationService.registerPeriodicSync();

import { CyclesProvider } from './contexts/CyclesContext';

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <CyclesProvider>
      <App />
    </CyclesProvider>
  </HashRouter>
);
