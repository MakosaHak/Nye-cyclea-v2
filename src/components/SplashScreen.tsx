import { useEffect, useState } from 'react';

export function SplashScreen() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-white">
            {/* Soft Premium Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-rose-50/50 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pink-50/50 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

            <div className={`relative z-10 flex flex-col items-center transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Minimalist Logo Container */}
                <div className="relative mb-10">
                    {/* Outer Glow */}
                    <div className="absolute inset-0 bg-rose-200/30 rounded-[40px] blur-3xl animate-soft-glow" />
                    
                    {/* Logo Frame */}
                    <div className="relative w-32 h-32 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(251,113,133,0.15)] flex items-center justify-center border border-rose-50/50 overflow-hidden">
                        <img 
                            src="/icons/pwa-192x192.png" 
                            alt="Logo Nye Cyclea" 
                            className="w-24 h-24 object-contain"
                        />
                        {/* Glass shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-shine-fast" />
                    </div>
                </div>

                {/* Styled Brand Name */}
                <div className="flex flex-col items-center gap-1">
                    <h1 className="text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-rose-500 to-pink-600 drop-shadow-sm"
                        style={{ fontFamily: 'var(--font-brand)' }}>
                        Nye Cyclea
                    </h1>
                    <div className="flex items-center gap-3 w-full px-2">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-300">Premium</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
                    </div>
                </div>
            </div>

            {/* Bottom Signature */}
            <div className={`absolute bottom-12 transition-all duration-1000 delay-500 ${mounted ? 'opacity-30' : 'opacity-0'}`}>
                <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-gray-400">Pure Harmonie</span>
            </div>

            <style>{`
                @keyframes soft-glow {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                }
                @keyframes shine-fast {
                    0% { transform: translateX(-150%) skewX(-25deg); }
                    50%, 100% { transform: translateX(150%) skewX(-25deg); }
                }
                .animate-soft-glow {
                    animation: soft-glow 4s infinite ease-in-out;
                }
                .animate-shine-fast {
                    animation: shine-fast 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}

