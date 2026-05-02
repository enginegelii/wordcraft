"use client";

import Link from "next/link";
import {
  Flame, Star, BookOpen, Gamepad2, Plus, Target,
  Zap, ChevronRight, Trophy, GraduationCap, Sparkles,
  CheckCircle2, RotateCcw, TrendingUp,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn, formatRelativeDate } from "@/lib/utils";
import {
  getXPForNextLevel, LEVEL_THRESHOLDS, BADGES,
  GRAMMAR_XP_THRESHOLDS, GRAMMAR_LEVEL_ORDER,
} from "@/lib/types";
import { GRAMMAR_TOPICS, LEVEL_DISPLAY } from "@/lib/grammar-data";
import { useEffect } from "react";

// ─── XP BREAKDOWN ─────────────────────────────────────────────────────────────
const XP_TIPS = [
  { icon: "➕", text: "Kelime ekle", xp: "+5 XP" },
  { icon: "✅", text: "Doğru cevap (iyi)", xp: "+8 XP" },
  { icon: "⭐", text: "Doğru cevap (mükemmel)", xp: "+10 XP" },
  { icon: "🏆", text: "Kelime öğrenildi!", xp: "+15 XP bonus" },
  { icon: "📖", text: "Gramer konusu oku", xp: "+10 XP" },
  { icon: "🎯", text: "Quiz tamamla (≥70%)", xp: "+50 Gramer XP" },
];

export default function Dashboard() {
  const stats = useAppStore((s) => s.stats);
  const words = useAppStore((s) => s.words);
  const achievements = useAppStore((s) => s.achievements);
  const getDueWords = useAppStore((s) => s.getDueWords);
  const checkAndUpdateStreak = useAppStore((s) => s.checkAndUpdateStreak);
  const grammar = useAppStore((s) => s.grammar);

  useEffect(() => {
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  const dueWords = getDueWords();
  const recentWords = words.slice(0, 5);
  const currentLevelXP = LEVEL_THRESHOLDS[stats.level - 1] ?? 0;
  const nextLevelXP = getXPForNextLevel(stats.level);
  const progressPct = Math.min(
    100,
    ((stats.xp - currentLevelXP) / Math.max(1, nextLevelXP - currentLevelXP)) * 100
  );

  const newCount = words.filter((w) => w.status === "new").length;
  const learningCount = words.filter((w) => w.status === "learning" || w.status === "review").length;
  const masteredCount = words.filter((w) => w.status === "mastered").length;
  const masteredPct = words.length > 0 ? Math.round((masteredCount / words.length) * 100) : 0;

  // Gramer
  const grammarLevel = grammar.level;
  const grammarXP = grammar.grammarXP ?? 0;
  const completedTopics = Object.values(grammar.topicProgress ?? {}).filter((p) => p.quizCompleted).length;
  const totalTopics = GRAMMAR_TOPICS.length;
  const grammarLevelInfo = grammarLevel ? LEVEL_DISPLAY[grammarLevel] : null;
  const grammarLevelIdx = grammarLevel ? GRAMMAR_LEVEL_ORDER.indexOf(grammarLevel) : -1;
  const nextGrammarLevel =
    grammarLevelIdx >= 0 && grammarLevelIdx < GRAMMAR_LEVEL_ORDER.length - 1
      ? GRAMMAR_LEVEL_ORDER[grammarLevelIdx + 1]
      : null;
  const nextGrammarThreshold = nextGrammarLevel ? GRAMMAR_XP_THRESHOLDS[nextGrammarLevel] : (grammarLevel ? GRAMMAR_XP_THRESHOLDS[grammarLevel] : 0) + 600;
  const currentGrammarThreshold = grammarLevel ? GRAMMAR_XP_THRESHOLDS[grammarLevel] : 0;
  const grammarProgressPct = Math.min(
    100,
    ((grammarXP - currentGrammarThreshold) / Math.max(1, nextGrammarThreshold - currentGrammarThreshold)) * 100
  );

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-4xl space-y-5">

      {/* ── Streak + XP Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-lg shadow-brand-500/20">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute -top-4 -right-4 text-[120px] leading-none">🔥</div>
        </div>
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
              {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div className="flex items-baseline gap-2 mb-0.5">
              <Flame className="w-6 h-6 shrink-0" />
              <span className="text-3xl font-black">{stats.streakCount}</span>
              <span className="text-white/80 font-medium text-sm">günlük seri</span>
            </div>
            <p className="text-white/70 text-xs">
              {stats.streakCount === 0 ? "Bugün çalışmaya başla!" : stats.streakCount >= 7 ? "Mükemmel seri! 🏆" : "Devam et, güçleniyorsun!"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end mb-0.5">
              <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              <span className="text-2xl font-black">{stats.xp.toLocaleString("tr")}</span>
            </div>
            <p className="text-white/70 text-xs">Seviye {stats.level}</p>
          </div>
        </div>
        <div className="relative mt-3 space-y-1">
          <div className="flex justify-between text-xs text-white/60">
            <span>Seviye {stats.level}</span>
            <span>{stats.xp.toLocaleString("tr")} / {nextLevelXP.toLocaleString("tr")} XP</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/70 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Kelime Öğrenme Yolculuğu ──────────────────────────────────────── */}
      {words.length > 0 && (
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            Kelime Öğrenme Yolculuğu
          </h2>

          {/* Funnel: new → learning → mastered */}
          <div className="flex items-center gap-2 mb-4">
            <WordStageCard
              emoji="🆕"
              label="Yeni"
              count={newCount}
              color="bg-slate-100 dark:bg-slate-800/60"
              textColor="text-slate-600 dark:text-slate-300"
            />
            <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0" />
            <WordStageCard
              emoji="📖"
              label="Öğreniliyor"
              count={learningCount}
              color="bg-orange-50 dark:bg-orange-900/20"
              textColor="text-orange-600 dark:text-orange-400"
            />
            <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0" />
            <WordStageCard
              emoji="✅"
              label="Öğrenildi"
              count={masteredCount}
              color="bg-green-50 dark:bg-green-900/20"
              textColor="text-green-600 dark:text-green-400"
            />
          </div>

          {/* Overall mastery bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
              <span>{masteredCount} / {words.length} kelime öğrenildi</span>
              <span className="font-semibold text-green-600 dark:text-green-400">%{masteredPct}</span>
            </div>
            <div className="h-2.5 bg-[hsl(var(--secondary))] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-700"
                style={{ width: `${masteredPct}%` }}
              />
            </div>
          </div>

          {/* How to learn tip */}
          <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            💡 <span className="font-medium text-[hsl(var(--foreground))]">Nasıl öğrenilir?</span>{" "}
            Her kelimeyi flashcard, eşleştirme veya boşluk doldurma oyunlarında tekrarlayın.
            {" "}<span className="font-semibold text-brand-500">5+ doğru cevap → Öğrenildi (+15 XP bonus)</span>
          </div>
        </div>
      )}

      {/* ── Günlük Hedef / Tekrar ─────────────────────────────────────────── */}
      <div className="bg-[hsl(var(--card))] rounded-2xl p-4 border border-[hsl(var(--border))] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-500" />
            <span className="font-semibold text-sm">Bugünkü Tekrarlar</span>
          </div>
          <span className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            dueWords.length === 0
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400"
          )}>
            {dueWords.length === 0 ? "✅ Tamamlandı" : `${dueWords.length} bekliyor`}
          </span>
        </div>
        <div className="h-2.5 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              dueWords.length === 0
                ? "bg-gradient-to-r from-green-400 to-green-500"
                : "bg-gradient-to-r from-brand-400 to-brand-600"
            )}
            style={{ width: `${Math.min(100, ((stats.dailyGoal - dueWords.length) / Math.max(1, stats.dailyGoal)) * 100)}%` }}
          />
        </div>
        {dueWords.length > 0 && (
          <Link
            href="/play/flashcard"
            className="mt-3 flex items-center justify-center gap-2 bg-brand-500 text-white py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            {dueWords.length} Kelimeyi Tekrarla
          </Link>
        )}
      </div>

      {/* ── Hızlı Eylemler ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/add"
          className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-md shadow-violet-500/20 transition-transform active:scale-95"
        >
          <div className="absolute top-2 right-2 opacity-20 text-4xl">✨</div>
          <Plus className="w-7 h-7 mb-2" />
          <p className="font-bold text-sm">Kelime Ekle</p>
          <p className="text-white/70 text-xs">AI ile zenginleştir · +5 XP</p>
        </Link>

        <Link
          href="/play"
          className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-transform active:scale-95"
        >
          <div className="absolute top-2 right-2 opacity-20 text-4xl">🎮</div>
          <Gamepad2 className="w-7 h-7 mb-2" />
          <p className="font-bold text-sm">Oyunlar</p>
          <p className="text-white/70 text-xs">Eğlenerek öğren</p>
        </Link>

        <Link
          href="/grammar"
          className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-transform active:scale-95"
        >
          <div className="absolute top-2 right-2 opacity-20 text-4xl">🎓</div>
          <GraduationCap className="w-7 h-7 mb-2" />
          <p className="font-bold text-sm">Gramer</p>
          <p className="text-white/70 text-xs">{completedTopics}/{totalTopics} konu · Quiz XP</p>
        </Link>

        <Link
          href="/words"
          className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/20 transition-transform active:scale-95"
        >
          <div className="absolute top-2 right-2 opacity-20 text-4xl">📚</div>
          <BookOpen className="w-7 h-7 mb-2" />
          <p className="font-bold text-sm">Kelime Defterim</p>
          <p className="text-white/70 text-xs">{words.length} kelime</p>
        </Link>
      </div>

      {/* ── XP Kazanma Rehberi ────────────────────────────────────────────── */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          XP Nasıl Kazanılır?
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {XP_TIPS.map((tip) => (
            <div key={tip.text} className="flex items-center gap-2 bg-[hsl(var(--secondary))] rounded-xl px-3 py-2">
              <span className="text-base shrink-0">{tip.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{tip.text}</p>
                <p className="text-xs text-brand-500 font-bold">{tip.xp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gramer Seviyesi ───────────────────────────────────────────────── */}
      {grammar.placementDone && grammarLevelInfo ? (
        <Link href="/grammar" className="block">
          <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]">
            <div className="absolute top-0 right-0 w-28 h-28 opacity-5">
              <GraduationCap className="w-full h-full" />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Gramer Seviyesi</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{completedTopics}/{totalTopics} konu tamamlandı</p>
                  </div>
                </div>
                <span className={cn("text-xs font-bold px-3 py-1 rounded-full border", grammarLevelInfo.bg, grammarLevelInfo.color)}>
                  {grammarLevelInfo.label}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>{grammarXP} Gramer XP</span>
                  {nextGrammarLevel ? (
                    <span className="text-indigo-500 font-medium">{nextGrammarThreshold - grammarXP} XP → {LEVEL_DISPLAY[nextGrammarLevel].label}</span>
                  ) : (
                    <span className="text-green-500 font-medium">Maksimum Seviye 🏆</span>
                  )}
                </div>
                <div className="h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${nextGrammarLevel ? grammarProgressPct : 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/grammar" className="block">
          <div className="rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/10 p-4 text-center hover:border-indigo-400 transition-colors active:scale-[0.99]">
            <GraduationCap className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="font-semibold text-sm text-indigo-700 dark:text-indigo-300">Gramer Seviyeni Belirle</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">10 soruluk kısa test →</p>
          </div>
        </Link>
      )}

      {/* ── Son Eklenen Kelimeler ─────────────────────────────────────────── */}
      {recentWords.length > 0 && (
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              Son Eklenenler
            </h2>
            <Link href="/words" className="text-xs text-brand-500 flex items-center gap-0.5">
              Tümü <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-[hsl(var(--border))]">
            {recentWords.map((word) => (
              <div key={word.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-sm">{word.word}</span>
                  <span className="text-[hsl(var(--muted-foreground))] text-xs ml-2 truncate">
                    {word.translation}
                  </span>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2", `badge-${word.status}`)}>
                  {word.status === "new" ? "Yeni" :
                   word.status === "learning" ? "Öğreniliyor" :
                   word.status === "review" ? "Tekrar" : "✅ Öğrenildi"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Başarımlar ────────────────────────────────────────────────────── */}
      {achievements.length > 0 && (
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
          <h2 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Başarımlar
          </h2>
          <div className="flex flex-wrap gap-2">
            {achievements.slice(0, 6).map((a) => {
              const badge = Object.values(BADGES).find((b) => b.id === a.badgeId);
              if (!badge) return null;
              return (
                <div key={a.id} title={badge.desc} className="flex items-center gap-1.5 bg-[hsl(var(--secondary))] rounded-lg px-3 py-1.5">
                  <span className="text-base">{badge.icon}</span>
                  <span className="text-xs font-medium">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Boş durum ────────────────────────────────────────────────────── */}
      {words.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="text-6xl">📖</div>
          <h3 className="text-xl font-bold">Hadi Başlayalım!</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-xs mx-auto text-sm">
            İlk kelimeni ekle, AI otomatik olarak zengin bir kart oluşturacak.
          </p>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            İlk Kelimeni Ekle
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Word Stage Card ──────────────────────────────────────────────────────────
function WordStageCard({
  emoji, label, count, color, textColor,
}: {
  emoji: string; label: string; count: number; color: string; textColor: string;
}) {
  return (
    <div className={cn("flex-1 rounded-xl p-2.5 text-center", color)}>
      <div className="text-xl mb-0.5">{emoji}</div>
      <div className={cn("text-xl font-black", textColor)}>{count}</div>
      <div className="text-[10px] text-[hsl(var(--muted-foreground))] leading-tight">{label}</div>
    </div>
  );
}
