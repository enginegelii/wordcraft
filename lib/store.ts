"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Word, Review, GameSession, UserStats, Achievement,
  GrammarState, GrammarTopicProgress,
  getLevelFromXP, BADGES,
  getGrammarLevelFromXP,
  GRAMMAR_LEVEL_ORDER, GRAMMAR_XP_THRESHOLDS,
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
  upsertGrammarProgress,
  upsertGrammarMeta,
} from "./db";

interface AppState {
  _hasHydrated: boolean;
  isAuthenticated: boolean;
  isSyncing: boolean;
  words: Word[];
  reviews: Record<string, Review>;
  gameSessions: GameSession[];
  achievements: Achievement[];
  deletedWordIds: string[];   // kalıcı silme takibi
  stats: UserStats;
  grammar: GrammarState;

  setHasHydrated: (state: boolean) => void;
  login: (phone: string) => boolean;
  logout: () => void;
  clearDeletedWordIds: () => void;
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

  // Grammar actions
  setGrammarLevel: (level: GrammarState["level"]) => void;
  markPlacementDone: (level: GrammarState["level"]) => void;
  markTopicStudied: (topicId: string) => void;
  completeTopicQuiz: (topicId: string, score: number) => void;
  getTopicProgress: (topicId: string) => GrammarTopicProgress | null;
  addGrammarXP: (amount: number) => void;
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

const defaultGrammar: GrammarState = {
  level: null,
  placementDone: false,
  topicProgress: {},
  grammarXP: 0,
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
      deletedWordIds: [],
      stats: defaultStats,
      grammar: defaultGrammar,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      clearDeletedWordIds: () => set({ deletedWordIds: [] }),

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
          const localReviews = get().reviews;
          const cloudHasData = cloudData.words.length > 0;
          const localHasData = localWords.length > 0;

          if (!cloudHasData && localHasData) {
            // Cloud boş, lokal dolu → lokali cloud'a gönder
            console.log("[sync] Pushing local data to cloud...");
            await pushLocalDataToCloud(
              localWords,
              localReviews,
              get().stats,
              get().gameSessions,
              get().achievements,
              get().grammar
            );
            set({ isSyncing: false });
            return;
          }

          if (cloudHasData) {
            // Silinen ID'leri al — bunlar cloud'dan gelse bile eklenmeyecek
            const deletedIds = new Set(get().deletedWordIds);

            // Cloud'dan gelen kelimeleri filtrele (silinmişleri çıkar)
            const filteredCloudWords = cloudData.words.filter((w) => !deletedIds.has(w.id));
            const cloudWordMap = new Map(filteredCloudWords.map((w) => [w.id, w]));

            // Local-only: cloud'da olmayan ve silinmemiş kelimeler
            const localOnlyWords = localWords.filter(
              (w) => !cloudWordMap.has(w.id) && !deletedIds.has(w.id)
            );
            const mergedWords = [...filteredCloudWords, ...localOnlyWords];

            const mergedReviews = { ...localReviews, ...cloudData.reviews };

            // Başarımları birleştir
            const cloudBadgeIds = new Set(cloudData.achievements.map((a) => a.badgeId));
            const localOnlyAchievements = get().achievements.filter((a) => !cloudBadgeIds.has(a.badgeId));
            const mergedAchievements = [...cloudData.achievements, ...localOnlyAchievements];

            // En iyi stats'ı seç (daha yüksek XP)
            const cloudStats = cloudData.stats ?? get().stats;
            const mergedStats = cloudStats.xp >= get().stats.xp ? cloudStats : get().stats;

            // Grammar: cloud ve local'i birleştir
            const localGrammar = get().grammar;
            const cloudGrammarMeta = cloudData.grammarMeta;
            const cloudTopicProgress = cloudData.topicProgress ?? {};
            const mergedTopicProgress = { ...localGrammar.topicProgress, ...cloudTopicProgress };

            // Daha yüksek grammarXP'yi tut
            const cloudGrammarXP = cloudGrammarMeta?.grammarXP ?? 0;
            const localGrammarXP = localGrammar.grammarXP ?? 0;
            const mergedGrammarXP = Math.max(cloudGrammarXP, localGrammarXP);

            // Level: cloud'dan geldiyse kullan (null değilse), yoksa local'i koru
            const mergedGrammarLevel = cloudGrammarMeta?.level ?? localGrammar.level;
            const mergedPlacementDone = (cloudGrammarMeta?.placementDone ?? false) || localGrammar.placementDone;

            const mergedGrammar = {
              level: mergedGrammarLevel,
              placementDone: mergedPlacementDone,
              grammarXP: mergedGrammarXP,
              topicProgress: mergedTopicProgress,
            };

            set({
              words: mergedWords,
              reviews: mergedReviews,
              stats: mergedStats,
              achievements: mergedAchievements,
              gameSessions: cloudData.gameSessions,
              grammar: mergedGrammar,
              isSyncing: false,
            });

            // Lokalde fazladan kelimeler varsa cloud'a da yaz
            if (localOnlyWords.length > 0) {
              console.log(`[sync] Pushing ${localOnlyWords.length} local-only words to cloud...`);
              await pushLocalDataToCloud(mergedWords, mergedReviews, mergedStats, get().gameSessions, mergedAchievements, mergedGrammar);
            }

            // Eğer local'de grammar level var ama cloud'da yoksa → cloud'a yaz
            // (Kullanıcı sync özelliğinden önce placement test yapmış olabilir)
            if (mergedGrammar.level && !cloudGrammarMeta?.level) {
              console.log("[sync] Grammar level local'de var, cloud'a yazılıyor...");
              upsertGrammarMeta(mergedGrammar, mergedStats);
              // Topic progress varsa onları da yaz
              Object.values(mergedGrammar.topicProgress ?? {}).forEach((tp) => {
                upsertGrammarProgress(tp);
              });
            }

            // Cloud'da hâlâ var olabilecek silinmiş kelimeleri temizle
            const deletedIdsList = get().deletedWordIds;
            if (deletedIdsList.length > 0) {
              deletedIdsList.forEach((id) => deleteWordFromDB(id));
            }

            console.log(`[sync] Merged: ${mergedWords.length} words total`);
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
            // Silinen ID'yi takip et (sync sırasında cloud'dan geri gelmesin)
            deletedWordIds: [...new Set([...state.deletedWordIds, id])].slice(-500),
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

        // Mastery bonus: kelime ilk kez "mastered" olunca +15 XP
        const oldWord = get().words.find((w) => w.id === wordId);
        if (newStatus === "mastered" && oldWord?.status !== "mastered") {
          get().addXP(15);
        }

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

      // ── GRAMMAR ACTIONS ──────────────────────────────────────────────
      setGrammarLevel: (level) => {
        set((state) => ({
          grammar: { ...state.grammar, level },
        }));
      },

      markPlacementDone: (level) => {
        set((state) => ({
          grammar: { ...state.grammar, level, placementDone: true },
        }));
        upsertGrammarMeta(get().grammar, get().stats);
      },

      markTopicStudied: (topicId) => {
        set((state) => {
          const existing = state.grammar.topicProgress[topicId] ?? {
            topicId,
            studied: false,
            quizCompleted: false,
            quizScore: 0,
          };
          return {
            grammar: {
              ...state.grammar,
              topicProgress: {
                ...state.grammar.topicProgress,
                [topicId]: { ...existing, studied: true },
              },
            },
          };
        });
        const updatedProgress = get().grammar.topicProgress[topicId];
        if (updatedProgress) upsertGrammarProgress(updatedProgress);
        upsertGrammarMeta(get().grammar, get().stats);
        get().addXP(10);
      },

      completeTopicQuiz: (topicId, score) => {
        set((state) => {
          const existing = state.grammar.topicProgress[topicId] ?? {
            topicId,
            studied: false,
            quizCompleted: false,
            quizScore: 0,
          };
          return {
            grammar: {
              ...state.grammar,
              topicProgress: {
                ...state.grammar.topicProgress,
                [topicId]: {
                  ...existing,
                  quizCompleted: true,
                  quizScore: Math.max(existing.quizScore, score),
                  completedAt: new Date().toISOString(),
                },
              },
            },
          };
        });
        const xpGain = Math.round((score / 100) * 20);
        get().addXP(xpGain);
        // Gramer XP: quiz skoru ≥70 ise +50, 50-70 arası +30, altı +15
        const grammarXPGain = score >= 70 ? 50 : score >= 50 ? 30 : 15;
        get().addGrammarXP(grammarXPGain);
        get().checkAndUpdateStreak();
        // Cloud'a kaydet
        const completedProgress = get().grammar.topicProgress[topicId];
        if (completedProgress) upsertGrammarProgress(completedProgress);
        upsertGrammarMeta(get().grammar, get().stats);
      },

      getTopicProgress: (topicId) => {
        return get().grammar.topicProgress[topicId] ?? null;
      },

      addGrammarXP: (amount) => {
        set((state) => {
          const newXP = (state.grammar.grammarXP ?? 0) + amount;
          const currentLevel = state.grammar.level;
          if (!currentLevel) return { grammar: { ...state.grammar, grammarXP: newXP } };

          // SADECE yükselt, asla düşürme — bir sonraki seviyeye yetecek XP var mı bak
          const currentIdx = GRAMMAR_LEVEL_ORDER.indexOf(currentLevel);
          let newLevel = currentLevel;
          // Tüm üst seviyeleri kontrol et (birden fazla atlama mümkün)
          for (let i = currentIdx + 1; i < GRAMMAR_LEVEL_ORDER.length; i++) {
            const candidate = GRAMMAR_LEVEL_ORDER[i];
            if (newXP >= GRAMMAR_XP_THRESHOLDS[candidate]) {
              newLevel = candidate;
            }
          }

          return {
            grammar: {
              ...state.grammar,
              grammarXP: newXP,
              level: newLevel,
            },
          };
        });
        // Gramer XP'yi buluta kaydet (cihazlar arası senkron için)
        const { grammar, stats } = get();
        const updatedGrammar = {
          ...grammar,
          grammarXP: (grammar.grammarXP ?? 0) + amount,
        };
        upsertGrammarMeta(updatedGrammar, stats).catch(() => {/* offline */});
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
      version: 3,
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as any;
        // v1 → v2: grammar alanlarını güvenli hale getir
        if (!state.grammar) {
          state.grammar = { level: null, placementDone: false, topicProgress: {}, grammarXP: 0 };
        } else {
          if (!state.grammar.topicProgress) state.grammar.topicProgress = {};
          if (state.grammar.grammarXP === undefined) state.grammar.grammarXP = 0;
        }
        // v2 → v3: deletedWordIds ekle
        if (!state.deletedWordIds) state.deletedWordIds = [];
        return state;
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        words: state.words,
        reviews: state.reviews,
        gameSessions: state.gameSessions,
        achievements: state.achievements,
        deletedWordIds: state.deletedWordIds,
        stats: state.stats,
        grammar: state.grammar,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.isAuthenticated) {
          setTimeout(() => state.syncFromCloud(), 200);
        }
      },
    }
  )
);
