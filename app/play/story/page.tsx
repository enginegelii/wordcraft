"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { shuffle, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";
import confetti from "canvas-confetti";

const sr = (seed: number) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

type Speaker = "player" | "enemy";
interface DialogueLine { speaker: Speaker; text: string; }

// ─── CHAPTER DATA (all English) ──────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 1, title: "The Gate's Secret", location: "Ancient Temple • Entrance",
    enemy: { emoji: "🛡️", name: "Stone Guardian", subtitle: "The temple's first warden" },
    accent: "#6366f1", particles: "#818cf8",
    dialogue: [
      { speaker: "enemy" as Speaker, text: "Who dares approach the sacred temple?! These words are bound by ancient law!" },
      { speaker: "player" as Speaker, text: "I seek the words imprisoned here. Stand aside, Guardian." },
      { speaker: "enemy" as Speaker, text: "Then prove your worth. Answer my riddle... or face eternal silence!" },
    ],
    challengeText: "What does this word mean?",
    successDialogue: [
      { speaker: "player" as Speaker, text: "Your riddle is solved. The word is free." },
      { speaker: "enemy" as Speaker, text: "...Remarkable. The gate is yours, Word Seeker." },
    ],
  },
  {
    id: 2, title: "Shadow Sentinel", location: "Dark Corridor • Lower Level",
    enemy: { emoji: "🗿", name: "Shadow Sentinel", subtitle: "Guardian of the corridor" },
    accent: "#8b5cf6", particles: "#a78bfa",
    dialogue: [
      { speaker: "enemy" as Speaker, text: "Turn back, wanderer. The darkness here devours the unworthy." },
      { speaker: "player" as Speaker, text: "I've come too far to retreat. The words call to me." },
      { speaker: "enemy" as Speaker, text: "Then face me! Your mind is your only weapon in this darkness!" },
    ],
    challengeText: "The Sentinel demands an answer:",
    successDialogue: [
      { speaker: "enemy" as Speaker, text: "You... you actually knew this! How is that possible?!" },
      { speaker: "player" as Speaker, text: "Step aside. There are more words to free." },
    ],
  },
  {
    id: 3, title: "Spirit of the Abyss", location: "Crystal Bridge • Endless Void",
    enemy: { emoji: "🌀", name: "Abyss Spirit", subtitle: "Guardian of the void" },
    accent: "#06b6d4", particles: "#67e8f9",
    dialogue: [
      { speaker: "enemy" as Speaker, text: "One wrong step and you fall... forever. Can your mind hold against the void?" },
      { speaker: "player" as Speaker, text: "Knowledge is my shield. The void holds no fear for me." },
      { speaker: "enemy" as Speaker, text: "Bold! Let us see if your knowledge matches your courage!" },
    ],
    challengeText: "The bridge trembles! Choose fast:",
    successDialogue: [
      { speaker: "enemy" as Speaker, text: "Astonishing... the words bow to you. Cross, Word Seeker." },
      { speaker: "player" as Speaker, text: "The dark tower lies ahead. I press on." },
    ],
  },
  {
    id: 4, title: "Shadow Sorcerer", location: "Dark Tower • Summit",
    enemy: { emoji: "🧙", name: "Shadow Sorcerer", subtitle: "Thief of words" },
    accent: "#a855f7", particles: "#d8b4fe",
    dialogue: [
      { speaker: "enemy" as Speaker, text: "You've come this far?! I'm impressed... and furious!" },
      { speaker: "player" as Speaker, text: "Return every stolen word, Sorcerer. This ends now." },
      { speaker: "enemy" as Speaker, text: "These words are MINE! Prepare to face my ultimate power!" },
    ],
    challengeText: "The Sorcerer casts his spell:",
    successDialogue: [
      { speaker: "enemy" as Speaker, text: "Impossible! My power is fading! How do you know all this?!" },
      { speaker: "player" as Speaker, text: "Because I never stopped learning. The final chamber awaits." },
    ],
  },
  {
    id: 5, title: "The Ancient Keeper", location: "Treasure Hall • Final Chamber",
    enemy: { emoji: "🔮", name: "Ancient Keeper", subtitle: "The temple's true guardian" },
    accent: "#f59e0b", particles: "#fcd34d",
    dialogue: [
      { speaker: "enemy" as Speaker, text: "Word Seeker... you have proven yourself beyond all expectation." },
      { speaker: "player" as Speaker, text: "I am ready for the final test. Whatever it may be." },
      { speaker: "enemy" as Speaker, text: "The words themselves shall judge you. Are you truly their guardian?" },
    ],
    challengeText: "The final question:",
    successDialogue: [
      { speaker: "enemy" as Speaker, text: "You've done it. The words are free. You are their true guardian." },
      { speaker: "player" as Speaker, text: "Not their master... their keeper. I will carry them always." },
    ],
  },
];

// ─── SCENE BACKGROUNDS ────────────────────────────────────────────────────────
function SceneBackground({ id }: { id: number }) {
  if (id === 1) return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sg1" cx="50%" cy="40%"><stop offset="0%" stopColor="#1e1b4b"/><stop offset="100%" stopColor="#060a18"/></radialGradient>
        <radialGradient id="arch1" cx="50%" cy="100%"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.5"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sg1)"/>
      {Array.from({length:40},(_,i)=><circle key={i} cx={sr(i*3)*380+10} cy={sr(i*7)*140+5} r={sr(i*11)*1.2+0.3} fill="white" opacity={sr(i*5)*0.7+0.2}/>)}
      <rect x="0" y="60" width="55" height="200" fill="#111827" rx="3"/>
      <rect x="0" y="50" width="70" height="18" fill="#1f2937" rx="2"/>
      <rect x="345" y="60" width="55" height="200" fill="#111827" rx="3"/>
      <rect x="330" y="50" width="70" height="18" fill="#1f2937" rx="2"/>
      <ellipse cx="200" cy="260" rx="160" ry="100" fill="url(#arch1)"/>
      <path d="M 70 260 Q 70 100 200 80 Q 330 100 330 260" fill="none" stroke="#6366f180" strokeWidth="2"/>
      <rect x="58" y="105" width="6" height="14" fill="#78350f" rx="1"/>
      <ellipse cx="61" cy="102" rx="5" ry="9" fill="#f97316" opacity="0.9"/>
      <ellipse cx="61" cy="99" rx="3" ry="6" fill="#fde68a" opacity="0.9"/>
      <rect x="336" y="105" width="6" height="14" fill="#78350f" rx="1"/>
      <ellipse cx="339" cy="102" rx="5" ry="9" fill="#f97316" opacity="0.9"/>
      <ellipse cx="339" cy="99" rx="3" ry="6" fill="#fde68a" opacity="0.9"/>
      <rect x="0" y="225" width="400" height="35" fill="#0a0f1e"/>
    </svg>
  );
  if (id === 2) return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sg2" cx="50%" cy="50%"><stop offset="0%" stopColor="#2e1065"/><stop offset="100%" stopColor="#050508"/></radialGradient>
        <radialGradient id="mist2" cx="50%" cy="80%"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sg2)"/>
      {[0,60,120,180,240,300,360].map(x=><line key={x} x1={x} y1={0} x2={200} y2={260} stroke="#1e1340" strokeWidth="0.5"/>)}
      {[0,80,160].map(y=><rect key={y} x="0" y={y} width="60" height="75" fill="#0d0820" stroke="#1e1340" strokeWidth="1"/>)}
      {[0,80,160].map(y=><rect key={y} x="340" y={y} width="60" height="75" fill="#0d0820" stroke="#1e1340" strokeWidth="1"/>)}
      <rect x="0" y="200" width="400" height="60" fill="url(#mist2)"/>
      <ellipse cx="200" cy="200" rx="80" ry="50" fill="#8b5cf6" opacity="0.12"/>
      {Array.from({length:20},(_,i)=><circle key={i} cx={sr(i*4)*380+10} cy={sr(i*9)*80} r={sr(i*6)*1+0.3} fill="#a78bfa" opacity={sr(i*2)*0.4+0.1}/>)}
    </svg>
  );
  if (id === 3) return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a1929"/><stop offset="60%" stopColor="#020d1a"/><stop offset="100%" stopColor="#000"/></linearGradient>
        <radialGradient id="abyss" cx="50%" cy="100%"><stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sg3)"/>
      {Array.from({length:30},(_,i)=><circle key={i} cx={sr(i*3)*380+10} cy={sr(i*7)*120} r={sr(i*11)*1.3+0.2} fill="#67e8f9" opacity={sr(i*5)*0.5+0.1}/>)}
      <rect x="0" y="150" width="400" height="110" fill="#000"/>
      {[0,1,2,3,4,5].map(i=><ellipse key={i} cx="200" cy={150+i*20} rx={180-i*20} ry={8} fill="none" stroke="#06b6d410" strokeWidth="1"/>)}
      {[0,1,2,3,4,5,6,7].map(i=>(
        <g key={i}>
          <rect x={30+i*48} y="140" width="40" height="14" fill="#0e7490" rx="3" opacity="0.8"/>
          <rect x={30+i*48} y="140" width="40" height="5" fill="#67e8f9" rx="2" opacity="0.6"/>
        </g>
      ))}
      <rect x="28" y="148" width="344" height="2" fill="#06b6d4" opacity="0.5"/>
      <ellipse cx="200" cy="260" rx="200" ry="60" fill="url(#abyss)"/>
    </svg>
  );
  if (id === 4) return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sg4" cx="50%" cy="40%"><stop offset="0%" stopColor="#2d0a3e"/><stop offset="100%" stopColor="#07020e"/></radialGradient>
        <radialGradient id="sorm" cx="50%" cy="0%"><stop offset="0%" stopColor="#a855f7" stopOpacity="0.4"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sg4)"/>
      {[[40,20,80,25],[120,10,100,30],[220,5,120,28],[320,15,80,22],[80,40,90,20],[260,35,100,25]].map(([x,y,w,h],i)=>(
        <ellipse key={i} cx={x} cy={y} rx={w} ry={h} fill="#1a0a2e" opacity="0.9"/>
      ))}
      <polyline points="250,0 245,40 255,40 242,90" stroke="#a855f7" strokeWidth="1.5" fill="none" opacity="0.7"/>
      <polyline points="150,0 148,35 158,35 145,80" stroke="#c084fc" strokeWidth="1" fill="none" opacity="0.5"/>
      <rect x="0" y="0" width="400" height="80" fill="url(#sorm)"/>
      {[0,40,80,120,160,200,240,280,320,360].map(x=><rect key={x} x={x} y="185" width="30" height="20" fill="#1a0a2e" rx="1"/>)}
      <rect x="0" y="200" width="400" height="60" fill="#120720"/>
      {Array.from({length:20},(_,i)=><circle key={i} cx={sr(i*4)*380+10} cy={sr(i*8)*160+20} r={sr(i*6)*1.2+0.3} fill="#d8b4fe" opacity={sr(i*3)*0.4+0.1}/>)}
    </svg>
  );
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sg5" cx="50%" cy="50%"><stop offset="0%" stopColor="#3d2800"/><stop offset="100%" stopColor="#0d0800"/></radialGradient>
        <radialGradient id="light5" cx="50%" cy="0%"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
        <radialGradient id="floor5" cx="50%" cy="100%"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sg5)"/>
      <rect x="0" y="0" width="400" height="120" fill="url(#light5)"/>
      {[30,130,240,340].map((x,i)=>(
        <g key={i}>
          <rect x={x} y="30" width="22" height="200" fill="#92400e" rx="2"/>
          <rect x={x-4} y="25" width="30" height="14" fill="#b45309" rx="2"/>
          <line x1={x+11} y1="30" x2={x+11} y2="230" stroke="#f59e0b" strokeWidth="1" opacity="0.4"/>
        </g>
      ))}
      <rect x="0" y="200" width="400" height="60" fill="url(#floor5)"/>
      {[50,340].map(x=><g key={x}><rect x={x} y="215" width="30" height="22" fill="#92400e" rx="2"/><rect x={x} y="213" width="30" height="8" fill="#b45309" rx="2"/><rect x={x+12} y="220" width="6" height="6" fill="#f59e0b" rx="1"/></g>)}
      {Array.from({length:25},(_,i)=><circle key={i} cx={sr(i*4)*360+20} cy={sr(i*7)*200+10} r={sr(i*11)*2+0.5} fill="#fcd34d" opacity={sr(i*3)*0.6+0.1}/>)}
    </svg>
  );
}

// ─── PARTICLES ────────────────────────────────────────────────────────────────
function Particles({ color }: { color: string }) {
  const pts = useRef(Array.from({length:10},(_,i)=>({id:i,x:sr(i*3)*100,y:sr(i*7)*100,s:sr(i*11)*4+2,d:3+sr(i*5)*4,dl:sr(i*9)*3,dx:(sr(i*13)-0.5)*40}))).current;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pts.map(p=>(
        <motion.div key={p.id} className="absolute rounded-full" style={{left:`${p.x}%`,top:`${p.y}%`,width:p.s,height:p.s,backgroundColor:color}}
          animate={{y:[0,-30,0],x:[0,p.dx,0],opacity:[0.1,0.6,0.1],scale:[1,1.5,1]}}
          transition={{repeat:Infinity,duration:p.d,delay:p.dl,ease:"easeInOut"}}/>
      ))}
    </div>
  );
}

// ─── PLAYER CHARACTER SVG ────────────────────────────────────────────────────
function PlayerCharacter({ accent, attacking = false }: { accent: string; attacking?: boolean }) {
  return (
    <svg width="72" height="120" viewBox="0 0 72 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="36" cy="112" rx="22" ry="7" fill={accent} opacity="0.25"/>
      <path d="M20 55 Q14 80 16 110 Q36 105 56 110 Q58 80 52 55 Q44 62 36 60 Q28 62 20 55Z" fill="#1e293b"/>
      <rect x="24" y="48" width="24" height="34" rx="5" fill="#334155"/>
      <rect x="22" y="72" width="28" height="5" rx="2" fill="#475569"/>
      <rect x="33" y="71" width="6" height="7" rx="1" fill="#94a3b8"/>
      <rect x="13" y="50" width="13" height="8" rx="4" fill="#334155"/>
      <rect x={attacking ? "50" : "46"} y="48" width="13" height="8" rx="4" fill="#334155"/>
      <rect x="31" y="38" width="10" height="12" rx="4" fill="#475569"/>
      <circle cx="36" cy="28" r="16" fill="#475569"/>
      <path d="M20 26 Q36 4 52 26 Q50 38 36 36 Q22 38 20 26Z" fill="#1e293b"/>
      <path d="M20 26 Q24 34 36 34 Q48 34 52 26" fill="#253348"/>
      <ellipse cx="36" cy="28" rx="10" ry="9" fill="#1a2234" opacity="0.6"/>
      <circle cx="31" cy="27" r="2.5" fill={accent} opacity="0.9"/>
      <circle cx="41" cy="27" r="2.5" fill={accent} opacity="0.9"/>
      <circle cx="31" cy="27" r="1.2" fill="white" opacity="0.7"/>
      <circle cx="41" cy="27" r="1.2" fill="white" opacity="0.7"/>
      <rect x={attacking ? "56" : "54"} y="10" width="4" height="90" rx="2" fill="#64748b"/>
      <circle cx={attacking ? "58" : "56"} cy="10" r="7" fill={accent} opacity="0.9"/>
      <circle cx={attacking ? "58" : "56"} cy="10" r="4" fill="white" opacity="0.7"/>
      <ellipse cx={attacking ? "58" : "56"} cy="10" rx="12" ry="12" fill={accent} opacity="0.2"/>
    </svg>
  );
}

// ─── SLASH EFFECT ─────────────────────────────────────────────────────────────
function SlashEffect({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{scaleX:0,opacity:1}} animate={{scaleX:1,opacity:0}} transition={{duration:0.3}}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-28 h-1.5 bg-white rounded-full blur-[2px] -rotate-[35deg]"/>
          <div className="absolute w-28 h-0.5 bg-white/60 rounded-full -rotate-[35deg]"/>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── SPEECH BUBBLE ────────────────────────────────────────────────────────────
function SpeechBubble({ text, accent, side, onNext }: {
  text: string;
  accent: string;
  side: "left" | "right";
  onNext: () => void;
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
    }, 22);
    return () => clearInterval(ref.current!);
  }, [text]);

  const skip = () => { clearInterval(ref.current!); setDisplayed(text); setDone(true); };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -6 }}
      transition={{ type: "spring", damping: 16, stiffness: 220 }}
      className="relative cursor-pointer select-none"
      style={{ maxWidth: 210 }}
      onClick={() => { if (!done) skip(); else onNext(); }}
    >
      {/* Bubble body */}
      <div
        className="rounded-2xl px-4 py-3"
        style={{
          background: "rgba(6, 8, 22, 0.92)",
          border: `1.5px solid ${accent}70`,
          backdropFilter: "blur(12px)",
          boxShadow: `0 6px 28px ${accent}30, inset 0 1px 0 rgba(255,255,255,0.06)`
        }}
      >
        <p className="text-sm font-medium text-white/90 leading-snug" style={{ minHeight: "3.5em" }}>
          {displayed}
          {!done && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}
              className="ml-0.5 text-white/40">▌</motion.span>
          )}
        </p>
        {done && (
          <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.1 }}
            className="text-right text-[10px] font-bold mt-2" style={{ color: accent }}>
            TAP ▶
          </motion.p>
        )}
      </div>
      {/* Tail pointing down toward the character */}
      <div style={{
        position: "absolute",
        bottom: -9,
        [side === "left" ? "left" : "right"]: 24,
        width: 0, height: 0,
        borderLeft: "9px solid transparent",
        borderRight: "9px solid transparent",
        borderTop: `10px solid ${accent}70`,
      }} />
    </motion.div>
  );
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Challenge { word: Word; options: string[] }
type Phase = "intro" | "chapter-intro" | "narrative" | "pre-challenge" | "challenge" | "chapter-success" | "victory";
function makeChallenge(word: Word, pool: Word[]): Challenge {
  const others = shuffle(pool.filter(w => w.id !== word.id)).slice(0, 3);
  return { word, options: shuffle([word.translation, ...others.map(w => w.translation)]) };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function StoryPage() {
  const storeWords = useAppStore.getState().words;
  const reviewWord = useAppStore(s => s.reviewWord);
  const addGameSession = useAppStore(s => s.addGameSession);

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
  const [enemyDead, setEnemyDead] = useState(false);

  const poolRef = useRef<Word[]>([]);
  const idxRef = useRef(0);
  const t0Ref = useRef(0);
  const chapter = CHAPTERS[chapterIdx];
  const currentLine = chapter.dialogue[lineIdx];

  const startStory = () => {
    const w = useAppStore.getState().words;
    poolRef.current = shuffle(w); idxRef.current = 0; t0Ref.current = Date.now();
    setChapterIdx(0); setLineIdx(0); setSuccessLine(0);
    setMistakes(0); setWordsUsed([]); setEnemyDead(false);
    setPhase("chapter-intro");
  };

  const nextWord = () => { const w = poolRef.current[idxRef.current % poolRef.current.length]; idxRef.current++; return w; };

  const advanceLine = () => {
    if (lineIdx < chapter.dialogue.length - 1) {
      setLineIdx(l => l + 1);
    } else {
      setPhase("pre-challenge");
      setTimeout(() => {
        const word = nextWord();
        setChallenge(makeChallenge(word, poolRef.current));
        setSelected(null); setAnswered(false); setIsCorrect(false); setEnemyDead(false);
        setPhase("challenge");
      }, 2200);
    }
  };

  const handleAnswer = (opt: string) => {
    if (answered || !challenge) return;
    setSelected(opt); setAnswered(true);
    const ok = opt === challenge.word.translation;
    setIsCorrect(ok);
    setWordsUsed(p => [...p, challenge.word.id]);
    if (ok) {
      playSound("correct"); triggerHaptic("light");
      reviewWord(challenge.word.id, 4);
      setShowSlash(true); setTimeout(() => setShowSlash(false), 380);
      setEnemyHit(true); setTimeout(() => setEnemyHit(false), 500);
      setFlash("green"); setTimeout(() => setFlash(null), 300);
    } else {
      playSound("wrong"); triggerHaptic("medium");
      setMistakes(m => m + 1); reviewWord(challenge.word.id, 1);
      setFlash("red"); setTimeout(() => setFlash(null), 400);
    }
    setTimeout(() => { setEnemyDead(ok); setSuccessLine(0); setPhase("chapter-success"); }, ok ? 900 : 1400);
  };

  const advanceSuccess = () => {
    if (successLine < chapter.successDialogue.length - 1) {
      setSuccessLine(l => l + 1);
    } else if (chapterIdx === CHAPTERS.length - 1) {
      const dur = Math.round((Date.now() - t0Ref.current) / 1000);
      const score = Math.max(10, 100 - mistakes * 15);
      addGameSession({ gameType: "story", score, wordsPracticed: wordsUsed, playedAt: new Date().toISOString(), duration: dur });
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.1 }, colors: ["#f59e0b"] }), 350);
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.9 }, colors: ["#a855f7"] }), 650);
      setPhase("victory");
    } else {
      setChapterIdx(i => i + 1); setLineIdx(0); setEnemyDead(false); setPhase("chapter-intro");
    }
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center space-y-8 relative overflow-hidden">
      {[...Array(5)].map((_,i)=>(
        <motion.div key={i} className="fixed rounded-full pointer-events-none"
          style={{width:100+i*60,height:100+i*60,left:`${5+i*20}%`,top:`${10+i*15}%`,background:`radial-gradient(circle,#6366f1,transparent)`,opacity:0.06}}
          animate={{scale:[1,1.4,1]}} transition={{repeat:Infinity,duration:3+i,ease:"easeInOut"}}/>
      ))}
      <motion.div initial={{scale:0,rotate:-10}} animate={{scale:1,rotate:0}} transition={{type:"spring",damping:10}} className="text-8xl">📜</motion.div>
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
        <h1 className="text-3xl font-black mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Temple of Forgotten Words
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm leading-relaxed">
          A 5-chapter epic adventure. Face ancient guardians. Prove your vocabulary — or be silenced forever.
        </p>
        <div className="flex justify-center gap-4 mt-5">
          {CHAPTERS.map((c,i)=>(
            <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.5+i*0.1}} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{c.enemy.emoji}</span>
              <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:c.accent}}/>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.8}} className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={startStory} disabled={storeWords.length < 2}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50">
          {storeWords.length < 2 ? "Add at least 2 words first" : "⚔️  Begin the Adventure"}
        </button>
        <Link href="/play" className="text-[hsl(var(--muted-foreground))] text-sm py-2">← Geri Dön</Link>
      </motion.div>
    </div>
  );

  // ── VICTORY ───────────────────────────────────────────────────────────────
  if (phase === "victory") {
    const score = Math.max(10, 100 - mistakes * 15);
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center space-y-6 relative overflow-hidden">
        <Particles color="#f59e0b" />
        <motion.div animate={{rotate:[0,-5,5,0]}} transition={{repeat:2,duration:0.4,delay:0.3}} className="text-7xl">🏆</motion.div>
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Legend Complete!</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">You've freed all the words. The temple is yours.</p>
          <div className="flex justify-center gap-1 mt-3 text-3xl">
            {Array.from({length:3}).map((_,i)=>(
              <motion.span key={i} initial={{scale:0}} animate={{scale:1}} transition={{delay:0.3+i*0.2,type:"spring"}}>{i<stars?"⭐":"☆"}</motion.span>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-500 rounded-2xl px-6 py-4"><p className="text-3xl font-black text-white">{score}</p><p className="text-sm text-yellow-100">Score</p></div>
          <div className="bg-purple-600 rounded-2xl px-6 py-4"><p className="text-3xl font-black text-white">{wordsUsed.length}</p><p className="text-sm text-purple-100">Words</p></div>
        </div>
        <div className="flex gap-3">
          <button onClick={startStory} className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm">Play Again</button>
          <Link href="/play" className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-5 py-3 rounded-xl font-semibold text-sm">Games</Link>
        </div>
      </motion.div>
    );
  }

  // ── GAME SCREEN ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{backgroundColor: "#060810"}}>
      {/* Scene background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div key={chapterIdx} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.8}} className="absolute inset-0">
            <SceneBackground id={chapter.id} />
          </motion.div>
        </AnimatePresence>
      </div>

      <Particles color={chapter.particles} />

      {/* Screen flash */}
      <AnimatePresence>
        {flash && (
          <motion.div key={flash} initial={{opacity:0.5}} animate={{opacity:0}} transition={{duration:0.4}}
            className="fixed inset-0 pointer-events-none z-50"
            style={{backgroundColor: flash==="green"?"#22c55e":"#ef4444"}}/>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-4">
        <button onClick={()=>setPhase("intro")} className="text-white/50 hover:text-white text-sm">← Çık</button>
        <div className="flex gap-1.5">
          {CHAPTERS.map((_,i)=>(
            <motion.div key={i} className="h-2 rounded-full"
              animate={{width:i===chapterIdx?24:8,backgroundColor:i<chapterIdx?chapter.accent:i===chapterIdx?"#fff":"rgba(255,255,255,0.2)"}}
              transition={{duration:0.4}}/>
          ))}
        </div>
        <div className="text-white/40 text-sm">{chapterIdx+1}/5</div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── CHAPTER INTRO ── */}
        {phase==="chapter-intro" && (
          <motion.div key={`ci${chapterIdx}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:1.05}} transition={{duration:0.5}}
            className="relative z-10 flex flex-col items-center justify-center cursor-pointer"
            style={{height:"calc(100vh - 60px)"}}
            onClick={()=>{setLineIdx(0);setPhase("narrative");}}>
            <motion.div initial={{scale:4,opacity:0}} animate={{scale:1,opacity:0.05}} transition={{duration:1}}
              className="absolute inset-0 flex items-center justify-center text-[200px] font-black select-none overflow-hidden">
              {chapterIdx+1}
            </motion.div>
            <motion.div initial={{y:50,scale:0.3,opacity:0}} animate={{y:0,scale:1,opacity:1}} transition={{type:"spring",delay:0.2,damping:10}}
              className="text-[100px] mb-6 relative" style={{filter:`drop-shadow(0 0 40px ${chapter.accent}90)`}}>
              {chapter.enemy.emoji}
            </motion.div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}} className="text-center">
              <p className="text-xs uppercase tracking-widest mb-1 font-medium" style={{color:chapter.accent}}>
                Chapter {chapterIdx+1} · {chapter.location}
              </p>
              <h2 className="text-3xl font-black mb-1">{chapter.title}</h2>
              <p className="text-sm text-white/40">{chapter.enemy.subtitle}</p>
            </motion.div>
            <motion.p initial={{opacity:0}} animate={{opacity:[0,0.5,0]}} transition={{delay:1.4,repeat:Infinity,duration:1.6}}
              className="text-white/30 text-xs absolute bottom-8">Tap to continue</motion.p>
          </motion.div>
        )}

        {/* ── NARRATIVE (speech bubbles from characters) ── */}
        {phase==="narrative" && (
          <motion.div key={`n${chapterIdx}${lineIdx}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="relative z-10" style={{height:"calc(100vh - 60px)"}}>

            {/* Player speech bubble — left */}
            <div className="absolute z-20" style={{bottom: 270, left: "3%"}}>
              <AnimatePresence mode="wait">
                {currentLine.speaker === "player" ? (
                  <SpeechBubble
                    key={`pb-${lineIdx}`}
                    text={currentLine.text}
                    accent={chapter.accent}
                    side="left"
                    onNext={advanceLine}
                  />
                ) : (
                  <motion.div key="pd" initial={{opacity:0}} animate={{opacity:0.18}}
                    className="px-3 py-2 rounded-2xl border border-white/10 bg-white/5 text-white/40 text-xs"
                    style={{maxWidth:90}}>
                    ...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enemy speech bubble — right */}
            <div className="absolute z-20 flex justify-end" style={{bottom: 255, right: "3%"}}>
              <AnimatePresence mode="wait">
                {currentLine.speaker === "enemy" ? (
                  <SpeechBubble
                    key={`eb-${lineIdx}`}
                    text={currentLine.text}
                    accent={chapter.accent}
                    side="right"
                    onNext={advanceLine}
                  />
                ) : (
                  <motion.div key="ed" initial={{opacity:0}} animate={{opacity:0.18}}
                    className="px-3 py-2 rounded-2xl border border-white/10 bg-white/5 text-white/40 text-xs"
                    style={{maxWidth:90}}>
                    ...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Player character — left */}
            <motion.div className="absolute flex flex-col items-center gap-1" style={{bottom:130, left:"4%"}}
              animate={{y:[0,-4,0]}} transition={{repeat:Infinity,duration:3,ease:"easeInOut"}}>
              <PlayerCharacter accent={chapter.accent}/>
              <span className="text-white/30 text-[10px] tracking-wider uppercase">You</span>
            </motion.div>

            {/* VS glow divider */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{bottom:180,width:2,height:80,background:`linear-gradient(to bottom,transparent,${chapter.accent}60,transparent)`}}/>

            {/* Enemy — right */}
            <motion.div className="absolute flex flex-col items-center gap-1" style={{bottom:120, right:"4%"}}
              animate={{y:[0,-8,0]}} transition={{repeat:Infinity,duration:2.6,ease:"easeInOut"}}>
              <div style={{transform:"scaleX(-1)", filter:`drop-shadow(0 0 20px ${chapter.accent}80)`}}>
                <span className="text-[90px] block">{chapter.enemy.emoji}</span>
              </div>
              <span className="text-white/30 text-[10px] tracking-wider uppercase">{chapter.enemy.name}</span>
            </motion.div>

            {/* Speaker name indicator at bottom */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <motion.div
                key={currentLine.speaker}
                initial={{opacity:0, y:4}} animate={{opacity:1, y:0}}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{background:`${chapter.accent}30`, border:`1px solid ${chapter.accent}50`, color:chapter.accent}}>
                {currentLine.speaker === "player" ? "You" : chapter.enemy.name} is speaking
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ── PRE-CHALLENGE ── */}
        {phase==="pre-challenge" && (
          <motion.div key="pre" className="relative z-10 flex flex-col items-center justify-center" style={{height:"calc(100vh - 60px)"}}>
            <div className="absolute" style={{bottom:160, left:"8%"}}>
              <motion.div animate={{x:[0,-5,0]}} transition={{repeat:Infinity,duration:0.7}}>
                <PlayerCharacter accent={chapter.accent}/>
              </motion.div>
              <span className="text-white/30 text-[10px] tracking-wider uppercase block text-center mt-1">You</span>
            </div>

            <div className="relative flex flex-col items-center">
              <motion.div
                animate={{scale:[1,1.12,1,1.2,1],filter:[`brightness(1)`,`brightness(2.5) drop-shadow(0 0 35px ${chapter.accent})`,`brightness(1)`,`brightness(3) drop-shadow(0 0 55px ${chapter.accent})`,`brightness(1)`]}}
                transition={{duration:2,ease:"easeInOut"}} className="text-[90px]">
                {chapter.enemy.emoji}
              </motion.div>
              {[...Array(8)].map((_,i)=>(
                <motion.div key={i} className="absolute rounded-full" style={{width:8,height:8,backgroundColor:chapter.accent}}
                  initial={{x:0,y:0,opacity:0,scale:0}}
                  animate={{x:Math.cos((i/8)*Math.PI*2)*90,y:Math.sin((i/8)*Math.PI*2)*90,opacity:[0,1,0],scale:[0,1.8,0]}}
                  transition={{repeat:Infinity,duration:0.85,delay:i*0.1}}/>
              ))}
            </div>
            <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
              className="text-base font-bold tracking-wide mt-6" style={{color:chapter.accent}}>
              ⚡ {chapter.enemy.name} is charging up...
            </motion.p>
          </motion.div>
        )}

        {/* ── CHALLENGE ── */}
        {phase==="challenge" && challenge && (
          <motion.div key="ch" initial={{opacity:0}} animate={{opacity:1}} className="relative z-10 flex flex-col" style={{height:"calc(100vh - 60px)"}}>

            {/* Battle arena */}
            <div className="flex items-end justify-between px-4 pt-3 pb-1">

              {/* Player side */}
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={answered && isCorrect ? {x:[0,14,0],rotate:[0,-8,0]} : {y:[0,-3,0]}}
                  transition={answered && isCorrect ? {duration:0.35} : {repeat:Infinity,duration:2.8,ease:"easeInOut"}}>
                  <PlayerCharacter accent={chapter.accent} attacking={answered && isCorrect}/>
                </motion.div>
                <span className="text-white/30 text-[10px] tracking-wider uppercase">You</span>
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400 w-full"/>
                </div>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center pb-8 gap-2">
                <motion.span className="text-xs font-black tracking-widest" style={{color:chapter.accent}}
                  animate={{opacity:[0.4,1,0.4]}} transition={{repeat:Infinity,duration:1.4}}>VS</motion.span>
                <div style={{width:1,height:40,background:`linear-gradient(to bottom,transparent,${chapter.accent}50,transparent)`}}/>
              </div>

              {/* Enemy side */}
              <div className="flex flex-col items-center gap-1">
                {/* Enemy speech bubble */}
                <div className="mb-2 relative" style={{maxWidth:180}}>
                  <div className="rounded-2xl px-3 py-2 text-xs font-medium text-white/90"
                    style={{background:"rgba(6,8,22,0.90)", border:`1.5px solid ${chapter.accent}65`, backdropFilter:"blur(10px)"}}>
                    {chapter.challengeText}
                  </div>
                  <div style={{position:"absolute",bottom:-7,right:20,width:0,height:0,
                    borderLeft:"7px solid transparent",borderRight:"7px solid transparent",
                    borderTop:`8px solid ${chapter.accent}65`}}/>
                </div>
                <div className="relative">
                  <motion.div
                    animate={enemyHit ? {x:[-16,16,-10,10,0],scale:[1,0.82,1]} : {y:[0,-6,0]}}
                    transition={enemyHit ? {duration:0.4} : {repeat:Infinity,duration:2,ease:"easeInOut"}}
                    className="text-[72px]"
                    style={{transform:"scaleX(-1)",filter:answered&&isCorrect?"grayscale(1) brightness(0.15)":`drop-shadow(0 0 22px ${chapter.accent}90)`}}>
                    {chapter.enemy.emoji}
                  </motion.div>
                  <SlashEffect show={showSlash}/>
                </div>
                <span className="text-white/30 text-[10px] tracking-wider uppercase">{chapter.enemy.name}</span>
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{backgroundColor:chapter.accent}}
                    animate={{width:answered&&isCorrect?"0%":"100%"}} transition={{duration:0.75}}/>
                </div>
              </div>
            </div>

            {/* Question card */}
            <div className="px-4 flex-1 flex flex-col justify-center gap-3 pt-1">
              <motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring"}}
                className="rounded-2xl border p-4"
                style={{borderColor:chapter.accent+"45",background:`linear-gradient(135deg,${chapter.accent}18,${chapter.accent}08)`,boxShadow:`0 0 28px ${chapter.accent}25`}}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">What does this mean?</p>
                <p className="text-4xl font-black text-center py-1" style={{textShadow:`0 0 24px ${chapter.accent}`}}>
                  {challenge.word.word}
                </p>
                {challenge.word.ipa && <p className="text-center text-white/30 text-sm mt-1">{challenge.word.ipa}</p>}
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                {challenge.options.map((opt,i)=>{
                  const ok=opt===challenge.word.translation, sel=opt===selected;
                  const style: React.CSSProperties = answered
                    ? ok?{borderColor:"#22c55e",background:"#22c55e18",color:"#86efac"}
                      : sel?{borderColor:"#ef4444",background:"#ef444418",color:"#fca5a5"}
                        : {borderColor:"rgba(255,255,255,0.04)",background:"rgba(255,255,255,0.02)",opacity:0.25}
                    : {borderColor:"rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.07)"};
                  return (
                    <motion.button key={opt} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
                      onClick={()=>handleAnswer(opt)} disabled={answered}
                      className="p-3.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 flex items-center justify-between gap-2 text-white"
                      style={style}>
                      <span className="text-left leading-tight">{opt}</span>
                      {answered&&ok&&<Check className="w-4 h-4 shrink-0 text-green-400"/>}
                      {answered&&sel&&!ok&&<X className="w-4 h-4 shrink-0 text-red-400"/>}
                    </motion.button>
                  );
                })}
              </div>
              {answered&&!isCorrect&&(
                <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-center text-white/40 text-sm">
                  Correct: <span className="text-green-400 font-semibold">{challenge.word.translation}</span>
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── CHAPTER SUCCESS (speech bubbles) ── */}
        {phase==="chapter-success" && (
          <motion.div key={`s${chapterIdx}${successLine}`} initial={{opacity:0}} animate={{opacity:1}}
            className="relative z-10" style={{height:"calc(100vh - 60px)"}}>

            {/* Defeated/alive enemy at top center */}
            <div className="absolute flex flex-col items-center" style={{top:"8%", left:"50%", transform:"translateX(-50%)"}}>
              {enemyDead ? (
                <motion.div initial={{scale:1,rotate:0,opacity:1}}
                  animate={{scale:[1,0.5,0],rotate:[0,-20,180],opacity:[1,0.5,0]}} transition={{duration:1.2}}>
                  <span className="text-[80px]" style={{filter:"grayscale(1) brightness(0.2)"}}>{chapter.enemy.emoji}</span>
                </motion.div>
              ) : (
                <span className="text-[80px]">{chapter.enemy.emoji}</span>
              )}
              {successLine > 0 && (
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:0.2}} className="text-5xl mt-2">
                  {chapterIdx === CHAPTERS.length-1 ? "🏆" : "✨"}
                </motion.div>
              )}
            </div>

            {/* Success speech bubbles */}
            {(() => {
              const line = chapter.successDialogue[successLine];
              return (
                <>
                  {/* Player bubble — left */}
                  <div className="absolute z-20" style={{bottom:270, left:"3%"}}>
                    <AnimatePresence mode="wait">
                      {line.speaker === "player" ? (
                        <SpeechBubble key={`sp-${successLine}`} text={line.text} accent="#22c55e" side="left" onNext={advanceSuccess}/>
                      ) : (
                        <motion.div key="spd" initial={{opacity:0}} animate={{opacity:0.18}}
                          className="px-3 py-2 rounded-2xl border border-white/10 bg-white/5 text-white/40 text-xs" style={{maxWidth:90}}>
                          ...
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Enemy bubble — right */}
                  <div className="absolute z-20 flex justify-end" style={{bottom:255, right:"3%"}}>
                    <AnimatePresence mode="wait">
                      {line.speaker === "enemy" ? (
                        <SpeechBubble key={`se-${successLine}`} text={line.text} accent="#22c55e" side="right" onNext={advanceSuccess}/>
                      ) : (
                        <motion.div key="sed" initial={{opacity:0}} animate={{opacity:0.18}}
                          className="px-3 py-2 rounded-2xl border border-white/10 bg-white/5 text-white/40 text-xs" style={{maxWidth:90}}>
                          ...
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              );
            })()}

            {/* Player character */}
            <motion.div className="absolute flex flex-col items-center gap-1" style={{bottom:130, left:"4%"}}
              animate={{y:[0,-4,0]}} transition={{repeat:Infinity,duration:3,ease:"easeInOut"}}>
              <PlayerCharacter accent="#22c55e"/>
              <span className="text-white/30 text-[10px] tracking-wider uppercase">You</span>
            </motion.div>

            {/* Advance hint */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <motion.div animate={{opacity:[0.3,0.7,0.3]}} transition={{repeat:Infinity,duration:1.5}}
                className="text-xs text-emerald-400/60">
                {successLine < chapter.successDialogue.length-1 ? "tap to continue" :
                  chapterIdx===CHAPTERS.length-1 ? "collect your victory →" : `chapter ${chapterIdx+2} →`}
              </motion.div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
