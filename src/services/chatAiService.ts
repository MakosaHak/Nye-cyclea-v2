import { ChatMessage } from '../types/chat';

// Online AI stub: in real usage, call your API here.
// Must respect health constraints: no diagnosis/prescription, educational tone, advise consulting when needed.
export async function onlineAIAnswer(prompt: string, context: string[]): Promise<string> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 600));
  const base = `Voici une réponse pédagogique basée sur vos informations. ${
    context.length ? `Contexte local: ${context.slice(0, 2).join(' | ')}` : ''
  }`;
  return base.trim();
}
