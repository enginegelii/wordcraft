"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Check, X, Trophy, Star, Zap } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn, shuffle, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";

interface Question {
  word: Word;
  sentence: string; // boşluklu cümle
  answer: string;
  options: string[];
}

function buildQuestions(words: Word[]): Question[] {
  const eligibleWords = words.filter((w) => w.examples.length > 0);
  const selected = shuffle(eligibleWords).slice(0, 8);

  return selected.map((word) => {
    const example = word.examples[0];
    const sentence = example.en.replace(
      new RegExp(`\\b${word.word}\\b`, "gi"),
      "___"
    );

    // Yanlış seçenekler: diğer kelimelerden rastgele
    const otherWords = words.filter((w) => w.id !== word.id);
    const wrongOptions = shuffle(otherWords)
      .slice(0, 3)
      .map((w) => w.word);

    const options = shuffle([word.word, ...wrongOptions]);

    return {
      word,
      sentence,
      answer: word.word,
      options,
    };
  });
}

export default function FillPage() {
  const words = useAppStore((s) => s.words);
  const reviewWord = useAppStore((s) => s.reviewWord);
  const addGameSession = useAppStore((s) => s.addGameSession);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [startTime] = useState(Date.now());

  const initGame = useCallback(() => {
    const qs = buildQuestions(words);
    setQuestions(qs);
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setCorrect(0);
  }, [words]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const current = questions[index];
  const isLast = index === questions.length - 1;
  const progress = questions.length > 0 ? ((index) / questions.length) * 100 : 0;

  const handleSelect = useCallback((option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);

    const isCorrect = option === current.answer;
    if (isCorrect) {
      setScore((s) => s + 10);
      setCorrect((c) => c + 1);
      playSound("correct");
      triggerHaptic("light");
      reviewWord(current.word.id, 4);
    } else {
      playSound("wrong");
      triggerHaptic("medium");
      reviewWord(current.word.id, 1);
    }
  }, [answered, current, reviewWord]);

  const handleNext = () => {
    if (isLast) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      addGameSession({
        gameType: "fill",
        score,
        wordsPracticed: questions.map((q) => q.word.id),
        playedAt: new Date().toISOString(),
        duration,
      });
      setGameState("finished");
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  if (gameState === "ready") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="text-6xl">📝</div>
        <div>
          <h2 className="text-2xl font-black">Boşluk Doldurma</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            Örnek cümledeki boşluğu doğru kelimeyle doldur.
            {questions.length} soru seni bekliyor!
          </p>
        </div>
        <button
          onClick={() => { initGame(); setGameState("playing"); }}
          disabled={words.length < 4}
          className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {words.length < 4 ? `${4 - words.length} kelime daha ekle` : "Oyuna Başla"}
        </button>
        <Link href="/play" className="text-[hsl(var(--muted-foreground))] text-sm">
          ← Geri Dön
        </Link>
      </div>
    );
  }

  if (gameState === "finished") {
    const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce-in">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black">
            {accuracy >= 80 ? "Harika!" : accuracy >= 60 ? "İyi!" : "Devam Et!"}
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {correct} / {questions.length} doğru
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">{score}</p>
            <p className="text-sm text-yellow-100">Puan</p>
          </div>
          <div className="bg-emerald-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">%{accuracy}</p>
            <p className="text-sm text-emerald-100">Doğruluk</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { initGame(); setGameState("playing"); }}
            className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm"
          >
            Tekrar Oyna
          </button>
          <Link href="/play" className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-5 py-3 rounded-xl font-semibold text-sm">
            Diğer Oyunlar
          </Link>
        </div>
      </div>
    );
  }

  if (!current || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
        <p className="text-[hsl(var(--muted-foreground))]">
          Örnek cümlesi olan yeterli kelime yok. Kelime ekleyip dene!
        </p>
        <Link href="/add" className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-semibold">
          Kelime Ekle
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setGameState("finished")}
          className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]"
        >
          <ChevronLeft className="w-5 h-5" /> Çık
        </button>
        <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))] text-sm">
          {index + 1} / {questions.length}
        </div>
        <div className="flex items-center gap-1 font-bold text-yellow-600">
          <Star className="w-5 h-5 fill-current" /> {score}
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-[hsl(var(--secondary))] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 mb-5 shadow-sm">
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wider">
          Boşluğu doldur
        </p>
        <p className="text-xl font-bold leading-relaxed">
          {current.sentence.split("___").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className={cn(
                  "inline-block min-w-[80px] mx-1 px-2 py-0.5 rounded-lg text-center border-b-2",
                  answered
                    ? selected === current.answer
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                      : "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                    : "border-brand-400 bg-brand-50 dark:bg-brand-950/20"
                )}>
                  {answered ? selected ?? "___" : "___"}
                </span>
              )}
            </span>
          ))}
        </p>
        {answered && (
          <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {current.word.examples[0].tr}
            </p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {current.options.map((option) => {
          const isCorrectAnswer = option === current.answer;
          const isSelectedOption = option === selected;

          let variantClass = "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/10";
          if (answered) {
            if (isCorrectAnswer) {
              variantClass = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400";
            } else if (isSelectedOption && !isCorrectAnswer) {
              variantClass = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400";
            } else {
              variantClass = "border-[hsl(var(--border))] opacity-50";
            }
          }

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={cn(
                "p-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95",
                "flex items-center justify-between gap-2",
                variantClass
              )}
            >
              <span>{option}</span>
              {answered && isCorrectAnswer && <Check className="w-4 h-4 text-green-500" />}
              {answered && isSelectedOption && !isCorrectAnswer && <X className="w-4 h-4 text-red-500" />}
            </button>
          );
        })}
      </div>

      {/* Next */}
      {answered && (
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20 active:scale-95 transition-transform animate-slide-up"
        >
          {isLast ? "Sonuçları Gör" : "Sonraki →"}
        </button>
      )}
    </div>
  );
}
