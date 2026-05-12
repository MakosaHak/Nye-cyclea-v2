import { PredictionService } from './predictionService';
import { StorageService } from './storageService';

export class NotificationService {
  private static readonly STORAGE_KEY = 'last_notification_date';

  /**
   * Demande la permission d'envoyer des notifications
   */
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications.');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Envoie une notification immédiate
   */
  static async sendNotification(
    title: string,
    body: string,
    icon: string = '/icons/pwa-192x192.png'
  ) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      // Utiliser le Service Worker pour l'envoi (plus fiable pour les PWA)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon,
            badge: icon,
            tag: 'cycle-update',
            vibrate: [100, 50, 100],
            data: { url: '/' },
          } as any);
          return;
        }
      }

      // Fallback pour les navigateurs sans SW ou hors PWA
      new Notification(title, {
        body,
        icon,
        tag: 'cycle-update',
      });
    } catch (e) {
      // Silently fail or use a simple fallback if really necessary
      try {
        new Notification(title, { body });
      } catch (err) {}
    }
  }

  /**
   * Enregistre la synchronisation périodique pour les notifications en arrière-plan
   */
  static async registerPeriodicSync() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;

      // @ts-expect-error PeriodicSync is not yet in standard lib
      if ('periodicSync' in registration) {
        try {
          // @ts-expect-error PeriodicSync is not yet in standard lib
          await registration.periodicSync.register('daily-cycle-update', {
            minInterval: 24 * 60 * 60 * 1000, // 1 jour
          });
          console.log('[Notification] Periodic sync registered');
        } catch (e) {
          console.warn('Periodic Sync non disponible ou app non installée.');
        }
      }

      // Fallback: Envoyer un message au SW pour démarrer le scheduler
      if (registration.active) {
        registration.active.postMessage({
          type: 'START_SCHEDULER',
        });
      }
    } catch (e) {
      console.error('Erreur registration sync', e);
    }
  }

  /**
   * Vérifie s'il faut envoyer une notification immédiate au lancement
   */
  static checkDailyNotification() {
    if (Notification.permission !== 'granted') return;

    const todayDate = new Date();
    const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    const lastNotif = localStorage.getItem(this.STORAGE_KEY);

    if (lastNotif === today) return;

    const cycles = StorageService.getCycles();
    if (cycles.length === 0) return;

    const phase = PredictionService.getCurrentPhase(cycles);
    const prediction = PredictionService.predictNextCycle(cycles);
    if (!phase) return;

    // Priority 1: Predicted Period
    const daysUntilPeriod = prediction?.predictedStart
      ? this.calculateDaysBetween(today, prediction.predictedStart)
      : 100;

    let title = '';
    let body = '';

    if (daysUntilPeriod <= 3 && daysUntilPeriod >= 0) {
      title =
        daysUntilPeriod === 0
          ? "Vos règles commencent aujourd'hui"
          : `Règles prévues dans ${daysUntilPeriod} jour${daysUntilPeriod > 1 ? 's' : ''}`;
      body = 'Préparez-vous, votre nouveau cycle commence bientôt. 🌸';
    } else if (phase.phase === 'ovulation') {
      title = `Jour ${phase.dayOfCycle} : Ovulation`;
      body = "Pic de fertilité aujourd'hui ! 🥚✨";
    } else {
      const phaseNames: Record<string, string> = {
        menstruation: 'Règles',
        follicular: 'Phase folliculaire',
        ovulation: 'Ovulation',
        luteal: 'Phase lutéale',
      };
      title = `Jour ${phase.dayOfCycle} : ${phaseNames[phase.phase] || 'Cycle'}`;

      if (phase.phase === 'menstruation') body = 'Jour de repos et de soin. ☕';
      else if (phase.phase === 'follicular') body = "L'énergie revient. Profitez-en ! 💪";
      else if (phase.phase === 'luteal') body = 'Moment de calme et de douceur. 🧘';
      else body = "Consultez l'app pour vos prévisions.";
    }

    this.sendNotification(title, body);
    localStorage.setItem(this.STORAGE_KEY, today);
  }

  /**
   * Déclenche une notification de test immédiate via le Service Worker
   */
  static async triggerTestNotification(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'CHECK_NOTIFICATIONS',
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('[Notification] Error triggering test:', e);
      return false;
    }
  }

  private static calculateDaysBetween(d1: string, d2: string): number {
    const one = new Date(d1);
    const [y, m, d] = d2.split('-').map(Number);
    const two = new Date(y, m - 1, d);
    const diff = two.getTime() - one.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }
}
