import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone 
            || document.referrer.includes('android-app://');
            
        if (isStandalone) {
            setIsInstalled(true);
        }

        const handler = (e: Event) => {
            console.log('[PWA] beforeinstallprompt event fired');
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        const installedHandler = () => {
            console.log('[PWA] appinstalled event fired');
            setIsInstalled(true);
            setIsInstallable(false);
            setInstallPrompt(null);
        };

        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const installApp = async () => {
        if (!installPrompt) {
            console.warn('[PWA] Install prompt not available');
            return false;
        }

        try {
            // Show the install prompt
            await installPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await installPrompt.userChoice;
            console.log(`[PWA] User response to install prompt: ${outcome}`);

            if (outcome === 'accepted') {
                setInstallPrompt(null);
                setIsInstallable(false);
                return true;
            }
        } catch (error) {
            console.error('[PWA] Installation failed:', error);
        }
        
        return false;
    };

    return { isInstallable, isInstalled, installApp };
}
