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

export const BADGES = {
  FIRST_WORD: { id: "first_word", icon: "🌱", name: "İlk Kelime", desc: "İlk kelimeni ekledin!" },
  STREAK_3: { id: "streak_3", icon: "🔥", name: "3 Günlük Seri", desc: "3 gün üst üste çalıştın!" },
  STREAK_7: { id: "streak_7", icon: "⚡", name: "Haftalık Seri", desc: "7 gün üst üste!" },
  STREAK_30: { id: "streak_30", icon: "💎", name: "Aylık Seri", desc: "30 gün üst üste!" },
  WORDS_10: { id: "words_10", icon: "📚", name: "10 Kelime", desc: "10 kelime ekledin!" },
  WORDS_50: { id: "words_50", icon: "🏆", name: "50 Kelime", desc: "50 kelime ekledin!" },
  WORDS_100: { id: "words_100", icon: "👑", name: "100 Kelime", desc: "100 kelime ekledin!" },
  PERFECT_GAME: { id: "perfect_game", icon: "⭐", name: "Mükemmel Oyun", desc: "Oyunda tam puan!" },
};
