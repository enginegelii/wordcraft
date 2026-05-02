"use client";

import { useState, useMemo } from "react";
import { Search, Volume2, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { WordStatus } from "@/lib/types";

const STATUS_LABELS: Record<WordStatus, string> = {
  new: "Yeni",
  learning: "Öğreniliyor",
  review: "Tekrar",
  mastered: "Öğrenildi",
};

const CONTEXT_TAG_OPTIONS = [
  "tümü", "günlük", "iş", "akademik", "argo", "teknik", "edebi", "informal", "genel",
] as const;

export default function WordsPage() {
  const words = useAppStore((s) => s.words);
  const deleteWord = useAppStore((s) => s.deleteWord);
  const reviews = useAppStore((s) => s.reviews);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WordStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState("tümü");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedExamples, setExpandedExamples] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return words.filter((w) => {
      const matchSearch =
        !search ||
        w.word.toLowerCase().includes(search.toLowerCase()) ||
        w.translation.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || w.status === statusFilter;
      const matchTag = tagFilter === "tümü" || w.contextTag === tagFilter;
      return matchSearch && matchStatus && matchTag;
    });
  }, [words, search, statusFilter, tagFilter]);

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US";
      // Mevcut sesler arasından İngilizce bir ses seç
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(
        (v) => v.lang.startsWith("en") && !v.lang.startsWith("en-IN")
      );
      if (enVoice) utt.voice = enVoice;
      utt.rate = 0.9;
      window.speechSynthesis.speak(utt);
    }
  };

  const stats = {
    all: words.length,
    new: words.filter((w) => w.status === "new").length,
    learning: words.filter((w) => w.status === "learning").length,
    review: words.filter((w) => w.status === "review").length,
    mastered: words.filter((w) => w.status === "mastered").length,
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelime Defterim</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-0.5">
            {words.length} kelime
          </p>
        </div>
        <Link
          href="/add"
          className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Ekle
        </Link>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kelime veya anlam ara..."
          className={cn(
            "w-full pl-11 pr-4 py-3 rounded-xl border",
            "bg-[hsl(var(--card))] border-[hsl(var(--border))]",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          )}
        />
      </div>

      {/* Durum filtresi */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(["all", "new", "learning", "review", "mastered"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              statusFilter === s
                ? "bg-brand-500 text-white"
                : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            {s === "all" ? "Tümü" : STATUS_LABELS[s]}{" "}
            <span className="opacity-70">({stats[s]})</span>
          </button>
        ))}
      </div>

      {/* Boş durum */}
      {words.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">📖</div>
          <h3 className="text-lg font-bold">Henüz kelime yok</h3>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            İlk kelimeni ekleyerek başla!
          </p>
          <Link href="/add" className="inline-block bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-semibold">
            Kelime Ekle
          </Link>
        </div>
      )}

      {words.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10 text-[hsl(var(--muted-foreground))]">
          <p>Arama sonucu bulunamadı</p>
        </div>
      )}

      {/* Kelime listesi */}
      <div className="space-y-3">
        {filtered.map((word) => {
          const review = reviews[word.id];
          return (
            <div
              key={word.id}
              className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{word.word}</h3>
                      <button
                        onClick={() => speak(word.word)}
                        className="p-1 rounded-lg hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    {word.ipa && (
                      <p className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{word.ipa}</p>
                    )}
                    <p className="text-brand-600 dark:text-brand-400 font-semibold mt-0.5">
                      {word.translation}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {word.partOfSpeech}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium", `badge-${word.status}`)}>
                      {STATUS_LABELS[word.status]}
                    </span>
                    <span className="text-xs bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] px-2 py-0.5 rounded-full">
                      {word.contextTag}
                    </span>
                  </div>
                </div>

                {/* Örnek cümleler */}
                {word.examples.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] space-y-2">
                    {/* Her zaman ilk cümle görünür */}
                    <div>
                      <p className="text-sm text-[hsl(var(--foreground))] italic">
                        &ldquo;{word.examples[0].en}&rdquo;
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {word.examples[0].tr}
                      </p>
                    </div>
                    {/* Geri kalan cümleler — açılır/kapanır */}
                    {expandedExamples.has(word.id) && word.examples.slice(1).map((ex, i) => (
                      <div key={i} className="pl-3 border-l-2 border-[hsl(var(--border))]">
                        <p className="text-sm text-[hsl(var(--foreground))] italic">
                          &ldquo;{ex.en}&rdquo;
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          {ex.tr}
                        </p>
                      </div>
                    ))}
                    {/* Aç/Kapat butonu — birden fazla cümle varsa */}
                    {word.examples.length > 1 && (
                      <button
                        onClick={() => setExpandedExamples(prev => {
                          const next = new Set(prev);
                          next.has(word.id) ? next.delete(word.id) : next.add(word.id);
                          return next;
                        })}
                        className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 mt-1 font-medium"
                      >
                        {expandedExamples.has(word.id) ? (
                          <><ChevronUp className="w-3 h-3" /> Gizle</>
                        ) : (
                          <><ChevronDown className="w-3 h-3" /> +{word.examples.length - 1} cümle daha</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Eş/Zıt anlamlılar */}
                {(word.synonyms.length > 0 || word.antonyms.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {word.synonyms.slice(0, 2).map((s) => (
                      <span key={s} className="text-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                        ≈ {s}
                      </span>
                    ))}
                    {word.antonyms.slice(0, 1).map((s) => (
                      <span key={s} className="text-xs bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                        ≠ {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sonraki tekrar */}
                {review && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                    Sonraki tekrar: {formatRelativeDate(review.nextReviewDate)}
                  </p>
                )}
              </div>

              {/* Sil butonu */}
              <div className="px-4 py-2 bg-[hsl(var(--secondary))]/30 border-t border-[hsl(var(--border))] flex justify-end">
                {confirmDelete === word.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">Emin misin?</span>
                    <button
                      onClick={() => {
                        deleteWord(word.id);
                        setConfirmDelete(null);
                      }}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg"
                    >
                      Sil
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs bg-[hsl(var(--secondary))] px-3 py-1 rounded-lg"
                    >
                      İptal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(word.id)}
                    className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Sil
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
