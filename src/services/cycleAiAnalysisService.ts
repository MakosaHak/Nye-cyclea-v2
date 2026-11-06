import { getSupabaseAccessToken, supabase } from '../lib/supabase';
import type { CycleEntry } from '../types';
import type { CycleAnalysis, CyclePattern } from './cycleAnalysisService';

/** Analyse rédigée par l'IA à partir des statistiques calculées sur l'appareil */
export interface AiCycleAnalysis {
  /** 2 à 3 phrases qui expliquent la situation */
  resume: string;
  /** Ce que l'IA observe dans les cycles */
  constats: string[];
  /** Conseils concrets et adaptés */
  conseils: string[];
  /** Vrai si un avis médical est recommandé */
  consulter: boolean;
  /** Raison de consulter, si `consulter` est vrai */
  motifConsultation?: string;
  generatedAt: string;
}

export type AiAnalysisFailure = 'offline' | 'not_pro' | 'session' | 'service';

// v2 : les avis demandés avant la limitation aux seules durées ne sont plus réaffichés
const CACHE_KEY = 'nye_cycle_ai_analysis_v2';

const ANALYSIS_SYSTEM_PROMPT = `Tu es NyeAI, l'assistante de Nye Cyclea, spécialisée dans l'analyse du cycle menstruel.

On te donne les statistiques réelles des cycles d'une utilisatrice. Analyse-les et réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{"resume": string, "constats": string[], "conseils": string[], "consulter": boolean, "motifConsultation": string}

RÈGLES:
- "resume" : 2 à 3 phrases, tu tutoies l'utilisatrice, ton chaleureux et rassurant, tu cites ses vrais chiffres.
- "constats" : 2 à 4 observations précises tirées des chiffres (écarts, tendance, cycles les plus longs ou courts).
- "conseils" : 3 à 5 conseils concrets et pratiques, adaptés à SA situation et au contexte africain quand c'est pertinent (hygiène de vie, suivi, alimentation, stress, sommeil).
- "consulter" : true si les chiffres justifient un avis médical (écarts de 20 jours ou plus, cycles de plus de 45 jours ou de moins de 21 jours, règles de plus de 8 jours), sinon false.
- "motifConsultation" : une phrase si consulter est true, sinon "".
- Aucun diagnostic médical, aucun nom de maladie présenté comme certain, aucun médicament.
- Rappelle que les prédictions sont moins fiables quand les cycles sont irréguliers, si c'est le cas.
- Ne te présente pas, ne salue pas, ne parle pas de toi : commence directement par l'analyse.
- Écris les pourcentages avec le signe % (ex. 40 %).
- Français simple, pas de Markdown, pas d'astérisques.`;

/** Empreinte des cycles : l'analyse IA n'est refaite que si les cycles ont changé */
export function cyclesSignature(cycles: CycleEntry[]): string {
  return [...cycles]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((c) => `${c.startDate.slice(0, 10)}>${c.endDate?.slice(0, 10) ?? ''}`)
    .join('|');
}

export function readCachedAiAnalysis(signature: string): AiCycleAnalysis | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { signature: string; analysis: AiCycleAnalysis };
    return cached.signature === signature ? cached.analysis : null;
  } catch {
    return null;
  }
}

export function clearCachedAiAnalysis(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* stockage indisponible */
  }
}

function writeCache(signature: string, analysis: AiCycleAnalysis): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ signature, analysis }));
  } catch {
    /* stockage plein ou indisponible : l'analyse reste affichée pour cette session */
  }
}

/**
 * Confidentialité : seules des durées en jours quittent l'appareil.
 * Aucune date, aucun symptôme, aucune note et aucun identifiant ne sont placés dans le message.
 */
function buildPrompt(cycles: CycleEntry[], pattern: CyclePattern, local: CycleAnalysis): string {
  const periodLengths = [...cycles]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .filter((cycle) => cycle.endDate)
    .map(
      (cycle) =>
        Math.round(
          (Date.parse(cycle.endDate!.slice(0, 10)) - Date.parse(cycle.startDate.slice(0, 10))) /
            86400000
        ) + 1
    )
    .filter((days) => days >= 1 && days <= 15);

  return [
    'Voici les durées relevées par l’utilisatrice (aucune date ni donnée personnelle).',
    '',
    `DURÉES DES CYCLES, du plus ancien au plus récent, en jours : ${pattern.lengths.join(', ')}`,
    periodLengths.length
      ? `DURÉES DES RÈGLES, du plus ancien au plus récent, en jours : ${periodLengths.join(', ')}`
      : 'DURÉES DES RÈGLES : non renseignées',
    '',
    'STATISTIQUES CALCULÉES :',
    `- Cycles complets mesurés : ${pattern.cycleCount}`,
    `- Longueur moyenne du cycle : ${pattern.averageLength} jours (écart-type ${pattern.lengthStdDev} jour)`,
    `- Cycle le plus court : ${pattern.shortestLength} jours, le plus long : ${pattern.longestLength} jours (écart de ${pattern.lengthRange} jours)`,
    `- Durée moyenne des règles : ${pattern.averagePeriodLength} jours (écart-type ${pattern.periodStdDev} jour)`,
    `- Taux d’irrégularité : ${pattern.irregularityRate} % des cycles s’écartent de plus de 3 jours du cycle médian`,
    `- Score de régularité : ${pattern.regularityScore}/100`,
    `- Tendance de la longueur des cycles : ${pattern.trends.lengthTrend}`,
    `- Niveau d’irrégularité estimé : ${local.isIrregular ? local.severity : 'aucun'}`,
    '',
    'Rédige ton analyse au format JSON demandé.',
  ].join('\n');
}

function toStringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.replace(/\*\*/g, '').trim())
    .slice(0, max);
}

/** Le modèle entoure parfois le JSON de texte ou de balises de code : on isole l'objet */
function parseAiJson(text: string): AiCycleAnalysis | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const resume = typeof raw.resume === 'string' ? raw.resume.replace(/\*\*/g, '').trim() : '';
    const constats = toStringList(raw.constats, 5);
    const conseils = toStringList(raw.conseils, 6);
    if (!resume || !conseils.length) return null;
    const motif = typeof raw.motifConsultation === 'string' ? raw.motifConsultation.trim() : '';
    return {
      resume,
      constats,
      conseils,
      consulter: raw.consulter === true,
      motifConsultation: motif || undefined,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function failureFromResponse(error: unknown, data: unknown): Promise<AiAnalysisFailure> {
  let message = '';
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.json === 'function') {
    try {
      const body = (await context.json()) as { error?: string; message?: string };
      message = `${body.error ?? ''} ${body.message ?? ''}`;
    } catch {
      /* corps illisible */
    }
  }
  if (!message && data && typeof (data as { error?: unknown }).error === 'string') {
    message = (data as { error: string }).error;
  }
  const lower = message.toLowerCase();
  if (lower.includes('pro') || lower.includes('abonnement')) return 'not_pro';
  if (lower.includes('session') || lower.includes('auth')) return 'session';
  return 'service';
}

async function requestAnalysis(
  prompt: string,
  token: string
): Promise<{ analysis: AiCycleAnalysis } | { fail: AiAnalysisFailure }> {
  const { data, error } = await supabase.functions.invoke('chat-ai', {
    body: { prompt, systemPrompt: ANALYSIS_SYSTEM_PROMPT, json: true },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error || (data && typeof data.error === 'string')) {
    return { fail: await failureFromResponse(error, data) };
  }

  const analysis = typeof data?.response === 'string' ? parseAiJson(data.response) : null;
  return analysis ? { analysis } : { fail: 'service' };
}

/**
 * Demande à l'IA une analyse personnalisée des cycles.
 * Le résultat est mis en cache : un nouvel appel n'a lieu que lorsque les cycles changent.
 */
export async function analyzeCyclesWithAi(
  cycles: CycleEntry[],
  pattern: CyclePattern,
  local: CycleAnalysis
): Promise<{ analysis: AiCycleAnalysis } | { fail: AiAnalysisFailure }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { fail: 'offline' };

  const token = await getSupabaseAccessToken();
  if (!token) return { fail: 'session' };

  const prompt = buildPrompt(cycles, pattern, local);

  try {
    let result = await requestAnalysis(prompt, token);
    // Le service gratuit sature par moments : une seconde tentative suffit le plus souvent
    if ('fail' in result && result.fail === 'service') {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      result = await requestAnalysis(prompt, token);
    }
    if ('analysis' in result) writeCache(cyclesSignature(cycles), result.analysis);
    return result;
  } catch (e) {
    console.warn('[Analyse IA] indisponible', e);
    return { fail: 'service' };
  }
}
