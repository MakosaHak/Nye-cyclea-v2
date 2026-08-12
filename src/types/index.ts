export interface CycleEntry {
  id: string;
  userId: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, optional
  symptoms?: string[];
  notes?: string;
  source: 'manual' | 'imported';
  createdAt: string;
}

export interface UserStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  last3Cycles: number[];
  predictionConfidence: number; // 0-1
}

export interface Prediction {
  predictedStart: string; // ISO date string
  predictedEnd: string;
  ovulationDate: string;
  fertileWindow: [string, string]; // [start, end]
  confidence: number; // 0-1
  basis: string; // explanation of prediction
  // Optional uncertainty windows for irregular cycles
  predictedStartRange?: [string, string];
  ovulationWindow?: [string, string];
}

export interface UserSettings {
  notificationsOn: boolean;
  privacyMode: boolean;
  shareAnonymousStats: boolean;
  defaultPeriodLength: number;
  defaultCycleLength: number;
}

export interface AuthData {
  id: string;
  username?: string;
  email?: string;
  isAnonymous: boolean;
  createdAt: string;
  subscriptionType?: 'free' | 'monthly' | 'yearly';
  subscriptionExpiry?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  /** Présent sur les réponses assistant — online = IA cloud Pro */
  source?: 'online' | 'local';
  /** Fournisseur cloud : gemini | groq */
  provider?: string;
}
