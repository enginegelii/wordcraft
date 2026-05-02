"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain, ChevronRight, Star, CheckCircle2, Lock,
  BookOpen, Trophy, Settings2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  GRAMMAR_TOPICS, LEVEL_ORDER, LEVEL_DISPLAY, getTopicsByLevel,
  type GrammarLevel,
} from "@/lib/grammar-data";
import { cn } from "@/lib/utils";

export default function GrammarPage() {
  const router = useRouter();
  const grammar = useAppStore((s) => s.grammar);
  const setGrammarLevel = useAppStore((s) => s.setGrammarLevel);

  const [showLevelPicker, setShowLevelPicker] = useState(false);

  // Tamamlanan konu sayısı
  const completedCount = Object.values(grammar.topicProgress).filter(
    (p) => p.quizCompleted
  ).length;

  // ── SEVİYE BELİRLENMEMİŞ ─────────────────────────────────────────────────
  if (!grammar.placementDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Gramer Öğren</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 leading-relaxed">
            Kursundan aldığın 4 seviyedeki gramer konularını sistematik şekilde öğren. Seviyeni belirlemek için kısa bir teste gir.
          </p>
        </div>
        <div className="w-full space-y-3">
          <button
            onClick={() => router.push("/grammar/placement")}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
          >
            🧠 Seviye Belirleme Testine Gir
          </button>
          <button
            onClick={() => setShowLevelPicker(true)}
            className="w-full py-3 border-2 border-[hsl(var(--border))] rounded-xl font-semibold text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Seviyemi Kendim Seçeyim
          </button>
        </div>

        {/* Manuel seviye seçimi */}
        {showLevelPicker && (
          <div className="w-full space-y-2">
            {LEVEL_ORDER.map((level) => {
              const info = LEVEL_DISPLAY[level];
              return (
                <button
                  key={level}
                  onClick={() => {
                    setGrammarLevel(level);
                    useAppStore.getState().markPlacementDone(level);
                    setShowLevelPicker(false);
                  }}
                  className={cn(
                    "w-full p-3 rounded-xl border-2 text-left font-semibold text-sm transition-all active:scale-95",
                    info.bg, info.color
                  )}
                >
                  {info.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const currentLevel = grammar.level ?? "intermediate";
  const currentLevelInfo = LEVEL_DISPLAY[currentLevel];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gramer</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-0.5">
            {completedCount} / {GRAMMAR_TOPICS.length} konu tamamlandı
          </p>
        </div>
        <button
          onClick={() => setShowLevelPicker((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
            currentLevelInfo.bg, currentLevelInfo.color
          )}
        >
          <Settings2 className="w-3.5 h-3.5" />
          {currentLevelInfo.label}
        </button>
      </div>

      {/* Seviye değiştir dropdown */}
      {showLevelPicker && (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-3 space-y-2 shadow-lg">
          <p className="text-xs text-[hsl(var(--muted-foreground))] px-1 font-medium">Başlangıç seviyesi seç:</p>
          {LEVEL_ORDER.map((level) => {
            const info = LEVEL_DISPLAY[level];
            return (
              <button
                key={level}
                onClick={() => {
                  setGrammarLevel(level);
                  setShowLevelPicker(false);
                }}
                className={cn(
                  "w-full p-2.5 rounded-xl border text-left text-sm font-semibold transition-all active:scale-95",
                  level === currentLevel
                    ? cn(info.bg, info.color, "border-current opacity-100")
                    : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {level === currentLevel && "✓ "}{info.label}
              </button>
            );
          })}
        </div>
      )}

      {/* İlerleme özeti */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm opacity-90">Genel İlerleme</p>
          <Trophy className="w-5 h-5 opacity-70" />
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-black">{completedCount}</span>
          <span className="text-white/70 mb-1">/ {GRAMMAR_TOPICS.length} konu</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${(completedCount / GRAMMAR_TOPICS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Konular — seviye gruplarına göre */}
      {LEVEL_ORDER.map((level) => {
        const topics = getTopicsByLevel(level);
        const info = LEVEL_DISPLAY[level];
        const levelIndex = LEVEL_ORDER.indexOf(level);
        const currentLevelIndex = LEVEL_ORDER.indexOf(currentLevel);
        const isLocked = levelIndex > currentLevelIndex + 1;
        const completedInLevel = topics.filter(
          (t) => grammar.topicProgress[t.id]?.quizCompleted
        ).length;

        return (
          <div key={level}>
            {/* Level Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", info.bg, info.color)}>
                  {info.label}
                </span>
                {isLocked && <Lock className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />}
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {completedInLevel}/{topics.length}
              </span>
            </div>

            {/* Topic Cards */}
            <div className="space-y-2.5">
              {topics.map((topic) => {
                const progress = grammar.topicProgress[topic.id];
                const isCompleted = progress?.quizCompleted ?? false;
                const isStudied = progress?.studied ?? false;
                const score = progress?.quizScore ?? 0;

                return (
                  <Link
                    key={topic.id}
                    href={isLocked ? "#" : `/grammar/${topic.id}`}
                    onClick={(e) => isLocked && e.preventDefault()}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border bg-[hsl(var(--card))] transition-all",
                      isLocked
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 active:scale-[0.98]",
                      isCompleted && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10"
                    )}
                  >
                    {/* Emoji */}
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm",
                      isCompleted
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-[hsl(var(--secondary))]"
                    )}>
                      {isCompleted ? "✅" : topic.emoji}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{topic.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{topic.subtitle}</p>
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {isStudied && !isCompleted && (
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                            📖 Okundu
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                            %{score} puan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isLocked ? (
                        <Lock className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="h-4" />
    </div>
  );
}
