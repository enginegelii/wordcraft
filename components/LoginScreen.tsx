"use client";

import { useState } from "react";
import { Phone, ArrowRight, Loader2, Lock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn, triggerHaptic } from "@/lib/utils";

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

    // Kısa gecikme — daha gerçekçi his
    await new Promise((r) => setTimeout(r, 600));

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
    // Sadece rakam al, max 10 hane
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    setError(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[hsl(var(--background))]">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10 animate-bounce-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/30 mb-4">
          <span className="text-white font-black text-4xl">W</span>
        </div>
        <h1 className="text-3xl font-black">WordCraft</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
          İngilizce öğrenme asistanın
        </p>
      </div>

      {/* Giriş Kartı */}
      <div
        className={cn(
          "w-full max-w-sm bg-[hsl(var(--card))] rounded-3xl border border-[hsl(var(--border))] shadow-xl p-6",
          shake && "animate-shake"
        )}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--secondary))] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          </div>
          <div>
            <h2 className="font-bold text-base">Giriş Yap</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Telefon numaranı gir</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Telefon input */}
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">+90</span>
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
                "w-full pl-20 pr-4 py-3.5 rounded-xl border-2 text-base font-medium transition-colors",
                "bg-[hsl(var(--background))]",
                "focus:outline-none",
                error
                  ? "border-red-400 focus:border-red-400 text-red-600 dark:text-red-400"
                  : "border-[hsl(var(--border))] focus:border-brand-500"
              )}
            />
          </div>

          {/* Hata mesajı */}
          {error && (
            <p className="text-sm text-red-500 font-medium text-center animate-slide-up">
              ❌ Bu numara tanınmıyor
            </p>
          )}

          {/* Giriş butonu */}
          <button
            type="submit"
            disabled={phone.length < 10 || loading}
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95",
              "bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Kontrol ediliyor...
              </>
            ) : (
              <>
                Giriş Yap
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Alt metin */}
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-6 text-center max-w-xs">
        Kişisel kullanım için tasarlandı.
        Veriler bu cihazda güvenle saklanır.
      </p>
    </div>
  );
}
