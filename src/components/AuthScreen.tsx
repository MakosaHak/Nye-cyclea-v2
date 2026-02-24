import { useState } from 'react';
import { ArrowRight, UserX } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AuthData } from '../types';
import { supabase } from '../lib/supabase';
import { SubscriptionService } from '../services/subscriptionService';

interface AuthScreenProps {
  onLogin: () => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Champs requis');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    // Sanitize username for email (remove spaces)
    const sanitizedUsername = username.toLowerCase().trim().replace(/\s+/g, '');
    // Using a more "formal" format to satisfy strict validators
    const shadowEmail = `user.${sanitizedUsername}@nyecyclea.com`;

    try {
      if (mode === 'signup') {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: shadowEmail,
          password,
          options: {
            data: { username },
          },
        });

        if (signupError) {
          console.error('Signup Error:', signupError);
          throw signupError;
        }
        if (!data.user) {
          throw new Error('Erreur lors de la création du compte');
        }

        // Fetch initial profile (will be 'free' by default via trigger)
        const sub = await SubscriptionService.getSubscriptionStatus(data.user.id);

        onLogin();
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: shadowEmail,
          password,
        });

        if (loginError) {
          console.error('Login Error:', loginError);
          throw loginError;
        }
        if (!data.user) {
          throw new Error('Connexion échouée');
        }

        const sub = await SubscriptionService.getSubscriptionStatus(data.user.id);

        const authData: AuthData = {
          id: data.user.id,
          username,
          isAnonymous: false,
          createdAt: new Date().toISOString(),
          subscriptionType: sub.subscription_type as any,
          subscriptionExpiry: sub.subscription_expiry,
        };
        await StorageService.setAuth(authData);
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    }
  };

  const handleAnonymousLogin = async () => {
    const authData: AuthData = {
      id: crypto.randomUUID(),
      username: `anonymous_${Date.now()}`,
      isAnonymous: true,
      createdAt: new Date().toISOString(),
    };

    await StorageService.setAuth(authData);
    onLogin();
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #fafafa 0%, #f6f7fb 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.08 }}></div>
      <div
        className="relative w-full max-w-md rounded-3xl shadow-2xl p-8 md:p-10"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8edff 60%, #ffe9f5 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          boxShadow: '0 18px 44px rgba(109, 40, 217, 0.18)',
        }}
      >
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/70 border border-white/80 flex items-center justify-center shadow-md">
            <img
              src="/icons/pwa-192x192.png"
              alt="Nye Cyclea"
              className="w-12 h-12 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span
              className="text-2xl leading-none -ml-1 text-pink-600"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              Nye Cyclea
            </span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/60 border border-white/70">
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`${mode === 'login' ? 'bg-white shadow-sm' : 'bg-transparent'} h-11 rounded-xl text-sm font-medium transition`}
          >
            Connexion
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`${mode === 'signup' ? 'bg-white shadow-sm' : 'bg-transparent'} h-11 rounded-xl text-sm font-medium transition`}
          >
            Inscription
          </button>
        </div>

        <div className="space-y-1 mb-6 text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </h2>
          <p className="text-slate-500 text-xs">Simple et rapide</p>
        </div>

        {error && (
          <div className="mb-4 p-2 rounded-lg border border-rose-100 bg-rose-50 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {mode === 'login' || mode === 'signup' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Pseudonyme / Identifiant
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Luna77"
                className="w-full h-12 px-4 rounded-2xl border border-pink-200 bg-white text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-2xl border border-pink-200 bg-white text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition"
              />
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Confirmation
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 rounded-2xl border border-pink-200 bg-white text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full h-12 rounded-2xl text-white font-medium transition flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(90deg, #fb7185 0%, #f472b6 100%)',
                boxShadow: '0 10px 22px rgba(244,114,182,0.22)',
              }}
            >
              <span>{mode === 'login' ? 'Se connecter' : "S'inscrire"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
