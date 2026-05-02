/**
 * Supabase veritabanı CRUD operasyonları
 * camelCase (TypeScript) <-> snake_case (Postgres) dönüşümlerini yönetir
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import type { Word, Review, UserStats, GameSession, Achievement, GrammarState, GrammarTopicProgress } from "./types";

// ─── Row → TypeScript mappers ────────────────────────────────────────────────

function rowToWord(row: Record<string, unknown>): Word {
  return {
    id: row.id as string,
    word: row.word as string,
    translation: row.translation as string,
    partOfSpeech: row.part_of_speech as Word["partOfSpeech"],
    ipa: row.ipa as string | undefined,
    examples: (row.examples as Word["examples"]) || [],
    synonyms: (row.synonyms as string[]) || [],
    antonyms: (row.antonyms as string[]) || [],
    contextTag: row.context_tag as Word["contextTag"],
    originalContext: row.original_context as string | undefined,
    imageUrl: row.image_url as string | undefined,
    grammarNote: row.grammar_note as string | undefined,
    status: row.status as Word["status"],
    createdAt: row.created_at as string,
  };
}

function wordToRow(word: Word) {
  return {
    id: word.id,
    word: word.word,
    translation: word.translation,
    part_of_speech: word.partOfSpeech,
    ipa: word.ipa ?? null,
    examples: word.examples,
    synonyms: word.synonyms,
    antonyms: word.antonyms,
    context_tag: word.contextTag,
    original_context: word.originalContext ?? null,
    image_url: word.imageUrl ?? null,
    grammar_note: word.grammarNote ?? null,
    status: word.status,
    created_at: word.createdAt,
  };
}

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    wordId: row.word_id as string,
    easeFactor: row.ease_factor as number,
    interval: row.interval as number,
    repetitions: row.repetitions as number,
    nextReviewDate: row.next_review_date as string,
    lastReviewDate: row.last_review_date as string | undefined,
  };
}

function reviewToRow(review: Review) {
  return {
    id: review.id,
    word_id: review.wordId,
    ease_factor: review.easeFactor,
    interval: review.interval,
    repetitions: review.repetitions,
    next_review_date: review.nextReviewDate,
    last_review_date: review.lastReviewDate ?? null,
  };
}

function rowToStats(row: Record<string, unknown>): UserStats {
  return {
    streakCount: row.streak_count as number,
    lastActiveDate: row.last_active_date as string,
    xp: row.xp as number,
    level: row.level as number,
    totalWordsAdded: row.total_words_added as number,
    totalReviews: row.total_reviews as number,
    dailyGoal: row.daily_goal as number,
  };
}

function statsToRow(stats: UserStats, grammar?: GrammarState) {
  return {
    id: 1,
    streak_count: stats.streakCount,
    last_active_date: stats.lastActiveDate,
    xp: stats.xp,
    level: stats.level,
    total_words_added: stats.totalWordsAdded,
    total_reviews: stats.totalReviews,
    daily_goal: stats.dailyGoal,
    // Grammar meta (optional — only written when grammar state is provided)
    ...(grammar !== undefined ? {
      grammar_level: grammar.level ?? null,
      grammar_xp: grammar.grammarXP ?? 0,
      grammar_placement_done: grammar.placementDone ?? false,
    } : {}),
  };
}

function rowToGrammarMeta(row: Record<string, unknown>): Pick<GrammarState, "level" | "grammarXP" | "placementDone"> {
  return {
    level: (row.grammar_level as GrammarState["level"]) ?? null,
    grammarXP: (row.grammar_xp as number) ?? 0,
    placementDone: (row.grammar_placement_done as boolean) ?? false,
  };
}

function grammarProgressToRow(p: GrammarTopicProgress) {
  return {
    id: `topic_${p.topicId}`,
    topic_id: p.topicId,
    studied: p.studied,
    quiz_completed: p.quizCompleted,
    quiz_score: p.quizScore,
    completed_at: p.completedAt ?? null,
    updated_at: new Date().toISOString(),
  };
}

// ─── Fetch all data ───────────────────────────────────────────────────────────

export async function fetchAllData() {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [wordsRes, reviewsRes, statsRes, achievementsRes, sessionsRes, grammarProgressRes] =
      await Promise.all([
        supabase.from("words").select("*").order("created_at", { ascending: false }),
        supabase.from("reviews").select("*"),
        supabase.from("user_stats").select("*").eq("id", 1).maybeSingle(),
        supabase.from("achievements").select("*"),
        supabase
          .from("game_sessions")
          .select("*")
          .order("played_at", { ascending: false })
          .limit(100),
        supabase.from("grammar_progress").select("*"),
      ]);

    const words: Word[] = (wordsRes.data ?? []).map(rowToWord);

    const reviews: Record<string, Review> = {};
    (reviewsRes.data ?? []).forEach((row) => {
      const r = rowToReview(row);
      reviews[r.wordId] = r;
    });

    const stats: UserStats | null = statsRes.data
      ? rowToStats(statsRes.data)
      : null;

    // Grammar meta (level, xp, placement) from user_stats row
    const grammarMeta = statsRes.data ? rowToGrammarMeta(statsRes.data) : null;

    // Grammar topic progress from grammar_progress table
    const topicProgress: Record<string, GrammarTopicProgress> = {};
    (grammarProgressRes.data ?? []).forEach((row) => {
      const tp: GrammarTopicProgress = {
        topicId: row.topic_id as string,
        studied: row.studied as boolean,
        quizCompleted: row.quiz_completed as boolean,
        quizScore: row.quiz_score as number,
        completedAt: row.completed_at as string | undefined,
      };
      topicProgress[tp.topicId] = tp;
    });

    const achievements: Achievement[] = (achievementsRes.data ?? []).map(
      (row) => ({
        id: row.id as string,
        badgeId: row.badge_id as string,
        unlockedAt: row.unlocked_at as string,
      })
    );

    const gameSessions: GameSession[] = (sessionsRes.data ?? []).map((row) => ({
      id: row.id as string,
      gameType: row.game_type as GameSession["gameType"],
      score: row.score as number,
      wordsPracticed: (row.words_practiced as string[]) ?? [],
      playedAt: row.played_at as string,
      duration: (row.duration as number) ?? 0,
    }));

    return { words, reviews, stats, grammarMeta, topicProgress, achievements, gameSessions };
  } catch (e) {
    console.error("[db] fetchAllData error:", e);
    return null;
  }
}

// ─── Individual upserts ───────────────────────────────────────────────────────

export async function upsertWord(word: Word) {
  console.log("[db] upsertWord çağrıldı:", word.word, "| configured:", isSupabaseConfigured, "| client:", !!supabase);
  if (!isSupabaseConfigured || !supabase) {
    console.warn("[db] upsertWord: atlandı — Supabase yapılandırılmamış");
    return;
  }
  try {
    const { error } = await supabase.from("words").upsert(wordToRow(word));
    if (error) {
      console.error("[db] upsertWord HATA:", error.message, error);
    } else {
      console.log("[db] upsertWord başarılı ✓", word.word);
    }
  } catch (e) {
    console.error("[db] upsertWord exception:", e);
  }
}

export async function deleteWordFromDB(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("words").delete().eq("id", id);
  if (error) console.error("[db] deleteWord error:", error.message);
}

export async function upsertReview(review: Review) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("reviews").upsert(reviewToRow(review));
  if (error) console.error("[db] upsertReview error:", error.message);
}

export async function upsertStats(stats: UserStats, grammar?: GrammarState) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("user_stats").upsert(statsToRow(stats, grammar));
  if (error) console.error("[db] upsertStats error:", error.message);
}

export async function upsertGrammarProgress(progress: GrammarTopicProgress) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from("grammar_progress")
    .upsert(grammarProgressToRow(progress), { onConflict: "id" });
  if (error) console.error("[db] upsertGrammarProgress error:", error.message);
}

export async function upsertGrammarMeta(grammar: GrammarState, stats: UserStats) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("user_stats").upsert(statsToRow(stats, grammar));
  if (error) console.error("[db] upsertGrammarMeta error:", error.message);
}

export async function upsertGameSession(session: GameSession) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("game_sessions").upsert({
    id: session.id,
    game_type: session.gameType,
    score: session.score,
    words_practiced: session.wordsPracticed,
    played_at: session.playedAt,
    duration: session.duration,
  });
  if (error) console.error("[db] upsertGameSession error:", error.message);
}

export async function upsertAchievement(achievement: Achievement) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("achievements").upsert({
    id: achievement.id,
    badge_id: achievement.badgeId,
    unlocked_at: achievement.unlockedAt,
  });
  if (error) console.error("[db] upsertAchievement error:", error.message);
}

// ─── Bulk push local → cloud ──────────────────────────────────────────────────

export async function pushLocalDataToCloud(
  words: Word[],
  reviews: Record<string, Review>,
  stats: UserStats,
  gameSessions: GameSession[],
  achievements: Achievement[],
  grammar?: GrammarState
) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: any[] = [];

    if (words.length > 0) {
      ops.push(supabase.from("words").upsert(words.map(wordToRow)));
    }

    const reviewList = Object.values(reviews);
    if (reviewList.length > 0) {
      ops.push(supabase.from("reviews").upsert(reviewList.map(reviewToRow)));
    }

    ops.push(supabase.from("user_stats").upsert(statsToRow(stats, grammar)));

    if (gameSessions.length > 0) {
      ops.push(
        supabase.from("game_sessions").upsert(
          gameSessions.map((s) => ({
            id: s.id,
            game_type: s.gameType,
            score: s.score,
            words_practiced: s.wordsPracticed,
            played_at: s.playedAt,
            duration: s.duration,
          }))
        )
      );
    }

    if (achievements.length > 0) {
      ops.push(
        supabase.from("achievements").upsert(
          achievements.map((a) => ({
            id: a.id,
            badge_id: a.badgeId,
            unlocked_at: a.unlockedAt,
          }))
        )
      );
    }

    // Grammar topic progress
    if (grammar?.topicProgress) {
      const topicRows = Object.values(grammar.topicProgress).map(grammarProgressToRow);
      if (topicRows.length > 0) {
        ops.push(supabase.from("grammar_progress").upsert(topicRows, { onConflict: "id" }));
      }
    }

    await Promise.all(ops);
    console.log("[db] Local data pushed to cloud ✓");
  } catch (e) {
    console.error("[db] pushLocalDataToCloud error:", e);
  }
}
