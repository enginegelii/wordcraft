"use client";

import Link from "next/link";
import {
  Flame, Star, BookOpen, Gamepad2, Plus, Target,
  TrendingUp, Zap, Clock, ChevronRight, Trophy, GraduationCap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn, formatRelativeDate } from "@/lib/utils";
import { getXPForNextLevel, LEVEL_THRESHOLDS, BADGES, GRAMMAR_XP_THRESHOLDS, GRAMMAR_LEVEL_ORDER } from "@/lib/types";
import { GRAMMAR_TOPICS, LEVEL_DISPLAY } from "@/lib/grammar-data";
import { useEffect } from "react";

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

  const masteredCount = words.filter((w) => w.status === "mastered").length;
  const learningCount = words.filter((w) => w.status === "learning" || w.status === "review").length;
  const todayProgress = Math.min(stats.dailyGoal, stats.totalReviews); // simplified

  // Gramer seviyesi hesaplamaları
  const grammarLevel = grammar.level;
  const grammarXP = grammar.grammarXP ?? 0;
  const completedTopics = Object.values(grammar.topicProgress ?? {}).filter((p) => p.quizCompleted).length;
  const totalTopics = GRAMMAR_TOPICS.length;
  const grammarLevelInfo = grammarLevel ? LEVEL_DISPLAY[grammarLevel] : null;
  const grammarLevelIdx = grammarLevel ? GRAMMAR_LEVEL_ORDER.indexOf(grammarLevel) : -1;
  const nextGrammarLevel = grammarLevelIdx >= 0 && grammarLevelIdx < GRAMMAR_LEVEL_ORDER.length - 1
    ? GRAMMAR_LEVEL_ORDER[grammarLevelIdx + 1] : null;
  const currentGrammarThreshold = grammarLevel ? GRAMMAR_XP_THRESHOLDS[grammarLevel] : 0;
  const nextGrammarThreshold = nextGrammarLevel ? GRAMMAR_XP_THRESHOLDS[nextGrammarLevel] : currentGrammarThreshold + 600;
  const grammarProgressPct = Math.min(100,
    ((grammarXP - currentGrammarThreshold) / Math.max(1, nextGrammarThreshold - currentGrammarThreshold)) * 100
  );

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-4xl space-y-6">
      {/* Karşılama */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          Merhaba! 👋
        </h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          {dueWords.length > 0
            ? `${dueWords.length} kelime tekrar bekliyor.`
            : "Bugün için harika görünüyor!"}
        </p>
      </div>

      {/* Streak + XP Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-lg shadow-brand-500/20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-4 text-8xl">🔥</div>
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-6 h-6 animate-streak-flame" />
              <span className="text-3xl font-black">{stats.streakCount}</span>
              <span className="text-white/80 font-medium">günlük seri</span>
            </div>
            <p className="text-white/70 text-sm">
              {stats.streakCount === 0
                ? "Bugün çalışmaya başla!"
                : stats.streakCount >= 7
                ? "Mükemmel seri! 🏆"
                : "Devam et, güçleniyorsun!"}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end mb-1">
              <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              <span className="text-2xl font-black">{stats.xp}</span>
            </div>
            <p className="text-white/70 text-sm">Seviye {stats.level}</p>
          </div>
        </div>
        {/* XP Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/70 mb-1">
            <span>Seviye {stats.level}</span>
            <span>{stats.xp} / {nextLevelXP} XP</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/70 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Günlük Hedef */}
      <div className="bg-[hsl(var(--card))] rounded-2xl p-4 border border-[hsl(var(--border))] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-500" />
            <span className="font-semibold">Günlük Hedef</span>
          </div>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            {dueWords.length} / {stats.dailyGoal} tekrar
          </span>
        </div>
        <div className="h-3 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              dueWords.length === 0
                ? "bg-gradient-to-r from-green-400 to-green-500"
                : "bg-gradient-to-r from-brand-400 to-brand-600"
            )}
            style={{ width: `${Math.min(100, ((stats.dailyGoal - dueWords.length) / stats.dailyGoal) * 100)}%` }}
          />
        </div>
        {dueWords.length === 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
            ✅ Tüm tekrarlar tamamlandı!
          </p>
        )}
      </div>

      {/* Hızlı Eylemler */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/play/flashcard"
          className={cn(
            "group relative overflow-hidden rounded-2xl p-4 text-white shadow-md transition-transform active:scale-95",
            dueWords.length > 0
              ? "bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-500/20 animate-pulse-glow"
              : "bg-gradient-to-br from-slate-500 to-slate-700"
          )}
        >
          <div className="absolute top-2 right-2 opacity-20 text-4xl">🃏</div>
          <Gamepad2 className="w-7 h-7 mb-2" />
          <p className="font-bold text-sm">Tekrar Başlat</p>
          <p className="text-white/70 text-xs">
            {dueWords.length > 0 ? `${dueWords.length} kelime bekliyor` : "Hepsi tamam!"}
          </p>
        </Link>

        <Link
          href="/add"
          className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-md shadow-violet-500/20 transition-transform active:scale-95"
        >
          <div className="absolute top-2 right-2 opacity-20 text-4xl">✨</div>
          <Plus className="w-7 h-7 mb-2" />
          <p className="font-bold text-sm">Kelime Ekle</p>
          <p className="text-white/70 text-xs">AI ile zenginleştir</p>
        </Link>

        <Link
          href="/play"
          className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-transform active:scale-95"
        >
          <div className="absolute top-2 right-2 opacity-20 text-4xl">🎮</div>
          <Zap className="w-7 h-7 mb-2" />
          <p className="font-bold text-sm">Oyunlar</p>
          <p className="text-white/70 text-xs">Eğlenerek öğren</p>
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

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-blue-500" />}
          value={words.length}
          label="Toplam Kelime"
          bg="bg-blue-50 dark:bg-blue-950/20"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          value={masteredCount}
          label="Öğrenildi"
          bg="bg-green-50 dark:bg-green-950/20"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-orange-500" />}
          value={learningCount}
          label="Öğreniliyor"
          bg="bg-orange-50 dark:bg-orange-950/20"
        />
      </div>

      {/* Gramer Seviyesi Widget */}
      {grammar.placementDone && grammarLevelInfo && (
        <Link href="/grammar" className="block">
          <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]">
            {/* Arkaplan efekti */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
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
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {completedTopics}/{totalTopics} konu tamamlandı
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full border",
                  grammarLevelInfo.bg, grammarLevelInfo.color
                )}>
                  {grammarLevelInfo.label}
                </span>
              </div>

              {/* XP İlerleme */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>{grammarXP} Gramer XP</span>
                  {nextGrammarLevel && (
                    <span className="text-indigo-500 font-medium">
                      {nextGrammarThreshold - grammarXP} XP → {LEVEL_DISPLAY[nextGrammarLevel].label}
                    </span>
                  )}
                  {!nextGrammarLevel && (
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
      )}

      {/* Gramer - henüz seviye belirlenmemiş */}
      {!grammar.placementDone && (
        <Link href="/grammar" className="block">
          <div className="rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/10 p-4 text-center hover:border-indigo-400 transition-colors active:scale-[0.99]">
            <GraduationCap className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="font-semibold text-sm text-indigo-700 dark:text-indigo-300">Gramer Seviyeni Belirle</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">10 soruluk kısa test →</p>
          </div>
        </Link>
      )}

      {/* Son Eklenen Kelimeler */}
      {recentWords.length > 0 && (
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              Son Eklenenler
            </h2>
            <Link
              href="/words"
              className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              Tümü <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-[hsl(var(--border))]">
            {recentWords.map((word) => (
              <div key={word.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-semibold">{word.word}</span>
                  <span className="text-[hsl(var(--muted-foreground))] text-sm ml-2">
                    {word.translation}
                  </span>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  `badge-${word.status}`
                )}>
                  {word.status === "new" ? "Yeni" :
                   word.status === "learning" ? "Öğreniliyor" :
                   word.status === "review" ? "Tekrar" : "Öğrenildi"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Başarımlar */}
      {achievements.length > 0 && (
        <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Son Başarımlar
          </h2>
          <div className="flex flex-wrap gap-2">
            {achievements.slice(0, 6).map((a) => {
              const badge = Object.values(BADGES).find((b) => b.id === a.badgeId);
              if (!badge) return null;
              return (
                <div
                  key={a.id}
                  title={badge.desc}
                  className="flex items-center gap-1.5 bg-[hsl(var(--secondary))] rounded-lg px-3 py-1.5"
                >
                  <span className="text-lg">{badge.icon}</span>
                  <span className="text-sm font-medium">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Boş durum */}
      {words.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="text-6xl">📖</div>
          <h3 className="text-xl font-bold">Hadi Başlayalım!</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-xs mx-auto">
            İlk kelimeni ekleyerek öğrenme yolculuğuna başla. AI otomatik olarak zengin bir kart oluşturacak.
          </p>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            İlk Kelimeni Ekle
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, value, label, bg,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  bg: string;
}) {
  return (
    <div className={cn("rounded-2xl p-3 text-center", bg)}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] leading-tight">{label}</p>
    </div>
  );
}
