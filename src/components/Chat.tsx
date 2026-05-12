import { useEffect, useRef, useState } from 'react';
import { Send, Wifi, WifiOff, User, Bot, Sparkles } from 'lucide-react';
import { getChatMode, onConnectivityChange } from '../services/chatModeService';
import { localSearch } from '../services/chatSearchService';
import { onlineAIAnswer } from '../services/chatAiService';
import { applyHealthSafety, enforceHealthRules } from '../services/chatSafetyService';
import { getInitialKBData } from '../services/chatLocalKB';
import { StorageService } from '../services/storageService';
import type { ChatMessage } from '../types/chat';

function uuid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function Chat() {
  const [mode, setMode] = useState<'online' | 'offline'>(getChatMode());
  const auth = StorageService.getAuth();
  const isPremium = auth?.subscriptionType === 'monthly' || auth?.subscriptionType === 'yearly';
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem('nye_chat_history');
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const off = onConnectivityChange(setMode);
    StorageService.initChatDB(getInitialKBData()).catch(console.error); // Initialize DB immediately with data
    return () => off();
  }, []);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) {
        const welcome: ChatMessage = {
          id: uuid(),
          role: 'assistant',
          content:
            'Bonjour ! Je suis Nye, votre assistante santé personnelle. \n\nJe suis là pour répondre à toutes vos questions sur votre cycle, votre bien-être, ou juste pour discuter. ✨',
          createdAt: new Date().toISOString(),
        };
        return [welcome];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('nye_chat_history', JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const content = input.trim();
    if (!content) {
      return;
    }

    const userMsg: ChatMessage = {
      id: uuid(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const blocked = enforceHealthRules(content);
    if (blocked) {
      const safe = applyHealthSafety(blocked);
      const botMsg: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content: safe,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
      return;
    }

    try {
      // New Async Local Search
      const localResults = await localSearch(content);

      // Should always return at least one result (fallback or real)
      const bestLocal = localResults && localResults.length > 0 ? localResults[0] : null;
      const localAnswer = bestLocal?.entry.answer || 'Je ne comprends pas.';
      const isFallback = bestLocal?.entry.id === 'fallback';

      await new Promise((r) => setTimeout(r, 600)); // Slight natural delay

      let text = localAnswer;

      // Online Hybrid Logic - Restricted to Premium
      if (mode === 'online' && isFallback) {
        if (isPremium) {
          try {
            const onlineResp = await onlineAIAnswer(content, [localAnswer]);
            if (onlineResp) {
              text = onlineResp;
            }
          } catch (e) {
            // Keep local fallback if online fails
            console.log('Online AI failed, using fallback');
          }
        } else {
          // Message for Free users hitting fallback
          text =
            'Désolé, je ne connais pas encore la réponse à cette question spécifique. \n\n✨ **Passez à Nye Cyclea Pro** pour plus de conseils personnalisés avec notre IA avancée !';
        }
      }

      const safeText = applyHealthSafety(text);
      const botMsg: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content: safeText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const botMsg: ChatMessage = {
        id: uuid(),
        role: 'assistant',
        content: "Désolé, j'ai eu un petit moment d'absence. Pouvez-vous répéter ?",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setTyping(false);
    }
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="flex flex-col w-full mx-auto bg-white shadow-xl overflow-hidden border border-gray-100 font-sans relative
            h-[calc(100vh-180px)] md:h-[80vh] 
            max-w-full md:max-w-4xl lg:max-w-5xl 
            rounded-3xl md:rounded-[40px]"
    >
      {/* Decorative Background Blurs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {/* Header */}
      <header className="px-6 py-5 bg-white/80 backdrop-blur-md border-b border-gray-50 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center border border-pink-100 shadow-sm overflow-hidden">
              <Sparkles className="w-6 h-6 text-pink-500" color="#ec4899" />
            </div>
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${mode === 'online' ? 'bg-emerald-400' : 'bg-gray-300'}`}
            ></div>
          </div>
          <div>
            <h1
              className="font-bold text-lg text-gray-800 tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              Nye Cyclea
            </h1>
            <span className="text-[11px] font-medium text-pink-500 uppercase tracking-wider">
              Assistant IA
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
          {mode === 'online' ? (
            <Wifi size={12} className="text-emerald-500" />
          ) : (
            <WifiOff size={12} className="text-gray-400" />
          )}
          <span className="text-[10px] font-semibold text-gray-500">
            {mode === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}
          </span>
        </div>
      </header>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth z-0 pb-24">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className="flex w-full"
              style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}
            >
              <div className={`flex max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 self-end">
                  {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center border border-purple-200">
                      <User size={16} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center border border-pink-100">
                      <Sparkles size={14} color="#ec4899" />
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div>
                  <div
                    className={`px-5 py-3 shadow-sm text-[15px] leading-relaxed relative group
                      ${
                        isUser
                          ? 'rounded-2xl rounded-tr-sm text-purple-950'
                          : 'rounded-2xl rounded-tl-sm text-gray-800'
                      }
                    `}
                    style={{
                      backgroundColor: isUser ? '#F3E8FF' : '#FFF0F3', // Solid Lavender vs Rose
                      border: isUser ? '1px solid #E9D5FF' : '1px solid #FFE4E6',
                    }}
                  >
                    {m.content}
                  </div>
                  <div
                    className={`text-[10px] mt-1 font-medium opacity-50 px-1 ${isUser ? 'text-right' : 'text-left'}`}
                  >
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="flex w-full justify-start">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                <Bot size={16} />
              </div>
              <div className="px-4 py-3 bg-rose-50 rounded-2xl rounded-tl-sm text-rose-400 text-xs font-medium animate-pulse">
                Nye est en train d'écrire...
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Final Robust Input Footer */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0 z-50 flex flex-col gap-2">
        <div className="text-[10px] text-gray-400 text-center px-4 leading-tight">
          Ces informations sont éducatives et ne remplacent pas un avis médical.
        </div>
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 rounded-full shadow-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-purple-200"
          style={{ backgroundColor: '#F3E8FF' }} // Soft Lavender
        >
          <input
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium px-4 h-12"
            style={{ color: '#6B21A8' }} // Dark Purple Text
            placeholder="Écrivez votre message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <style>{`input::placeholder { color: rgba(107, 33, 168, 0.5) !important; }`}</style>
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 mr-1 rounded-full bg-white flex items-center justify-center hover:bg-white/80 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            style={{ color: '#6B21A8' }}
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
