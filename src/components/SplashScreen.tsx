import { Heart } from 'lucide-react';

export function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #fff5f7 0%, #fff1f2 50%, #fdf4ff 100%)' }}>
            
            {/* Animated background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-pink-200/20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-200/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md animate-in fade-in zoom-in duration-1000">
                {/* Logo Section */}
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-pink-400/20 rounded-full blur-2xl group-hover:bg-pink-400/30 transition-all duration-700 animate-bounce-subtle" />
                    <div className="relative w-28 h-28 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-white/50 overflow-hidden transform hover:scale-105 transition-transform duration-500">
                        <img 
                            src="/icons/pwa-192x192.png" 
                            alt="Logo Nye Cyclea" 
                            className="w-20 h-20 object-contain drop-shadow-md"
                        />
                    </div>
                </div>

                {/* App Name */}
                <h1 className="text-4xl font-extrabold text-pink-600 mb-4 tracking-tight" style={{ fontFamily: 'var(--font-brand)' }}>
                    Nye Cyclea
                </h1>

                {/* Description */}
                <div className="space-y-4">
                    <p className="text-lg font-bold text-gray-700 leading-relaxed italic">
                        Votre compagnon bien-être au quotidien.
                    </p>
                    <div className="w-12 h-1 bg-pink-300 mx-auto rounded-full" />
                    <p className="text-sm text-gray-500 font-medium leading-loose px-4">
                        Suivez votre cycle, anticipez vos besoins et vivez chaque phase avec sérénité grâce à une approche respectueuse de votre intimité.
                    </p>
                </div>

                {/* Loading Indicator */}
                <div className="mt-12 flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-2 h-2 rounded-full bg-pink-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 rounded-full bg-pink-200 animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="absolute bottom-[-150px] w-full flex flex-col items-center opacity-40">
                    <Heart className="w-5 h-5 text-pink-400 mb-2" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400">Harmonie & Santé</span>
                </div>
            </div>

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
