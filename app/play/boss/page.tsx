"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Check, X, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { shuffle, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";
import confetti from "canvas-confetti";

// ─── PRIZE LADDER ─────────────────────────────────────────────────────────────

const PRIZES = [
  { q: 1,  label: "₺1.000",       safe: false, time: 30   },
  { q: 2,  label: "₺2.000",       safe: false, time: 30   },
  { q: 3,  label: "₺3.000",       safe: false, time: 30   },
  { q: 4,  label: "₺5.000",       safe: false, time: 30   },
  { q: 5,  label: "₺10.000",      safe: true,  time: 30   },
  { q: 6,  label: "₺20.000",      safe: false, time: 45   },
  { q: 7,  label: "₺40.000",      safe: false, time: 45   },
  { q: 8,  label: "₺75.000",      safe: false, time: 45   },
  { q: 9,  label: "₺150.000",     safe: false, time: 45   },
  { q: 10, label: "₺300.000",     safe: true,  time: 45   },
  { q: 11, label: "₺500.000",     safe: false, time: 20   },
  { q: 12, label: "₺750.000",     safe: false, time: 20   },
  { q: 13, label: "₺1.000.000",   safe: false, time: 20   },
  { q: 14, label: "₺5.000.000",   safe: false, time: null },
  { q: 15, label: "₺10.000.000",  safe: false, time: null },
] as const;

const LETTERS = ["A", "B", "C", "D"];

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface MMQuestion {
  type: "translation" | "fill";
  prompt: string;
  answer: string;
  options: string[];
  wordId?: string;
  grammarNote?: string;
}

type Phase = "intro" | "loading" | "playing" | "walkaway" | "victory" | "gameover";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function buildVocabQs(pool: Word[]): MMQuestion[] {
  if (pool.length < 4) return [];
  const picked = shuffle([...pool]).slice(0, 5);
  return picked.map((word) => {
    const others = shuffle(pool.filter((w) => w.id !== word.id)).slice(0, 3);
    const opts = shuffle([word.translation, ...others.map((w) => w.translation)]);
    return {
      type: "translation" as const,
      prompt: word.word,
      answer: word.translation,
      options: opts,
      wordId: word.id,
      grammarNote: word.grammarNote,
    };
  });
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function BossPage() {
  const storeWords = useAppStore((s) => s.words);
  const grammar = useAppStore((s) => s.grammar);
  const reviewWord = useAppStore((s) => s.reviewWord);
  const addGameSession = useAppStore((s) => s.addGameSession);
  const addXP = useAppStore((s) => s.addXP);
  const addGrammarXP = useAppStore((s) => s.addGrammarXP);

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<MMQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [joker5050Used, setJoker5050Used] = useState(false);
  const [jokerDDUsed, setJokerDDUsed] = useState(false);
  const [ddActive, setDdActive] = useState(false);
  const [ddAttempts, setDdAttempts] = useState(0);
  const [showLadder, setShowLadder] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timedOutRef = useRef(false);
  const startTimeRef = useRef(0);
  const practicedRef = useRef<string[]>([]);

  const q = questions[currentQ];
  const prizeRow = PRIZES[currentQ] as (typeof PRIZES)[number] | undefined;
  const safeHarborLabel = currentQ >= 10 ? PRIZES[9].label : currentQ >= 5 ? PRIZES[4].label : null;

  // ─── TIMER ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "playing" || !q) return;
    timedOutRef.current = false;
    const tl = (prizeRow?.time as number | null | undefined) ?? null;
    setTimeLeft(tl);
    if (!tl) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!timedOutRef.current) {
            timedOutRef.current = true;
            triggerHaptic("heavy");
            setTimeout(() => setPhase("gameover"), 400);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQ]);

  // ─── START GAME ─────────────────────────────────────────────────────────────

  const startGame = async () => {
    if (storeWords.length < 4) return;
    setPhase("loading");

    const pool = shuffle([...storeWords]);
    const vocabQs = buildVocabQs(pool);
    let aiQs: MMQuestion[] = [];

    try {
      const res = await fetch("/api/generate-boss-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: grammar.level ?? "intermediate",
          words: pool.slice(0, 12).map((w) => `${w.word} (${w.translation})`).join(", "),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        aiQs = (data.questions as MMQuestion[]) ?? [];
      }
    } catch (e) {
      console.error("[boss] AI fetch failed:", e);
    }

    // Fallback: more vocab questions if AI failed
    while (aiQs.length < 10 && pool.length >= 4) {
      const w = pool[aiQs.length % pool.length];
      const others = shuffle(pool.filter((x) => x.id !== w.id)).slice(0, 3);
      const opts = shuffle([w.translation, ...others.map((x) => x.translation)]);
      aiQs.push({ type: "translation", prompt: w.word, answer: w.translation, options: opts, wordId: w.id });
    }

    const allQs = [...vocabQs.slice(0, 5), ...aiQs.slice(0, 10)];
    setQuestions(allQs);
    setCurrentQ(0);
    setSelected(null);
    setRevealed(false);
    setEliminated([]);
    setJoker5050Used(false);
    setJokerDDUsed(false);
    setDdActive(false);
    setDdAttempts(0);
    practicedRef.current = [];
    startTimeRef.current = Date.now();
    setPhase("playing");
  };

  // ─── ANSWER LOGIC ───────────────────────────────────────────────────────────

  const startPartialTimer = () => {
    if (!prizeRow?.time) return;
    timedOutRef.current = false;
    const half = Math.ceil((prizeRow.time as number) * 0.4);
    setTimeLeft(half);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!timedOutRef.current) {
            timedOutRef.current = true;
            setTimeout(() => setPhase("gameover"), 400);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleSelect = (opt: string) => {
    if (phase !== "playing" || revealed || eliminated.includes(opt) || !q) return;

    // Stop timer
    clearInterval(timerRef.current!);
    timedOutRef.current = true;

    const isCorrect = opt === q.answer;

    // SRS review
    if (q.wordId) {
      practicedRef.current.push(q.wordId);
      reviewWord(q.wordId, isCorrect ? 4 : 1);
    }

    if (!isCorrect && ddActive && ddAttempts === 0) {
      // Double Dip: first wrong — one more try
      triggerHaptic("medium");
      setDdAttempts(1);
      setEliminated((prev) => [...prev, opt]);
      setSelected(null);
      startPartialTimer();
      return;
    }

    setSelected(opt);
    setRevealed(true);
    triggerHaptic(isCorrect ? "light" : "heavy");

    if (isCorrect) {
      // Award XP
      const gramXP = q.type === "fill" ? (currentQ >= 10 ? 5 : 3) : 1;
      addGrammarXP(gramXP);
      addXP((currentQ + 1) * 5);

      setTimeout(() => {
        const next = currentQ + 1;
        if (next >= Math.min(questions.length, 15)) {
          confetti({ particleCount: 300, spread: 120, origin: { y: 0.5 } });
          setTimeout(() => confetti({ particleCount: 150, spread: 80, origin: { x: 0.2 }, colors: ["#f0c040", "#fff"] }), 400);
          addXP(500);
          addGameSession({
            gameType: "boss",
            score: next * 100,
            wordsPracticed: practicedRef.current,
            playedAt: new Date().toISOString(),
            duration: Math.round((Date.now() - startTimeRef.current) / 1000),
          });
          setPhase("victory");
        } else {
          setCurrentQ(next);
          setSelected(null);
          setRevealed(false);
          setEliminated([]);
          setDdActive(false);
          setDdAttempts(0);
          setPhase("playing");
        }
      }, 1400);
    } else {
      addGameSession({
        gameType: "boss",
        score: currentQ * 50,
        wordsPracticed: practicedRef.current,
        playedAt: new Date().toISOString(),
        duration: Math.round((Date.now() - startTimeRef.current) / 1000),
      });
      setTimeout(() => setPhase("gameover"), 1300);
    }
  };

  // ─── JOKERS ─────────────────────────────────────────────────────────────────

  const use5050 = () => {
    if (joker5050Used || !q || revealed) return;
    setJoker5050Used(true);
    const wrongs = q.options.filter((o) => o !== q.answer && !eliminated.includes(o));
    const toElim = shuffle(wrongs).slice(0, 2);
    setEliminated((prev) => [...prev, ...toElim]);
    triggerHaptic("light");
  };

  const useDoubleDip = () => {
    if (jokerDDUsed || !q || revealed) return;
    setJokerDDUsed(true);
    setDdActive(true);
    setDdAttempts(0);
    triggerHaptic("light");
  };

  const walkAway = () => {
    clearInterval(timerRef.current!);
    timedOutRef.current = true;
    addGameSession({
      gameType: "boss",
      score: currentQ * 50,
      wordsPracticed: practicedRef.current,
      playedAt: new Date().toISOString(),
      duration: Math.round((Date.now() - startTimeRef.current) / 1000),
    });
    setPhase("walkaway");
  };

  // ─── OPTION STYLING ─────────────────────────────────────────────────────────

  const getOptClass = (opt: string) => {
    if (eliminated.includes(opt)) return "opacity-20 pointer-events-none border-white/10 bg-transparent";
    if (revealed) {
      if (opt === q?.answer) return "border-green-400/80 bg-green-600/25 text-green-200";
      if (opt === selected) return "border-red-400/80 bg-red-600/25 text-red-200";
      return "opacity-30 border-white/10 bg-transparent pointer-events-none";
    }
    if (selected === opt && ddAttempts > 0) return "border-orange-400/70 bg-orange-600/20";
    return "border-[#2a5ab0]/70 bg-[#0a1e54]/70 hover:bg-[#142a70]/80 hover:border-[#4a7ef9] active:scale-95";
  };

  const timerMax = (prizeRow?.time as number | null | undefined) ?? 1;
  const timerPct = timeLeft === null ? 100 : (timeLeft / timerMax) * 100;
  const timerColor = timeLeft === null ? "#a78820" : timeLeft > 15 ? "#22c55e" : timeLeft > 7 ? "#f97316" : "#ef4444";

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREENS
  // ─────────────────────────────────────────────────────────────────────────────

  // ── INTRO ────────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-[90vh] flex flex-col items-center justify-center px-5 text-center space-y-7">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-3xl font-black text-[#f0c040] tracking-tight" style={{ textShadow: "0 0 30px rgba(240,192,64,0.5)" }}>
            Kim Milyoner Olmak İster?
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">İngilizce Dil Yarışması</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-sm w-full space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: "📚", title: "Soru 1–5", sub: "Kelime anlamı · 30sn" },
              { icon: "✍️", title: "Soru 6–10", sub: "Boşluk doldurma · 45sn" },
              { icon: "🧠", title: "Soru 11–13", sub: "Zor gramer · 20sn" },
              { icon: "💎", title: "Soru 14–15", sub: "Uzman · Süresiz" },
            ].map((item) => (
              <div key={item.title} className="bg-[#0a1e54]/50 border border-[#2a5ab0]/30 rounded-xl p-3">
                <div className="text-lg mb-1">{item.icon}</div>
                <p className="text-white/80 font-semibold text-xs">{item.title}</p>
                <p className="text-[hsl(var(--muted-foreground))] text-[10px] mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5 text-center">
              <p className="text-amber-400 font-bold text-xs">½ Yarı Yarıya</p>
              <p className="text-[hsl(var(--muted-foreground))] text-[10px] mt-0.5">2 yanlış şık kalkar</p>
            </div>
            <div className="flex-1 bg-purple-500/10 border border-purple-500/25 rounded-xl px-3 py-2.5 text-center">
              <p className="text-purple-400 font-bold text-xs">✌️ Çift Cevap</p>
              <p className="text-[hsl(var(--muted-foreground))] text-[10px] mt-0.5">2 kez cevap hakkı</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={startGame}
            disabled={storeWords.length < 4}
            className="bg-gradient-to-r from-[#a87800] to-[#f0c040] text-black font-black py-4 rounded-2xl text-lg shadow-xl shadow-yellow-500/25 disabled:opacity-40 transition-all active:scale-95"
          >
            {storeWords.length < 4 ? "En az 4 kelime gerekli" : "🎯  Yarışmaya Başla!"}
          </button>
          <Link href="/play" className="text-[hsl(var(--muted-foreground))] text-sm py-2 text-center">← Geri Dön</Link>
        </motion.div>
      </div>
    );
  }

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-[90vh] flex flex-col items-center justify-center gap-5 px-5 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="text-5xl">⏳</motion.div>
        <div>
          <p className="text-white font-semibold">Sorular hazırlanıyor...</p>
          <p className="text-[hsl(var(--muted-foreground))] text-xs mt-1">AI seviyene uygun sorular üretiyor</p>
        </div>
      </div>
    );
  }

  // ── WALK AWAY ────────────────────────────────────────────────────────────────
  if (phase === "walkaway") {
    const earned = currentQ >= 10 ? PRIZES[9].label : currentQ >= 5 ? PRIZES[4].label : "₺0";
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[90vh] flex flex-col items-center justify-center px-5 text-center gap-6">
        <div className="text-5xl">🚶</div>
        <div>
          <h2 className="text-2xl font-black text-[#f0c040]">Çekildin!</h2>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Güvenli ödülünle ayrıldın</p>
          <p className="text-3xl font-black text-green-400 mt-3">{earned}</p>
          <p className="text-[hsl(var(--muted-foreground))] text-xs mt-1">{currentQ}. soruya kadar geldin</p>
        </div>
        <div className="flex gap-3">
          <button onClick={startGame} className="bg-gradient-to-r from-[#a87800] to-[#f0c040] text-black font-bold px-5 py-3 rounded-xl text-sm">Tekrar Oyna</button>
          <Link href="/play" className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm">Oyunlar</Link>
        </div>
      </motion.div>
    );
  }

  // ── VICTORY ──────────────────────────────────────────────────────────────────
  if (phase === "victory") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[90vh] flex flex-col items-center justify-center px-5 text-center gap-6">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: 3, duration: 0.5 }} className="text-6xl">🏆</motion.div>
        <div>
          <h2 className="text-3xl font-black text-[#f0c040]" style={{ textShadow: "0 0 20px rgba(240,192,64,0.6)" }}>TEBRİKLER!</h2>
          <p className="text-white text-sm mt-1">Tüm soruları doğru cevapladın!</p>
          <p className="text-4xl font-black text-green-400 mt-3">₺10.000.000</p>
          <p className="text-[hsl(var(--muted-foreground))] text-xs mt-1">+500 XP kazandın 🎉</p>
        </div>
        <div className="flex gap-3">
          <button onClick={startGame} className="bg-gradient-to-r from-[#a87800] to-[#f0c040] text-black font-bold px-5 py-3 rounded-xl text-sm">Tekrar Oyna</button>
          <Link href="/play" className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm">Oyunlar</Link>
        </div>
      </motion.div>
    );
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────────────
  if (phase === "gameover") {
    const earned = currentQ >= 10 ? PRIZES[9].label : currentQ >= 5 ? PRIZES[4].label : "₺0";
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[90vh] flex flex-col items-center justify-center px-5 text-center gap-6">
        <div className="text-5xl">💔</div>
        <div>
          <h2 className="text-2xl font-black text-red-400">Elendin!</h2>
          {q && selected && selected !== q.answer && (
            <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
              Doğru cevap: <span className="text-green-400 font-semibold">&ldquo;{q.answer}&rdquo;</span>
            </p>
          )}
          {!selected && (
            <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Süre doldu</p>
          )}
          <p className="text-2xl font-bold text-[#f0c040] mt-3">{earned}</p>
          <p className="text-[hsl(var(--muted-foreground))] text-xs mt-1">güvenli ödülünle ayrıldın</p>
        </div>
        <div className="flex gap-3">
          <button onClick={startGame} className="bg-gradient-to-r from-[#a87800] to-[#f0c040] text-black font-bold px-5 py-3 rounded-xl text-sm">Tekrar Dene 🔁</button>
          <Link href="/play" className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm">Çekil</Link>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ── PLAYING ──────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────
  if (!q) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010916] via-[#020e28] to-[#010916] text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 25%, rgba(240,192,64,0.07) 0%, transparent 60%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={walkAway} className="text-white/40 hover:text-white/60 text-sm flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Çekil
        </button>
        <button
          onClick={() => setShowLadder((v) => !v)}
          className="text-[#f0c040]/50 hover:text-[#f0c040]/80 text-xs font-semibold transition-colors"
        >
          {showLadder ? "↑ Soruya Dön" : "₺ Para Basamağı"}
        </button>
      </div>

      {/* Prize Ladder Overlay */}
      <AnimatePresence>
        {showLadder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mx-4 mb-3"
          >
            <div className="bg-[#010916]/95 border border-[#f0c040]/15 rounded-2xl overflow-hidden">
              <div className="max-h-[38vh] overflow-y-auto py-1.5">
                {[...PRIZES].reverse().map((row) => {
                  const rIdx = row.q - 1;
                  const isCurrent = rIdx === currentQ;
                  const isDone = rIdx < currentQ;
                  return (
                    <div
                      key={row.q}
                      className={`flex items-center gap-3 px-4 py-1.5 text-sm ${isCurrent ? "bg-[#f0c040]/12 border-l-2 border-[#f0c040]" : ""}`}
                    >
                      <span className={`font-mono text-xs w-4 shrink-0 ${isCurrent ? "text-[#f0c040]" : "text-white/30"}`}>{row.q}</span>
                      <span className={`font-bold flex-1 ${isCurrent ? "text-[#f0c040]" : isDone ? "text-green-400/60" : "text-white/50"}`}>{row.label}</span>
                      {row.safe && <span className="text-[9px] text-amber-400/70 bg-amber-400/10 rounded px-1 py-0.5">⚓</span>}
                      {isCurrent && <span className="text-[9px] text-[#f0c040] font-bold">← şu an</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative px-4 pb-8 space-y-4">

        {/* Current prize + question number */}
        <div className="text-center">
          <motion.div key={currentQ} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block">
            <p className="text-[10px] text-[#f0c040]/40 uppercase tracking-widest">Soru {currentQ + 1} / {Math.min(questions.length, 15)}</p>
            <p className="text-2xl font-black text-[#f0c040]" style={{ textShadow: "0 0 14px rgba(240,192,64,0.45)" }}>
              {prizeRow?.label}
            </p>
            {prizeRow?.safe && <p className="text-[10px] text-amber-400/70 mt-0.5">⚓ Güvenli Basamak</p>}
          </motion.div>
        </div>

        {/* Timer */}
        {timeLeft !== null ? (
          <div className="space-y-1">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: timerColor, width: `${timerPct}%` }}
                transition={{ duration: 0.8, ease: "linear" }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span style={{ color: timerColor }} className="flex items-center gap-1 font-mono font-bold">
                <Clock className="w-3 h-3" /> {timeLeft}s
              </span>
              {safeHarborLabel && <span className="text-white/25">Güvenli: {safeHarborLabel}</span>}
            </div>
          </div>
        ) : (
          <p className="text-center text-white/25 text-[10px]">
            Süresiz soru{safeHarborLabel ? ` · Güvenli basamak: ${safeHarborLabel}` : ""}
          </p>
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
          >
            {/* Question card */}
            <div className="bg-[#071535]/80 border border-[#2a5ab0]/40 rounded-2xl p-5 mb-4 text-center shadow-[0_0_40px_rgba(10,30,84,0.5)]">
              {q.type === "fill" ? (
                <>
                  <p className="text-[hsl(var(--muted-foreground))] text-[10px] uppercase tracking-widest mb-3">
                    ✍️ Boşluğu doğru şekilde doldurun
                  </p>
                  <p className="text-xl font-bold text-white leading-relaxed">{q.prompt}</p>
                  {q.grammarNote && (
                    <p className="text-[10px] text-[#f0c040]/45 mt-2 italic">{q.grammarNote}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[hsl(var(--muted-foreground))] text-[10px] uppercase tracking-widest mb-3">
                    📚 Bu kelimenin Türkçe anlamı nedir?
                  </p>
                  <p className="text-3xl font-black text-white tracking-wide">{q.prompt}</p>
                  {q.grammarNote && (
                    <p className="text-[10px] text-[#f0c040]/45 mt-2 italic">{q.grammarNote}</p>
                  )}
                </>
              )}
            </div>

            {/* Options (2×2 grid) */}
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  disabled={revealed || eliminated.includes(opt)}
                  className={`relative p-3.5 rounded-xl border text-sm font-semibold transition-all flex items-start gap-2 text-left ${getOptClass(opt)}`}
                >
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border transition-colors ${
                      revealed && opt === q.answer
                        ? "bg-green-500 border-green-400 text-white"
                        : revealed && opt === selected
                        ? "bg-red-500 border-red-400 text-white"
                        : "border-current opacity-60"
                    }`}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="leading-snug pt-0.5 flex-1">{opt}</span>
                  {revealed && opt === q.answer && <Check className="w-4 h-4 shrink-0 ml-auto mt-0.5 text-green-400" />}
                  {revealed && opt === selected && opt !== q.answer && <X className="w-4 h-4 shrink-0 ml-auto mt-0.5 text-red-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Jokers */}
        {!revealed && (
          <div className="flex gap-3 justify-center pt-1">
            <button
              onClick={use5050}
              disabled={joker5050Used || eliminated.length > 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                joker5050Used
                  ? "opacity-20 border-white/10 bg-transparent cursor-not-allowed"
                  : "border-amber-400/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-95"
              }`}
            >
              ½ Yarı Yarıya
            </button>
            <button
              onClick={useDoubleDip}
              disabled={jokerDDUsed}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                jokerDDUsed
                  ? "opacity-20 border-white/10 bg-transparent cursor-not-allowed"
                  : ddActive
                  ? "border-purple-400/60 bg-purple-500/25 text-purple-200 animate-pulse"
                  : "border-purple-400/35 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 active:scale-95"
              }`}
            >
              ✌️ Çift Cevap
            </button>
          </div>
        )}

        {/* Joker status hints */}
        {ddActive && !revealed && ddAttempts === 0 && (
          <p className="text-center text-purple-300/80 text-[11px]">
            Çift Cevap aktif — yanlış cevap verirsen bir hakkın daha olacak!
          </p>
        )}
        {ddActive && !revealed && ddAttempts > 0 && (
          <p className="text-center text-orange-300 text-[11px] animate-pulse">
            ⚠️ İlk cevabın yanlıştı — son hakkın!
          </p>
        )}

      </div>
    </div>
  );
}
