import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <div
        className={`flex flex-col items-center transition-all duration-1000 ease-in-out ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Small, Elegant Logo */}
        <div className="mb-6">
          <img
            src="/icons/pwa-192x192.png"
            alt="Logo"
            className="w-20 h-20 object-contain opacity-90"
          />
        </div>

        {/* Refined Brand Name */}
        <h1
          className="text-3xl font-light tracking-[0.2em] text-rose-600"
          style={{ fontFamily: 'var(--font-brand)' }}
        >
          Nye Cyclea
        </h1>

        {/* Subtle Loading Dot */}
        <div className="mt-8 flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-200 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-pink-200 animate-pulse delay-75" />
          <div className="w-1.5 h-1.5 rounded-full bg-pink-200 animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
}
