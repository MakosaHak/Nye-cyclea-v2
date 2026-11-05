import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_SYSTEM_PROMPT = `Tu es NyeAI, l'assistante bienveillante de Nye Cyclea (santé menstruelle et bien-être).

RÈGLES:
- Pas de diagnostic médical ni de prescription.
- Informations éducatives et générales uniquement.
- Symptômes graves ou urgence → conseiller un professionnel de santé ou les urgences.
- Français simple, chaleureux, adapté au contexte africain quand c'est pertinent.
- Réponses courtes (3 à 6 phrases sauf si l'utilisatrice demande plus de détails).`;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

type RequestBody = {
  prompt?: string;
  context?: string | string[];
  systemPrompt?: string;
  history?: ChatTurn[];
};

type AiResult = { text: string; provider: 'gemini' | 'groq'; model: string };

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isPremium(subscriptionType: string | null | undefined, expiry: string | null | undefined): boolean {
  if (
    subscriptionType !== 'monthly' &&
    subscriptionType !== 'yearly' &&
    subscriptionType !== 'pro'
  ) {
    return false;
  }
  if (!expiry) return true;
  return new Date(expiry) > new Date();
}

function buildSystemPrompt(body: RequestBody, contextText: string): string {
  const base = body.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;
  if (!contextText) return base;
  return `${base}\n\nContexte de suivi (données locales de l'utilisatrice, à utiliser avec prudence):\n${contextText}`;
}

function buildOpenAiMessages(
  systemPrompt: string,
  history: ChatTurn[],
  prompt: string
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ];
  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.content.trim() });
  }
  if (!history.length || history[history.length - 1]?.content !== prompt) {
    messages.push({ role: 'user', content: prompt });
  }
  return messages;
}

/**
 * Modèles Gemini essayés dans l'ordre. Google retire régulièrement les anciens
 * modèles (ex. gemini-1.5-flash) : on ne dépend donc jamais d'un seul nom.
 * GEMINI_MODEL (secret Supabase) passe en premier s'il est défini.
 */
const GEMINI_MODEL_CANDIDATES = [
  // Le plus rapide d'abord : mesuré en production, « flash-lite » répond en ~2 s
  // alors que « gemini-flash-latest » dépassait le délai.
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta';

/** Délai maximum par tentative de modèle */
const GEMINI_TIMEOUT_MS = 10000;

/** Erreurs passagères (surcharge, quota à la minute, délai dépassé) : une nouvelle tentative a du sens */
const GEMINI_TRANSIENT = /\b(429|500|503)\)|timed out|TimeoutError|aborted/i;

/**
 * Gemini exige une conversation qui commence par l'utilisatrice et alterne les rôles.
 * On retire donc le message d'accueil de l'assistante et on fusionne les tours consécutifs.
 */
function normalizeHistory(history: ChatTurn[], prompt: string): ChatTurn[] {
  const turns: ChatTurn[] = history.map((t) => ({ role: t.role, content: t.content.trim() }));
  if (!turns.length || turns[turns.length - 1].role !== 'user' || turns[turns.length - 1].content !== prompt) {
    turns.push({ role: 'user', content: prompt });
  }
  const merged: ChatTurn[] = [];
  for (const turn of turns) {
    if (!turn.content) continue;
    if (!merged.length && turn.role !== 'user') continue;
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) {
      last.content = `${last.content}\n${turn.content}`;
    } else {
      merged.push({ ...turn });
    }
  }
  return merged;
}

/** Dernier recours : demande à Google la liste des modèles « flash » réellement disponibles. */
async function discoverGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`${GEMINI_API}/models?pageSize=200&key=${apiKey}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const names: string[] = (data.models || [])
      .filter((m: { name?: string; supportedGenerationMethods?: string[] }) =>
        m.supportedGenerationMethods?.includes('generateContent')
      )
      .map((m: { name: string }) => m.name.replace(/^models\//, ''))
      .filter(
        (n: string) =>
          n.startsWith('gemini-') &&
          n.includes('flash') &&
          !/image|tts|audio|live|embedding|vision|exp|preview|omni|robotics|computer/.test(n)
      );
    // Les alias « latest » puis les versions les plus récentes d'abord
    return names.sort((x, y) => {
      const lx = x.includes('latest') ? 0 : 1;
      const ly = y.includes('latest') ? 0 : 1;
      return lx - ly || y.localeCompare(x, undefined, { numeric: true });
    });
  } catch {
    return [];
  }
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  systemPrompt: string,
  turns: ChatTurn[]
): Promise<AiResult> {
  const res = await fetch(`${GEMINI_API}/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Un modèle qui ne répond pas ne doit pas bloquer toute la requête
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: turns.map((turn) => ({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.content }],
      })),
      generationConfig: {
        temperature: 0.65,
        // Marge large : les modèles récents consomment une partie du budget en « réflexion »
        maxOutputTokens: 2048,
      },
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error?.message || JSON.stringify(data);
    throw new Error(`Gemini (${model}, ${res.status}): ${msg}`);
  }

  const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
    .trim();
  if (!text) throw new Error(`Gemini (${model}): réponse vide`);

  return { text, provider: 'gemini', model };
}

/** Google Gemini — quota gratuit via Google AI Studio, avec repli automatique de modèle */
async function callGemini(
  systemPrompt: string,
  history: ChatTurn[],
  prompt: string
): Promise<AiResult> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY manquante');

  const turns = normalizeHistory(history, prompt);
  const preferred = Deno.env.get('GEMINI_MODEL')?.trim();
  const tried = new Set<string>();
  const errors: string[] = [];

  const tryModels = async (models: string[]): Promise<AiResult | null> => {
    for (const model of models) {
      if (!model || tried.has(model)) continue;
      tried.add(model);
      try {
        return await callGeminiModel(apiKey, model, systemPrompt, turns);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[chat-ai]', msg);
        errors.push(msg);
        // Clé refusée : inutile d'essayer les autres modèles
        if (/API key|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) break;
      }
    }
    return null;
  };

  const primary = [preferred ?? '', ...GEMINI_MODEL_CANDIDATES];
  const known = await tryModels(primary);
  if (known) return known;

  // Gemini renvoie souvent « forte demande » (503) pendant quelques secondes :
  // on laisse passer le pic puis on retente une fois les mêmes modèles.
  if (errors.some((e) => GEMINI_TRANSIENT.test(e))) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    tried.clear();
    const retried = await tryModels(primary);
    if (retried) return retried;
  }

  const discovered = await tryModels((await discoverGeminiModels(apiKey)).slice(0, 4));
  if (discovered) return discovered;

  throw new Error(
    errors.map((e) => e.slice(0, 140)).join(' | ') || 'Gemini: aucun modèle disponible'
  );
}

/** Groq — inférence rapide, tier gratuit (Llama) */
async function callGroq(
  systemPrompt: string,
  history: ChatTurn[],
  prompt: string
): Promise<AiResult> {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY manquante');

  const model = Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile';
  const messages = buildOpenAiMessages(systemPrompt, history, prompt);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 700,
      temperature: 0.65,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.error?.message || JSON.stringify(data);
    throw new Error(`Groq: ${msg}`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq: réponse vide');

  return { text, provider: 'groq', model };
}

/** Essaie les fournisseurs dans l'ordre (défaut: gemini → groq) */
async function callWithFallback(
  systemPrompt: string,
  history: ChatTurn[],
  prompt: string
): Promise<AiResult> {
  const orderRaw = Deno.env.get('AI_PROVIDER_ORDER') || 'gemini,groq';
  const order = orderRaw.split(',').map((p) => p.trim().toLowerCase());

  const providers: Record<string, () => Promise<AiResult>> = {
    gemini: () => callGemini(systemPrompt, history, prompt),
    groq: () => callGroq(systemPrompt, history, prompt),
  };

  const errors: string[] = [];

  for (const name of order) {
    const fn = providers[name];
    if (!fn) continue;

    const hasKey =
      (name === 'gemini' && Deno.env.get('GEMINI_API_KEY')) ||
      (name === 'groq' && Deno.env.get('GROQ_API_KEY'));

    if (!hasKey) {
      errors.push(`${name}: clé API absente`);
      continue;
    }

    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[chat-ai] ${name} failed:`, msg);
      errors.push(msg);
    }
  }

  throw new Error(
    errors.length
      ? `Aucun fournisseur IA disponible. ${errors.join(' | ')}`
      : 'Configurez GEMINI_API_KEY et/ou GROQ_API_KEY dans Supabase'
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Authentification requise' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Configuration Supabase manquante' }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: 'Session invalide' }, 401);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_type, subscription_expiry')
      .eq('id', user.id)
      .single();

    if (!isPremium(profile?.subscription_type, profile?.subscription_expiry)) {
      return jsonResponse({ error: 'Abonnement Pro requis pour NyeAI en ligne' }, 403);
    }

    const body = (await req.json()) as RequestBody;
    const prompt = body.prompt?.trim();
    if (!prompt) {
      return jsonResponse({ error: 'Question vide' }, 400);
    }

    const contextText = Array.isArray(body.context)
      ? body.context.filter(Boolean).join('\n')
      : body.context?.trim() || '';

    const history = (body.history || [])
      .filter((m) => m.content?.trim() && (m.role === 'user' || m.role === 'assistant'))
      .slice(-10);

    const systemPrompt = buildSystemPrompt(body, contextText);
    const result = await callWithFallback(systemPrompt, history, prompt);

    return jsonResponse({
      response: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (e) {
    console.error('[chat-ai]', e);
    const message = e instanceof Error ? e.message : 'Erreur serveur';
    return jsonResponse({ error: message }, 502);
  }
});
