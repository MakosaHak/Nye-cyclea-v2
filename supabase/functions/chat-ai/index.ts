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
  if (subscriptionType !== 'monthly' && subscriptionType !== 'yearly') return false;
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

/** Google Gemini — quota gratuit généreux via Google AI Studio */
async function callGemini(
  systemPrompt: string,
  history: ChatTurn[],
  prompt: string
): Promise<AiResult> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY manquante');

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';

  const contents: { role: string; parts: { text: string }[] }[] = [];

  for (const turn of history) {
    contents.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content.trim() }],
    });
  }

  if (!history.length || history[history.length - 1]?.content !== prompt) {
    contents.push({ role: 'user', parts: [{ text: prompt }] });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 700,
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.error?.message || JSON.stringify(data);
    throw new Error(`Gemini: ${msg}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Gemini: réponse vide');

  return { text, provider: 'gemini', model };
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
