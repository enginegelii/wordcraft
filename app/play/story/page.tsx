"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Check, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { shuffle, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";
import confetti from "canvas-confetti";

// ─── CHAPTER DATA ─────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    id: 1,
    title: "Kapının Sırrı",
    location: "Antik Tapınak • Giriş",
    enemy: { emoji: "🛡️", name: "Taş Bekçi", subtitle: "Tapınağın ilk muhafızı" },
    bg: "#080d1f",
    accent: "#6366f1",
    particles: "#818cf8",
    narrative: [
      "Yüzyıllardır aranılan tapınağın önündesindir. Bozkırda tek başına, yalnızca bilginle donanmış.",
      "Dev kapının üzerindeki kadim yazı titrek ışıkla parlıyor: «Girmek isteyenler bilgisini ispatlasın.»",
      "Kapıdan ağır bir ses yükseliyor. Taş Bekçi gözlerini açıyor...",
    ],
    challengeText: "Bekçi gürbüz sesiyle soruyor:",
    successText: [
      "Bekçi yavaşça geride çekiliyor, senin gücüne boyun eğiyor.",
      "Kapı gıcırdayarak açılıyor. Tapınak seni içine çekiyor.",
    ],
  },
  {
    id: 2,
    title: "Gölge Sentinel",
    location: "Karanlık Koridor • Alt Katman",
    enemy: { emoji: "🗿", name: "Gölge Sentinel", subtitle: "Koridorun karanlık muhafızı" },
    bg: "#100520",
    accent: "#8b5cf6",
    particles: "#a78bfa",
    narrative: [
      "Taş duvarlar arasında ilerlerken hava ağırlaşıyor. Her adım yankılanıyor.",
      "Mor gözlü bir figür duvardan sıyrılarak önüne çıkıyor: Gölge Sentinel.",
      "\"Buradan geçmek istiyorsan bilginin bedelini öde!\" diye fısıldıyor, sesi her yerden geliyor.",
    ],
    challengeText: "Sentinel'in gözleri sana sabitleniyor:",
    successText: [
      "Sentinel bir çığlık atıp duman haline geliyor.",
      "Koridor açılıyor. Daha derinlere iniyorsun.",
    ],
  },
  {
    id: 3,
    title: "Uçurum Ruhu",
    location: "Kristal Köprü • Sonsuz Boşluk",
    enemy: { emoji: "🌀", name: "Uçurum Ruhu", subtitle: "Sonsuzluğun bekçisi" },
    bg: "#030d1a",
    accent: "#06b6d4",
    particles: "#67e8f9",
    narrative: [
      "Önünde sonsuz bir uçurum uzanıyor. Karanlığın dibinde hiçbir şey görünmüyor.",
      "İnce kristal köprünün ortasında saydam bir ruh süzülüyor, seni izliyor.",
      "Her adımda bir kelime soruyor. Yanlış adım at... düşüşün sonu olmaz.",
    ],
    challengeText: "Köprü sallantıya geçti! Hızlı cevapla:",
    successText: [
      "Ruh bir断 çığlık atarak dağılıyor.",
      "Köprü sakinleşiyor. Karşı kıyı seni bekliyor.",
    ],
  },
  {
    id: 4,
    title: "Gölge Büyücüsü",
    location: "Kara Kule • Zirve",
    enemy: { emoji: "🧙", name: "Gölge Büyücüsü", subtitle: "Kelimelerin hırsızı" },
    bg: "#150310",
    accent: "#a855f7",
    particles: "#d8b4fe",
    narrative: [
      "Kule'nin zirvesinde seni bekleyen figür yavaşça dönüyor. Gözleri alev gibi yanıyor.",
      "\"Sen...  gerçekten buraya kadar geldin mi?!\" diye bağırıyor.",
      "\"Kelimeler BENİM gücüm. ONLARI ALAMAZSIN!\" Büyüsünü fırlatmaya hazırlanıyor.",
    ],
    challengeText: "Büyücü son büyüsünü fırlatıyor!",
    successText: [
      "Büyücü geride savruldu! \"İmkânsız... nasıl bu kadar bildin?!\"",
      "Karanlık dağılıyor. Kule aydınlanıyor. Son oda seni bekliyor.",
    ],
  },
  {
    id: 5,
    title: "Kadim Bekçi",
    location: "Hazine Odası • Son Oda",
    enemy: { emoji: "🔮", name: "Kadim Bekçi", subtitle: "Tapınağın kendisi" },
    bg: "#160e00",
    accent: "#f59e0b",
    particles: "#fcd34d",
    narrative: [
      "Altın ışıkla dolup taşan son odadasın. Binlerce kelime etrafında dans ediyor.",
      "Kristal bir küre titreyerek açılıyor. Bir ses: \"Gerçekten bu gücü taşımaya layk mısın?\"",
      "Son sınav. Tapınağın kendisi seni test ediyor. Her şeyini ortaya koy.",
    ],
    challengeText: "Son sınav. Kelimeni kanıtla:",
    successText: [
      "Kelimeler sana doğru uçuşuyor, etrafında dans ediyor.",
      "Sen artık bir Kelime Ustasısın. Efsane yazıldı. 🌟",
    ],
  },
];

// ─── PARTICLE SYSTEM ─────────────────────────────────────────────────────────

function Particles({ color, count = 14 }: { color: string; count?: number }) {
  const items = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 5,
      dur: 3 + Math.random() * 5,
      delay: Math.random() * 4,
      drift: (Math.random() - 0.5) * 40,
    }))
  ).current;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {items.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, backgroundColor: color }}
          animate={{ y: [0, -35, 0], x: [0, p.drift, 0], opacity: [0.1, 0.7, 0.1], scale: [1, 1.6, 1] }}
          transition={{ repeat: Infinity, duration: p.dur, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── TYPEWRITER CARD ──────────────────────────────────────────────────────────

function TypewriterCard({
  text, accent, onNext, isLast,
}: {
  text: string; accent: string; onNext: () => void; isLast: boolean;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    ref.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(ref.current!); setDone(true); }
    }, 26);
    return () => clearInterval(ref.current!);
  }, [text]);

  const skip = () => { clearInterval(ref.current!); setDisplayed(text); setDone(true); };

  return (
    <div>
      <div
        className="rounded-2xl border p-5 mb-4 min-h-[110px] cursor-pointer select-none"
        style={{ borderColor: accent + "35", background: `linear-gradient(135deg, ${accent}12, ${accent}06)` }}
        onClick={!done ? skip : undefined}
      >
        <p className="text-base leading-relaxed font-medium text-white/90">
          {displayed}
          {!done && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="ml-0.5">▌</motion.span>}
        </p>
        {!done && <p className="text-white/20 text-xs mt-2">Atlamak için dokun</p>}
      </div>
      <AnimatePresence>
        {done && (
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onClick={onNext}
            className="w-full py-3.5 rounded-xl font-semibold border border-white/20 bg-white/10 hover:bg-white/15 transition-all active:scale-95 flex items-center justify-center gap-2 text-white"
          >
            {isLast ? <>⚔️ Savaşa Hazırım</> : <><ChevronRight className="w-4 h-4" /> Devam</>}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SLASH EFFECT ─────────────────────────────────────────────────────────────

function SlashEffect({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
        >
          <div className="w-28 h-1.5 bg-white rounded-full blur-[2px] -rotate-[35deg]" />
          <div className="absolute w-28 h-0.5 bg-white/60 rounded-full -rotate-[35deg]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Challenge { word: Word; options: string[] }
type Phase = "intro" | "chapter-intro" | "narrative" | "pre-challenge" | "challenge" | "chapter-success" | "victory";

function makeChallenge(word: Word, pool: Word[]): Challenge {
  const others = shuffle(pool.filter((w) => w.id !== word.id)).slice(0, 3);
  return { word, options: shuffle([word.translation, ...others.map((w) => w.translation)]) };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function StoryPage() {
  const storeWords = useAppStore.getState().words;
  const reviewWord = useAppStore((s) => s.reviewWord);
  const addGameSession = useAppStore((s) => s.addGameSession);

  const [phase, setPhase] = useState<Phase>("intro");
  const [chapterIdx, setChapterIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [successLine, setSuccessLine] = useState(0);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [flash, setFlash] = useState<"green" | "red" | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [wordsUsed, setWordsUsed] = useState<string[]>([]);

  const poolRef = useRef<Word[]>([]);
  const idxRef = useRef(0);
  const t0Ref = useRef(0);
  const chapter = CHAPTERS[chapterIdx];

  const startStory = () => {
    const w = useAppStore.getState().words;
    poolRef.current = shuffle(w);
    idxRef.current = 0;
    t0Ref.current = Date.now();
    setChapterIdx(0); setLineIdx(0); setSuccessLine(0);
    setMistakes(0); setWordsUsed([]);
    setPhase("chapter-intro");
  };

  const nextWord = () => { const w = poolRef.current[idxRef.current % poolRef.current.length]; idxRef.current++; return w; };

  const advanceLine = () => {
    if (lineIdx < chapter.narrative.length - 1) {
      setLineIdx((l) => l + 1);
    } else {
      setPhase("pre-challenge");
      setTimeout(() => {
        const word = nextWord();
        setChallenge(makeChallenge(word, poolRef.current));
        setSelected(null); setAnswered(false); setIsCorrect(false);
        setPhase("challenge");
      }, 2000);
    }
  };

  const handleAnswer = (opt: string) => {
    if (answered || !challenge) return;
    setSelected(opt); setAnswered(true);
    const ok = opt === challenge.word.translation;
    setIsCorrect(ok);
    setWordsUsed((p) => [...p, challenge.word.id]);

    if (ok) {
      playSound("correct"); triggerHaptic("light");
      reviewWord(challenge.word.id, 4);
      setShowSlash(true); setTimeout(() => setShowSlash(false), 400);
      setEnemyHit(true); setTimeout(() => setEnemyHit(false), 500);
      setFlash("green"); setTimeout(() => setFlash(null), 350);
    } else {
      playSound("wrong"); triggerHaptic("medium");
      setMistakes((m) => m + 1);
      reviewWord(challenge.word.id, 1);
      setFlash("red"); setTimeout(() => setFlash(null), 450);
    }
    setTimeout(() => { setSuccessLine(0); setPhase("chapter-success"); }, ok ? 1100 : 1500);
  };

  const advanceSuccess = () => {
    if (successLine < chapter.successText.length - 1) {
      setSuccessLine((l) => l + 1);
    } else if (chapterIdx === CHAPTERS.length - 1) {
      const dur = Math.round((Date.now() - t0Ref.current) / 1000);
      const score = Math.max(10, 100 - mistakes * 15);
      addGameSession({ gameType: "story", score, wordsPracticed: wordsUsed, playedAt: new Date().toISOString(), duration: dur });
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.1 }, colors: ["#f59e0b"] }), 350);
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.9 }, colors: ["#a855f7"] }), 650);
      setPhase("victory");
    } else {
      setChapterIdx((i) => i + 1); setLineIdx(0); setPhase("chapter-intro");
    }
  };

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center space-y-8 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full opacity-10"
              style={{ width: 100 + i * 50, height: 100 + i * 50, left: `${5 + i * 22}%`, top: `${15 + i * 12}%`, background: `radial-gradient(circle, #6366f1, transparent)` }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.05, 0.2, 0.05] }}
              transition={{ repeat: Infinity, duration: 3 + i * 0.7, ease: "easeInOut" }}
            />
          ))}
        </div>
        <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 10 }} className="text-8xl">📜</motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-3xl font-black mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Unutulan Kelimelerin Tapınağı</h1>
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm leading-relaxed">
            5 bölümlük epik bir macera. Her bölümde farklı bir düşman seni bekliyor. Kelime bilginle onları alt et, tapınağın sırrını çöz.
          </p>
          <div className="flex justify-center gap-3 mt-5">
            {CHAPTERS.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                className="flex flex-col items-center gap-1">
                <span className="text-2xl">{c.enemy.emoji}</span>
                <span className="text-[10px] text-white/30">{c.id}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={startStory} disabled={storeWords.length < 2}
            className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50">
            {storeWords.length < 2 ? "En az 2 kelime gerekli" : "⚔️  Maceraya Başla"}
          </button>
          <Link href="/play" className="text-[hsl(var(--muted-foreground))] text-sm py-2">← Geri Dön</Link>
        </motion.div>
      </div>
    );
  }

  // ── VICTORY ───────────────────────────────────────────────────────────────
  if (phase === "victory") {
    const score = Math.max(10, 100 - mistakes * 15);
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center space-y-6 relative overflow-hidden">
        <Particles color="#f59e0b" count={20} />
        <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: 2, duration: 0.4, delay: 0.3 }} className="text-7xl">🏆</motion.div>
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Efsane Tamamlandı!</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">Tapınağın tüm sırlarını çözdün. Kelimeler özgür!</p>
          <div className="flex justify-center gap-1 mt-3 text-3xl">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.2, type: "spring" }}>{i < stars ? "⭐" : "☆"}</motion.span>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-500 rounded-2xl px-6 py-4"><p className="text-3xl font-black text-white">{score}</p><p className="text-sm text-yellow-100">Puan</p></div>
          <div className="bg-purple-600 rounded-2xl px-6 py-4"><p className="text-3xl font-black text-white">{wordsUsed.length}</p><p className="text-sm text-purple-100">Kelime</p></div>
        </div>
        <div className="flex gap-3">
          <button onClick={startStory} className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm">Tekrar Oyna</button>
          <Link href="/play" className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-5 py-3 rounded-xl font-semibold text-sm">Oyunlar</Link>
        </div>
      </motion.div>
    );
  }

  // ── GAME SCREEN ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white relative overflow-hidden transition-colors duration-1000"
      style={{ background: `radial-gradient(ellipse at 50% -10%, ${chapter.accent}30 0%, ${chapter.bg} 55%)`, backgroundColor: chapter.bg }}>

      <Particles color={chapter.particles} count={12} />

      {/* Glow behind enemy */}
      <motion.div key={chapterIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
        className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${chapter.accent}35, transparent 70%)` }} />

      {/* Screen flash */}
      <AnimatePresence>
        {flash && (
          <motion.div key={flash} initial={{ opacity: 0.55 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ backgroundColor: flash === "green" ? "#22c55e" : "#ef4444" }} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 pt-5 z-10">
        <button onClick={() => setPhase("intro")} className="text-white/40 hover:text-white text-sm">← Çık</button>
        <div className="flex gap-1.5 items-center">
          {CHAPTERS.map((_, i) => (
            <motion.div key={i} className="h-2 rounded-full"
              animate={{ width: i === chapterIdx ? 24 : 8, backgroundColor: i < chapterIdx ? chapter.accent : i === chapterIdx ? "#fff" : "rgba(255,255,255,0.15)" }}
              transition={{ duration: 0.4 }} />
          ))}
        </div>
        <div className="text-white/40 text-sm">{chapterIdx + 1} / 5</div>
      </div>

      <div className="relative z-10 px-4 pb-10">
        <AnimatePresence mode="wait">

          {/* ── CHAPTER INTRO ── */}
          {phase === "chapter-intro" && (
            <motion.div key={`ci${chapterIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.08 }} transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center min-h-[78vh] text-center cursor-pointer"
              onClick={() => { setLineIdx(0); setPhase("narrative"); }}>

              {/* Big background number */}
              <motion.div initial={{ scale: 4, opacity: 0 }} animate={{ scale: 1, opacity: 0.04 }} transition={{ duration: 0.9 }}
                className="absolute inset-0 flex items-center justify-center text-[180px] font-black select-none pointer-events-none overflow-hidden">
                {chapterIdx + 1}
              </motion.div>

              {/* Enemy */}
              <motion.div initial={{ y: 40, scale: 0.5, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ type: "spring", delay: 0.2, damping: 12 }}
                className="text-9xl mb-4 relative" style={{ filter: `drop-shadow(0 0 30px ${chapter.accent}80)` }}>
                {chapter.enemy.emoji}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: chapter.accent }}>Bölüm {chapterIdx + 1} • {chapter.location}</p>
                <h2 className="text-3xl font-black mb-1">{chapter.title}</h2>
                <p className="text-sm" style={{ color: chapter.accent + "80" }}>{chapter.enemy.name}</p>
                <p className="text-[10px] text-white/20 mt-1">{chapter.enemy.subtitle}</p>
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0] }} transition={{ delay: 1.3, repeat: Infinity, duration: 1.6 }}
                className="text-white/30 text-xs mt-12 absolute bottom-8">Devam etmek için dokun</motion.p>
            </motion.div>
          )}

          {/* ── NARRATIVE ── */}
          {phase === "narrative" && (
            <motion.div key={`n${chapterIdx}${lineIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Enemy (idle bounce) */}
              <div className="flex flex-col items-center py-6">
                <motion.div animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                  className="text-7xl mb-2" style={{ filter: `drop-shadow(0 0 18px ${chapter.accent}60)` }}>
                  {chapter.enemy.emoji}
                </motion.div>
                <p className="text-white/30 text-xs">{chapter.enemy.name}</p>
              </div>

              <TypewriterCard
                text={chapter.narrative[lineIdx]}
                accent={chapter.accent}
                onNext={advanceLine}
                isLast={lineIdx === chapter.narrative.length - 1}
              />
            </motion.div>
          )}

          {/* ── PRE-CHALLENGE (enemy powers up) ── */}
          {phase === "pre-challenge" && (
            <motion.div key="pre" className="flex flex-col items-center justify-center min-h-[70vh]">
              <motion.div
                animate={{ scale: [1, 1.1, 1, 1.18, 1], filter: [`brightness(1) drop-shadow(0 0 0px transparent)`, `brightness(2.5) drop-shadow(0 0 30px ${chapter.accent})`, `brightness(1)`, `brightness(3) drop-shadow(0 0 50px ${chapter.accent})`, `brightness(1)`] }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                className="text-9xl mb-8">
                {chapter.enemy.emoji}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className="text-lg font-bold" style={{ color: chapter.accent }}>⚡ {chapter.enemy.name} saldırıya geçiyor...</p>
              </motion.div>
              {/* Charging particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div key={i} className="absolute rounded-full" style={{ width: 6, height: 6, backgroundColor: chapter.accent }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ x: (Math.cos((i / 8) * Math.PI * 2)) * 80, y: (Math.sin((i / 8) * Math.PI * 2)) * 80, opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.1 }} />
              ))}
            </motion.div>
          )}

          {/* ── CHALLENGE ── */}
          {phase === "challenge" && challenge && (
            <motion.div key="ch" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Enemy with hit reaction */}
              <div className="flex flex-col items-center py-5">
                <div className="relative">
                  <motion.div
                    animate={enemyHit
                      ? { x: [-18, 18, -12, 12, 0], scale: [1, 0.85, 1] }
                      : { y: [0, -6, 0] }}
                    transition={enemyHit ? { duration: 0.45 } : { repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    className="text-7xl"
                    style={{ filter: answered && isCorrect ? "grayscale(1) brightness(0.35)" : `drop-shadow(0 0 20px ${chapter.accent}90)` }}>
                    {chapter.enemy.emoji}
                  </motion.div>
                  <SlashEffect show={showSlash} />
                </div>
                {/* Enemy HP bar */}
                <div className="w-36 h-2 bg-white/10 rounded-full overflow-hidden mt-3">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: chapter.accent }}
                    animate={{ width: answered && isCorrect ? "0%" : "100%" }} transition={{ duration: 0.7 }} />
                </div>
                <p className="text-white/25 text-xs mt-1">{chapter.enemy.name}</p>
              </div>

              {/* Question card */}
              <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}
                className="rounded-2xl border p-5 mb-4"
                style={{ borderColor: chapter.accent + "45", background: `linear-gradient(135deg, ${chapter.accent}18, ${chapter.accent}08)`, boxShadow: `0 0 24px ${chapter.accent}20` }}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{chapter.challengeText}</p>
                <p className="text-4xl font-black text-center py-1" style={{ textShadow: `0 0 24px ${chapter.accent}` }}>
                  {challenge.word.word}
                </p>
                {challenge.word.ipa && <p className="text-center text-white/30 text-sm mt-1">{challenge.word.ipa}</p>}
              </motion.div>

              {/* Answer options */}
              <div className="grid grid-cols-2 gap-3">
                {challenge.options.map((opt, i) => {
                  const ok = opt === challenge.word.translation;
                  const sel = opt === selected;
                  const style: React.CSSProperties = answered
                    ? ok ? { borderColor: "#22c55e", background: "#22c55e18", color: "#86efac" }
                      : sel ? { borderColor: "#ef4444", background: "#ef444418", color: "#fca5a5" }
                        : { borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)", opacity: 0.25 }
                    : { borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)" };
                  return (
                    <motion.button key={opt} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      onClick={() => handleAnswer(opt)} disabled={answered}
                      className="p-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 flex items-center justify-between gap-2 text-white"
                      style={style}>
                      <span className="text-left leading-tight">{opt}</span>
                      {answered && ok && <Check className="w-4 h-4 shrink-0 text-green-400" />}
                      {answered && sel && !ok && <X className="w-4 h-4 shrink-0 text-red-400" />}
                    </motion.button>
                  );
                })}
              </div>

              {answered && !isCorrect && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white/40 text-sm mt-4">
                  Doğru: <span className="font-semibold text-green-400">{challenge.word.translation}</span>
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ── CHAPTER SUCCESS ── */}
          {phase === "chapter-success" && (
            <motion.div key={`s${chapterIdx}${successLine}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Enemy defeated */}
              <div className="flex flex-col items-center py-6">
                {successLine === 0 ? (
                  <motion.div
                    initial={{ scale: 1, rotate: 0, opacity: 1 }}
                    animate={{ scale: [1, 1.1, 0.3], rotate: [0, -15, 180], opacity: [1, 0.6, 0] }}
                    transition={{ duration: 0.9 }}
                    className="text-7xl mb-2" style={{ filter: "grayscale(1) brightness(0.3)" }}>
                    {chapter.enemy.emoji}
                  </motion.div>
                ) : (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }}
                    className="text-6xl mb-2">
                    {chapterIdx === CHAPTERS.length - 1 ? "🏆" : "✨"}
                  </motion.div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-5 min-h-[100px] flex items-center">
                <p className="text-base leading-relaxed italic text-white/85">
                  {chapter.successText[successLine]}
                </p>
              </div>

              <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                onClick={advanceSuccess}
                className="w-full py-3.5 rounded-xl font-bold border border-white/20 bg-white/10 hover:bg-white/15 transition-all active:scale-95 flex items-center justify-center gap-2">
                {successLine < chapter.successText.length - 1
                  ? <><ChevronRight className="w-4 h-4" /> Devam</>
                  : chapterIdx === CHAPTERS.length - 1
                    ? "Zaferi Topla 🏆"
                    : `Bölüm ${chapterIdx + 2}: ${CHAPTERS[chapterIdx + 1].title} →`}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
