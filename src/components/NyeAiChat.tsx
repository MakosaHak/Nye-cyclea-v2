import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Crown, RotateCcw, Send, Shield } from 'lucide-react';
import { ProBadge } from './ProBadge';
import { useCyclesContext } from '../contexts/CyclesContext';
import { askNyeAi, NYE_AI_SUGGESTIONS } from '../services/nyeAiService';
import { StorageService } from '../services/storageService';
import { SubscriptionService } from '../services/subscriptionService';
import type { ChatMessage } from '../types';

const STORAGE_KEY = 'nye_ai_chat_v2';

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function welcomeMessage(): ChatMessage {
  return {
    id: newId(),
    role: 'assistant',
    content:
      'Bonjour ! Je suis NyeAI, ton assistante éducative sur le cycle et le bien-être. Choisis une suggestion ci-dessous ou écris ta question — je ne remplace pas un avis médical.',
    createdAt: new Date().toISOString(),
  };
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [welcomeMessage()];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.length > 0 ? parsed : [welcomeMessage()];
  } catch {
    return [welcomeMessage()];
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function BotAvatar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-10 h-10 min-w-10 min-h-10 aspect-square rounded-full bg-pink-100 flex items-center justify-center shrink-0 ${className}`}
      aria-hidden
    >
      <Bot className="w-5 h-5 text-pink-600" strokeWidth={2} />
    </div>
  );
}

export function NyeAiChat() {
  const { cycles, stats } = useCyclesContext();
  const auth = StorageService.getAuth();
  const isPremium = SubscriptionService.isPremium(auth?.subscriptionType);

  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

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
        const { text: reply, source } = await askNyeAi(content, history, {
          isPremium,
          stats,
          cycles,
        });

        let finalText = reply;
        if (!isPremium && source === 'local') {
          finalText = `${reply}\n\n— Réponses éducatives intégrées. Passe à Nye Cyclea Pro pour des échanges personnalisés avec l'IA en ligne.`;
        }

        const botMsg: ChatMessage = {
          id: newId(),
          role: 'assistant',
          content: finalText,
          createdAt: new Date().toISOString(),
          source,
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: 'Désolée, un petit souci technique. Réessaie dans un instant.',
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
    const fresh = [welcomeMessage()];
    setMessages(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  const showSuggestions = messages.length <= 1 && !typing;

  return (
    <div className="flex flex-col -mx-4 -mt-2 min-h-[calc(100dvh-9rem)] max-h-[calc(100dvh-9rem)]">
      {/* Hero */}
      <div
        className="relative mx-4 mt-2 overflow-hidden rounded-3xl p-5 text-white shadow-xl border border-white/20 shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.78), rgba(236, 72, 153, 0.74), rgba(168, 85, 247, 0.7))',
          boxShadow: '0 8px 32px rgba(244, 63, 94, 0.14)',
        }}
      >
        <div
          className="absolute -top-10 -right-6 w-36 h-36 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 min-w-14 min-h-14 aspect-square rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Bot className="w-7 h-7" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl font-bold leading-tight flex items-center gap-2 flex-wrap"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                NyeAI
                {isPremium ? (
                  <ProBadge size="sm" />
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                    Mode éducatif
                  </span>
                )}
              </h1>
              <p className="text-xs text-white/90 mt-1 leading-snug">
                {isPremium
                  ? 'IA en ligne avec le contexte de tes cycles'
                  : 'Questions sur ton cycle, tes règles et ton bien-être'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetChat}
            className="shrink-0 p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
            title="Nouvelle conversation"
            aria-label="Nouvelle conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isUser && <BotAvatar className="mt-0.5" />}
              <div
                className={`max-w-[85%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'text-white rounded-2xl rounded-br-md shadow-sm'
                      : 'glass-card text-gray-800 rounded-2xl rounded-bl-md !rounded-bl-md border-pink-100/80'
                  }`}
                  style={
                    isUser
                      ? {
                          background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
                          boxShadow: '0 3px 12px rgba(236, 72, 153, 0.2)',
                        }
                      : undefined
                  }
                >
                  {m.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1 flex items-center gap-1.5">
                  {formatTime(m.createdAt)}
                  {!isUser && m.source === 'online' && (
                    <span className="text-emerald-600/80 font-medium">IA en ligne</span>
                  )}
                  {!isUser && m.source === 'local' && isPremium && (
                    <span className="text-amber-600/80 font-medium">Mode local</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {NYE_AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void sendMessage(s)}
                className="text-xs font-medium px-3 py-2 rounded-full bg-white/80 border border-pink-100 text-pink-700 hover:bg-pink-50 active:scale-[0.98] transition-all shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {typing && (
          <div className="flex gap-2.5 items-start">
            <BotAvatar className="mt-0.5" />
            <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-300 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:120ms]" />
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:240ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Pro banner (free) */}
      {!isPremium && (
        <div className="px-4 pb-2 shrink-0">
          <Link
            to="/subscribe"
            className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/80 hover:border-amber-200 transition-colors"
          >
            <Crown className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-gray-700 leading-snug">
              <span className="font-semibold text-amber-800">Nye Cyclea Pro</span> — conversations IA
              plus riches, avec le contexte de tes cycles.
            </p>
          </Link>
        </div>
      )}

      {/* Zone de saisie */}
      <div className="shrink-0 px-3 sm:px-4 pt-2 pb-2 bg-transparent">
        <form
          onSubmit={handleSubmit}
          className="nye-ai-composer flex items-center gap-3 w-full rounded-2xl bg-white px-3 py-2.5 shadow-md shadow-pink-100/50"
        >
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="send"
            className="nye-ai-composer-input flex-1 h-10 py-0 px-0.5 sm:px-1 bg-transparent text-gray-800 text-[15px] leading-normal placeholder:text-gray-400 min-w-0"
            placeholder="Pose ta question…"
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
            className="w-[3.25rem] h-[3.25rem] rounded-full text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 [-webkit-tap-highlight-color:transparent]"
            style={{
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              boxShadow: '0 4px 18px rgba(244, 63, 94, 0.42)',
            }}
            aria-label="Envoyer"
          >
            <Send className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </form>
        <p className="flex items-start justify-center gap-1.5 mt-4 pt-1 pb-1 text-[11px] leading-snug text-center text-gray-500/25">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-px text-gray-500/25" aria-hidden />
          <span>Informations éducatives — ne remplace pas un avis médical</span>
        </p>
      </div>
    </div>
  );
}
