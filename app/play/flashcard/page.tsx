"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw, ChevronLeft, Volume2, ThumbsUp, ThumbsDown, Meh,
  Trophy, Star, Zap,
} from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { cn, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";
import type { ReviewQuality } from "@/lib/sm2";

export default function FlashcardPage() {
  const router = useRouter();
  const words = useAppStore((s) => s.words);
  const getDueWords = useAppStore((s) => s.getDueWords);
  const reviewWord = useAppStore((s) => s.reviewWord);
  const addGameSession = useAppStore((s) => s.addGameSession);

  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());

  // Kartları hazırla
  useEffect(() => {
    const due = getDueWords();
    // Eğer bekleyen yok, tüm kelimeleri al
    const q = due.length > 0 ? due : [...words];
    // Karıştır
    const shuffled = [...q].sort(() => Math.random() - 0.5).slice(0, 20);
    setQueue(shuffled);
  }, []);

  const current = queue[index];
  const isLast = index === queue.length - 1;
  const progress = queue.length > 0 ? ((index) / queue.length) * 100 : 0;

  const speak = () => {
    if (!current) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(current.word);
      utt.lang = "en-US";
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(
        (v) => v.lang.startsWith("en") && !v.lang.startsWith("en-IN")
      );
      if (enVoice) utt.voice = enVoice;
      utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    }
  };

  const handleFlip = () => {
    if (!started) setStarted(true);
    setFlipped(!flipped);
    playSound("flip");
  };

  const handleRate = useCallback((quality: ReviewQuality) => {
    if (!current) return;

    reviewWord(current.id, quality);

    const xp = quality >= 4 ? 10 : quality === 3 ? 5 : 2;
    setXpGained((prev) => prev + xp);
    setReviewed((prev) => prev + 1);

    if (quality >= 4) {
      playSound("correct");
      triggerHaptic("light");
    } else if (quality <= 1) {
      playSound("wrong");
      triggerHaptic("heavy");
    }

    if (isLast) {
      // Oyun bitti
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
    }
  }, [current, isLast, xpGained, queue, startTime, reviewWord, addGameSession]);

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold">Harika!</h2>
        <p className="text-[hsl(var(--muted-foreground))]">
          Hiç kelimen yok. Önce kelime ekle!
        </p>
        <Link href="/add" className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-semibold">
          Kelime Ekle
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 animate-bounce-in">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black">Harika!</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {reviewed} kelime tekrar edildi
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">+{xpGained}</p>
            <p className="text-sm text-yellow-100 flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" /> XP Kazandın
            </p>
          </div>
          <div className="bg-brand-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">{reviewed}</p>
            <p className="text-sm text-orange-100 flex items-center gap-1">
              <Zap className="w-4 h-4" /> Tekrar
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIndex(0);
              setFlipped(false);
              setFinished(false);
              setXpGained(0);
              setReviewed(0);
              const due = getDueWords();
              const q = due.length > 0 ? due : [...words];
              setQueue([...q].sort(() => Math.random() - 0.5).slice(0, 20));
            }}
            className="flex items-center gap-2 bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Tekrar Oyna
          </button>
          <Link href="/play" className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-3 rounded-xl font-semibold text-sm">
            Diğer Oyunlar
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/play" className="flex items-center gap-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
          <ChevronLeft className="w-5 h-5" />
          Çık
        </Link>
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <span>{index + 1} / {queue.length}</span>
          <div className="flex items-center gap-1 text-yellow-600">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold">+{xpGained}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[hsl(var(--secondary))] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flip Card */}
      <div className="flip-card h-72 cursor-pointer mb-6" onClick={handleFlip}>
        <div className={cn("flip-card-inner", flipped && "flipped")}>
          {/* Front */}
          <div className="flip-card-front bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl shadow-xl shadow-brand-500/20 flex flex-col items-center justify-center p-8 text-white">
            <p className="text-xs text-white/60 mb-4 uppercase tracking-wider">İngilizce</p>
            <h2 className="text-4xl font-black text-center mb-3">{current.word}</h2>
            {current.ipa && (
              <p className="text-white/70 font-mono text-sm">{current.ipa}</p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); speak(); }}
              className="mt-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <p className="text-white/50 text-sm mt-6">Dokunarak çevir</p>
          </div>

          {/* Back */}
          <div className="flip-card-back bg-[hsl(var(--card))] border-2 border-brand-500/30 rounded-2xl shadow-xl flex flex-col justify-center p-6">
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wider font-semibold">Türkçe Karşılık</p>
                <div className="bg-[hsl(var(--secondary))] rounded-xl px-4 py-3 mb-1">
                  <h3 className="text-2xl font-black text-[hsl(var(--foreground))]">{current.translation}</h3>
                </div>
                <p className="text-xs text-brand-500 font-semibold">{current.partOfSpeech}</p>
              </div>
              {current.examples[0] && (
                <div className="bg-[hsl(var(--secondary))] rounded-xl p-3">
                  <p className="text-sm italic text-[hsl(var(--foreground))]">&ldquo;{current.examples[0].en}&rdquo;</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{current.examples[0].tr}</p>
                </div>
              )}
              {current.grammarNote && (
                <p className="text-xs text-blue-600 dark:text-blue-300 text-center font-medium">📝 {current.grammarNote}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons — sadece flip sonrası göster */}
      {flipped && (
        <div className="space-y-3 animate-slide-up">
          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">Ne kadar iyi hatırladın?</p>
          <div className="grid grid-cols-3 gap-3">
            <RateButton
              onClick={() => handleRate(1)}
              icon={<ThumbsDown className="w-5 h-5" />}
              label="Bilmiyorum"
              color="from-red-500 to-red-600"
              shadow="shadow-red-500/20"
            />
            <RateButton
              onClick={() => handleRate(3)}
              icon={<Meh className="w-5 h-5" />}
              label="Zor"
              color="from-yellow-500 to-yellow-600"
              shadow="shadow-yellow-500/20"
            />
            <RateButton
              onClick={() => handleRate(5)}
              icon={<ThumbsUp className="w-5 h-5" />}
              label="Kolay"
              color="from-green-500 to-green-600"
              shadow="shadow-green-500/20"
            />
          </div>
        </div>
      )}

      {!flipped && (
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          Kartı çevirmek için dokun
        </p>
      )}
    </div>
  );
}

function RateButton({
  onClick, icon, label, color, shadow,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  shadow: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl text-white font-semibold",
        "bg-gradient-to-br shadow-md transition-transform active:scale-95 text-sm",
        `${color} ${shadow}`
      )}
    >
      {icon}
      {label}
    </button>
  );
}
