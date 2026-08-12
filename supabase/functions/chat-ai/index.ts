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

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return jsonResponse({ error: 'Clé OPENAI_API_KEY non configurée sur Supabase' }, 503);
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

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: body.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT },
    ];

    if (contextText) {
      messages.push({
        role: 'system',
        content: `Contexte de suivi (données locales de l'utilisatrice, à utiliser avec prudence):\n${contextText}`,
      });
    }

    for (const turn of history) {
      messages.push({ role: turn.role, content: turn.content.trim() });
    }

    if (!history.length || history[history.length - 1]?.content !== prompt) {
      messages.push({ role: 'user', content: prompt });
    }

    const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 600,
        temperature: 0.65,
      }),
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      console.error('[chat-ai] OpenAI error:', aiData);
      return jsonResponse(
        { error: aiData.error?.message || 'Erreur du fournisseur IA' },
        502
      );
    }

    const response = aiData.choices?.[0]?.message?.content?.trim();
    if (!response) {
      return jsonResponse({ error: 'Réponse IA vide' }, 502);
    }

    return jsonResponse({ response, model });
  } catch (e) {
    console.error('[chat-ai]', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500);
  }
});
