"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Timer, Zap, Trophy, Star } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn, shuffle, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";

type CardType = { id: string; text: string; wordId: string; type: "en" | "tr" };

const GAME_TIME = 60; // saniye

export default function MatchPage() {
  const words = useAppStore((s) => s.words);
  const addGameSession = useAppStore((s) => s.addGameSession);
  const addGrammarXP = useAppStore((s) => s.addGrammarXP);
  const grammarLevel = useAppStore((s) => s.grammar.level);

  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [selected, setSelected] = useState<CardType | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [startTime] = useState(Date.now());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initGame = useCallback(() => {
    const available = [...words].sort(() => Math.random() - 0.5).slice(0, 4);
    setGameWords(available);

    const newCards: CardType[] = [
      ...available.map((w) => ({ id: `en-${w.id}`, text: w.word, wordId: w.id, type: "en" as const })),
      ...available.map((w) => ({ id: `tr-${w.id}`, text: w.translation, wordId: w.id, type: "tr" as const })),
    ];
    setCards(shuffle(newCards));
    setSelected(null);
    setMatched(new Set());
    setWrong(new Set());
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_TIME);
  }, [words]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState("finished");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Tüm eşleşmeler tamamlandı mı?
  useEffect(() => {
    if (matched.size === gameWords.length * 2 && gameWords.length > 0) {
      clearInterval(timerRef.current!);
      const duration = Math.round((Date.now() - startTime) / 1000);
      addGameSession({
        gameType: "match",
        score,
        wordsPracticed: gameWords.map((w) => w.id),
        playedAt: new Date().toISOString(),
        duration,
      });
      setGameState("finished");
    }
  }, [matched, gameWords.length, score, startTime, addGameSession, gameWords]);

  const handleCardClick = useCallback((card: CardType) => {
    if (matched.has(card.id) || gameState !== "playing") return;

    if (!selected) {
      setSelected(card);
      return;
    }

    if (selected.id === card.id) {
      setSelected(null);
      return;
    }

    // Eşleşme kontrolü
    if (selected.wordId === card.wordId && selected.type !== card.type) {
      // Doğru eşleşme!
      const newCombo = combo + 1;
      const bonus = newCombo >= 3 ? 20 : newCombo >= 2 ? 10 : 5;
      setScore((s) => s + bonus);
      setCombo(newCombo);
      setMatched((m) => new Set([...m, selected.id, card.id]));
      setSelected(null);
      playSound("correct");
      triggerHaptic("light");
      if (grammarLevel) addGrammarXP(1);
    } else {
      // Yanlış eşleşme
      setCombo(0);
      setWrong(new Set([selected.id, card.id]));
      playSound("wrong");
      triggerHaptic("medium");
      setTimeout(() => {
        setWrong(new Set());
        setSelected(null);
      }, 700);
    }
  }, [selected, matched, combo, gameState]);

  const timeColor = timeLeft <= 10
    ? "text-red-500"
    : timeLeft <= 20
    ? "text-yellow-500"
    : "text-[hsl(var(--foreground))]";

  if (gameState === "ready") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="text-6xl">⚡</div>
        <div>
          <h2 className="text-2xl font-black">Hızlı Eşleştirme</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            {GAME_TIME} saniyede İngilizce ve Türkçe kelimeleri eşleştir.
            Combo yaptıkça bonus XP kazan!
          </p>
        </div>
        <div className="bg-[hsl(var(--secondary))] rounded-2xl p-4 text-sm space-y-2 text-left w-full max-w-xs">
          <p>⚡ Doğru eşleştirme: <strong>5 puan</strong></p>
          <p>🔥 2 combo: <strong>+10 bonus</strong></p>
          <p>💥 3+ combo: <strong>+20 bonus</strong></p>
        </div>
        <button
          onClick={() => { initGame(); setGameState("playing"); }}
          disabled={words.length < 4}
          className="bg-gradient-to-r from-violet-500 to-violet-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-500/20 active:scale-95 transition-transform disabled:opacity-50"
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
    const allMatched = matched.size === gameWords.length * 2;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center shadow-lg animate-bounce-in",
          allMatched
            ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-500/30"
            : "bg-gradient-to-br from-violet-500 to-violet-700 shadow-violet-500/30"
        )}>
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black">
            {allMatched ? "Mükemmel!" : "Süre Doldu!"}
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {matched.size / 2} / {gameWords.length} eşleşme
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">{score}</p>
            <p className="text-sm text-yellow-100 flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" /> Puan
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { initGame(); setGameState("playing"); }}
            className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm"
          >
            Tekrar Oyna
          </button>
          <Link href="/play" className="bg-gradient-to-r from-violet-500 to-violet-700 text-white px-5 py-3 rounded-xl font-semibold text-sm">
            Diğer Oyunlar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { clearInterval(timerRef.current!); setGameState("finished"); }}
          className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]"
        >
          <ChevronLeft className="w-5 h-5" /> Çık
        </button>
        <div className="flex items-center gap-4">
          {combo >= 2 && (
            <div className="flex items-center gap-1 text-brand-500 font-bold animate-bounce-in">
              <Zap className="w-4 h-4" /> {combo}x Combo!
            </div>
          )}
          <div className={cn("flex items-center gap-1 font-bold text-lg", timeColor)}>
            <Timer className="w-5 h-5" /> {timeLeft}s
          </div>
        </div>
        <div className="flex items-center gap-1 font-bold text-yellow-600">
          <Star className="w-5 h-5 fill-current" /> {score}
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-[hsl(var(--secondary))] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-400 to-yellow-400 rounded-full transition-all duration-1000"
          style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const isMatched = matched.has(card.id);
          const isWrong = wrong.has(card.id);
          const isSelected = selected?.id === card.id;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={isMatched}
              className={cn(
                "p-4 rounded-xl border-2 text-center font-semibold transition-all active:scale-95 min-h-[70px] flex items-center justify-center",
                isMatched
                  ? "border-green-400 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 opacity-60"
                  : isWrong
                  ? "border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600 animate-shake"
                  : isSelected
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 shadow-md shadow-violet-500/20"
                  : card.type === "en"
                  ? "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/10"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:border-violet-300"
              )}
            >
              <span className="text-sm leading-tight">{card.text}</span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
        İngilizce ve Türkçe karşılıklarını eşleştir
      </p>
    </div>
  );
}
