"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Check, X, Trophy, Star, Brain, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn, shuffle, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";
import { LEVEL_DISPLAY } from "@/lib/grammar-data";

interface Question {
  word?: Word;
  sentence: string;
  blankedEn: string;
  sentenceTr: string;
  answer: string;
  options: string[];
  grammarNote?: string;
  source: "vocabulary" | "grammar-ai";
}

function buildVocabQuestions(words: Word[]): Question[] {
  const eligible = words.filter((w) => w.examples.length > 0);
  if (eligible.length === 0) return [];
  const selected = shuffle(eligible).slice(0, 8);
  return selected.map((word) => {
    const example = word.examples[Math.floor(Math.random() * word.examples.length)];
    const blankedEn = example.en.replace(new RegExp(`\\b${word.word}\\b`, "gi"), "___");
    const wrongOptions = shuffle(words.filter((w) => w.id !== word.id)).slice(0, 3).map((w) => w.word);
    return {
      word,
      sentence: example.en,
      blankedEn,
      sentenceTr: example.tr,
      answer: word.word,
      options: shuffle([word.word, ...wrongOptions]),
      source: "vocabulary" as const,
    };
  });
}

function buildAiQuestions(
  aiSentences: Array<{ en: string; tr: string; blank: string; blankedEn: string; grammarNote?: string }>,
  wordList: string[],
): Question[] {
  return aiSentences.map((s) => {
    const pool = wordList.filter((w) => w.toLowerCase() !== s.blank.toLowerCase());
    const wrongs = shuffle(pool).slice(0, 3);
    const fillers = ["already", "yet", "just", "never", "still", "soon", "often", "rarely"];
    while (wrongs.length < 3) {
      const f = fillers[Math.floor(Math.random() * fillers.length)];
      if (!wrongs.includes(f) && f !== s.blank) wrongs.push(f);
    }
    return {
      sentence: s.en,
      blankedEn: s.blankedEn,
      sentenceTr: s.tr,
      answer: s.blank,
      options: shuffle([s.blank, ...wrongs.slice(0, 3)]),
      grammarNote: s.grammarNote,
      source: "grammar-ai" as const,
    };
  });
}

type GameState = "ready" | "loading" | "playing" | "finished";

export default function FillPage() {
  const words = useAppStore.getState().words;
  const grammar = useAppStore((s) => s.grammar);
  const reviewWord = useAppStore((s) => s.reviewWord);
  const addGameSession = useAppStore((s) => s.addGameSession);
  const addGrammarXP = useAppStore((s) => s.addGrammarXP);

  const [gameState, setGameState] = useState<GameState>("ready");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const grammarCorrectRef = useRef(0);

  const grammarLevel = grammar.level;
  const grammarLevelInfo = grammarLevel ? LEVEL_DISPLAY[grammarLevel] : null;

  const startGame = async () => {
    setGameState("loading");
    scoreRef.current = 0;
    correctRef.current = 0;
    grammarCorrectRef.current = 0;

    let qs: Question[] = [];

    if (grammarLevel) {
      try {
        const wordNames = useAppStore.getState().words.map((w) => w.word);
        const res = await fetch("/api/generate-sentences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level: grammarLevel, gameType: "fill", words: wordNames, count: 8 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sentences?.length > 0) {
            qs = buildAiQuestions(data.sentences, wordNames);
          }
        }
      } catch (e) {
        console.warn("AI sentence generation failed, falling back:", e);
      }
    }

    if (qs.length === 0) {
      qs = buildVocabQuestions(useAppStore.getState().words);
    }

    if (qs.length === 0) {
      setGameState("ready");
      return;
    }

    setQuestions(qs);
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    startTimeRef.current = Date.now();
    setGameState("playing");
  };

  const current = questions[index];
  const isLast = index === questions.length - 1;
  const progress = questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0;

  const handleSelect = (option: string) => {
    if (answered || !current) return;
    setSelected(option);
    setAnswered(true);
    const isCorrect = option === current.answer;
    if (isCorrect) {
      const newScore = scoreRef.current + 10;
      scoreRef.current = newScore;
      correctRef.current += 1;
      setScore(newScore);
      if (current.source === "grammar-ai") {
        grammarCorrectRef.current += 1;
        addGrammarXP(1);
      }
      playSound("correct");
      triggerHaptic("light");
      if (current.word) reviewWord(current.word.id, 4);
    } else {
      playSound("wrong");
      triggerHaptic("medium");
      if (current.word) reviewWord(current.word.id, 1);
    }
  };

  const handleNext = () => {
    if (isLast) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      addGameSession({
        gameType: "fill",
        score: scoreRef.current,
        wordsPracticed: questions.filter((q) => q.word).map((q) => q.word!.id),
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
    const eligibleCount = useAppStore.getState().words.filter((w) => w.examples.length > 0).length;
    const canStart = grammarLevel ? true : eligibleCount >= 2;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="text-6xl">📝</div>
        <div>
          <h2 className="text-2xl font-black">Boşluk Doldurma</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Cümledeki boşluğu doğru kelimeyle doldur.</p>
          {grammarLevelInfo && (
            <div className={cn(
              "inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full border text-xs font-semibold",
              grammarLevelInfo.bg, grammarLevelInfo.color
            )}>
              <Brain className="w-3.5 h-3.5" />
              {grammarLevelInfo.label} seviyesine uygun cümleler
            </div>
          )}
        </div>
        <button
          onClick={startGame}
          disabled={!canStart}
          className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {!canStart ? `${2 - eligibleCount} kelime daha ekle` : "Oyuna Başla"}
        </button>
        <Link href="/play" className="text-[hsl(var(--muted-foreground))] text-sm">← Geri Dön</Link>
      </div>
    );
  }

  if (gameState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="font-semibold">Seviyene uygun cümleler hazırlanıyor...</p>
        {grammarLevelInfo && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{grammarLevelInfo.label} yapıları kullanılıyor</p>
        )}
      </div>
    );
  }

  if (gameState === "finished") {
    const accuracy = questions.length > 0 ? Math.round((correctRef.current / questions.length) * 100) : 0;
    const aiQuestions = questions.filter((q) => q.source === "grammar-ai").length;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black">
            {accuracy >= 80 ? "Harika! 🎉" : accuracy >= 60 ? "İyi! 👍" : "Devam Et! 💪"}
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">{correctRef.current} / {questions.length} doğru</p>
          {grammarCorrectRef.current > 0 && (
            <p className="text-sm text-indigo-500 font-medium mt-1">+{grammarCorrectRef.current} Gramer XP kazandın! 🧠</p>
          )}
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">{scoreRef.current}</p>
            <p className="text-sm text-yellow-100">Puan</p>
          </div>
          <div className="bg-emerald-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">%{accuracy}</p>
            <p className="text-sm text-emerald-100">Doğruluk</p>
          </div>
        </div>
        {aiQuestions > 0 && grammarLevelInfo && (
          <div className={cn("px-4 py-2 rounded-xl border text-sm font-medium", grammarLevelInfo.bg, grammarLevelInfo.color)}>
            {aiQuestions} soru {grammarLevelInfo.label} gramer yapısı içeriyordu
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={startGame} className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm">
            Tekrar Oyna
          </button>
          <Link href="/play" className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-5 py-3 rounded-xl font-semibold text-sm">
            Diğer Oyunlar
          </Link>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
        <p className="text-[hsl(var(--muted-foreground))]">Soru bulunamadı.</p>
        <Link href="/add" className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-semibold">
          Kelime Ekle
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setGameState("finished")} className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
          <ChevronLeft className="w-5 h-5" /> Çık
        </button>
        <div className="flex items-center gap-2">
          {current.source === "grammar-ai" && grammarLevelInfo && (
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", grammarLevelInfo.bg, grammarLevelInfo.color)}>
              {grammarLevelInfo.label}
            </span>
          )}
          <span className="text-sm text-[hsl(var(--muted-foreground))]">{index + 1} / {questions.length}</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-yellow-600">
          <Star className="w-5 h-5 fill-current" /> {score}
        </div>
      </div>

      <div className="h-2 bg-[hsl(var(--secondary))] rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {current.grammarNote && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-indigo-500 font-medium">
          <Brain className="w-3.5 h-3.5" />{current.grammarNote}
        </div>
      )}

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 mb-5 shadow-sm">
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wider">Boşluğu doldur</p>
        <p className="text-xl font-bold leading-relaxed">
          {current.blankedEn.split("___").map((part, i, arr) => (
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
                  {answered ? (selected ?? "___") : "___"}
                </span>
              )}
            </span>
          ))}
        </p>
        {answered && (
          <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
            {selected !== current.answer && (
              <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">
                Doğru cevap: {current.answer}
              </p>
            )}
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{current.sentenceTr}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {current.options.map((option) => {
          const isCorrectAnswer = option === current.answer;
          const isSelectedOption = option === selected;
          let variantClass = "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/10";
          if (answered) {
            if (isCorrectAnswer) variantClass = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400";
            else if (isSelectedOption) variantClass = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400";
            else variantClass = "border-[hsl(var(--border))] opacity-40";
          }
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={cn("p-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 flex items-center justify-between gap-2", variantClass)}
            >
              <span>{option}</span>
              {answered && isCorrectAnswer && <Check className="w-4 h-4 text-green-500 shrink-0" />}
              {answered && isSelectedOption && !isCorrectAnswer && <X className="w-4 h-4 text-red-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <button
          onClick={handleNext}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
        >
          {isLast ? "Sonucu Gör 🏁" : "Sonraki →"}
        </button>
      )}
    </div>
  );
}
