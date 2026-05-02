"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { RotateCcw, Zap, FileText, Lock } from "lucide-react";

const GAMES = [
  {
    href: "/play/flashcard",
    icon: "🃏",
    title: "Flashcard",
    description: "Klasik kart çevirme — biliyorum / bilmiyorum / zor. Spaced repetition sistemi.",
    color: "from-brand-500 to-brand-700",
    shadow: "shadow-brand-500/20",
    requiredWords: 1,
    badge: null,
  },
  {
    href: "/play/match",
    icon: "⚡",
    title: "Hızlı Eşleştirme",
    description: "İngilizce-Türkçe kartları eşleştir. Süreli oyun, combo bonusu!",
    color: "from-violet-500 to-violet-700",
    shadow: "shadow-violet-500/20",
    requiredWords: 4,
    badge: "Popüler",
  },
  {
    href: "/play/fill",
    icon: "📝",
    title: "Boşluk Doldurma",
    description: "Örnek cümlede boş bırakılan kelimeyi seç veya yaz.",
    color: "from-emerald-500 to-emerald-700",
    shadow: "shadow-emerald-500/20",
    requiredWords: 4,
    badge: null,
  },
  {
    href: "/play/story",
    icon: "📜",
    title: "Hikaye Modu",
    description: "Gölge Büyücüsü'nün esir aldığı kelimeleri kurtarmak için 5 bölümlük epik maceraya atıl.",
    color: "from-indigo-600 to-purple-700",
    shadow: "shadow-indigo-500/20",
    requiredWords: 10,
    badge: "Yeni ✨",
  },
  {
    href: "/play/boss",
    icon: "🐉",
    title: "Boss Battle",
    description: "Hafıza Ejderhası Mnemosux ile epik bir savaşa gir. Doğru cevapla hasar ver, yanlış cevap verirsen o sana saldırır!",
    color: "from-red-600 to-orange-700",
    shadow: "shadow-red-500/20",
    requiredWords: 20,
    badge: "Sert 💀",
  },
];

export default function PlayPage() {
  const words = useAppStore((s) => s.words);
  const getDueWords = useAppStore((s) => s.getDueWords);
  const gameSessions = useAppStore((s) => s.gameSessions);

  const dueWords = getDueWords();
  const totalPlayed = gameSessions.length;
  const bestScore = gameSessions.reduce((max, s) => Math.max(max, s.score), 0);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Oyunlar</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
          Öğrenmeyi eğlenceye dönüştür
        </p>
      </div>

      {/* Tekrar Hatırlatması */}
      {dueWords.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
          <div className="absolute top-1 right-3 text-5xl opacity-10">🔔</div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">{dueWords.length} kelime tekrar bekliyor!</p>
              <p className="text-white/70 text-sm">Bugünkü tekrarları yap, serinini koru</p>
            </div>
            <Link
              href="/play/flashcard"
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors flex-shrink-0"
            >
              Başla
            </Link>
          </div>
        </div>
      )}

      {/* İstatistik Özetleri */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-3 text-center">
          <p className="text-2xl font-black">{words.length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Kelime</p>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-3 text-center">
          <p className="text-2xl font-black">{totalPlayed}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Oyun</p>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-3 text-center">
          <p className="text-2xl font-black">{bestScore}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">En Yüksek</p>
        </div>
      </div>

      {/* Oyun Kartları */}
      <div className="space-y-4">
        {GAMES.map((game) => {
          const isLocked = words.length < game.requiredWords;
          return (
            <GameCard
              key={game.href}
              game={game}
              isLocked={isLocked}
              wordCount={words.length}
            />
          );
        })}
      </div>

    </div>
  );
}

function GameCard({
  game,
  isLocked,
  wordCount,
}: {
  game: typeof GAMES[0];
  isLocked: boolean;
  wordCount: number;
}) {
  if (isLocked) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5 opacity-60">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{game.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{game.title}</h3>
              <Lock className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{game.description}</p>
            <p className="text-xs text-brand-500 mt-1">
              {game.requiredWords - wordCount} kelime daha ekle
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={game.href}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 text-white",
        "bg-gradient-to-br shadow-lg transition-transform active:scale-95",
        `${game.color} ${game.shadow}`
      )}
    >
      <div className="absolute top-3 right-4 opacity-15 text-6xl">{game.icon}</div>
      <div className="relative flex items-center gap-4">
        <div className="text-4xl">{game.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{game.title}</h3>
            {game.badge && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {game.badge}
              </span>
            )}
          </div>
          <p className="text-white/80 text-sm mt-0.5">{game.description}</p>
        </div>
        <Zap className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
      </div>
    </Link>
  );
}
