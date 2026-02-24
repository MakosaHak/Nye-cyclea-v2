export type ChatMode = 'online' | 'offline';

export const getChatMode = (): ChatMode => {
  try {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine ? 'online' : 'offline';
    }
  } catch {}
  return 'offline';
};

export const onConnectivityChange = (cb: (mode: ChatMode) => void) => {
  const handler = () => cb(getChatMode());
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
};
