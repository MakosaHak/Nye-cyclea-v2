export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export type ChatMode = 'online' | 'offline';

export interface ChatAnswer {
  messages: ChatMessage[];
  mode: ChatMode;
  usedOnlineAI: boolean;
  usedLocalKB: boolean;
  disclaimer?: string;
}
