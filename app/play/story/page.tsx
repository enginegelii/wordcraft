"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, X, Scroll } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { shuffle, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";
import confetti from "canvas-confetti";

// ─── STORY DATA ──────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    id: 1,
    title: "Kapının Sırrı",
    location: "Antik Tapınak Girişi",
    emoji: "🚪",
    bg: "from-[#0f172a] via-[#1e1b4b] to-[#0f172a]",
    glowColor: "#6366f1",
    narrative: [
      "Yüzyıllardır aranılan Kelime Tapınağı'nın önündesin. Bozkırda tek başına, yalnızca bilginle donanmış.",
      "Dev kapının üzerindeki kadim yazı titrek bir ışıkla parlıyor: «Girmek isteyenler bilgisini ispatlasın.»",
      "Kapının ortasındaki çark dönmeye başlıyor. Senden bir kelime soruyor..."
    ],
    challengeText: "Kapı kilidini çöz:",
    successNarrative: [
      "Kapı derin bir sesle gıcırdayarak açılıyor. Yüzyıllık toz havaya karışıyor.",
      "İçeriden binlerce yıllık bilginin ağır kokusu yayılıyor...",
      "İlk engeli geçtin. Tapınak seni kucaklamaya başlıyor."
    ]
  },
  {
    id: 2,
    title: "Bekçinin Sınavı",
    location: "Taş Koridor — Alt Katman",
    emoji: "⚔️",
    bg: "from-[#1a0a2e] via-[#2d1b69] to-[#1a0a2e]",
    glowColor: "#8b5cf6",
    narrative: [
      "Taş koridorda ilerliyorsun. Her adımın yankısı sonsuzluğa uzanıyor gibi.",
      "Aniden dev bir gölge önünü kesiyor. Dev zırhlı Taş Bekçi beliriyor!",
      "\"Yalnızca gerçek bilgeler geçebilir bu eşikten.\" diye gümbürdeyen sesiyle konuşuyor. Gözleri kırmızı yanıyor."
    ],
    challengeText: "Bekçi sana bakıyor. Tereddüt etme!",
    successNarrative: [
      "Bekçi uzun bir sessizliğin ardından yavaşça eğiliyor.",
      "\"Değerlisin, yolcu. Devam et. Tapınak seni bekliyor.\"",
      "Taş duvar ikiye ayrılıyor. Yol açılıyor."
    ]
  },
  {
    id: 3,
    title: "Uçurumun Üstünde",
    location: "Kristal Köprü — Sonsuz Boşluk",
    emoji: "🌉",
    bg: "from-[#0d1117] via-[#0c2233] to-[#0d1117]",
    glowColor: "#06b6d4",
    narrative: [
      "Önünde sonsuz bir uçurum uzanıyor. Karanlığın dibinde hiçbir şey görünmüyor.",
      "Işıl ışıl parlayan kristal taşlardan oluşan ince bir köprü sallantıda duruyor.",
      "Her taş farklı bir kelimenin gücüyle tutuluyor. Yanlış adım at... düşüşün sonu olmaz."
    ],
    challengeText: "Taş sallantıya geçti! Hızlıca cevapla:",
    successNarrative: [
      "Taş altında sağlamlaşıyor. Nefes veriyorsun.",
      "Köprü mavi bir parıltıyla titreşiyor — seni onayladı.",
      "Karşı kıyıya ulaştın. Neredeyse hedefte."
    ]
  },
  {
    id: 4,
    title: "Büyücü ile Yüzleşme",
    location: "Kara Kule — Zirve",
    emoji: "🔮",
    bg: "from-[#1a0505] via-[#4a0e0e] to-[#1a0505]",
    glowColor: "#ef4444",
    narrative: [
      "Kule'nin zirvesinde seni bekleyen Gölge Büyücüsü yükseliyor. Yarı insan, yarı karanlık.",
      "\"Kelimeleri toplayan sen misin?!\" diye haykırıyor. \"Onlar BENİM avım, BENIM gücüm!\"",
      "\"Son bir sınavı geçersen... serbest bırakırım hepsini. Geçemezsen... sonsuza dek burada kalırsın!\""
    ],
    challengeText: "Büyücü son büyüsünü fırlatıyor. Dur!",
    successNarrative: [
      "Büyücü çığlık atarak geride sürükleniyor!",
      "\"İm... imkânsız! Bu kadar kelimeyi nasıl biliyorsun?!\"",
      "Karanlık dağılıyor. Kule çatırdayarak aydınlanıyor."
    ]
  },
  {
    id: 5,
    title: "Kelimelerin Özgürlüğü",
    location: "Kadim Hazine Odası",
    emoji: "✨",
    bg: "from-[#1c1000] via-[#3d2a00] to-[#1c1000]",
    glowColor: "#f59e0b",
    narrative: [
      "Altın bir ışıkla dolup taşan son odadasın. Binlerce kelime etrafında dans ediyor.",
      "Hepsi kurtarıldı. Yüzyıllardır hapiste olan her sözcük, her kavram, her bilgi.",
      "Ama tapınak son bir sınav istiyor. En yüce kelimeyi çöz. Efsanenin son halkası."
    ],
    challengeText: "Son kelimeyi çöz. Efsane tamamlanır:",
    successNarrative: [
      "Kelimeler sana doğru uçuşuyor, etrafında dans ediyor.",
      "Tapınak titreyerek tam anlamıyla aydınlanıyor.",
      "Sen artık bir Kelime Ustasısın. Efsane yazıldı. 🌟"
    ]
  }
];

interface Challenge {
  word: Word;
  options: string[];
}

type Phase = "intro" | "narrative" | "challenge" | "chapter-success" | "victory";

function makeChallenge(word: Word, allWords: Word[]): Challenge {
  const others = shuffle(allWords.filter((w) => w.id !== word.id)).slice(0, 3);
  const options = shuffle([word.translation, ...others.map((w) => w.translation)]);
  return { word, options };
}

export default function StoryPage() {
  const storeWords = useAppStore.getState().words;
  const reviewWord = useAppStore((s) => s.reviewWord);
  const addGameSession = useAppStore((s) => s.addGameSession);

  const [phase, setPhase] = useState<Phase>("intro");
  const [chapterIdx, setChapterIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [successLineIdx, setSuccessLineIdx] = useState(0);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [wordsUsed, setWordsUsed] = useState<string[]>([]);

  const wordPoolRef = useRef<Word[]>([]);
  const usedIdxRef = useRef(0);
  const startTimeRef = useRef(0);

  const chapter = CHAPTERS[chapterIdx];

  const startStory = () => {
    const fresh = useAppStore.getState().words;
    wordPoolRef.current = shuffle(fresh);
    usedIdxRef.current = 0;
    startTimeRef.current = Date.now();
    setChapterIdx(0);
    setLineIdx(0);
    setSuccessLineIdx(0);
    setTotalMistakes(0);
    setWordsUsed([]);
    setPhase("narrative");
  };

  const getNextWord = () => {
    const pool = wordPoolRef.current;
    const word = pool[usedIdxRef.current % pool.length];
    usedIdxRef.current += 1;
    return word;
  };

  const advanceLine = () => {
    if (lineIdx < chapter.narrative.length - 1) {
      setLineIdx((l) => l + 1);
    } else {
      const word = getNextWord();
      setChallenge(makeChallenge(word, wordPoolRef.current));
      setSelected(null);
      setAnswered(false);
      setPhase("challenge");
    }
  };

  const handleAnswer = (option: string) => {
    if (answered || !challenge) return;
    setSelected(option);
    setAnswered(true);
    const isCorrect = option === challenge.word.translation;
    setWordsUsed((prev) => [...prev, challenge.word.id]);

    if (isCorrect) {
      playSound("correct");
      triggerHaptic("light");
      reviewWord(challenge.word.id, 4);
    } else {
      playSound("wrong");
      triggerHaptic("medium");
      setTotalMistakes((m) => m + 1);
      reviewWord(challenge.word.id, 1);
    }
    setTimeout(() => {
      setSuccessLineIdx(0);
      setPhase("chapter-success");
    }, 900);
  };

  const advanceSuccess = () => {
    if (successLineIdx < chapter.successNarrative.length - 1) {
      setSuccessLineIdx((l) => l + 1);
    } else {
      const isLast = chapterIdx === CHAPTERS.length - 1;
      if (isLast) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        const score = Math.max(10, 100 - totalMistakes * 15);
        addGameSession({
          gameType: "story",
          score,
          wordsPracticed: wordsUsed,
          playedAt: new Date().toISOString(),
          duration,
        });
        confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 } });
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.1, y: 0.7 }, colors: ["#f59e0b", "#fbbf24"] }), 400);
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.9, y: 0.7 }, colors: ["#a855f7", "#6366f1"] }), 700);
        setPhase("victory");
      } else {
        setChapterIdx((i) => i + 1);
        setLineIdx(0);
        setPhase("narrative");
      }
    }
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center space-y-8">
        <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12 }} className="text-8xl select-none">
          📜
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-3xl font-black mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Unutulan Kelimelerin Tapınağı
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm leading-relaxed">
            5 bölümlük epik bir maceraya atıl. Gölge Büyücüsü&apos;nün esir aldığı kelimeleri kurtarmak için
            kelime bilginini kullan. Her doğru cevap seni hedefe bir adım daha yaklaştırır.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={startStory}
            disabled={storeWords.length < 2}
            className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {storeWords.length < 2 ? "En az 2 kelime gerekli" : "⚔️  Maceraya Başla"}
          </button>
          <Link href="/play" className="text-[hsl(var(--muted-foreground))] text-sm py-2">← Geri Dön</Link>
        </motion.div>
      </div>
    );
  }

  // ── VICTORY ────────────────────────────────────────────────────────────────
  if (phase === "victory") {
    const score = Math.max(10, 100 - totalMistakes * 15);
    const stars = totalMistakes === 0 ? 3 : totalMistakes <= 2 ? 2 : 1;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
        <div className="text-7xl">🏆</div>
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Efsane Tamamlandı!
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">
            Tapınağın sırlarını çözdün. Kelimeler özgür!
          </p>
          <div className="flex justify-center gap-1 mt-3 text-3xl">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.2 }}>
                {i < stars ? "⭐" : "☆"}
              </motion.span>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">{score}</p>
            <p className="text-sm text-yellow-100">Puan</p>
          </div>
          <div className="bg-purple-600 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">{wordsUsed.length}</p>
            <p className="text-sm text-purple-100">Kelime</p>
          </div>
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
    <div className={`min-h-screen bg-gradient-to-b ${chapter.bg} text-white transition-all duration-1000`}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${chapter.glowColor}20 0%, transparent 60%)` }} />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 pt-5">
        <button onClick={() => setPhase("intro")} className="flex items-center gap-1 text-white/50 hover:text-white transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" /> Çık
        </button>
        <div className="flex gap-1.5">
          {CHAPTERS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${i < chapterIdx ? "w-6 bg-white/80" : i === chapterIdx ? "w-6 bg-white" : "w-3 bg-white/20"}`}
            />
          ))}
        </div>
        <div className="text-sm text-white/50">{chapterIdx + 1}/5</div>
      </div>

      {/* Chapter label */}
      <div className="relative px-5 pb-3">
        <p className="text-white/40 text-xs uppercase tracking-widest">{chapter.location}</p>
        <h2 className="text-xl font-black mt-0.5">{chapter.emoji} {chapter.title}</h2>
      </div>

      {/* Content */}
      <div className="relative px-4 pb-8">
        <AnimatePresence mode="wait">

          {/* NARRATIVE */}
          {phase === "narrative" && (
            <motion.div key={`n-${chapterIdx}-${lineIdx}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.35 }}>
              <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-6 min-h-[140px] flex items-center mb-5">
                <p className="text-base leading-relaxed font-medium text-white/90">
                  {chapter.narrative[lineIdx]}
                </p>
              </div>
              <button onClick={advanceLine} className="w-full py-3.5 rounded-xl font-semibold border border-white/20 bg-white/10 hover:bg-white/15 transition-all active:scale-95 flex items-center justify-center gap-2 text-white/90">
                {lineIdx < chapter.narrative.length - 1 ? (<><ChevronRight className="w-4 h-4" /> Devam</>) : (<><Scroll className="w-4 h-4" /> Sınava Hazırım</>)}
              </button>
            </motion.div>
          )}

          {/* CHALLENGE */}
          {phase === "challenge" && challenge && (
            <motion.div key="challenge" initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-5 mb-5">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-4">{chapter.challengeText}</p>
                <p className="text-4xl font-black text-center tracking-wide py-2" style={{ textShadow: `0 0 30px ${chapter.glowColor}` }}>
                  {challenge.word.word}
                </p>
                {challenge.word.ipa && <p className="text-center text-white/40 text-sm mt-1">{challenge.word.ipa}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {challenge.options.map((opt) => {
                  const isCorrect = opt === challenge.word.translation;
                  const isSelected = opt === selected;
                  let cls = "border-white/15 bg-white/8 hover:bg-white/15";
                  if (answered) {
                    if (isCorrect) cls = "border-green-400/60 bg-green-500/20 text-green-300";
                    else if (isSelected) cls = "border-red-400/60 bg-red-500/20 text-red-300";
                    else cls = "border-white/5 bg-white/3 opacity-30";
                  }
                  return (
                    <button key={opt} onClick={() => handleAnswer(opt)} disabled={answered}
                      className={`p-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 flex items-center justify-between gap-2 backdrop-blur-sm ${cls}`}>
                      <span className="text-left leading-tight">{opt}</span>
                      {answered && isCorrect && <Check className="w-4 h-4 shrink-0" />}
                      {answered && isSelected && !isCorrect && <X className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {answered && challenge && selected !== challenge.word.translation && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white/50 text-sm mt-4">
                  Doğru cevap: <span className="text-green-400 font-semibold">{challenge.word.translation}</span>
                </motion.p>
              )}
            </motion.div>
          )}

          {/* CHAPTER SUCCESS */}
          {phase === "chapter-success" && (
            <motion.div key={`s-${chapterIdx}-${successLineIdx}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <div className="bg-white/8 backdrop-blur-sm border border-white/20 rounded-2xl p-6 min-h-[140px] flex items-center mb-5">
                <p className="text-base leading-relaxed italic text-white/85">
                  ✨&nbsp; {chapter.successNarrative[successLineIdx]}
                </p>
              </div>
              <button onClick={advanceSuccess} className="w-full py-3.5 rounded-xl font-bold border border-white/25 bg-white/15 hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-white">
                {successLineIdx < chapter.successNarrative.length - 1
                  ? (<><ChevronRight className="w-4 h-4" /> Devam</>)
                  : chapterIdx === CHAPTERS.length - 1
                    ? "Zaferi Topla 🏆"
                    : `Sonraki: ${CHAPTERS[chapterIdx + 1].title} →`}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
