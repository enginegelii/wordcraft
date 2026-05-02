"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Check, X, Zap, Flame, Shield } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { shuffle, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";
import confetti from "canvas-confetti";

// ─── BOSS CONFIG ─────────────────────────────────────────────────────────────

const BOSS_MAX_HP = 200;
const PLAYER_MAX_HP = 100;
const CORRECT_DAMAGE = 20;   // Player → Boss
const WRONG_DAMAGE = 18;     // Boss → Player
const TIMEOUT_DAMAGE = 25;   // Boss → Player (timeout cezası)
const COMBO_THRESHOLD = 3;
const COMBO_BONUS = 20;      // Kombo bonusu extra hasar
const QUESTION_TIME = 10;    // saniye

const BOSS_PHASES = [
  {
    minHpPct: 67,
    name: "Mnemosux",
    title: "Uyuyan Ejderha",
    emoji: "🐉",
    color: "#22c55e",
    taunt: null,
    bg: "from-[#0d2818] via-[#0a2010] to-[#0d2818]",
    glow: "#22c55e"
  },
  {
    minHpPct: 34,
    name: "Öfkeli Mnemosux",
    title: "Uyanışın Öfkesi",
    emoji: "🔥🐉",
    color: "#f97316",
    taunt: "\"Kelimelerimi çalamayacaksın!\"",
    bg: "from-[#2a1200] via-[#3d1a00] to-[#2a1200]",
    glow: "#f97316"
  },
  {
    minHpPct: 1,
    name: "Çılgın Mnemosux",
    title: "Son Nefes",
    emoji: "💀🐉",
    color: "#ef4444",
    taunt: "\"SENI YOK EDECEĞİM!\"",
    bg: "from-[#2a0000] via-[#4a0000] to-[#2a0000]",
    glow: "#ef4444"
  }
];

const BOSS_TAUNTS_CORRECT = [
  "\"Sadece şans bu...\"",
  "\"Hmph. Biraz bilgin varmış.\"",
  "\"Henüz bitmedi!\"",
  "\"Bu acıyor ama yenilmeyeceğim!\"",
];

const BOSS_TAUNTS_WRONG = [
  "\"AHA! İşte bu hata oldu!\"",
  "\"Kelimeler seni terk ediyor!\"",
  "\"HAHAHa... hisset gücümü!\"",
  "\"Bilgin mi bitti?!\"",
];

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface BossQuestion {
  word: Word;
  type: "en2tr" | "tr2en";
  prompt: string;
  answer: string;
  options: string[];
}

type GameState = "intro" | "playing" | "victory" | "defeat";
type AttackAnim = "player-attack" | "boss-attack" | null;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function makeQuestion(word: Word, allWords: Word[], type: "en2tr" | "tr2en"): BossQuestion {
  if (type === "en2tr") {
    const others = shuffle(allWords.filter((w) => w.id !== word.id)).slice(0, 3);
    const options = shuffle([word.translation, ...others.map((w) => w.translation)]);
    return { word, type, prompt: word.word, answer: word.translation, options };
  } else {
    const others = shuffle(allWords.filter((w) => w.id !== word.id)).slice(0, 3);
    const options = shuffle([word.word, ...others.map((w) => w.word)]);
    return { word, type, prompt: word.translation, answer: word.word, options };
  }
}

function getBossPhase(bossHpPct: number) {
  if (bossHpPct >= 67) return BOSS_PHASES[0];
  if (bossHpPct >= 34) return BOSS_PHASES[1];
  return BOSS_PHASES[2];
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function BossPage() {
  const storeWords = useAppStore.getState().words;
  const reviewWord = useAppStore((s) => s.reviewWord);
  const addGameSession = useAppStore((s) => s.addGameSession);

  const [gameState, setGameState] = useState<GameState>("intro");
  const [bossHp, setBossHp] = useState(BOSS_MAX_HP);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [combo, setCombo] = useState(0);
  const [question, setQuestion] = useState<BossQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [attackAnim, setAttackAnim] = useState<AttackAnim>(null);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  const wordPoolRef = useRef<Word[]>([]);
  const usedIdxRef = useRef(0);
  const wordsPracticedRef = useRef<string[]>([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const answeredRef = useRef(false);

  const bossHpPct = (bossHp / BOSS_MAX_HP) * 100;
  const playerHpPct = (playerHp / PLAYER_MAX_HP) * 100;
  const bossPhase = getBossPhase(bossHpPct);

  // ─── GAME LOGIC ─────────────────────────────────────────────────────────────

  const nextQuestion = useCallback((pool: Word[]) => {
    const word = pool[usedIdxRef.current % pool.length];
    usedIdxRef.current += 1;
    const type: "en2tr" | "tr2en" = usedIdxRef.current % 3 === 0 ? "tr2en" : "en2tr";
    const q = makeQuestion(word, pool, type);
    setQuestion(q);
    setSelected(null);
    setAnswered(false);
    answeredRef.current = false;
    setTimeLeft(QUESTION_TIME);
    setQuestionCount((c) => c + 1);
  }, []);

  const triggerBossAttack = useCallback((dmg: number, isTaunt = false) => {
    setAttackAnim("boss-attack");
    setPlayerHp((hp) => {
      const newHp = Math.max(0, hp - dmg);
      if (newHp <= 0) {
        setTimeout(() => setGameState("defeat"), 800);
      }
      return newHp;
    });
    if (isTaunt) {
      const t = BOSS_TAUNTS_WRONG[Math.floor(Math.random() * BOSS_TAUNTS_WRONG.length)];
      setTaunt(t);
      setTimeout(() => setTaunt(null), 2500);
    }
    setTimeout(() => setAttackAnim(null), 600);
  }, []);

  const triggerPlayerAttack = useCallback((isCombo: boolean, newBossHp: number) => {
    setAttackAnim("player-attack");
    if (newBossHp <= 0) {
      setTimeout(() => {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });
        setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { x: 0.1 }, colors: ["#ef4444", "#f97316"] }), 300);
        setGameState("victory");
      }, 700);
    }
    if (isCombo) {
      const t = "🔥 KOMBO SALDIRISI! +" + (CORRECT_DAMAGE + COMBO_BONUS) + " hasar!";
      setTaunt(t);
      setTimeout(() => setTaunt(null), 2000);
    } else {
      const t = BOSS_TAUNTS_CORRECT[Math.floor(Math.random() * BOSS_TAUNTS_CORRECT.length)];
      setTaunt(t);
      setTimeout(() => setTaunt(null), 2000);
    }
    setTimeout(() => setAttackAnim(null), 500);
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== "playing" || answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (!answeredRef.current) {
            answeredRef.current = true;
            setAnswered(true);
            playSound("wrong");
            triggerHaptic("heavy");
            triggerBossAttack(TIMEOUT_DAMAGE, true);
            setCombo(0);
            setTimeout(() => {
              if (question) {
                wordsPracticedRef.current.push(question.word.id);
                reviewWord(question.word.id, 1);
              }
              nextQuestion(wordPoolRef.current);
            }, 2000);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [gameState, answered, question, reviewWord, nextQuestion, triggerBossAttack]);

  const startBattle = () => {
    const fresh = useAppStore.getState().words;
    wordPoolRef.current = shuffle(fresh);
    usedIdxRef.current = 0;
    wordsPracticedRef.current = [];
    startTimeRef.current = Date.now();
    setBossHp(BOSS_MAX_HP);
    setPlayerHp(PLAYER_MAX_HP);
    setCombo(0);
    setScore(0);
    setQuestionCount(0);
    setTaunt(null);
    setAttackAnim(null);
    setGameState("playing");
    nextQuestion(shuffle(fresh));
  };

  const handleAnswer = (option: string) => {
    if (answered || answeredRef.current || !question) return;
    clearInterval(timerRef.current!);
    answeredRef.current = true;
    setSelected(option);
    setAnswered(true);

    const isCorrect = option === question.answer;
    wordsPracticedRef.current.push(question.word.id);
    reviewWord(question.word.id, isCorrect ? 4 : 1);

    if (isCorrect) {
      playSound("correct");
      triggerHaptic("light");
      const newCombo = combo + 1;
      setCombo(newCombo);
      const isComboAttack = newCombo >= COMBO_THRESHOLD && newCombo % COMBO_THRESHOLD === 0;
      const dmg = isComboAttack ? CORRECT_DAMAGE + COMBO_BONUS : CORRECT_DAMAGE;
      const newBossHp = Math.max(0, bossHp - dmg);
      setBossHp(newBossHp);
      setScore((s) => s + (isComboAttack ? 20 : 10));
      triggerPlayerAttack(isComboAttack, newBossHp);
      if (newBossHp > 0) {
        setTimeout(() => nextQuestion(wordPoolRef.current), 1800);
      }
    } else {
      playSound("wrong");
      triggerHaptic("medium");
      setCombo(0);
      triggerBossAttack(WRONG_DAMAGE, true);
      setTimeout(() => nextQuestion(wordPoolRef.current), 2200);
    }
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (gameState === "intro") {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center space-y-7">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-2">
          <div className="text-7xl">🐉</div>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-2xl font-black text-red-500">MNEMOSUX</motion.div>
          <p className="text-[hsl(var(--muted-foreground))] text-xs uppercase tracking-widest">Hafıza Ejderhası</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-sm">
          <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">
            Mnemosux, insanların öğrendiği kelimeleri hafızalarından çalan kadim bir ejderhadır.
            Onu yenebilmek için her soruya doğru cevap vererek ona hasar ver.
            Yanlış cevap verirsen... o sana saldırır.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
              <p className="text-green-400 font-bold">✅ Doğru</p>
              <p className="text-[hsl(var(--muted-foreground))]">-{CORRECT_DAMAGE} HP</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 font-bold">❌ Yanlış</p>
              <p className="text-[hsl(var(--muted-foreground))]">-{WRONG_DAMAGE} HP sana</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <p className="text-orange-400 font-bold">🔥 ×{COMBO_THRESHOLD}</p>
              <p className="text-[hsl(var(--muted-foreground))]">Kombo +{COMBO_BONUS}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={startBattle}
            disabled={storeWords.length < 2}
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-red-500/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {storeWords.length < 2 ? "En az 2 kelime gerekli" : "⚔️  Savaşa Gir"}
          </button>
          <Link href="/play" className="text-[hsl(var(--muted-foreground))] text-sm py-2">← Geri Dön</Link>
        </motion.div>
      </div>
    );
  }

  // ── VICTORY ────────────────────────────────────────────────────────────────
  if (gameState === "victory") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
        <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: 3 }} className="text-7xl">🏆</motion.div>
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Ejderha Yenildi!</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">Mnemosux&apos;u alt ettin. Hafızalar kurtarıldı!</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <div className="bg-red-600 rounded-2xl px-5 py-4 min-w-[90px]">
            <p className="text-2xl font-black text-white">{score}</p>
            <p className="text-xs text-red-100">Puan</p>
          </div>
          <div className="bg-orange-500 rounded-2xl px-5 py-4 min-w-[90px]">
            <p className="text-2xl font-black text-white">{questionCount}</p>
            <p className="text-xs text-orange-100">Soru</p>
          </div>
          <div className="bg-green-600 rounded-2xl px-5 py-4 min-w-[90px]">
            <p className="text-2xl font-black text-white">{playerHp}</p>
            <p className="text-xs text-green-100">Kalan HP</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={startBattle} className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm">Tekrar Savaş</button>
          <Link href="/play" className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-5 py-3 rounded-xl font-semibold text-sm">Oyunlar</Link>
        </div>
      </motion.div>
    );
  }

  // ── DEFEAT ─────────────────────────────────────────────────────────────────
  if (gameState === "defeat") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
        <div className="text-7xl">💀</div>
        <div>
          <h2 className="text-3xl font-black text-red-500">Yenildin...</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">Mnemosux güçlü. Ama her yenilgi bir ders verir.</p>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Ejderhanın kalan canı: <span className="text-red-400 font-bold">{bossHp} HP</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={startBattle} className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-5 py-3 rounded-xl font-semibold text-sm">Tekrar Dene 🔁</button>
          <Link href="/play" className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm">Çekil</Link>
        </div>
      </motion.div>
    );
  }

  // ── BATTLE SCREEN ──────────────────────────────────────────────────────────
  const timerPct = (timeLeft / QUESTION_TIME) * 100;
  const timerColor = timeLeft > 6 ? "#22c55e" : timeLeft > 3 ? "#f97316" : "#ef4444";

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bossPhase.bg} text-white transition-all duration-1000`}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${bossPhase.glow}25 0%, transparent 55%)` }} />

      {/* Attack flash overlay */}
      <AnimatePresence>
        {attackAnim && (
          <motion.div
            key={attackAnim}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ backgroundColor: attackAnim === "player-attack" ? "#22c55e" : "#ef4444" }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative flex items-center justify-between p-4">
        <button onClick={() => setGameState("intro")} className="flex items-center gap-1 text-white/50 hover:text-white text-sm">
          <ChevronLeft className="w-4 h-4" /> Çık
        </button>
        <div className="flex items-center gap-2 text-sm text-white/60">
          {combo >= COMBO_THRESHOLD && (
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="flex items-center gap-1 text-orange-400 font-bold text-xs">
              <Flame className="w-3.5 h-3.5" /> {combo}× KOMBO
            </motion.span>
          )}
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-yellow-400">{score}</span>
        </div>
      </div>

      <div className="relative px-4 pb-8 space-y-4">

        {/* Boss HP */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold" style={{ color: bossPhase.color }}>{bossPhase.emoji} {bossPhase.name}</span>
            <span className="text-white/50">{bossHp} / {BOSS_MAX_HP} HP</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: bossPhase.color }}
              animate={{ width: `${bossHpPct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <p className="text-xs text-white/40 italic">{bossPhase.title}</p>
        </div>

        {/* Boss + Taunt */}
        <div className="text-center relative py-2">
          <motion.div
            animate={attackAnim === "boss-attack" ? { x: [-8, 8, -8, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="text-6xl select-none"
          >
            {bossPhase.emoji}
          </motion.div>
          <AnimatePresence>
            {taunt && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute left-0 right-0 top-0 mx-auto max-w-xs bg-black/50 backdrop-blur rounded-xl px-4 py-2 text-sm font-semibold text-white/90"
              >
                {taunt}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player HP */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-blue-300"><Shield className="w-3.5 h-3.5" /> Sen</span>
            <span className="text-white/50">{playerHp} / {PLAYER_MAX_HP} HP</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-blue-500"
              animate={{ width: `${playerHpPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="space-y-1">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-none"
              style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
            />
          </div>
          <p className="text-xs text-right" style={{ color: timerColor }}>{timeLeft}s</p>
        </div>

        {/* Question */}
        {question && (
          <AnimatePresence mode="wait">
            <motion.div key={questionCount} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="bg-white/8 backdrop-blur border border-white/10 rounded-2xl p-5 mb-4">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
                  {question.type === "en2tr" ? "Bu kelimenin Türkçesi nedir?" : "Hangi kelime bu anlama gelir?"}
                </p>
                <p className="text-3xl font-black text-center" style={{ textShadow: `0 0 20px ${bossPhase.glow}` }}>
                  {question.prompt}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {question.options.map((opt) => {
                  const isCorrect = opt === question.answer;
                  const isSelected = opt === selected;
                  let cls = "border-white/15 bg-white/8 hover:bg-white/15";
                  if (answered) {
                    if (isCorrect) cls = "border-green-400/60 bg-green-500/20 text-green-300";
                    else if (isSelected) cls = "border-red-400/60 bg-red-500/20 text-red-300";
                    else cls = "border-white/5 bg-white/3 opacity-30";
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={answered}
                      className={`p-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 flex items-center justify-between gap-1 ${cls}`}
                    >
                      <span className="text-left leading-tight">{opt}</span>
                      {answered && isCorrect && <Check className="w-4 h-4 shrink-0" />}
                      {answered && isSelected && !isCorrect && <X className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
