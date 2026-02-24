import { createRoot } from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { NotificationService } from './services/notificationService';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with automatic updates
registerSW({
  onNeedRefresh() {
    if (confirm('Une nouvelle version est disponible. Voulez-vous mettre à jour ?')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('L\'application est prête pour le mode hors-ligne.');
  },
});

// Register periodic background sync for notifications
NotificationService.registerPeriodicSync();

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>
);
