import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Crown, RotateCcw, Send, Shield, WifiOff } from 'lucide-react';
import { ProBadge } from './ProBadge';
import { useCyclesContext } from '../contexts/CyclesContext';
import {
  askNyeAi,
  canUseCloudAi,
  OFFLINE_FAQ,
  OFFLINE_TYPED_REPLY,
  type OfflineFaqItem,
} from '../services/nyeAiService';
import { StorageService } from '../services/storageService';
import { SubscriptionService } from '../services/subscriptionService';
import { ensureSupabaseSession } from '../lib/supabase';
import type { ChatMessage } from '../types';

const STORAGE_KEY = 'nye_ai_chat_v2';

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function welcomeMessage(cloudReady: boolean): ChatMessage {
  return {
    id: newId(),
    role: 'assistant',
    content: cloudReady
      ? 'Bonjour ! Je suis NyeAI. Écris ta question sur ton cycle ou ton bien-être, ou choisis une question rapide en bas. Je ne remplace pas un avis médical.'
      : 'Bonjour ! Je suis NyeAI. Je suis hors ligne pour le moment, mais tu peux choisir une question rapide en bas pour une réponse immédiate.',
    createdAt: new Date().toISOString(),
  };
}

function loadHistory(cloudReady: boolean): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [welcomeMessage(cloudReady)];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.length > 0 ? parsed : [welcomeMessage(cloudReady)];
  } catch {
    return [welcomeMessage(cloudReady)];
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function BotAvatar() {
  return (
    <div className="nye-chat-avatar" aria-hidden>
      <Bot width={20} height={20} strokeWidth={2} />
    </div>
  );
}
/**
 * Espace disponible entre l'en-tête et la barre de navigation de l'app.
 * Le chat s'y ancre en position fixe : la barre de saisie reste toujours visible,
 * et remonte au-dessus du clavier virtuel sur mobile.
 */
function useChatBounds(): { top: number; bottom: number } {
  const [bounds, setBounds] = useState({ top: 73, bottom: 72 });

  useLayoutEffect(() => {
    const header = document.querySelector('header');
    const nav = document.querySelector('nav[aria-label="Navigation principale"]');
    const vv = window.visualViewport;

    const measure = () => {
      const top = header?.getBoundingClientRect().height ?? 73;
      const navHeight = nav?.getBoundingClientRect().height ?? 72;
      const keyboard = vv ? window.innerHeight - vv.height - vv.offsetTop : 0;
      const bottom = keyboard > 120 ? keyboard : navHeight;
      setBounds((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
    };

    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (header) ro?.observe(header);
    if (nav) ro?.observe(nav);
    window.addEventListener('resize', measure);
    vv?.addEventListener('resize', measure);
    vv?.addEventListener('scroll', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
      vv?.removeEventListener('resize', measure);
      vv?.removeEventListener('scroll', measure);
    };
  }, []);

  return bounds;
}

export function NyeAiChat() {
  const bounds = useChatBounds();
  const { cycles, stats } = useCyclesContext();
  const auth = StorageService.getAuth();
  const [isPremium, setIsPremium] = useState(() =>
    SubscriptionService.isPremium(auth?.subscriptionType)
  );

  const [networkOnline, setNetworkOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine
  );
  const [cloudSessionOk, setCloudSessionOk] = useState(true);

  const cloudReady = canUseCloudAi(isPremium) && networkOnline && cloudSessionOk;

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory(cloudReady));
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOnline = () => {
      setNetworkOnline(true);
      setCloudSessionOk(true);
    };
    const onOffline = () => setNetworkOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Rafraîchir statut Pro + session Supabase à l'ouverture de NyeAI
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const localAuth = StorageService.getAuth();
      if (!localAuth || localAuth.isAnonymous) return;

      await ensureSupabaseSession();

      try {
        const sub = await SubscriptionService.getSubscriptionStatus(localAuth.id);
        if (cancelled) return;
        const refreshed = {
          ...localAuth,
          subscriptionType: sub.subscription_type as typeof localAuth.subscriptionType,
          subscriptionExpiry: sub.subscription_expiry ?? undefined,
        };
        await StorageService.setAuth(refreshed);
        setIsPremium(SubscriptionService.isPremium(refreshed.subscriptionType));
      } catch (e) {
        console.warn('[NyeAI] Sync subscription failed', e);
      }
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  /** Question FAQ hors ligne — réponse instantanée, sans appel réseau */
  const pickOfflineQuestion = useCallback((item: OfflineFaqItem) => {
    if (typing) return;
    const userMsg: ChatMessage = {
      id: newId(),
      role: 'user',
      content: item.question,
      createdAt: new Date().toISOString(),
    };
    const botMsg: ChatMessage = {
      id: newId(),
      role: 'assistant',
      content: item.answer,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  }, [typing]);

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || typing) return;

      const userMsg: ChatMessage = {
        id: newId(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setTyping(true);

      try {
        const history = [...messages, userMsg];
        const { text: reply, cloud, failReason } = await askNyeAi(content, history, {
          isPremium,
          stats,
          cycles,
        });

        // Une réponse cloud confirme la session ; une panne passagère du service
        // ne doit pas basculer tout le chat en « hors ligne ».
        if (cloud) setCloudSessionOk(true);

        const botMsg: ChatMessage = {
          id: newId(),
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);

        if (failReason === 'session' && isPremium) {
          setCloudSessionOk(false);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: OFFLINE_TYPED_REPLY,
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setTyping(false);
        inputRef.current?.focus();
      }
    },
    [typing, messages, isPremium, stats, cycles]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const resetChat = () => {
    const fresh = [welcomeMessage(cloudReady)];
    setMessages(fresh);
    setCloudSessionOk(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  return (
    <div className="nye-chat" style={{ top: bounds.top, bottom: bounds.bottom }}>
      <div className="nye-chat-inner">
        {/* Hero compact */}
        <div className="nye-chat-hero">
          <div className="nye-chat-hero-icon">
            <Bot width={24} height={24} strokeWidth={2} />
          </div>
          <div className="nye-chat-hero-text">
            <h1 className="nye-chat-hero-title" style={{ fontFamily: 'var(--font-brand)' }}>
              NyeAI
              {isPremium && <ProBadge size="sm" />}
            </h1>
            <p className="nye-chat-hero-status">
              {!cloudReady && <WifiOff width={12} height={12} strokeWidth={2.25} />}
              <span>
                {cloudReady
                  ? 'En ligne — pose ta question librement'
                  : 'Hors ligne — réponses rapides disponibles'}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={resetChat}
            className="nye-chat-reset"
            title="Nouvelle conversation"
            aria-label="Nouvelle conversation"
          >
            <RotateCcw width={16} height={16} />
          </button>
        </div>

        {/* Messages — seule zone qui défile */}
        <div className="nye-chat-messages">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`nye-chat-row ${isUser ? 'is-user' : 'is-bot'}`}>
                {!isUser && <BotAvatar />}
                <div className="nye-chat-bubble-wrap">
                  <div className="nye-chat-bubble">{m.content}</div>
                  <span className="nye-chat-time">{formatTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="nye-chat-row is-bot">
              <BotAvatar />
              <div className="nye-chat-bubble nye-chat-typing" aria-label="NyeAI écrit…">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Dock bas — toujours visible : questions rapides + barre de saisie */}
        <div className="nye-chat-dock">
          <div className="nye-chat-chips" role="list" aria-label="Questions rapides">
            {!isPremium && (
              <Link to="/subscribe" role="listitem" className="nye-chat-chip is-pro">
                <Crown width={14} height={14} />
                Passer Pro
              </Link>
            )}
            {OFFLINE_FAQ.map((item) => (
              <button
                key={item.id}
                type="button"
                role="listitem"
                title={item.question}
                disabled={typing}
                onClick={() => pickOfflineQuestion(item)}
                className="nye-chat-chip"
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="nye-ai-composer nye-chat-composer">
            <input
              ref={inputRef}
              type="text"
              enterKeyHint="send"
              className="nye-ai-composer-input nye-chat-input"
              placeholder={cloudReady ? 'Pose ta question…' : 'Choisis une question rapide…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              autoCorrect="on"
              spellCheck={false}
              aria-label="Message à NyeAI"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="nye-chat-send"
              aria-label="Envoyer"
            >
              <Send width={20} height={20} strokeWidth={2.25} />
            </button>
          </form>
          <p className="nye-chat-disclaimer">
            <Shield width={12} height={12} aria-hidden />
            <span>Informations éducatives — ne remplace pas un avis médical</span>
          </p>
        </div>
      </div>
    </div>
  );
}