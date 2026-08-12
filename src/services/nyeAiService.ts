import { supabase } from '../lib/supabase';
import type { ChatMessage, CycleEntry, UserStats } from '../types';

const SYSTEM_PROMPT = `Tu es NyeAI, l'assistante bienveillante de Nye Cyclea (santé menstruelle et bien-être).

RÈGLES:
- Pas de diagnostic médical ni de prescription.
- Informations éducatives et générales uniquement.
- Symptômes graves ou urgence → conseiller un professionnel de santé ou les urgences.
- Français simple, chaleureux, adapté au contexte africain quand c'est pertinent.
- Réponses courtes (3 à 6 phrases sauf si l'utilisatrice demande plus de détails).`;

type LocalEntry = {
  keywords: string[];
  answer: string;
};

const LOCAL_KB: LocalEntry[] = [
  {
    keywords: ['cycle', 'durée', 'longueur', 'combien de jours'],
    answer:
      'Un cycle menstruel dure en moyenne 21 à 35 jours, avec des règles souvent entre 3 et 7 jours. Chaque corps est différent : l’important est de repérer ton propre rythme sur plusieurs mois. Tu peux suivre tes cycles dans Nye Cyclea pour voir tes moyennes.',
  },
  {
    keywords: ['règles', 'regles', 'menstruation', 'menstruel', 'menstruelle'],
    answer:
      'Les règles correspondent à l’élimination de la muqueuse utérine. Des douleurs légères ou une fatigue peuvent être fréquentes. Si tu saignes très abondamment, si la douleur t’empêche de vivre normalement ou si tu te sens très mal, parle-en à un·e professionnel·le de santé.',
  },
  {
    keywords: ['ovulation', 'ovulatoire', 'fertile', 'fertilité', 'fertilite'],
    answer:
      'L’ovulation survient en général vers le milieu du cycle (souvent autour du 14e jour sur un cycle de 28 jours). La fenêtre fertile inclut quelques jours avant et le jour de l’ovulation. Les estimations dans l’app t’aident à te repérer, mais elles ne remplacent pas une contraception si tu veux éviter une grossesse.',
  },
  {
    keywords: ['spm', 'syndrome prémenstruel', 'premenstruel', 'avant les règles'],
    answer:
      'Le SPM regroupe des signes avant les règles : humeur changeante, tensions, fatigue, seins sensibles… Reposer, bouger doucement, s’hydrater et noter tes symptômes peut aider. Si le SPM perturbe fortement ta vie, un·e professionnel·le peut proposer des solutions adaptées.',
  },
  {
    keywords: ['douleur', 'crampes', 'mal au ventre', 'dysmenorrhee', 'dysménorrhée'],
    answer:
      'Les crampes sont fréquentes au début des règles. Chaleur locale, repos et activité légère soulagent parfois. Évite l’automédication sans avis médical. Douleur intense, fièvre ou saignement anormal → consultation recommandée.',
  },
  {
    keywords: ['retard', 'en retard', 'cycle irrégulier', 'irregulier', 'irrégulier'],
    answer:
      'Un retard peut venir du stress, d’un changement de rythme, d’une variation hormonale ou d’autres causes. Si tu as eu un rapport non protégé, une grossesse est une possibilité à considérer avec un test. Cycles très irréguliers sur plusieurs mois : en parler à un·e professionnel·le.',
  },
  {
    keywords: ['contraception', 'pilule', 'préservatif', 'preservatif', 'protection'],
    answer:
      'Il existe plusieurs méthodes (préservatif, pilule, implant, etc.). Le choix dépend de ta santé, de ton mode de vie et de tes objectifs. Seul·e un·e professionnel·le de santé ou une sage-femme peut te conseiller la méthode la plus adaptée.',
  },
  {
    keywords: ['hygiène', 'protege-slip', 'protège-slip', 'serviette', 'cup', 'coupe'],
    answer:
      'Change régulièrement protections ou cup, lave-toi les mains, privilégie des produits adaptés à ta peau. En cas d’odeur forte, démangeaisons ou brûlures persistantes, consulte pour écarter une infection.',
  },
  {
    keywords: ['grossesse', 'enceinte', 'test', 'aménorrhée', 'amenorrhee'],
    answer:
      'Un test de grossesse en pharmacie est fiable quelques jours après la date de règles attendue. Pour un suivi de grossesse ou des questions sur ta santé, consulte un centre de santé ou une sage-femme.',
  },
  {
    keywords: ['bonjour', 'salut', 'coucou', 'hello', 'hey'],
    answer:
      'Coucou ! Je suis NyeAI. Pose-moi une question sur ton cycle, tes règles, l’ovulation ou le bien-être — je partage des infos éducatives. Pour un avis médical personnalisé, il faut voir un·e professionnel·le.',
  },
];

const FALLBACK =
  'Je n’ai pas bien saisi ta question. Reformule avec des mots simples (ex. « crampes », « retard de règles », « ovulation »). Rappel : je donne des infos générales, pas un diagnostic. En cas de doute médical, consulte un·e professionnel·le.';

const EMERGENCY_KEYWORDS = [
  'urgence',
  'saignement abondant',
  'perte de connaissance',
  'douleur poitrine',
  'essoufflement',
  'fièvre très',
  'grossesse extra',
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function localAnswer(prompt: string): string {
  const q = normalize(prompt);
  if (EMERGENCY_KEYWORDS.some((k) => q.includes(normalize(k)))) {
    return 'Si tu penses être en danger ou en urgence médicale, contacte immédiatement les services d’urgence ou rends-toi au centre de santé le plus proche. Je ne peux pas gérer une urgence à ta place.';
  }
  let best: LocalEntry | null = null;
  let bestScore = 0;
  for (const entry of LOCAL_KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(normalize(kw))) score += kw.length > 6 ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (best && bestScore > 0) return best.answer;
  return FALLBACK;
}

function buildUserContext(stats: UserStats | null, cycles: CycleEntry[]): string {
  if (cycles.length === 0) return 'Aucun cycle enregistré dans l’app pour le moment.';
  const last = cycles[0];
  return [
    `Cycles enregistrés: ${cycles.length}.`,
    `Durée moyenne du cycle: ${stats?.averageCycleLength ?? '—'} jours.`,
    `Durée moyenne des règles: ${stats?.averagePeriodLength ?? '—'} jours.`,
    last?.startDate ? `Dernières règles (début): ${last.startDate.slice(0, 10)}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export async function askNyeAi(
  prompt: string,
  history: ChatMessage[],
  options: { isPremium: boolean; stats: UserStats | null; cycles: CycleEntry[] }
): Promise<{ text: string; source: 'online' | 'local' }> {
  const trimmed = prompt.trim();
  if (!trimmed) return { text: FALLBACK, source: 'local' };

  const contextBlock = buildUserContext(options.stats, options.cycles);
  const recentHistory = history
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Utilisatrice' : 'NyeAI'}: ${m.content}`)
    .join('\n');

  if (options.isPremium) {
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          prompt: trimmed,
          context: [contextBlock, recentHistory].filter(Boolean),
          systemPrompt: SYSTEM_PROMPT,
        },
      });
      if (!error && data?.response && typeof data.response === 'string') {
        return { text: data.response.trim(), source: 'online' };
      }
    } catch (e) {
      console.warn('[NyeAI] Edge function unavailable, using local KB', e);
    }
  }

  const enriched = localAnswer(trimmed);
  if (options.cycles.length > 0 && enriched === FALLBACK) {
    return {
      text: `${FALLBACK}\n\nD’après ton suivi dans l’app : ${contextBlock}`,
      source: 'local',
    };
  }
  return { text: enriched, source: 'local' };
}

export const NYE_AI_SUGGESTIONS = [
  'Qu’est-ce qu’un cycle normal ?',
  'Comment repérer l’ovulation ?',
  'Crampes pendant les règles',
  'Cycle irrégulier : que faire ?',
];
