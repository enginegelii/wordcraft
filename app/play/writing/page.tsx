"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Check, X, Star, Trophy, Lightbulb, RefreshCw } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn, playSound, triggerHaptic } from "@/lib/utils";
import { generateId } from "@/lib/utils";
import type { Word, SentenceEntry, SentenceEvaluation } from "@/lib/types";
import { GRAMMAR_TOPICS } from "@/lib/grammar-data";

// ─── Grammar topic → directive mapping ───────────────────────────────────────
const TOPIC_DIRECTIVES: Record<string, string> = {
  "there-was-were":        "There was / There were yapısını kullan",
  "regular-irregular-verbs": "Past Simple (V2) formunda kullan",
  "past-continuous":       "Past Continuous (was/were + V-ing) kullan",
  "present-perfect":       "Present Perfect (have/has + V3) kullan",
  "comparatives":          "Karşılaştırma yapısı (more... than / -er than) kullan",
  "adverbs":               "Bir zarf (adverb) ile birlikte kullan",
  "past-perfect":          "Past Perfect (had + V3) kullan",
  "conditionals-0-1":      "1. Tip Koşul Cümlesi (If + present, will) kullan",
  "conditionals-2":        "2. Tip Koşul Cümlesi (If + past, would) kullan",
  "passive-voice":         "Pasif yapı (is/was + V3) kullan",
  "gerunds-infinitives":   "Gerund (-ing) veya Infinitive (to + V) kullan",
  "relative-clauses":      "Relative Clause (who/which/that) ile kullan",
  "present-perfect-cont":  "Present Perfect Continuous (have been + V-ing) kullan",
  "wish-if-only":          "Wish / If only yapısını kullan",
  "noun-clauses":          "Noun Clause (that/what/whether) ile kullan",
  "contrast-conjunctions": "Contrast bağlacı (however/although/but) ile kullan",
  "future-continuous":     "Future Continuous (will be + V-ing) kullan",
  "passive-all-tenses":    "Herhangi bir zamanda Pasif yapı kullan",
  "causative":             "Causative (have/get something done) kullan",
  "phrasal-verbs":         "Bir phrasal verb içerecek şekilde kullan",
};

const FALLBACK_DIRECTIVES = [
  "Doğal ve anlamlı bir cümle yaz",
  "Bu kelimeyi bir hikaye cümlesinde kullan",
  "Günlük hayattan bir örnek cümle yaz",
  "Kelimenin anlamını ortaya çıkaran bir cümle yaz",
];

function getDirective(word: Word, studiedTopicIds: string[]): { directive: string; grammarTopic?: string } {
  if (studiedTopicIds.length === 0) {
    const dir = FALLBACK_DIRECTIVES[Math.floor(Math.random() * FALLBACK_DIRECTIVES.length)];
    return { directive: `"${word.word}" kelimesini kullanarak bir cümle yaz. ${dir}.` };
  }
  // Try to find a topic with a directive
  const shuffled = [...studiedTopicIds].sort(() => Math.random() - 0.5);
  for (const topicId of shuffled) {
    if (TOPIC_DIRECTIVES[topicId]) {
      return {
        directive: `"${word.word}" kelimesini kullanarak bir cümle yaz. ${TOPIC_DIRECTIVES[topicId]}.`,
        grammarTopic: TOPIC_DIRECTIVES[topicId],
      };
    }
  }
  const dir = FALLBACK_DIRECTIVES[Math.floor(Math.random() * FALLBACK_DIRECTIVES.length)];
  return { directive: `"${word.word}" kelimesini kullanarak bir cümle yaz. ${dir}.` };
}

// ─── Score display ────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "from-green-500 to-emerald-600"
    : score >= 65 ? "from-yellow-500 to-amber-600"
    : "from-red-500 to-rose-600";
  return (
    <div className={cn("w-20 h-20 rounded-full bg-gradient-to-br flex flex-col items-center justify-center shadow-lg", color)}>
      <span className="text-2xl font-black text-white">{score}</span>
      <span className="text-xs text-white/80">/ 100</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const SESSION_SIZE = 5;

type Phase = "ready" | "writing" | "evaluating" | "result" | "finished";

export default function WritingPage() {
  const words = useAppStore((s) => s.words);
  const grammar = useAppStore((s) => s.grammar);
  const addXP = useAppStore((s) => s.addXP);
  const addSentenceEntry = useAppStore((s) => s.addSentenceEntry);
  const grammarLevel = grammar.level;

  const [phase, setPhase] = useState<Phase>("ready");
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [userSentence, setUserSentence] = useState("");
  const [evaluation, setEvaluation] = useState<SentenceEvaluation | null>(null);
  const [sessionEntries, setSessionEntries] = useState<SentenceEntry[]>([]);
  const [totalXP, setTotalXP] = useState(0);

  // Studied grammar topics
  const studiedTopicIds = useMemo(() => {
    return Object.entries(grammar.topicProgress)
      .filter(([, p]) => p.studied || p.quizCompleted)
      .map(([id]) => id);
  }, [grammar.topicProgress]);

  // Current word + directive
  const currentWord = sessionWords[index];
  const currentDirective = useMemo(() => {
    if (!currentWord) return { directive: "", grammarTopic: undefined };
    return getDirective(currentWord, studiedTopicIds);
  }, [currentWord, studiedTopicIds]);

  const startSession = useCallback(() => {
    // Her statü grubunu kendi içinde shuffle et, sonra öncelik sırasıyla birleştir
    const groups: Record<string, typeof words> = { learning: [], review: [], new: [], mastered: [] };
    words.forEach((w) => { if (groups[w.status]) groups[w.status].push(w); });
    // Her grubu rastgele karıştır
    Object.values(groups).forEach((g) => g.sort(() => Math.random() - 0.5));
    const prioritized = (["learning", "review", "new", "mastered"] as const).flatMap((s) => groups[s]);
    const selected = prioritized.slice(0, SESSION_SIZE);
    if (selected.length === 0) return;
    setSessionWords(selected);
    setIndex(0);
    setUserSentence("");
    setEvaluation(null);
    setSessionEntries([]);
    setTotalXP(0);
    setPhase("writing");
  }, [words]);

  const handleEvaluate = useCallback(async () => {
    if (!currentWord || !userSentence.trim()) return;
    setPhase("evaluating");
    try {
      const res = await fetch("/api/evaluate-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: currentWord.word,
          translation: currentWord.translation,
          partOfSpeech: currentWord.partOfSpeech,
          directive: currentDirective.directive,
          grammarTopic: currentDirective.grammarTopic,
          userSentence: userSentence.trim(),
          grammarLevel,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data: SentenceEvaluation = await res.json();
      setEvaluation(data);
      setPhase("result");
      if (data.isCorrect) { playSound("correct"); triggerHaptic("light"); }
      else { playSound("wrong"); triggerHaptic("medium"); }
    } catch {
      setEvaluation({
        score: 0, isCorrect: false,
        feedback: "Değerlendirme yapılamadı. İnternet bağlantınızı kontrol edin.",
        corrected: userSentence,
        alternatives: [],
      });
      setPhase("result");
    }
  }, [currentWord, userSentence, currentDirective, grammarLevel]);

  const handleNext = useCallback(() => {
    if (!evaluation || !currentWord) return;

    // Calculate XP: score/10, min 2 if attempted
    const xp = Math.max(2, Math.round(evaluation.score / 10));
    addXP(xp);
    setTotalXP((t) => t + xp);

    const entry: SentenceEntry = {
      id: generateId(),
      wordId: currentWord.id,
      word: currentWord.word,
      translation: currentWord.translation,
      directive: currentDirective.directive,
      grammarTopic: currentDirective.grammarTopic,
      userSentence: userSentence.trim(),
      evaluation,
      xpEarned: xp,
      createdAt: new Date().toISOString(),
    };
    addSentenceEntry(entry);
    setSessionEntries((prev) => [...prev, entry]);

    if (index >= sessionWords.length - 1) {
      setPhase("finished");
    } else {
      setIndex((i) => i + 1);
      setUserSentence("");
      setEvaluation(null);
      setPhase("writing");
    }
  }, [evaluation, currentWord, currentDirective, userSentence, index, sessionWords.length, addXP, addSentenceEntry]);

  const avgScore = sessionEntries.length > 0
    ? Math.round(sessionEntries.reduce((s, e) => s + e.evaluation.score, 0) / sessionEntries.length)
    : 0;

  // ── READY ──────────────────────────────────────────────────────────────────
  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="text-6xl">✍️</div>
        <div>
          <h2 className="text-2xl font-black">Cümle Yaz</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 max-w-sm">
            Öğrendiğin kelimeleri cümle içinde kullan. Her kelime için bir direktif verilir,
            Claude cümleni değerlendirir ve geri bildirim verir.
          </p>
        </div>
        <div className="bg-[hsl(var(--secondary))] rounded-2xl p-4 text-sm space-y-2 text-left w-full max-w-xs">
          <p>✍️ <strong>{SESSION_SIZE} kelime</strong> için cümle yaz</p>
          <p>🎯 Her cümleye <strong>direktif + gramer hedefi</strong> verilir</p>
          <p>🤖 <strong>Claude</strong> cümleni değerlendirir</p>
          <p>⭐ Skora göre <strong>XP</strong> kazan</p>
          {studiedTopicIds.length > 0 && (
            <p className="text-indigo-500 font-medium">🧠 {studiedTopicIds.length} gramer konun entegre edildi</p>
          )}
        </div>
        <button
          onClick={startSession}
          disabled={words.length === 0}
          className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-sky-500/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {words.length === 0 ? "Önce kelime ekle" : "Başla"}
        </button>
        <Link href="/play" className="text-[hsl(var(--muted-foreground))] text-sm">← Geri Dön</Link>
      </div>
    );
  }

  // ── FINISHED ───────────────────────────────────────────────────────────────
  if (phase === "finished") {
    const perfect = sessionEntries.filter((e) => e.evaluation.score >= 80).length;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 animate-bounce-in">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black">Harika iş! ✍️</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">{sessionWords.length} cümle tamamlandı</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-sky-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">%{avgScore}</p>
            <p className="text-sm text-sky-100">Ortalama</p>
          </div>
          <div className="bg-yellow-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">+{totalXP}</p>
            <p className="text-sm text-yellow-100">XP Kazandın</p>
          </div>
          <div className="bg-green-500 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-white">{perfect}/{sessionWords.length}</p>
            <p className="text-sm text-green-100">Mükemmel</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={startSession} className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Tekrar
          </button>
          <Link href="/writing-journal" className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-5 py-3 rounded-xl font-semibold text-sm">
            Günlüğüm →
          </Link>
          <Link href="/play" className="bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm">
            Oyunlar
          </Link>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  // ── WRITING / EVALUATING / RESULT ──────────────────────────────────────────
  const progress = ((index + 1) / sessionWords.length) * 100;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setPhase("ready")} className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
          <ChevronLeft className="w-5 h-5" /> Çık
        </button>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">{index + 1} / {sessionWords.length}</span>
        <div className="flex items-center gap-1 font-bold text-yellow-600">
          <Star className="w-5 h-5 fill-current" /> {totalXP} XP
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[hsl(var(--secondary))] rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Word Card */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-700 rounded-2xl p-5 mb-4 text-white shadow-lg shadow-sky-500/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{currentWord.partOfSpeech}</p>
            <h2 className="text-3xl font-black">{currentWord.word}</h2>
            <p className="text-white/80 mt-1">{currentWord.translation}</p>
          </div>
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-full bg-white/20",
            currentWord.status === "mastered" ? "text-green-300" : currentWord.status === "learning" ? "text-yellow-300" : "text-white/80"
          )}>
            {currentWord.status === "mastered" ? "Öğrenildi" : currentWord.status === "learning" ? "Öğreniliyor" : currentWord.status === "review" ? "Tekrar" : "Yeni"}
          </span>
        </div>
        {currentWord.examples.length > 0 && (
          <p className="text-white/60 text-xs mt-3 italic">Örnek: {currentWord.examples[0].en}</p>
        )}
      </div>

      {/* Directive */}
      <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-4">
        <Lightbulb className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-indigo-400 uppercase tracking-wider mb-0.5">Direktif</p>
          <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{currentDirective.directive}</p>
        </div>
      </div>

      {/* Text Input */}
      {phase === "writing" && (
        <>
          <textarea
            value={userSentence}
            onChange={(e) => setUserSentence(e.target.value)}
            placeholder="Cümlenizi buraya yazın..."
            rows={3}
            className="w-full rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-base focus:outline-none focus:border-sky-400 resize-none transition-colors mb-4"
            autoFocus
          />
          <button
            onClick={handleEvaluate}
            disabled={userSentence.trim().length < 3}
            className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-sky-500/20 active:scale-95 transition-transform disabled:opacity-40"
          >
            Değerlendir 🤖
          </button>
        </>
      )}

      {/* Evaluating */}
      {phase === "evaluating" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
          <p className="font-semibold text-[hsl(var(--muted-foreground))]">Claude cümleni değerlendiriyor...</p>
        </div>
      )}

      {/* Result */}
      {phase === "result" && evaluation && (
        <div className="space-y-4 animate-slide-up">
          {/* User sentence */}
          <div className={cn(
            "rounded-xl border-2 p-4",
            evaluation.isCorrect
              ? "border-green-400 bg-green-50 dark:bg-green-950/20"
              : "border-red-400 bg-red-50 dark:bg-red-950/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {evaluation.isCorrect
                ? <Check className="w-5 h-5 text-green-500" />
                : <X className="w-5 h-5 text-red-500" />
              }
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase">Senin cümlен</p>
            </div>
            <p className="font-medium italic">"{userSentence}"</p>
          </div>

          {/* Score + feedback */}
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4">
            <div className="flex items-start gap-4">
              <ScoreBadge score={evaluation.score} />
              <div className="flex-1">
                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">Geri Bildirim</p>
                <p className="text-sm leading-relaxed">{evaluation.feedback}</p>
              </div>
            </div>
          </div>

          {/* Corrected */}
          {evaluation.corrected && evaluation.corrected !== userSentence && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-700 rounded-xl p-4">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 font-semibold">Düzeltilmiş Hali</p>
              <p className="font-medium text-emerald-800 dark:text-emerald-300">"{evaluation.corrected}"</p>
            </div>
          )}

          {/* Alternatives */}
          {evaluation.alternatives && evaluation.alternatives.length > 0 && (
            <div className="bg-[hsl(var(--secondary))] rounded-xl p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 font-semibold">Alternatif Cümleler</p>
              <div className="space-y-2">
                {evaluation.alternatives.map((alt, i) => (
                  <p key={i} className="text-sm text-[hsl(var(--foreground))]">• {alt}</p>
                ))}
              </div>
            </div>
          )}

          {/* XP preview */}
          <div className="text-center text-sm text-yellow-600 font-semibold">
            Bu cümleden +{Math.max(2, Math.round(evaluation.score / 10))} XP kazanacaksın
          </div>

          <button
            onClick={handleNext}
            className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 active:scale-95 transition-transform"
          >
            {index >= sessionWords.length - 1 ? "Sonucu Gör 🏁" : "Sonraki Kelime →"}
          </button>
        </div>
      )}
    </div>
  );
}
