"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Word, Review, GameSession, UserStats, Achievement,
  getLevelFromXP, BADGES,
} from "./types";
import {
  createInitialReview, calculateSM2, isDueForReview,
  getWordStatusFromInterval, qualityToXP, type ReviewQuality,
} from "./sm2";
import { generateId } from "./utils";

interface AppState {
  words: Word[];
  reviews: Record<string, Review>; // wordId -> Review
  gameSessions: GameSession[];
  achievements: Achievement[];
  stats: UserStats;

  // Actions
  addWord: (word: Omit<Word, "id" | "createdAt" | "status">) => Word;
  deleteWord: (id: string) => void;
  getWord: (id: string) => Word | undefined;
  getDueWords: () => Word[];
  reviewWord: (wordId: string, quality: ReviewQuality) => void;
  addGameSession: (session: Omit<GameSession, "id">) => void;
  updateStats: (partial: Partial<UserStats>) => void;
  checkAndUpdateStreak: () => void;
  addXP: (amount: number) => void;
  checkAchievements: () => void;
}

const defaultStats: UserStats = {
  streakCount: 0,
  lastActiveDate: "",
  xp: 0,
  level: 1,
  totalWordsAdded: 0,
  totalReviews: 0,
  dailyGoal: 10,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      words: [],
      reviews: {},
      gameSessions: [],
      achievements: [],
      stats: defaultStats,

      addWord: (wordData) => {
        const word: Word = {
          ...wordData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          status: "new",
        };
        const reviewData = createInitialReview(word.id);
        const review: Review = { ...reviewData, id: generateId() };

        set((state) => ({
          words: [word, ...state.words],
          reviews: { ...state.reviews, [word.id]: review },
          stats: {
            ...state.stats,
            totalWordsAdded: state.stats.totalWordsAdded + 1,
          },
        }));

        // XP ekle ve başarımları kontrol et
        get().addXP(5);
        get().checkAchievements();
        return word;
      },

      deleteWord: (id) => {
        set((state) => {
          const { [id]: _removed, ...remainingReviews } = state.reviews;
          return {
            words: state.words.filter((w) => w.id !== id),
            reviews: remainingReviews,
          };
        });
      },

      getWord: (id) => get().words.find((w) => w.id === id),

      getDueWords: () => {
        const { words, reviews } = get();
        return words.filter((w) => {
          const review = reviews[w.id];
          return !review || isDueForReview(review);
        });
      },

      reviewWord: (wordId, quality) => {
        const { reviews } = get();
        const existing = reviews[wordId];
        const currentReview = existing ?? {
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
        };

        const result = calculateSM2(currentReview, quality);
        const newStatus = getWordStatusFromInterval(result.interval);

        set((state) => ({
          reviews: {
            ...state.reviews,
            [wordId]: {
              id: existing?.id ?? generateId(),
              wordId,
              ...result,
              lastReviewDate: new Date().toISOString().split("T")[0],
            },
          },
          words: state.words.map((w) =>
            w.id === wordId ? { ...w, status: newStatus } : w
          ),
          stats: {
            ...state.stats,
            totalReviews: state.stats.totalReviews + 1,
          },
        }));

        get().addXP(qualityToXP(quality));
        get().checkAndUpdateStreak();
      },

      addGameSession: (session) => {
        const fullSession: GameSession = { ...session, id: generateId() };
        set((state) => ({
          gameSessions: [fullSession, ...state.gameSessions],
        }));
      },

      updateStats: (partial) => {
        set((state) => ({ stats: { ...state.stats, ...partial } }));
      },

      checkAndUpdateStreak: () => {
        const { stats } = get();
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        if (stats.lastActiveDate === today) return; // Bugün zaten sayıldı

        let newStreak = stats.streakCount;
        if (stats.lastActiveDate === yesterday) {
          newStreak = stats.streakCount + 1;
        } else if (stats.lastActiveDate !== today) {
          newStreak = 1; // Seri bozuldu
        }

        set((state) => ({
          stats: {
            ...state.stats,
            streakCount: newStreak,
            lastActiveDate: today,
          },
        }));

        get().checkAchievements();
      },

      addXP: (amount) => {
        set((state) => {
          const newXP = state.stats.xp + amount;
          const newLevel = getLevelFromXP(newXP);
          return {
            stats: { ...state.stats, xp: newXP, level: newLevel },
          };
        });
      },

      checkAchievements: () => {
        const { stats, words, achievements } = get();
        const hasAchievement = (id: string) => achievements.some((a) => a.badgeId === id);
        const newAchievements: Achievement[] = [];

        const check = (condition: boolean, badgeId: string) => {
          if (condition && !hasAchievement(badgeId)) {
            newAchievements.push({
              id: generateId(),
              badgeId,
              unlockedAt: new Date().toISOString(),
            });
          }
        };

        check(words.length >= 1, BADGES.FIRST_WORD.id);
        check(words.length >= 10, BADGES.WORDS_10.id);
        check(words.length >= 50, BADGES.WORDS_50.id);
        check(words.length >= 100, BADGES.WORDS_100.id);
        check(stats.streakCount >= 3, BADGES.STREAK_3.id);
        check(stats.streakCount >= 7, BADGES.STREAK_7.id);
        check(stats.streakCount >= 30, BADGES.STREAK_30.id);

        if (newAchievements.length > 0) {
          set((state) => ({
            achievements: [...state.achievements, ...newAchievements],
          }));
        }
      },
    }),
    {
      name: "wordcraft-storage",
      version: 1,
    }
  )
);
