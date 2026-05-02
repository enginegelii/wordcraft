"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, Volume2, Trophy, Star, Zap, RefreshCw,
  Check, ChevronsRight, AlarmClock, BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { cn, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";
import type { ReviewQuality } from "@/lib/sm2";
import { calculateSM2, qualityToXP, getWordStatusFromInterval } from "@/lib/sm2";
import { LEVEL_DISPLAY } from "@/lib/grammar-data";

function formatInterval(days: number): string {
  if (days <= 0) return "Bugun";
  if (days === 1) return "Yarin";
  if (days < 7) return `${days} gun`;
  if (days < 14) return "1 hafta";
  if (days < 22) return "2 hafta";
  if (days < 45) return "~1 ay";
  return `${Math.round(days / 30)} ay`;
}

const STATUS_LABEL: Record<string, string> = {
  new: "Yeni",
  learning: "Ogreniyor",
  review: "Tekrarda",
  mastered: "Ogrenildi",
};

export default function FlashcardPage() {
  const words = useAppStore((s) => s.words);
  const reviews = useAppStore((s) => s.reviews);
  const getDueWords = useAppStore((s) => s.getDueWords);
  const reviewWord = useAppStore((s) => s.reviewWord);
  const addGameSession = useAppStore((s) => s.addGameSession);
  const addGrammarXP = useAppStore((s) => s.addGrammarXP);
  const grammar = useAppStore((s) => s.grammar);
  const grammarLevelInfo = grammar.level ? LEVEL_DISPLAY[grammar.level] : null;

  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [showExamples, setShowExamples] = useState(false);
  const [xpPopups, setXpPopups] = useState<{ id: number; xp: number; color: string }[]>([]);
  const [rating, setRating] = useState<ReviewQuality | null>(null);
  const [animating, setAnimating] = useState(false);
  const popupCounter = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const due = getDueWords();
    const q = due.length > 0 ? due : [...words];
    setQueue([...q].sort(() => Math.random() - 0.5).slice(0, 20));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = queue[index];
  const isLast = index === queue.length - 1;
  const progress = queue.length > 0 ? (index / queue.length) * 100 : 0;

  const currentReview = current ? reviews[current.id] : null;
  const reviewBase = currentReview
    ? { easeFactor: currentReview.easeFactor, interval: currentReview.interval, repetitions: currentReview.repetitions }
    : { easeFactor: 2.5, interval: 1, repetitions: 0 };
  const wordStatus = getWordStatusFromInterval(reviewBase.interval);

  const previewI3 = calculateSM2(reviewBase, 3).interval;
  const previewI4 = calculateSM2(reviewBase, 4).interval;
  const previewI5 = calculateSM2(reviewBase, 5).interval;

  const speak = useCallback(() => {
    if (!current || typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    const utt = new SpeechSynthesisUtterance(current.word);
    utt.lang = "en-US";
    const voices = window.speechSynthesis?.getVoices() ?? [];
    const enVoice = voices.find((v) => v.lang.startsWith("en") && !v.lang.startsWith("en-IN"));
    if (enVoice) utt.voice = enVoice;
    utt.rate = 0.9;
    window.speechSynthesis?.speak(utt);
  }, [current]);

  const handleFlip = useCallback(() => {
    if (flipped || animating) return;
    setAnimating(true);
    playSound("flip");
    speak();
    setTimeout(() => {
      setFlipped(true);
      setAnimating(false);
    }, 180);
  }, [flipped, animating, speak]);

  const handleRate = useCallback((quality: ReviewQuality) => {
    if (!current || rating !== null) return;
    setRating(quality);
    reviewWord(current.id, quality);

    const xp = qualityToXP(quality);
    setXpGained((prev) => prev + xp);
    setReviewed((prev) => prev + 1);

    const popColor =
      quality >= 4 ? "from-green-400 to-emerald-500"
      : quality === 3 ? "from-yellow-400 to-orange-400"
      : "from-red-400 to-rose-500";

    if (xp > 0) {
      const id = popupCounter.current++;
      setXpPopups((prev) => [...prev, { id, xp, color: popColor }]);
      setTimeout(() => setXpPopups((prev) => prev.filter((p) => p.id !== id)), 1000);
    }

    if (quality >= 4) {
      playSound("correct");
      triggerHaptic("light");
      if (grammar.level) addGrammarXP(1);
    } else if (quality <= 1) {
      playSound("wrong");
      triggerHaptic("heavy");
    } else {
      triggerHaptic("light");
    }

    setTimeout(() => {
      if (isLast) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        addGameSession({
          gameType: "flashcard",
          score: xpGained + xp,
          wordsPracticed: queue.map((w) => w.id),
          playedAt: new Date().toISOString(),
          duration,
        });
        setFinished(true);
      } else {
        setIndex((prev) => prev + 1);
        setFlipped(false);
        setShowExamples(false);
        setRating(null);
      }
    }, 350);
  }, [current, rating, isLast, xpGained, queue, startTime, reviewWord, addGameSession, grammar.level, addGrammarXP]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (!flipped) {
      if (Math.abs(dx) > 40) handleFlip();
    } else {
      if (dx < -60) handleRate(1);
      else if (dx > 60) handleRate(5);
    }
  };

  // ── Empty state ──
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold">Harika!</h2>
        <p className="text-[hsl(var(--muted-foreground))]">Kelime yok. Once kelime ekle!</p>
        <Link href="/add" className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-semibold">
          Kelime Ekle
        </Link>
      </div>
    );
  }

  // ── Finish screen ──
  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 animate-bounce-in">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black">Tebrikler!</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">{reviewed} kelime tekrar edildi</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">+{xpGained}</p>
            <p className="text-sm text-yellow-100 flex items-center gap-1 justify-center">
              <Star className="w-4 h-4 fill-current" /> XP Kazandin
            </p>
          </div>
          <div className="bg-brand-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">{reviewed}</p>
            <p className="text-sm text-orange-100 flex items-center gap-1 justify-center">
              <Zap className="w-4 h-4" /> Tekrar
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIndex(0); setFlipped(false); setFinished(false);
              setXpGained(0); setReviewed(0); setRating(null);
              const due = getDueWords();
              const q = due.length > 0 ? due : [...words];
              setQueue([...q].sort(() => Math.random() - 0.5).slice(0, 20));
            }}
            className="flex items-center gap-2 bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Tekrar Oyna
          </button>
          <Link href="/play" className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-3 rounded-xl font-semibold text-sm">
            Diger Oyunlar
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto select-none">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/play" className="flex items-center gap-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-sm">
          <ChevronLeft className="w-4 h-4" /> Cik
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[hsl(var(--muted-foreground))]">{index + 1} / {queue.length}</span>
          <div className="flex items-center gap-1 text-yellow-600 font-bold">
            <Star className="w-4 h-4 fill-current" />
            +{xpGained}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[hsl(var(--secondary))] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card — state-based, no 3D flip */}
      <div
        className={cn(
          "rounded-2xl shadow-lg mb-4 overflow-hidden cursor-pointer transition-opacity duration-150",
          animating && "opacity-0",
          !animating && "opacity-100"
        )}
        onClick={!flipped ? handleFlip : undefined}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {!flipped ? (
          /* ── FRONT ── */
          <div className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 min-h-[240px] flex flex-col items-center justify-center p-8 text-white">
            {/* decorative circles */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />

            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20">
              {STATUS_LABEL[wordStatus]}
            </div>
            {grammarLevelInfo && (
              <div className="absolute top-4 right-4 text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full">
                {grammarLevelInfo.label}
              </div>
            )}

            <p className="text-xs text-white/60 uppercase tracking-widest mb-3">Ingilizce</p>
            <h2 className="text-5xl font-black text-center leading-tight mb-2">{current.word}</h2>
            {current.ipa && <p className="text-white/70 font-mono text-sm mb-3">{current.ipa}</p>}
            {current.contextTag && (
              <span className="text-[11px] bg-white/15 text-white/80 px-2.5 py-1 rounded-full mb-2">
                {current.contextTag}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); speak(); }}
              className="mt-3 p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors active:scale-95"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <p className="text-white/40 text-xs mt-4">Dokunarak cevir veya kaydır</p>
          </div>
        ) : (
          /* ── BACK ── */
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            {/* Word strip */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[hsl(var(--border))]">
              <div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-0.5">Ingilizce</p>
                <h3 className="text-lg font-black">{current.word}</h3>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); speak(); }}
                className="p-2 rounded-lg bg-[hsl(var(--secondary))] hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-brand-500" />
              </button>
            </div>

            {/* Translation */}
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Turkce</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black">{current.translation}</p>
                  {current.partOfSpeech && (
                    <span className="text-xs font-semibold text-brand-500">{current.partOfSpeech}</span>
                  )}
                </div>
              </div>

              {current.examples[0] && (
                <div className="bg-[hsl(var(--secondary))] rounded-xl p-3 relative">
                  <BookOpen className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]/40" />
                  <p className="text-sm italic leading-relaxed pr-5">
                    &ldquo;{current.examples[0].en}&rdquo;
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{current.examples[0].tr}</p>
                </div>
              )}

              {current.grammarNote && (
                <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                  {current.grammarNote}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* More examples — shown after flip */}
      {flipped && current.examples.length > 1 && (
        <div className="mb-3 rounded-xl border border-[hsl(var(--border))] overflow-hidden text-sm">
          <button
            onClick={() => setShowExamples((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <span className="font-medium">Tum ornekler ({current.examples.length})</span>
            <span className="text-brand-500 font-semibold text-xs">{showExamples ? "Gizle" : "Goster"}</span>
          </button>
          {showExamples && (
            <div className="divide-y divide-[hsl(var(--border))]">
              {current.examples.map((ex, i) => (
                <div key={i} className="px-4 py-3 bg-[hsl(var(--card))]">
                  <p className="text-sm italic">&ldquo;{ex.en}&rdquo;</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{ex.tr}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {flipped ? (
        <div className="relative">
          {/* XP popup */}
          {xpPopups.map((p) => (
            <div
              key={p.id}
              className={cn(
                "absolute left-1/2 -top-8 pointer-events-none z-20 -translate-x-1/2",
                "text-white text-sm font-black px-3 py-1 rounded-full bg-gradient-to-r animate-float-up",
                p.color
              )}
            >
              +{p.xp} XP
            </div>
          ))}

          <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mb-2.5 font-medium uppercase tracking-wider">
            Ne kadar iyi hatırladın?
          </p>

          <div className="grid grid-cols-4 gap-2">
            <RateBtn onClick={() => handleRate(1)} label="Tekrar" interval="Bugun" xp={1}
              bg="bg-red-500 hover:bg-red-600" icon={<RefreshCw className="w-4 h-4" />}
              disabled={rating !== null} active={rating === 1} />
            <RateBtn onClick={() => handleRate(3)} label="Zor" interval={formatInterval(previewI3)} xp={5}
              bg="bg-orange-500 hover:bg-orange-600" icon={<AlarmClock className="w-4 h-4" />}
              disabled={rating !== null} active={rating === 3} />
            <RateBtn onClick={() => handleRate(4)} label="Iyi" interval={formatInterval(previewI4)} xp={8}
              bg="bg-emerald-500 hover:bg-emerald-600" icon={<Check className="w-4 h-4" />}
              disabled={rating !== null} active={rating === 4} />
            <RateBtn onClick={() => handleRate(5)} label="Kolay" interval={formatInterval(previewI5)} xp={10}
              bg="bg-blue-500 hover:bg-blue-600" icon={<ChevronsRight className="w-4 h-4" />}
              disabled={rating !== null} active={rating === 5} />
          </div>

          <p className="text-center text-[10px] text-[hsl(var(--muted-foreground))]/50 mt-2">
            Sola kaydır = Tekrar · Saga kaydır = Kolay
          </p>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={handleFlip}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-brand-500/20 active:scale-95 transition-transform"
          >
            <Volume2 className="w-4 h-4" />
            Karti Cevir
          </button>
          <p className="text-xs text-[hsl(var(--muted-foreground))]/50 mt-2">ya da sola/saga kaydır</p>
        </div>
      )}
    </div>
  );
}

function RateBtn({
  onClick, label, interval, xp, bg, icon, disabled, active,
}: {
  onClick: () => void; label: string; interval: string; xp: number;
  bg: string; icon: React.ReactNode; disabled: boolean; active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1 py-3 px-1 rounded-xl text-white font-semibold text-xs",
        "transition-all active:scale-95 shadow-sm",
        bg,
        disabled && !active && "opacity-50",
        active && "ring-2 ring-white ring-offset-1 scale-105"
      )}
    >
      {icon}
      <span className="font-bold text-[13px]">{label}</span>
      <span className="text-white/75 text-[10px] font-normal">{interval}</span>
      <span className="text-white/60 text-[10px]">+{xp} XP</span>
    </button>
  );
}
