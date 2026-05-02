"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { shuffle, playSound, triggerHaptic } from "@/lib/utils";
import type { Word } from "@/lib/types";
import confetti from "canvas-confetti";

// ─── DETERMINISTIC RAND (consistent between renders) ─────────────────────────
const sr = (seed: number) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

// ─── CHAPTER DATA ─────────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 1, title: "Kapının Sırrı", location: "Antik Tapınak • Giriş",
    enemy: { emoji: "🛡️", name: "Taş Bekçi", subtitle: "Tapınağın ilk muhafızı" },
    accent: "#6366f1", particles: "#818cf8",
    narrative: [
      "Yüzyıllardır aranılan tapınağın önündesindir. Bozkırda tek başına, yalnızca bilginle donanmış.",
      "Dev kapının üzerindeki kadim yazı titrek ışıkla parlıyor: «Girmek isteyenler bilgisini ispatlasın.»",
      "Kapıdan ağır bir ses yükseliyor. Taş Bekçi uyanıyor...",
    ],
    challengeText: "Bekçi gürbüz sesiyle soruyor:",
    successText: ["Bekçi yavaşça geride çekiliyor, senin gücüne boyun eğiyor.", "Kapı gıcırdayarak açılıyor. Tapınak seni içine çekiyor."],
  },
  {
    id: 2, title: "Gölge Sentinel", location: "Karanlık Koridor • Alt Katman",
    enemy: { emoji: "🗿", name: "Gölge Sentinel", subtitle: "Koridorun karanlık muhafızı" },
    accent: "#8b5cf6", particles: "#a78bfa",
    narrative: [
      "Taş duvarlar arasında ilerlerken hava ağırlaşıyor. Her adım yankılanıyor.",
      "Mor gözlü bir figür duvardan sıyrılarak önüne çıkıyor: Gölge Sentinel.",
      "\"Buradan geçmek istiyorsan bilginin bedelini öde!\" diye fısıldıyor, sesi her yerden geliyor.",
    ],
    challengeText: "Sentinel'in gözleri sana sabitleniyor:",
    successText: ["Sentinel bir çığlık atıp duman haline geliyor.", "Koridor açılıyor. Daha derinlere iniyorsun."],
  },
  {
    id: 3, title: "Uçurum Ruhu", location: "Kristal Köprü • Sonsuz Boşluk",
    enemy: { emoji: "🌀", name: "Uçurum Ruhu", subtitle: "Sonsuzluğun bekçisi" },
    accent: "#06b6d4", particles: "#67e8f9",
    narrative: [
      "Önünde sonsuz bir uçurum uzanıyor. Karanlığın dibinde hiçbir şey görünmüyor.",
      "İnce kristal köprünün ortasında saydam bir ruh süzülüyor, seni izliyor.",
      "Her adımda bir kelime soruyor. Yanlış adım at... düşüşün sonu olmaz.",
    ],
    challengeText: "Köprü sallantıya geçti! Hızlı cevapla:",
    successText: ["Ruh bir çığlık atarak dağılıyor.", "Köprü sakinleşiyor. Karşı kıyı seni bekliyor."],
  },
  {
    id: 4, title: "Gölge Büyücüsü", location: "Kara Kule • Zirve",
    enemy: { emoji: "🧙", name: "Gölge Büyücüsü", subtitle: "Kelimelerin hırsızı" },
    accent: "#a855f7", particles: "#d8b4fe",
    narrative: [
      "Kule'nin zirvesinde seni bekleyen figür yavaşça dönüyor. Gözleri alev gibi yanıyor.",
      "\"Sen... gerçekten buraya kadar geldin mi?!\" diye bağırıyor.",
      "\"Kelimeler BENİM gücüm. ONLARI ALAMAZSIN!\" Büyüsünü fırlatmaya hazırlanıyor.",
    ],
    challengeText: "Büyücü son büyüsünü fırlatıyor!",
    successText: ["Büyücü geride savruldu! \"İmkânsız... nasıl bu kadar bildin?!\"", "Karanlık dağılıyor. Kule aydınlanıyor. Son oda seni bekliyor."],
  },
  {
    id: 5, title: "Kadim Bekçi", location: "Hazine Odası • Son Oda",
    enemy: { emoji: "🔮", name: "Kadim Bekçi", subtitle: "Tapınağın kendisi" },
    accent: "#f59e0b", particles: "#fcd34d",
    narrative: [
      "Altın ışıkla dolup taşan son odadasın. Binlerce kelime etrafında dans ediyor.",
      "Kristal bir küre titreyerek açılıyor. Bir ses: \"Gerçekten bu gücü taşımaya layk mısın?\"",
      "Son sınav. Tapınağın kendisi seni test ediyor. Her şeyini ortaya koy.",
    ],
    challengeText: "Son sınav. Kelimeni kanıtla:",
    successText: ["Kelimeler sana doğru uçuşuyor, etrafında dans ediyor.", "Sen artık bir Kelime Ustasısın. Efsane yazıldı. 🌟"],
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
      {/* Left pillar */}
      <rect x="0" y="60" width="55" height="200" fill="#111827" rx="3"/>
      <rect x="0" y="50" width="70" height="18" fill="#1f2937" rx="2"/>
      <rect x="15" y="100" width="8" height="60" fill="#6366f120" rx="2"/>
      <rect x="28" y="110" width="8" height="50" fill="#6366f120" rx="2"/>
      {/* Right pillar */}
      <rect x="345" y="60" width="55" height="200" fill="#111827" rx="3"/>
      <rect x="330" y="50" width="70" height="18" fill="#1f2937" rx="2"/>
      <rect x="370" y="100" width="8" height="60" fill="#6366f120" rx="2"/>
      <rect x="357" y="110" width="8" height="50" fill="#6366f120" rx="2"/>
      {/* Gate glow */}
      <ellipse cx="200" cy="260" rx="160" ry="100" fill="url(#arch1)"/>
      {/* Arch outline */}
      <path d="M 70 260 Q 70 100 200 80 Q 330 100 330 260" fill="none" stroke="#6366f180" strokeWidth="2"/>
      {/* Runes */}
      {[90,130,170].map(y=><text key={y} x="30" y={y} fontSize="8" fill="#6366f160" fontFamily="monospace">᛫</text>)}
      {[90,130,170].map(y=><text key={y} x="360" y={y} fontSize="8" fill="#6366f160" fontFamily="monospace">᛫</text>)}
      {/* Torches */}
      <rect x="58" y="105" width="6" height="14" fill="#78350f" rx="1"/>
      <ellipse cx="61" cy="102" rx="5" ry="9" fill="#f97316" opacity="0.9"/>
      <ellipse cx="61" cy="99" rx="3" ry="6" fill="#fde68a" opacity="0.9"/>
      <rect x="336" y="105" width="6" height="14" fill="#78350f" rx="1"/>
      <ellipse cx="339" cy="102" rx="5" ry="9" fill="#f97316" opacity="0.9"/>
      <ellipse cx="339" cy="99" rx="3" ry="6" fill="#fde68a" opacity="0.9"/>
      {/* Ground */}
      <rect x="0" y="225" width="400" height="35" fill="#0a0f1e"/>
      {[0,50,100,150,200,250,300,350].map(x=><line key={x} x1={x} y1="225" x2={x+50} y2="260" stroke="#1e293b" strokeWidth="0.7"/>)}
    </svg>
  );
  if (id === 2) return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sg2" cx="50%" cy="50%"><stop offset="0%" stopColor="#2e1065"/><stop offset="100%" stopColor="#050508"/></radialGradient>
        <radialGradient id="mist2" cx="50%" cy="80%"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sg2)"/>
      {/* Corridor perspective lines */}
      {[-1,0,1,2,3].map(i=><line key={i} x1={0} y1={60+i*50} x2={400} y2={60+i*50} stroke="#1e1340" strokeWidth="0.5"/>)}
      {/* Left wall */}
      {[0,60,120,180,240,300,360].map(x=><line key={x} x1={x} y1={0} x2={200} y2={260} stroke="#1e1340" strokeWidth="0.5"/>)}
      {/* Right wall */}
      {[40,100,160,220,280,340,400].map(x=><line key={x} x1={x} y1={0} x2={200} y2={260} stroke="#1e1340" strokeWidth="0.3"/>)}
      {/* Wall blocks left */}
      {[0,80,160].map(y=><rect key={y} x="0" y={y} width="60" height="75" fill="#0d0820" stroke="#1e1340" strokeWidth="1"/>)}
      {/* Wall blocks right */}
      {[0,80,160].map(y=><rect key={y} x="340" y={y} width="60" height="75" fill="#0d0820" stroke="#1e1340" strokeWidth="1"/>)}
      {/* Glowing symbols on walls */}
      {[30,110,190].map(y=><text key={y} x="22" y={y+20} fontSize="14" fill="#8b5cf660" textAnchor="middle">✦</text>)}
      {[30,110,190].map(y=><text key={y} x="378" y={y+20} fontSize="14" fill="#8b5cf660" textAnchor="middle">✦</text>)}
      {/* Mist at floor */}
      <rect x="0" y="200" width="400" height="60" fill="url(#mist2)"/>
      {/* Purple torch glow */}
      <ellipse cx="30" cy="80" rx="25" ry="20" fill="#8b5cf6" opacity="0.15"/>
      <ellipse cx="370" cy="80" rx="25" ry="20" fill="#8b5cf6" opacity="0.15"/>
      {/* Vanishing point glow */}
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
      {/* Abyss - bottomless pit */}
      <rect x="0" y="150" width="400" height="110" fill="#000"/>
      {/* Depth lines in abyss */}
      {[0,1,2,3,4,5].map(i=><ellipse key={i} cx="200" cy={150+i*20} rx={180-i*20} ry={8} fill="none" stroke="#06b6d410" strokeWidth="1"/>)}
      {/* Crystal bridge segments */}
      {[0,1,2,3,4,5,6,7].map(i=>(
        <g key={i}>
          <rect x={30+i*48} y="140" width="40" height="14" fill="#0e7490" rx="3" opacity="0.8"/>
          <rect x={30+i*48} y="140" width="40" height="5" fill="#67e8f9" rx="2" opacity="0.6"/>
          {/* Gap */}
          <rect x={70+i*48} y="140" width="8" height="14" fill="transparent"/>
        </g>
      ))}
      {/* Bridge glow */}
      <rect x="28" y="148" width="344" height="2" fill="#06b6d4" opacity="0.5"/>
      {/* Floating crystal fragments */}
      {[80,160,240,320].map((x,i)=>(
        <g key={i}>
          <polygon points={`${x},${90+i*5} ${x+8},${100+i*5} ${x+4},${85+i*5}`} fill="#67e8f9" opacity="0.4"/>
        </g>
      ))}
      {/* Abyss glow from below */}
      <ellipse cx="200" cy="260" rx="200" ry="60" fill="url(#abyss)"/>
      {/* Fog/mist on sides */}
      <rect x="0" y="130" width="60" height="40" fill="#0a1929" opacity="0.8"/>
      <rect x="340" y="130" width="60" height="40" fill="#0a1929" opacity="0.8"/>
    </svg>
  );
  if (id === 4) return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sg4" cx="50%" cy="40%"><stop offset="0%" stopColor="#2d0a3e"/><stop offset="100%" stopColor="#07020e"/></radialGradient>
        <radialGradient id="sorm" cx="50%" cy="0%"><stop offset="0%" stopColor="#a855f7" stopOpacity="0.4"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sg4)"/>
      {/* Storm clouds */}
      {[[40,20,80,25],[120,10,100,30],[220,5,120,28],[320,15,80,22],[80,40,90,20],[260,35,100,25]].map(([x,y,w,h],i)=>(
        <ellipse key={i} cx={x} cy={y} rx={w} ry={h} fill="#1a0a2e" opacity="0.9"/>
      ))}
      {/* Lightning */}
      <polyline points="250,0 245,40 255,40 242,90" stroke="#a855f7" strokeWidth="1.5" fill="none" opacity="0.7"/>
      <polyline points="150,0 148,35 158,35 145,80" stroke="#c084fc" strokeWidth="1" fill="none" opacity="0.5"/>
      {/* Storm glow */}
      <rect x="0" y="0" width="400" height="80" fill="url(#sorm)"/>
      {/* Tower battlements */}
      {[0,40,80,120,160,200,240,280,320,360].map(x=><rect key={x} x={x} y="185" width="30" height="20" fill="#1a0a2e" rx="1"/>)}
      <rect x="0" y="200" width="400" height="60" fill="#120720"/>
      {/* Tower windows glowing */}
      {[60,180,320].map(x=><rect key={x} x={x} y="210" width="20" height="28" fill="#7c3aed" opacity="0.5" rx="2"/>)}
      {[60,180,320].map(x=><rect key={x} x={x+4} y="214" width="12" height="20" fill="#a855f7" opacity="0.7" rx="1"/>)}
      {Array.from({length:20},(_,i)=><circle key={i} cx={sr(i*4)*380+10} cy={sr(i*8)*160+20} r={sr(i*6)*1.2+0.3} fill="#d8b4fe" opacity={sr(i*3)*0.4+0.1}/>)}
      {/* Purple energy beams */}
      <line x1="200" y1="0" x2="200" y2="200" stroke="#a855f7" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  );
  // Chapter 5 - Treasure room
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sg5" cx="50%" cy="50%"><stop offset="0%" stopColor="#3d2800"/><stop offset="100%" stopColor="#0d0800"/></radialGradient>
        <radialGradient id="light5" cx="50%" cy="0%"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
        <radialGradient id="floor5" cx="50%" cy="100%"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3"/><stop offset="100%" stopColor="transparent" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sg5)"/>
      <rect x="0" y="0" width="400" height="120" fill="url(#light5)"/>
      {/* Golden pillars */}
      {[30,130,240,340].map((x,i)=>(
        <g key={i}>
          <rect x={x} y="30" width="22" height="200" fill="#92400e" rx="2"/>
          <rect x={x-4} y="25" width="30" height="14" fill="#b45309" rx="2"/>
          <rect x={x-4} y="216" width="30" height="14" fill="#b45309" rx="2"/>
          <line x1={x+11} y1="30" x2={x+11} y2="230" stroke="#f59e0b" strokeWidth="1" opacity="0.4"/>
        </g>
      ))}
      {/* Floating orbs */}
      {[70,150,200,270,330].map((x,i)=>(
        <ellipse key={i} cx={x} cy={60+i*10} rx={8+i*2} ry={8+i*2} fill="#f59e0b" opacity="0.25"/>
      ))}
      {/* Light beams from ceiling */}
      {[80,160,200,240,320].map((x,i)=>(
        <polygon key={i} points={`${x-5},0 ${x+5},0 ${x+30},260 ${x-30},260`} fill="#f59e0b" opacity={0.04+i*0.01}/>
      ))}
      {/* Floor reflection */}
      <rect x="0" y="200" width="400" height="60" fill="url(#floor5)"/>
      {/* Treasure chests */}
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

// ─── TYPEWRITER DIALOGUE BOX ──────────────────────────────────────────────────
function DialogueBox({ text, accent, speakerName, onNext, isLast }: {
  text: string; accent: string; speakerName: string; onNext: () => void; isLast: boolean;
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
    }, 24);
    return () => clearInterval(ref.current!);
  }, [text]);

  const skip = () => { clearInterval(ref.current!); setDisplayed(text); setDone(true); };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      {/* Speaker name plate */}
      <div className="ml-4 mb-0 inline-block">
        <div className="px-4 py-1.5 rounded-t-xl text-sm font-bold text-white" style={{ backgroundColor: accent }}>
          {speakerName}
        </div>
      </div>
      {/* Dialogue box */}
      <div
        className="mx-0 border-t-2 cursor-pointer select-none"
        style={{ background: "rgba(5,5,15,0.92)", borderColor: accent + "80", backdropFilter: "blur(8px)" }}
        onClick={!done ? skip : onNext}
      >
        <div className="px-5 py-4 min-h-[90px] flex flex-col justify-between">
          <p className="text-sm leading-relaxed text-white/90 font-medium">
            {displayed}
            {!done && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.55 }} className="ml-0.5 text-white/60">▌</motion.span>}
          </p>
          {done && (
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }}
              className="self-end text-xs font-semibold mt-2 flex items-center gap-1"
              style={{ color: accent }}>
              {isLast ? "⚔️ SAVAŞA GİR" : "DEVAM ▶"}
            </motion.div>
          )}
        </div>
      </div>
    </div>
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
  const [flash, setFlash] = useState<"green"|"red"|null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [wordsUsed, setWordsUsed] = useState<string[]>([]);
  const [enemyDead, setEnemyDead] = useState(false);

  const poolRef = useRef<Word[]>([]);
  const idxRef = useRef(0);
  const t0Ref = useRef(0);
  const chapter = CHAPTERS[chapterIdx];

  const startStory = () => {
    const w = useAppStore.getState().words;
    poolRef.current = shuffle(w); idxRef.current = 0; t0Ref.current = Date.now();
    setChapterIdx(0); setLineIdx(0); setSuccessLine(0);
    setMistakes(0); setWordsUsed([]); setEnemyDead(false);
    setPhase("chapter-intro");
  };

  const nextWord = () => { const w = poolRef.current[idxRef.current % poolRef.current.length]; idxRef.current++; return w; };

  const advanceLine = () => {
    if (lineIdx < chapter.narrative.length - 1) { setLineIdx(l => l + 1); }
    else {
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
    if (successLine < chapter.successText.length - 1) { setSuccessLine(l => l + 1); }
    else if (chapterIdx === CHAPTERS.length - 1) {
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
        <h1 className="text-3xl font-black mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Unutulan Kelimelerin Tapınağı</h1>
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm leading-relaxed">
          5 bölümlük epik macera. Her bölümde farklı bir düşman. Kelime bilginle onları alt et.
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
          {storeWords.length < 2 ? "En az 2 kelime gerekli" : "⚔️  Maceraya Başla"}
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
          <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Efsane Tamamlandı!</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">Tapınağın tüm sırlarını çözdün. Kelimeler özgür!</p>
          <div className="flex justify-center gap-1 mt-3 text-3xl">
            {Array.from({length:3}).map((_,i)=>(
              <motion.span key={i} initial={{scale:0}} animate={{scale:1}} transition={{delay:0.3+i*0.2,type:"spring"}}>{i<stars?"⭐":"☆"}</motion.span>
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
            {/* Big bg number */}
            <motion.div initial={{scale:4,opacity:0}} animate={{scale:1,opacity:0.05}} transition={{duration:1}}
              className="absolute inset-0 flex items-center justify-center text-[200px] font-black select-none overflow-hidden">
              {chapterIdx+1}
            </motion.div>
            {/* Enemy */}
            <motion.div initial={{y:50,scale:0.3,opacity:0}} animate={{y:0,scale:1,opacity:1}} transition={{type:"spring",delay:0.2,damping:10}}
              className="text-[100px] mb-6 relative" style={{filter:`drop-shadow(0 0 40px ${chapter.accent}90)`}}>
              {chapter.enemy.emoji}
            </motion.div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}} className="text-center">
              <p className="text-xs uppercase tracking-widest mb-1 font-medium" style={{color:chapter.accent}}>
                Bölüm {chapterIdx+1} · {chapter.location}
              </p>
              <h2 className="text-3xl font-black mb-1">{chapter.title}</h2>
              <p className="text-sm text-white/40">{chapter.enemy.subtitle}</p>
            </motion.div>
            <motion.p initial={{opacity:0}} animate={{opacity:[0,0.5,0]}} transition={{delay:1.4,repeat:Infinity,duration:1.6}}
              className="text-white/30 text-xs absolute bottom-8">Devam etmek için dokun</motion.p>
          </motion.div>
        )}

        {/* ── NARRATIVE (full screen scene + dialogue box) ── */}
        {phase==="narrative" && (
          <motion.div key={`n${chapterIdx}${lineIdx}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="relative z-10" style={{height:"calc(100vh - 60px)"}}>
            {/* Enemy character in scene */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <motion.div
                animate={{y:[0,-8,0]}} transition={{repeat:Infinity,duration:2.6,ease:"easeInOut"}}
                className="text-[90px]" style={{filter:`drop-shadow(0 0 25px ${chapter.accent}70)`}}>
                {chapter.enemy.emoji}
              </motion.div>
            </div>

            {/* JRPG Dialogue box at bottom */}
            <DialogueBox
              text={chapter.narrative[lineIdx]}
              accent={chapter.accent}
              speakerName={chapter.enemy.name}
              onNext={advanceLine}
              isLast={lineIdx===chapter.narrative.length-1}
            />
          </motion.div>
        )}

        {/* ── PRE-CHALLENGE ── */}
        {phase==="pre-challenge" && (
          <motion.div key="pre" className="relative z-10 flex flex-col items-center justify-center" style={{height:"calc(100vh - 60px)"}}>
            <motion.div
              animate={{scale:[1,1.12,1,1.2,1],filter:[`brightness(1)`,`brightness(2.5) drop-shadow(0 0 35px ${chapter.accent})`,`brightness(1)`,`brightness(3) drop-shadow(0 0 55px ${chapter.accent})`,`brightness(1)`]}}
              transition={{duration:2,ease:"easeInOut"}} className="text-[100px] mb-8">
              {chapter.enemy.emoji}
            </motion.div>
            {/* Charging ring particles */}
            {[...Array(8)].map((_,i)=>(
              <motion.div key={i} className="absolute rounded-full" style={{width:8,height:8,backgroundColor:chapter.accent}}
                initial={{x:0,y:0,opacity:0,scale:0}}
                animate={{x:Math.cos((i/8)*Math.PI*2)*90,y:Math.sin((i/8)*Math.PI*2)*90,opacity:[0,1,0],scale:[0,1.8,0]}}
                transition={{repeat:Infinity,duration:0.85,delay:i*0.1}}/>
            ))}
            <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
              className="text-base font-bold tracking-wide" style={{color:chapter.accent}}>
              ⚡ {chapter.enemy.name} saldırıya hazırlanıyor...
            </motion.p>
          </motion.div>
        )}

        {/* ── CHALLENGE ── */}
        {phase==="challenge" && challenge && (
          <motion.div key="ch" initial={{opacity:0}} animate={{opacity:1}} className="relative z-10 flex flex-col" style={{height:"calc(100vh - 60px)"}}>
            {/* Enemy in battle stance - top half */}
            <div className="flex flex-col items-center pt-4 pb-2">
              <div className="relative">
                <motion.div
                  animate={enemyHit?{x:[-18,18,-12,12,0],scale:[1,0.8,1]}:{y:[0,-5,0]}}
                  transition={enemyHit?{duration:0.45}:{repeat:Infinity,duration:2,ease:"easeInOut"}}
                  className="text-[80px]"
                  style={{filter:answered&&isCorrect?"grayscale(1) brightness(0.2)":`drop-shadow(0 0 24px ${chapter.accent}90)`}}>
                  {chapter.enemy.emoji}
                </motion.div>
                <SlashEffect show={showSlash}/>
              </div>
              {/* Enemy HP bar */}
              <div className="w-40 h-2.5 bg-white/10 rounded-full overflow-hidden mt-2">
                <motion.div className="h-full rounded-full" style={{backgroundColor:chapter.accent}}
                  animate={{width:answered&&isCorrect?"0%":"100%"}} transition={{duration:0.8}}/>
              </div>
            </div>

            {/* Question card */}
            <div className="px-4 flex-1 flex flex-col justify-center gap-3">
              <motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring"}}
                className="rounded-2xl border p-5"
                style={{borderColor:chapter.accent+"45",background:`linear-gradient(135deg,${chapter.accent}18,${chapter.accent}08)`,boxShadow:`0 0 28px ${chapter.accent}25`}}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{chapter.challengeText}</p>
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
                  Doğru: <span className="text-green-400 font-semibold">{challenge.word.translation}</span>
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── CHAPTER SUCCESS ── */}
        {phase==="chapter-success" && (
          <motion.div key={`s${chapterIdx}${successLine}`} initial={{opacity:0}} animate={{opacity:1}}
            className="relative z-10" style={{height:"calc(100vh - 60px)"}}>
            {/* Defeated enemy */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center">
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
            {/* Success dialogue */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="ml-4 mb-0 inline-block">
                <div className="px-4 py-1.5 rounded-t-xl text-sm font-bold text-white bg-emerald-600">Anlatıcı</div>
              </div>
              <div className="border-t-2 border-emerald-500/50 cursor-pointer" style={{background:"rgba(5,5,15,0.92)",backdropFilter:"blur(8px)"}}
                onClick={advanceSuccess}>
                <div className="px-5 py-4 min-h-[90px] flex flex-col justify-between">
                  <p className="text-sm leading-relaxed text-white/90 font-medium italic">{chapter.successText[successLine]}</p>
                  <motion.div animate={{opacity:[0.4,1,0.4]}} transition={{repeat:Infinity,duration:1}}
                    className="self-end text-xs font-semibold mt-2 text-emerald-400">
                    {successLine < chapter.successText.length-1 ? "DEVAM ▶" : chapterIdx===CHAPTERS.length-1 ? "ZAFERİ TOPLA 🏆" : `BÖLÜM ${chapterIdx+2} →`}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
