import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabaseAccessToken, supabase } from '../lib/supabase';
import type { ChatMessage, CycleEntry, UserStats } from '../types';

export const NYE_AI_SYSTEM_PROMPT = `Tu es NyeAI, l'assistante bienveillante de Nye Cyclea (santé menstruelle et bien-être).

RÈGLES:
- Pas de diagnostic médical ni de prescription.
- Informations éducatives et générales uniquement.
- Symptômes graves ou urgence → conseiller un professionnel de santé ou les urgences.
- Français simple, chaleureux, adapté au contexte africain quand c'est pertinent.
- Réponses courtes (3 à 6 phrases sauf si l'utilisatrice demande plus de détails).`;

export type OfflineFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const OFFLINE_FAQ: OfflineFaqItem[] = [
  {
    id: 'cycle-normal',
    question: "Qu'est-ce qu'un cycle normal ?",
    answer:
      "Un cycle menstruel dure en moyenne 21 à 35 jours, avec des règles souvent entre 3 et 7 jours. Chaque corps est différent : l'important est de repérer ton propre rythme sur plusieurs mois. Tu peux suivre tes cycles dans Nye Cyclea pour voir tes moyennes.",
  },
  {
    id: 'ovulation',
    question: "Comment repérer l'ovulation ?",
    answer:
      "L'ovulation survient en général vers le milieu du cycle (souvent autour du 14e jour sur un cycle de 28 jours). La fenêtre fertile inclut quelques jours avant et le jour de l'ovulation. Les estimations dans l'app t'aident à te repérer, mais elles ne remplacent pas une contraception si tu veux éviter une grossesse.",
  },
  {
    id: 'crampes',
    question: 'Crampes pendant les règles',
    answer:
      "Les crampes sont fréquentes au début des règles. Chaleur locale, repos et activité légère soulagent parfois. Évite l'automédication sans avis médical. Douleur intense, fièvre ou saignement anormal → consultation recommandée.",
  },
  {
    id: 'irregulier',
    question: 'Cycle irrégulier : que faire ?',
    answer:
      "Un retard peut venir du stress, d'un changement de rythme ou d'une variation hormonale. Cycles très irréguliers sur plusieurs mois : en parler à un·e professionnel·le. Note tes cycles dans l'app pour repérer un pattern.",
  },
  {
    id: 'regles',
    question: 'Que se passe-t-il pendant les règles ?',
    answer:
      "Les règles correspondent à l'élimination de la muqueuse utérine. Des douleurs légères ou une fatigue peuvent être fréquentes. Si tu saignes très abondamment ou si la douleur t'empêche de vivre normalement, parle-en à un·e professionnel·le de santé.",
  },
  {
    id: 'spm',
    question: 'Qu’est-ce que le SPM ?',
    answer:
      "Le SPM regroupe des signes avant les règles : humeur changeante, tensions, fatigue, seins sensibles… Reposer, s'hydrater et noter tes symptômes peut aider. Si le SPM perturbe fortement ta vie, un·e professionnel·le peut proposer des solutions adaptées.",
  },
  {
    id: 'contraception',
    question: 'Quelles méthodes de contraception existent ?',
    answer:
      'Il existe plusieurs méthodes (préservatif, pilule, implant, etc.). Le choix dépend de ta santé et de tes objectifs. Seul·e un·e professionnel·le de santé ou une sage-femme peut te conseiller la méthode la plus adaptée.',
  },
  {
    id: 'hygiene',
    question: 'Comment prendre soin de son hygiène intime ?',
    answer:
      "Change régulièrement protections ou cup, lave-toi les mains, privilégie des produits adaptés à ta peau. En cas d'odeur forte, démangeaisons ou brûlures persistantes, consulte pour écarter une infection.",
  },
];

export const OFFLINE_TYPED_REPLY =
  "Je suis momentanément hors ligne et je ne peux pas répondre librement à ta question pour l'instant. Tu peux choisir une des questions ci-dessous : la réponse s'affichera tout de suite.";

export const OFFLINE_SESSION_REPLY =
  'Pour utiliser NyeAI, ta session a expiré. Va dans Réglages → déconnecte-toi → reconnecte-toi avec ton identifiant et ton mot de passe.';

export const OFFLINE_NOT_PRO_REPLY =
  "Ton abonnement Pro n'est pas reconnu par le serveur. Vérifie la table profiles dans Supabase (subscription_type = monthly ou yearly).";

export const OFFLINE_SERVICE_REPLY =
  'NyeAI est temporairement indisponible. En attendant, choisis une question ci-dessous pour une réponse immédiate.';

export type NyeAiFailReason = 'session' | 'not_pro' | 'service' | 'offline';

export function canUseCloudAi(isPremium: boolean): boolean {
  return isPremium && typeof navigator !== 'undefined' && navigator.onLine;
}

function sortCyclesByDateDesc(cycles: CycleEntry[]): CycleEntry[] {
  return [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}

function buildUserContext(stats: UserStats | null, cycles: CycleEntry[]): string {
  const sorted = sortCyclesByDateDesc(cycles);
  if (sorted.length === 0) return "Aucun cycle enregistré dans l'app pour le moment.";
  const last = sorted[0];
  const recentDates = sorted
    .slice(0, 3)
    .map((c) => c.startDate.slice(0, 10))
    .join(', ');
  return [
    `Cycles enregistrés: ${sorted.length}.`,
    `Durée moyenne du cycle: ${stats?.averageCycleLength ?? '—'} jours.`,
    `Durée moyenne des règles: ${stats?.averagePeriodLength ?? '—'} jours.`,
    last?.startDate ? `Dernières règles (début): ${last.startDate.slice(0, 10)}.` : '',
    sorted.length > 1 ? `Dates récentes de début de règles: ${recentDates}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

async function parseFunctionError(error: unknown): Promise<NyeAiFailReason> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: string; message?: string };
      const msg = `${body.error ?? ''} ${body.message ?? ''}`.toLowerCase();
      if (msg.includes('pro') || msg.includes('abonnement')) return 'not_pro';
      if (msg.includes('auth') || msg.includes('session') || msg.includes('unauthorized')) {
        return 'session';
      }
    } catch {
      /* ignore parse errors */
    }
  }
  return 'service';
}

async function askCloudAi(
  prompt: string,
  history: ChatMessage[],
  contextBlock: string
): Promise<{ text: string } | { fail: NyeAiFailReason }> {
  const token = await getSupabaseAccessToken();
  if (!token) {
    return { fail: 'session' };
  }

  const recentHistory = history
    .slice(-10)
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));

  const { data, error } = await supabase.functions.invoke('chat-ai', {
    body: {
      prompt,
      context: contextBlock,
      systemPrompt: NYE_AI_SYSTEM_PROMPT,
      history: recentHistory,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    console.warn('[NyeAI] Edge function chat-ai:', error.message, data);
    return { fail: await parseFunctionError(error) };
  }

  if (data?.error && typeof data.error === 'string') {
    console.warn('[NyeAI] chat-ai a répondu:', data.error);
    const msg = data.error.toLowerCase();
    if (msg.includes('pro') || msg.includes('abonnement')) return { fail: 'not_pro' };
    if (msg.includes('auth') || msg.includes('session')) return { fail: 'session' };
    return { fail: 'service' };
  }

  if (data?.response && typeof data.response === 'string') {
    return { text: data.response.trim() };
  }

  return { fail: 'service' };
}

function failMessage(reason: NyeAiFailReason): string {
  switch (reason) {
    case 'session':
      return OFFLINE_SESSION_REPLY;
    case 'not_pro':
      return OFFLINE_NOT_PRO_REPLY;
    case 'service':
      return OFFLINE_SERVICE_REPLY;
    default:
      return OFFLINE_TYPED_REPLY;
  }
}

export async function askNyeAi(
  prompt: string,
  history: ChatMessage[],
  options: { isPremium: boolean; stats: UserStats | null; cycles: CycleEntry[] }
): Promise<{ text: string; cloud: boolean; failReason?: NyeAiFailReason }> {
  const trimmed = prompt.trim();
  if (!trimmed) return { text: OFFLINE_TYPED_REPLY, cloud: false, failReason: 'offline' };

  if (!canUseCloudAi(options.isPremium)) {
    return { text: OFFLINE_TYPED_REPLY, cloud: false, failReason: 'offline' };
  }

  const contextBlock = buildUserContext(options.stats, options.cycles);

  try {
    const result = await askCloudAi(trimmed, history, contextBlock);
    if ('text' in result) return { text: result.text, cloud: true };
    return { text: failMessage(result.fail), cloud: false, failReason: result.fail };
  } catch (e) {
    console.warn('[NyeAI] Cloud unavailable', e);
    return { text: OFFLINE_SERVICE_REPLY, cloud: false, failReason: 'service' };
  }
}

export const NYE_AI_SUGGESTIONS = OFFLINE_FAQ.slice(0, 4).map((item) => item.question);
