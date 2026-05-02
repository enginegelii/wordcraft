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
import {
  fetchAllData,
  pushLocalDataToCloud,
  upsertWord,
  deleteWordFromDB,
  upsertReview,
  upsertStats,
  upsertGameSession,
  upsertAchievement,
} from "./db";

interface AppState {
  _hasHydrated: boolean;
  isAuthenticated: boolean;
  isSyncing: boolean;
  words: Word[];
  reviews: Record<string, Review>;
  gameSessions: GameSession[];
  achievements: Achievement[];
  stats: UserStats;

  setHasHydrated: (state: boolean) => void;
  login: (phone: string) => boolean;
  logout: () => void;
  syncFromCloud: () => Promise<void>;
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

const ALLOWED_PHONE = "5457827477";

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      isAuthenticated: false,
      isSyncing: false,
      words: [],
      reviews: {},
      gameSessions: [],
      achievements: [],
      stats: defaultStats,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: (phone) => {
        const cleaned = phone.replace(/\s/g, "");
        if (cleaned === ALLOWED_PHONE) {
          set({ isAuthenticated: true });
          setTimeout(() => get().syncFromCloud(), 100);
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false }),

      syncFromCloud: async () => {
        if (get().isSyncing) return;
        set({ isSyncing: true });

        try {
          const cloudData = await fetchAllData();

          if (!cloudData) {
            set({ isSyncing: false });
            return;
          }

          const localWords = get().words;
          const cloudHasData = cloudData.words.length > 0;
          const localHasData = localWords.length > 0;

          if (!cloudHasData && localHasData) {
            console.log("[sync] Pushing local data to cloud...");
            await pushLocalDataToCloud(
              get().words,
              get().reviews,
              get().stats,
              get().gameSessions,
              get().achievements
            );
            set({ isSyncing: false });
            return;
          }

          if (cloudHasData) {
            set({
              words: cloudData.words,
              reviews: cloudData.reviews,
              stats: cloudData.stats ?? get().stats,
              achievements: cloudData.achievements,
              gameSessions: cloudData.gameSessions,
              isSyncing: false,
            });
            console.log(`[sync] Loaded ${cloudData.words.length} words from cloud`);
          } else {
            set({ isSyncing: false });
          }
        } catch (e) {
          console.error("[sync] syncFromCloud error:", e);
          set({ isSyncing: false });
        }
      },

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

        upsertWord(word);
        upsertReview(review);

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
        deleteWordFromDB(id);
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

        const updatedReview: Review = {
          id: existing?.id ?? generateId(),
          wordId,
          ...result,
          lastReviewDate: new Date().toISOString().split("T")[0],
        };

        set((state) => ({
          reviews: {
            ...state.reviews,
            [wordId]: updatedReview,
          },
          words: state.words.map((w) =>
            w.id === wordId ? { ...w, status: newStatus } : w
          ),
          stats: {
            ...state.stats,
            totalReviews: state.stats.totalReviews + 1,
          },
        }));

        upsertReview(updatedReview);

        get().addXP(qualityToXP(quality));
        get().checkAndUpdateStreak();
      },

      addGameSession: (session) => {
        const fullSession: GameSession = { ...session, id: generateId() };
        set((state) => ({
          gameSessions: [fullSession, ...state.gameSessions],
        }));
        upsertGameSession(fullSession);
      },

      updateStats: (partial) => {
        set((state) => {
          const newStats = { ...state.stats, ...partial };
          upsertStats(newStats);
          return { stats: newStats };
        });
      },

      checkAndUpdateStreak: () => {
        const { stats } = get();
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        if (stats.lastActiveDate === today) return;

        let newStreak = stats.streakCount;
        if (stats.lastActiveDate === yesterday) {
          newStreak = stats.streakCount + 1;
        } else if (stats.lastActiveDate !== today) {
          newStreak = 1;
        }

        const newStats = {
          ...stats,
          streakCount: newStreak,
          lastActiveDate: today,
        };

        set((state) => ({ stats: { ...state.stats, ...newStats } }));
        upsertStats(newStats);
        get().checkAchievements();
      },

      addXP: (amount) => {
        set((state) => {
          const newXP = state.stats.xp + amount;
          const newLevel = getLevelFromXP(newXP);
          const newStats = { ...state.stats, xp: newXP, level: newLevel };
          upsertStats(newStats);
          return { stats: newStats };
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
          newAchievements.forEach(upsertAchievement);
        }
      },
    }),
    {
      name: "wordcraft-storage",
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.isAuthenticated) {
          setTimeout(() => state.syncFromCloud(), 200);
        }
      },
    }
  )
);
