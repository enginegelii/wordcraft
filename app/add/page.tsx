"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Keyboard, ImagePlus, Loader2, Check, X, Volume2,
  Plus, ChevronDown, ChevronUp, Tag, BookOpen, Mic2,
} from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { Word, PartOfSpeech, ContextTag } from "@/lib/types";

type Tab = "manual" | "photo";

interface GeneratedCard {
  word: string;
  translation: string;
  partOfSpeech: PartOfSpeech;
  ipa?: string;
  examples: { en: string; tr: string }[];
  synonyms: string[];
  antonyms: string[];
  contextTag: ContextTag;
  grammarNote?: string | null;
}

export default function AddPage() {
  const router = useRouter();
  const addWord = useAppStore((s) => s.addWord);

  const [tab, setTab] = useState<Tab>("manual");
  const [inputWord, setInputWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedCard | null>(null);
  const [saved, setSaved] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Photo tab
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [selectedText, setSelectedText] = useState<string>("");
  const [ocrLoading, setOcrLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manuel kelime üretimi
  const handleGenerateFromWord = async (word: string) => {
    if (!word.trim()) return;
    setLoading(true);
    setError(null);
    setGenerated(null);
    setSaved(false);

    try {
      const res = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kart üretilemedi");
      setGenerated(data);
      triggerHaptic("light");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
      triggerHaptic("heavy");
    } finally {
      setLoading(false);
    }
  };

  // Foto yükleme ve OCR
  const handleImageUpload = async (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setOcrLoading(true);
    setExtractedText("");
    setSelectedText("");

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExtractedText(data.extractedText ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR hatası");
    } finally {
      setOcrLoading(false);
    }
  };

  // Görselden kelime seçildiğinde kart üret
  const handleWordFromImage = async (word: string) => {
    setSelectedText(word);
    setGenerated(null);
    await handleGenerateFromWord(word);
  };

  // Kartı kaydet
  const handleSave = () => {
    if (!generated) return;
    addWord({
      word: generated.word,
      translation: generated.translation,
      partOfSpeech: generated.partOfSpeech,
      ipa: generated.ipa,
      examples: generated.examples,
      synonyms: generated.synonyms,
      antonyms: generated.antonyms,
      contextTag: generated.contextTag,
      grammarNote: generated.grammarNote ?? undefined,
      originalContext: selectedText || undefined,
    });
    setSaved(true);
    triggerHaptic("medium");
    setTimeout(() => {
      setGenerated(null);
      setInputWord("");
      setSelectedText("");
      setSaved(false);
    }, 1500);
  };

  // TTS
  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US";
      speechSynthesis.speak(utt);
    }
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Kelime Ekle</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
          AI otomatik olarak zengin bir kart oluşturur
        </p>
      </div>

      {/* Tab seçimi */}
      <div className="flex gap-2 bg-[hsl(var(--secondary))] p-1 rounded-xl">
        <TabButton active={tab === "manual"} onClick={() => setTab("manual")} icon={<Keyboard className="w-4 h-4" />}>
          Manuel Yaz
        </TabButton>
        <TabButton active={tab === "photo"} onClick={() => setTab("photo")} icon={<ImagePlus className="w-4 h-4" />}>
          Foto Yükle
        </TabButton>
      </div>

      {/* Manuel Tab */}
      {tab === "manual" && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateFromWord(inputWord)}
              placeholder="İngilizce kelime veya ifade yaz..."
              className={cn(
                "w-full px-4 py-4 rounded-xl border text-lg font-medium",
                "bg-[hsl(var(--card))] border-[hsl(var(--border))]",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                "placeholder:text-[hsl(var(--muted-foreground))] placeholder:font-normal"
              )}
              autoFocus
            />
          </div>
          <button
            onClick={() => handleGenerateFromWord(inputWord)}
            disabled={loading || !inputWord.trim()}
            className={cn(
              "w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-95",
              "bg-gradient-to-r from-brand-500 to-brand-600 shadow-md shadow-brand-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Kart Oluşturuluyor...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Kart Oluştur
              </>
            )}
          </button>
        </div>
      )}

      {/* Photo Tab */}
      {tab === "photo" && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(f);
            }}
          />

          {!imagePreview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full border-2 border-dashed border-[hsl(var(--border))] rounded-2xl p-10",
                "flex flex-col items-center gap-3 text-[hsl(var(--muted-foreground))]",
                "hover:border-brand-400 hover:text-brand-500 transition-colors cursor-pointer"
              )}
            >
              <ImagePlus className="w-10 h-10" />
              <div className="text-center">
                <p className="font-medium">Fotoğraf Yükle</p>
                <p className="text-sm">Kitap, menü, tabela fotoğrafı</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Yüklenen görsel"
                  className="w-full max-h-48 object-cover"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    setExtractedText("");
                    setSelectedText("");
                    setGenerated(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {ocrLoading && (
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Metin okunuyor...
                </div>
              )}

              {extractedText && !ocrLoading && (
                <div className="bg-[hsl(var(--secondary))] rounded-xl p-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 font-medium">
                    Metni seç veya aşağıya kelime yaz:
                  </p>
                  <p className="text-sm leading-relaxed">{extractedText}</p>
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={selectedText}
                  onChange={(e) => setSelectedText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleWordFromImage(selectedText)}
                  placeholder="Görseldeki kelimeyi buraya yaz..."
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border",
                    "bg-[hsl(var(--card))] border-[hsl(var(--border))]",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500"
                  )}
                />
              </div>
              <button
                onClick={() => handleWordFromImage(selectedText)}
                disabled={loading || !selectedText.trim()}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95",
                  "bg-gradient-to-r from-brand-500 to-brand-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Kart Oluştur
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hata */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4">
          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">Hata</p>
            <p className="text-red-600 dark:text-red-500 text-sm">{error}</p>
            {error.includes("ANTHROPIC_API_KEY") && (
              <p className="text-red-500 text-xs mt-1">
                .env.local dosyasına ANTHROPIC_API_KEY ekleyin.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Üretilen Kart */}
      {generated && !saved && (
        <WordCardPreview
          card={generated}
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(!showDetails)}
          onSpeak={speak}
          onSave={handleSave}
          onDiscard={() => { setGenerated(null); setInputWord(""); }}
        />
      )}

      {/* Başarı */}
      {saved && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-4 animate-bounce-in">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">
              Kelime eklendi! 🎉
            </p>
            <p className="text-green-600 dark:text-green-500 text-sm">+5 XP kazandın</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active, onClick, icon, children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
        active
          ? "bg-[hsl(var(--card))] text-brand-600 dark:text-brand-400 shadow-sm"
          : "text-[hsl(var(--muted-foreground))]"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function WordCardPreview({
  card, showDetails, onToggleDetails, onSpeak, onSave, onDiscard,
}: {
  card: GeneratedCard;
  showDetails: boolean;
  onToggleDetails: () => void;
  onSpeak: (text: string) => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-md animate-slide-up">

      {/* Üst turuncu şerit + kelime */}
      <div className="border-b border-[hsl(var(--border))]">
        {/* Renk şeridi */}
        <div className="h-1.5 bg-brand-500" />

        <div className="px-5 pt-4 pb-3">
          {/* Kelime + ses butonu */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-[hsl(var(--foreground))]">{card.word}</h2>
                <button
                  onClick={() => onSpeak(card.word)}
                  className="p-1.5 rounded-lg bg-[hsl(var(--secondary))] hover:bg-brand-100 dark:hover:bg-brand-900/40 text-brand-500 transition-colors flex-shrink-0"
                  title="Sesli Oku"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              {card.ipa && (
                <p className="text-sm font-mono text-[hsl(var(--muted-foreground))] mt-0.5">{card.ipa}</p>
              )}
            </div>

            {/* Badge'ler */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-xs bg-brand-500 text-white px-2.5 py-1 rounded-full font-semibold">
                {card.partOfSpeech}
              </span>
              <span className="text-xs bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] px-2.5 py-1 rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {card.contextTag}
              </span>
            </div>
          </div>

          {/* Türkçe çeviri — belirgin kutu içinde */}
          <div className="mt-3 bg-[hsl(var(--secondary))] rounded-xl px-4 py-2.5">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">Türkçe</p>
            <p className="text-lg font-bold text-[hsl(var(--foreground))]">{card.translation}</p>
          </div>
        </div>
      </div>

      {/* Örnek Cümle */}
      {card.examples[0] && (
        <div className="px-5 py-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[hsl(var(--foreground))] leading-relaxed">
                &ldquo;{card.examples[0].en}&rdquo;
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
                {card.examples[0].tr}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detaylar Toggle */}
      <button
        onClick={onToggleDetails}
        className="w-full flex items-center justify-between px-5 py-2.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
      >
        <span className="font-medium">Tüm detaylar</span>
        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showDetails && (
        <div className="px-5 py-3 space-y-3 border-t border-[hsl(var(--border))]">
          {/* Diğer örnek cümleler */}
          {card.examples.slice(1).map((ex, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mic2 className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div>
                <p className="text-sm text-[hsl(var(--foreground))]">&ldquo;{ex.en}&rdquo;</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{ex.tr}</p>
              </div>
            </div>
          ))}

          {/* Eş anlamlılar */}
          {card.synonyms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">Eş anlamlı</p>
              <div className="flex flex-wrap gap-1.5">
                {card.synonyms.map((s) => (
                  <span key={s} className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Zıt anlamlılar */}
          {card.antonyms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">Zıt anlamlı</p>
              <div className="flex flex-wrap gap-1.5">
                {card.antonyms.map((s) => (
                  <span key={s} className="text-xs bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-2.5 py-1 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gramer notu */}
          {card.grammarNote && (
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3">
              <span className="text-sm">📝</span>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{card.grammarNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="flex gap-3 p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30">
        <button
          onClick={onDiscard}
          className="flex-1 py-3 rounded-xl border border-[hsl(var(--border))] font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors active:scale-95 text-sm"
        >
          İptal
        </button>
        <button
          onClick={onSave}
          className="flex-[2] py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          <Check className="w-4 h-4" />
          Kelime Defterime Ekle
        </button>
      </div>
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // data:image/...;base64, kısmını çıkar
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
