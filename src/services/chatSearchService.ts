import { StorageService } from './storageService';
import { getInitialKBData, KBEntry } from './chatLocalKB';

// Lazy init state
let isDbInitialized = false;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

async function ensureDbReady() {
  if (!isDbInitialized) {
    await StorageService.initChatDB(getInitialKBData());
    isDbInitialized = true;
  }
}

export interface LocalSearchResult {
  entry: KBEntry;
  score: number;
}

export async function findBestAnswer(question: string): Promise<string> {
  await ensureDbReady();

  const qClean = normalize(question);
  const terms = qClean.split(/[^a-z0-9]+/).filter((t) => t.length > 2); // Filter short words

  if (terms.length === 0) {
    return await StorageService.getChatFallback();
  }

  const allEntries = await StorageService.searchChatKB();

  const scoredEntries = allEntries.map((entry) => {
    let score = 0;
    const searchableText = normalize(entry.question + ' ' + entry.keywords.join(' '));

    terms.forEach((term) => {
      // 3 points for exact keyword match
      if (entry.keywords.some((k) => normalize(k) === term)) {
        score += 3;
      }
      // 2 points if term is in question
      else if (searchableText.includes(term)) {
        score += 2;
      }
    });

    return { entry, score };
  });

  // Sort by score
  scoredEntries.sort((a, b) => b.score - a.score);

  const best = scoredEntries[0];

  // Threshold: must have at least one strong match
  if (best && best.score >= 2) {
    let answer = best.entry.answer;

    // Add Disclaimer if needed
    if (best.entry.disclaimer) {
      answer += '\n\n⚠️ *Information éducative uniquement. Consultez un médecin en cas de doute.*';
    }

    return answer;
  }

  return await StorageService.getChatFallback();
}

// Wrapper to return {entry} structure expected by Chat.tsx temporarily
export async function localSearch(question: string): Promise<LocalSearchResult[]> {
    const answer = await findBestAnswer(question);

  // Check if it's the fallback
  const fallbackMsg = await StorageService.getChatFallback();
  const isFallback = answer === fallbackMsg;

  return [
    {
      entry: {
        id: isFallback ? 'fallback' : 'found',
        category: 'system',
        subCategory: 'system',
        question: question,
        keywords: [],
        answer: answer,
        disclaimer: false,
      },
      score: isFallback ? 0 : 5,
    },
  ];
}
