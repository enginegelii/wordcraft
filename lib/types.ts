export type PartOfSpeech =
  | "noun" | "verb" | "adjective" | "adverb"
  | "pronoun" | "preposition" | "conjunction"
  | "interjection" | "phrasal verb" | "idiom" | "other";

export type ContextTag =
  | "günlük" | "iş" | "akademik" | "argo"
  | "teknik" | "edebi" | "informal" | "genel";

export type WordStatus = "new" | "learning" | "review" | "mastered";

export interface WordExample {
  en: string;
  tr: string;
}

export interface Word {
  id: string;
  userId?: string;
  word: string;
  translation: string; // Türkçe karşılık
  partOfSpeech: PartOfSpeech;
  ipa?: string; // Telaffuz
  examples: WordExample[];
  synonyms: string[];
  antonyms: string[];
  contextTag: ContextTag;
  originalContext?: string; // Fotoğraftan eklendiyse orijinal cümle
  imageUrl?: string;
  grammarNote?: string;
  createdAt: string;
  status: WordStatus;
}

export interface Review {
  id: string;
  wordId: string;
  easeFactor: number;    // SM-2: başlangıç 2.5
  interval: number;       // gün cinsinden
  repetitions: number;
  nextReviewDate: string; // ISO date string
  lastReviewDate?: string;
}

export interface GameSession {
  id: string;
  gameType: "flashcard" | "match" | "fill" | "dictation" | "story" | "boss";
  score: number;
  wordsPracticed: string[];
  playedAt: string;
  duration: number; // saniye
}

export interface UserStats {
  streakCount: number;
  lastActiveDate: string;
  xp: number;
  level: number;
  totalWordsAdded: number;
  totalReviews: number;
  dailyGoal: number; // günlük hedef kelime sayısı
}

export interface Achievement {
  id: string;
  badgeId: string;
  unlockedAt: string;
}

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000,
];

export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function getXPForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}

// ─── GRAMMAR TYPES ────────────────────────────────────────────────────────────

export type GrammarLevel = "intermediate" | "upper-intermediate" | "advanced" | "advanced-plus";

export interface GrammarTopicProgress {
  topicId: string;
  studied: boolean;         // konu anlatımı okundu mu
  quizCompleted: boolean;   // quiz yapıldı mı
  quizScore: number;        // son quiz puanı (0-100)
  completedAt?: string;     // ISO date
}

export interface GrammarState {
  level: GrammarLevel | null;          // null = henüz belirlenmedi
  placementDone: boolean;
  topicProgress: Record<string, GrammarTopicProgress>; // topicId → progress
  grammarXP: number;                   // Gramer ilerleme puanı
}

// Gramer seviyesi eşikleri (grammarXP bazlı)
export const GRAMMAR_XP_THRESHOLDS: Record<GrammarLevel, number> = {
  "intermediate": 0,
  "upper-intermediate": 200,
  "advanced": 400,
  "advanced-plus": 600,
};

export const GRAMMAR_LEVEL_ORDER: GrammarLevel[] = [
  "intermediate",
  "upper-intermediate",
  "advanced",
  "advanced-plus",
];

// Seviye için gereken XP ve bir sonraki seviye bilgisi
export function getNextGrammarLevel(level: GrammarLevel): GrammarLevel | null {
  const idx = GRAMMAR_LEVEL_ORDER.indexOf(level);
  return idx < GRAMMAR_LEVEL_ORDER.length - 1 ? GRAMMAR_LEVEL_ORDER[idx + 1] : null;
}

export function getGrammarLevelFromXP(xp: number, currentLevel: GrammarLevel): GrammarLevel {
  // XP'ye göre ulaşılabilecek en yüksek seviyeyi bul
  let result: GrammarLevel = currentLevel;
  for (const level of GRAMMAR_LEVEL_ORDER) {
    if (xp >= GRAMMAR_XP_THRESHOLDS[level]) {
      result = level;
    }
  }
  return result;
}
