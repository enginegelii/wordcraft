"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, Check, X, Star } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { SentenceEntry } from "@/lib/types";

function ScoreDot({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 65 ? "bg-yellow-500" : "bg-red-500";
  return <span className={cn("inline-block w-2.5 h-2.5 rounded-full", color)} />;
}

function EntryCard({ entry }: { entry: SentenceEntry }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 cursor-pointer hover:border-sky-300 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <ScoreDot score={entry.evaluation.score} />
          <span className="font-bold text-sky-600 dark:text-sky-400">{entry.word}</span>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">— {entry.translation}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "text-sm font-bold",
            entry.evaluation.score >= 80 ? "text-green-500" : entry.evaluation.score >= 65 ? "text-yellow-500" : "text-red-500"
          )}>{entry.evaluation.score}/100</span>
          {entry.evaluation.isCorrect ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
        </div>
      </div>

      {/* User sentence */}
      <p className="text-sm italic text-[hsl(var(--foreground))] mt-2">"{entry.userSentence}"</p>

      {/* Meta */}
      <div className="flex items-center gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span>{date}</span>
        {entry.xpEarned > 0 && (
          <span className="flex items-center gap-0.5 text-yellow-600">
            <Star className="w-3 h-3 fill-current" /> +{entry.xpEarned} XP
          </span>
        )}
        {entry.grammarTopic && (
          <span className="text-indigo-400 truncate max-w-[140px]">{entry.grammarTopic}</span>
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] space-y-3 animate-slide-up">
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Direktif</p>
            <p className="text-sm">{entry.directive}</p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Geri Bildirim</p>
            <p className="text-sm leading-relaxed">{entry.evaluation.feedback}</p>
          </div>
          {entry.evaluation.corrected && entry.evaluation.corrected !== entry.userSentence && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
              <p className="text-xs text-emerald-600 font-semibold mb-1">Düzeltilmiş Hali</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">"{entry.evaluation.corrected}"</p>
            </div>
          )}
          {entry.evaluation.alternatives && entry.evaluation.alternatives.length > 0 && (
            <div className="bg-[hsl(var(--secondary))] rounded-lg p-3">
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold mb-1 uppercase">Alternatifler</p>
              {entry.evaluation.alternatives.map((a, i) => (
                <p key={i} className="text-sm">• {a}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WritingJournalPage() {
  const sentenceEntries = useAppStore((s) => s.sentenceEntries);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "correct" | "wrong">("all");

  const filtered = sentenceEntries.filter((e) => {
    const matchSearch = !search || e.word.toLowerCase().includes(search.toLowerCase()) || e.userSentence.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "correct" && e.evaluation.isCorrect) || (filter === "wrong" && !e.evaluation.isCorrect);
    return matchSearch && matchFilter;
  });

  const avgScore = sentenceEntries.length > 0
    ? Math.round(sentenceEntries.reduce((s, e) => s + e.evaluation.score, 0) / sentenceEntries.length)
    : 0;
  const totalXP = sentenceEntries.reduce((s, e) => s + e.xpEarned, 0);
  const correctCount = sentenceEntries.filter((e) => e.evaluation.isCorrect).length;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/play" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-black">Cümle Günlüğüm ✍️</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{sentenceEntries.length} cümle yazıldı</p>
        </div>
        <Link href="/play/writing" className="ml-auto bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          + Yeni
        </Link>
      </div>

      {/* Stats */}
      {sentenceEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-sky-600">%{avgScore}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Ortalama</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-green-600">{correctCount}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Doğru</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-yellow-600">{totalXP}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Toplam XP</p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Kelime veya cümle ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:outline-none focus:border-sky-400"
          />
        </div>
        <div className="flex gap-1 bg-[hsl(var(--secondary))] rounded-xl p-1">
          {(["all", "correct", "wrong"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === f ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm" : "text-[hsl(var(--muted-foreground))]"
              )}
            >
              {f === "all" ? "Tümü" : f === "correct" ? "✓ Doğru" : "✗ Yanlış"}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-5xl">✍️</p>
          <p className="font-semibold text-[hsl(var(--muted-foreground))]">
            {sentenceEntries.length === 0 ? "Henüz cümle yazmadın" : "Sonuç bulunamadı"}
          </p>
          {sentenceEntries.length === 0 && (
            <Link href="/play/writing" className="inline-block bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold">
              İlk Cümleyi Yaz
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
        </div>
      )}
    </div>
  );
}
