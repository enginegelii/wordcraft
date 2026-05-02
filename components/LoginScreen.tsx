"use client";

import { useState } from "react";
import { ArrowRight, Loader2, BookOpen, Gamepad2, GraduationCap, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn, triggerHaptic } from "@/lib/utils";

const FEATURES = [
  {
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    title: "Akıllı Kelime Kartları",
    desc: "AI ile otomatik üretilen zengin içerik",
  },
  {
    icon: <Gamepad2 className="w-5 h-5 text-emerald-400" />,
    title: "7 Farklı Oyun",
    desc: "Flashcard, eşleştirme, boşluk doldurma ve daha fazlası",
  },
  {
    icon: <GraduationCap className="w-5 h-5 text-violet-400" />,
    title: "Gramer Modülü",
    desc: "Seviyene göre kişiselleştirilmiş gramer öğrenimi",
  },
];

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    await new Promise((r) => setTimeout(r, 500));
    const success = login(phone);
    if (success) {
      triggerHaptic("medium");
    } else {
      setError(true);
      setShake(true);
      triggerHaptic("heavy");
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    setError(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] overflow-hidden">
      {/* Gradient blob */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-12 gap-8">
        {/* Logo + branding */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-2xl shadow-brand-500/40 mx-auto">
              <span className="text-white font-black text-5xl">W</span>
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-yellow-900" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">WordCraft</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
              Kişisel İngilizce Öğrenme Asistanın
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="w-full max-w-sm space-y-2.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl px-4 py-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Login card */}
        <div
          className={cn(
            "w-full max-w-sm bg-[hsl(var(--card))] rounded-3xl border border-[hsl(var(--border))] shadow-xl p-6 space-y-4",
            shake && "animate-shake"
          )}
        >
          <div className="text-center">
            <h2 className="font-bold text-lg">Giriş Yap</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              Telefon numaranı gir, ilerlemen her cihazda senkronize olsun
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[hsl(var(--muted-foreground))] pointer-events-none">
                <span className="text-lg">🇹🇷</span>
                <span className="text-sm font-semibold">+90</span>
                <div className="w-px h-4 bg-[hsl(var(--border))]" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => formatPhone(e.target.value)}
                placeholder="5XX XXX XX XX"
                inputMode="numeric"
                autoFocus
                className={cn(
                  "w-full pl-24 pr-4 py-3.5 rounded-xl border-2 text-base font-medium transition-colors bg-[hsl(var(--background))] focus:outline-none",
                  error
                    ? "border-red-400 focus:border-red-400 text-red-600 dark:text-red-400"
                    : "border-[hsl(var(--border))] focus:border-brand-500"
                )}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium text-center">
                ❌ Bu numara tanınmıyor
              </p>
            )}

            <button
              type="submit"
              disabled={phone.length < 10 || loading}
              className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Kontrol ediliyor...
                </>
              ) : (
                <>
                  Hadi Başlayalım
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-[hsl(var(--muted-foreground))] text-center max-w-xs">
          Veriler Supabase ile güvenli şekilde saklanır ve tüm cihazlara senkronize edilir.
        </p>
      </div>
    </div>
  );
}
