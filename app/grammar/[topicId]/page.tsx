"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, BookOpen, Pencil, Check, X,
  Trophy, Star, RotateCcw, ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getTopicById, LEVEL_DISPLAY } from "@/lib/grammar-data";
import { cn, playSound, triggerHaptic } from "@/lib/utils";

type Tab = "lesson" | "quiz";

export default function GrammarTopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;

  const topic = getTopicById(topicId);
  const markTopicStudied = useAppStore((s) => s.markTopicStudied);
  const completeTopicQuiz = useAppStore((s) => s.completeTopicQuiz);
  const getTopicProgress = useAppStore((s) => s.getTopicProgress);

  const [tab, setTab] = useState<Tab>("lesson");

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // Sayfa açılınca ders sekmesi okumayı kaydet
  useEffect(() => {
    if (topic && tab === "lesson") {
      const progress = getTopicProgress(topicId);
      if (!progress?.studied) {
        markTopicStudied(topicId);
      }
    }
  }, [topic, tab]);

  if (!topic) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-[hsl(var(--muted-foreground))]">Konu bulunamadı.</p>
          <Link href="/grammar" className="text-indigo-500 font-semibold">
            Gramer sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  const levelInfo = LEVEL_DISPLAY[topic.level];
  const progress = getTopicProgress(topicId);
  const currentQuestion = topic.questions[quizIndex];
  const isLastQuestion = quizIndex === topic.questions.length - 1;
  const quizProgress = ((quizIndex + 1) / topic.questions.length) * 100;

  const handleSelectAnswer = (optionIdx: number) => {
    if (answered) return;
    setSelected(optionIdx);
    setAnswered(true);

    const isCorrect = optionIdx === currentQuestion.correct;
    if (isCorrect) {
      const pts = 100 / topic.questions.length;
      setScore((s) => s + pts);
      setCorrectCount((c) => c + 1);
      playSound("correct");
      triggerHaptic("light");
    } else {
      playSound("wrong");
      triggerHaptic("medium");
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalScore = Math.round(score + (selected === currentQuestion.correct ? 100 / topic.questions.length : 0));
      completeTopicQuiz(topicId, Math.round((correctCount + (selected === currentQuestion.correct ? 1 : 0)) / topic.questions.length * 100));
      setQuizDone(true);
    } else {
      setQuizIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setCorrectCount(0);
    setQuizDone(false);
  };

  // ─── QUIZ DONE ─────────────────────────────────────────────────────────────
  if (tab === "quiz" && quizDone) {
    const finalPct = Math.round((correctCount / topic.questions.length) * 100);
    const isPerfect = finalPct === 100;
    const isGood = finalPct >= 70;

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center space-y-6 max-w-lg mx-auto">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center shadow-lg animate-bounce-in",
          isPerfect
            ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-500/30"
            : isGood
            ? "bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/30"
            : "bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-500/30"
        )}>
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black">
            {isPerfect ? "Mükemmel! 🎉" : isGood ? "Harika! 👏" : "İyi Çalışma! 💪"}
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {correctCount} / {topic.questions.length} doğru
          </p>
        </div>
        <div className="flex gap-4">
          <div className={cn(
            "rounded-2xl px-6 py-4",
            isPerfect ? "bg-yellow-500" : isGood ? "bg-green-500" : "bg-indigo-500"
          )}>
            <p className="text-3xl font-black text-white">%{finalPct}</p>
            <p className="text-sm text-white/80 flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" /> Puan
            </p>
          </div>
          <div className="bg-[hsl(var(--secondary))] rounded-2xl px-6 py-4">
            <p className="text-3xl font-black">{correctCount}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Doğru</p>
          </div>
        </div>

        {!isGood && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            %70'in altında kaldın. Konu anlatımını tekrar okuyup quiz'i yeniden dene!
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={resetQuiz}
            className="flex items-center gap-2 bg-[hsl(var(--secondary))] px-5 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4" /> Tekrar
          </button>
          {!isGood && (
            <button
              onClick={() => { setTab("lesson"); resetQuiz(); }}
              className="flex items-center gap-2 bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
            >
              <BookOpen className="w-4 h-4" /> Konuya Dön
            </button>
          )}
          <Link
            href="/grammar"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white px-5 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            Diğer Konular
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[hsl(var(--background))]/90 backdrop-blur-md border-b border-[hsl(var(--border))]">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/grammar" className="flex items-center gap-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            <ChevronLeft className="w-5 h-5" /> Geri
          </Link>
          <div className="text-center">
            <p className="font-bold text-sm truncate max-w-[200px]">{topic.title}</p>
            <span className={cn("text-[10px] font-semibold", levelInfo.color)}>
              {levelInfo.label}
            </span>
          </div>
          <div className="w-12" /> {/* spacer */}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[hsl(var(--border))]">
          <button
            onClick={() => setTab("lesson")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors",
              tab === "lesson"
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            <BookOpen className="w-4 h-4" /> Konu Anlatımı
          </button>
          <button
            onClick={() => { setTab("quiz"); resetQuiz(); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors",
              tab === "quiz"
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            <Pencil className="w-4 h-4" />
            Quiz
            {progress?.quizCompleted && (
              <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                %{progress.quizScore}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── LESSON TAB ── */}
      {tab === "lesson" && (
        <div className="px-4 py-6 space-y-6">
          {/* Topic intro card */}
          <div className={cn(
            "rounded-2xl border p-5",
            levelInfo.bg
          )}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{topic.emoji}</span>
              <div>
                <h1 className="text-xl font-black">{topic.title}</h1>
                <p className={cn("text-sm font-medium mt-0.5", levelInfo.color)}>{topic.subtitle}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{topic.description}</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {topic.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-3">
              <h2 className="text-lg font-bold">{section.title}</h2>

              {/* Content with basic markdown rendering */}
              <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-4 space-y-2">
                <MarkdownContent content={section.content} />
              </div>

              {/* Examples */}
              {section.examples && section.examples.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider px-1">
                    Örnekler
                  </p>
                  {section.examples.map((ex, eIdx) => (
                    <div
                      key={eIdx}
                      className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl px-4 py-2.5"
                    >
                      <ExampleLine text={ex} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Quiz CTA */}
          <div className="pt-2">
            <button
              onClick={() => setTab("quiz")}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Pencil className="w-5 h-5" />
              Quiz'e Geç →
            </button>
          </div>
        </div>
      )}

      {/* ── QUIZ TAB ── */}
      {tab === "quiz" && !quizDone && (
        <div className="px-4 py-6">
          {/* Progress */}
          <div className="flex items-center justify-between mb-2 text-sm text-[hsl(var(--muted-foreground))]">
            <span>Soru {quizIndex + 1} / {topic.questions.length}</span>
            <span className="font-semibold text-indigo-500">{correctCount} doğru</span>
          </div>
          <div className="h-2 bg-[hsl(var(--secondary))] rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${quizProgress}%` }}
            />
          </div>

          {/* Question card */}
          <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 mb-5 shadow-sm">
            <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-3">
              {topic.title}
            </p>
            <p className="text-lg font-bold leading-relaxed">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-5">
            {currentQuestion.options.map((option, idx) => {
              const isCorrectAnswer = idx === currentQuestion.correct;
              const isSelectedOption = idx === selected;

              let cls =
                "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/10";
              if (answered) {
                if (isCorrectAnswer)
                  cls = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400";
                else if (isSelectedOption)
                  cls = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400";
                else cls = "border-[hsl(var(--border))] opacity-40";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={answered}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-sm font-medium text-left transition-all active:scale-[0.98]",
                    "flex items-center justify-between gap-2",
                    cls
                  )}
                >
                  <span>{option}</span>
                  {answered && isCorrectAnswer && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                  {answered && isSelectedOption && !isCorrectAnswer && <X className="w-4 h-4 text-red-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answered && (
            <div className={cn(
              "rounded-xl p-4 mb-5 border animate-slide-up",
              selected === currentQuestion.correct
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            )}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1">
                {selected === currentQuestion.correct ? "✅ Doğru!" : "❌ Yanlış"}
              </p>
              <p className="text-sm leading-relaxed text-[hsl(var(--foreground))]">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Next button */}
          {answered && (
            <button
              onClick={handleNext}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              {isLastQuestion ? "Sonuçları Gör 🏆" : <>Sonraki <ChevronRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Yardımcı Bileşenler ──────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-1" />;

        // Table row
        if (line.startsWith("|")) {
          return null; // handled below
        }

        // Bold text and inline code rendering
        const rendered = renderInline(line);

        // Heading
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-bold text-[hsl(var(--foreground))]">
              {rendered}
            </p>
          );
        }

        // List item
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered item (1. ...)
        const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-indigo-500 font-bold shrink-0">{numberedMatch[1]}.</span>
              <span>{renderInline(numberedMatch[2])}</span>
            </div>
          );
        }

        // ⚠️ note
        if (line.startsWith("⚠️")) {
          return (
            <div key={i} className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 text-yellow-800 dark:text-yellow-200 text-xs">
              {rendered}
            </div>
          );
        }

        return <p key={i}>{rendered}</p>;
      })}

      {/* Tables */}
      <TableContent content={content} />
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Split on **bold** and `code`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
    const codeIdx = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity;

    if (boldIdx === Infinity && codeIdx === Infinity) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (boldIdx <= codeIdx && boldMatch) {
      if (boldIdx > 0) parts.push(<span key={key++}>{remaining.slice(0, boldIdx)}</span>);
      parts.push(<strong key={key++} className="font-bold text-[hsl(var(--foreground))]">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    } else if (codeMatch) {
      if (codeIdx > 0) parts.push(<span key={key++}>{remaining.slice(0, codeIdx)}</span>);
      parts.push(<code key={key++} className="bg-[hsl(var(--secondary))] px-1 py-0.5 rounded text-xs font-mono text-indigo-600 dark:text-indigo-400">{codeMatch[1]}</code>);
      remaining = remaining.slice(codeIdx + codeMatch[0].length);
    }
  }

  return <>{parts}</>;
}

function TableContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const tableLines = lines.filter((l) => l.startsWith("|"));
  if (tableLines.length < 2) return null;

  const headers = tableLines[0].split("|").filter((c) => c.trim());
  const rows = tableLines.slice(2).map((row) =>
    row.split("|").filter((c) => c.trim())
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))] mt-2">
      <table className="w-full text-xs">
        <thead className="bg-[hsl(var(--secondary))]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold">
                {h.trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[hsl(var(--border))]">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">
                  {renderInline(cell.trim())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExampleLine({ text }: { text: string }) {
  // Split "English sentence (Turkish translation)"
  const parenMatch = text.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (parenMatch) {
    return (
      <div>
        <p className="text-sm font-medium text-[hsl(var(--foreground))] italic">"{parenMatch[1].trim()}"</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{parenMatch[2].trim()}</p>
      </div>
    );
  }
  return <p className="text-sm italic text-[hsl(var(--foreground))]">"{text}"</p>;
}
