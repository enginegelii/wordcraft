"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, X, Trophy, Brain } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { PLACEMENT_QUESTIONS, determineLevel, LEVEL_DISPLAY } from "@/lib/grammar-data";
import { cn, playSound, triggerHaptic } from "@/lib/utils";

type Phase = "intro" | "quiz" | "result";

export default function GrammarPlacementPage() {
  const router = useRouter();
  const markPlacementDone = useAppStore((s) => s.markPlacementDone);

  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof determineLevel> | null>(null);

  const current = PLACEMENT_QUESTIONS[index];
  const progress = ((index + 1) / PLACEMENT_QUESTIONS.length) * 100;
  const isLast = index === PLACEMENT_QUESTIONS.length - 1;

  const handleSelect = (optionIdx: number) => {
    if (answered) return;
    setSelected(optionIdx);
    setAnswered(true);

    const isCorrect = optionIdx === current.correct;
    if (isCorrect) {
      playSound("correct");
      triggerHaptic("light");
    } else {
      playSound("wrong");
      triggerHaptic("medium");
    }

    const newAnswers = [...answers, { questionId: current.id, isCorrect }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (isLast) {
        const level = determineLevel(newAnswers);
        setResult(level);
        markPlacementDone(level);
        setPhase("result");
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
        setAnswered(false);
      }
    }, 900);
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Seviye Belirleme Testi</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 leading-relaxed">
            10 kısa soru ile gramer seviyeni belirleyeceğiz. Buna göre sana uygun konuları önereceğiz.
          </p>
        </div>
        <div className="w-full bg-[hsl(var(--secondary))] rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">10</span>
            <span>Çoktan seçmeli soru</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">~</span>
            <span>Yaklaşık 3-5 dakika</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>Olası seviye: A2 → C1</span>
          </div>
        </div>
        <button
          onClick={() => setPhase("quiz")}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
        >
          Teste Başla →
        </button>
        <Link href="/grammar" className="text-[hsl(var(--muted-foreground))] text-sm">
          ← Geri Dön
        </Link>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const levelInfo = LEVEL_DISPLAY[result];
    const correct = answers.filter((a) => a.isCorrect).length;
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center space-y-6 max-w-md mx-auto">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce-in">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mb-2">Seviyeniz belirlendi!</p>
          <div className={cn("inline-block px-5 py-2 rounded-full border text-lg font-black mb-2", levelInfo.bg, levelInfo.color)}>
            {levelInfo.label}
          </div>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-2">
            {correct} / {PLACEMENT_QUESTIONS.length} doğru cevap
          </p>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
          Bu seviyeden itibaren konulara başlıyoruz. İstersen daha sonra manuel olarak seviyeni değiştirebilirsin.
        </p>
        <button
          onClick={() => router.push("/grammar")}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          Konulara Başla 🚀
        </button>
      </div>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/grammar" className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
          <ChevronLeft className="w-5 h-5" /> Çık
        </Link>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          {index + 1} / {PLACEMENT_QUESTIONS.length}
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 bg-[hsl(var(--secondary))] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 mb-5 shadow-sm">
        <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-3">
          Seviye Belirleme · Soru {index + 1}
        </p>
        <p className="text-lg font-bold leading-relaxed">{current.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {current.options.map((option, idx) => {
          const isCorrectAnswer = idx === current.correct;
          const isSelectedOption = idx === selected;

          let cls =
            "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/10";
          if (answered) {
            if (isCorrectAnswer)
              cls = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400";
            else if (isSelectedOption)
              cls = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400";
            else cls = "border-[hsl(var(--border))] opacity-40";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-sm font-medium text-left transition-all active:scale-[0.98]",
                "flex items-center justify-between gap-2",
                cls
              )}
            >
              <span>{option}</span>
              {answered && isCorrectAnswer && <Check className="w-4 h-4 text-green-500 shrink-0" />}
              {answered && isSelectedOption && !isCorrectAnswer && <X className="w-4 h-4 text-red-500 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
