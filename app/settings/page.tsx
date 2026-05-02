"use client";

import { useState } from "react";
import {
  Target, Moon, Sun, Trash2, Download, Trophy,
  ChevronRight, Check, LogOut, RefreshCw, Wifi, WifiOff,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useTheme } from "next-themes";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BADGES } from "@/lib/types";

const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const stats = useAppStore((s) => s.stats);
  const achievements = useAppStore((s) => s.achievements);
  const updateStats = useAppStore((s) => s.updateStats);
  const words = useAppStore((s) => s.words);
  const logout = useAppStore((s) => s.logout);
  const syncFromCloud = useAppStore((s) => s.syncFromCloud);
  const isSyncing = useAppStore((s) => s.isSyncing);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncMessage(null);
    await syncFromCloud();
    setSyncMessage("Senkron tamamlandi!");
    setTimeout(() => setSyncMessage(null), 3000);
  };

  const exportData = () => {
    const data = {
      words: useAppStore.getState().words,
      reviews: useAppStore.getState().reviews,
      stats: useAppStore.getState().stats,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wordcraft-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
          Tercihleri ve hesabı yönet
        </p>
      </div>

      {/* Profil / İstatistik */}
      <Section title="Profil">
        <div className="flex items-center gap-4 p-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md">
            <span className="text-2xl font-black text-white">{stats.level}</span>
          </div>
          <div>
            <p className="font-bold text-lg">Seviye {stats.level}</p>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">{stats.xp} XP toplam</p>
            <p className="text-brand-500 text-sm font-medium">🔥 {stats.streakCount} günlük seri</p>
          </div>
        </div>
        <Divider />
        <div className="grid grid-cols-3 divide-x divide-[hsl(var(--border))]">
          <StatItem value={words.length} label="Kelime" />
          <StatItem value={stats.totalReviews} label="Tekrar" />
          <StatItem value={words.filter((w) => w.status === "mastered").length} label="Öğrenildi" />
        </div>
      </Section>

      {/* Günlük Hedef */}
      <Section title="Günlük Hedef">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-sm">
            <Target className="w-4 h-4" />
            <span>Günde kaç tekrar yapmak istiyorsun?</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {DAILY_GOAL_OPTIONS.map((goal) => (
              <button
                key={goal}
                onClick={() => updateStats({ dailyGoal: goal })}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  stats.dailyGoal === goal
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                    : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {goal} kelime
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Tema */}
      <Section title="Görünüm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <div>
                <p className="font-medium">Tema</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {theme === "dark" ? "Koyu mod" : theme === "light" ? "Açık mod" : "Sistem"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    theme === t
                      ? "bg-brand-500 text-white"
                      : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                  )}
                >
                  {t === "light" ? "☀️" : t === "dark" ? "🌙" : "⚙️"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Başarımlar */}
      {achievements.length > 0 && (
        <Section title={`Başarımlar (${achievements.length})`}>
          <div className="p-4 grid grid-cols-2 gap-3">
            {Object.values(BADGES).map((badge) => {
              const unlocked = achievements.some((a) => a.badgeId === badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border",
                    unlocked
                      ? "border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-950/20"
                      : "border-[hsl(var(--border))] opacity-40"
                  )}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{badge.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{badge.desc}</p>
                  </div>
                  {unlocked && <Check className="w-4 h-4 text-yellow-500 ml-auto" />}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Veri */}
      <Section title="Veri">
        <button
          onClick={exportData}
          className="flex items-center justify-between w-full px-4 py-3 hover:bg-[hsl(var(--secondary))] transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <div className="text-left">
              <p className="font-medium">Verileri İndir</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">JSON olarak yedekle</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        </button>

        <Divider />

        <div className="px-4 py-3">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-3 text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Tüm Verileri Sıfırla</span>
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-red-500 text-sm font-medium">
                ⚠️ Tüm kelimeler ve ilerleme silinecek. Bu işlem geri alınamaz!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    localStorage.removeItem("wordcraft-storage");
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold"
                >
                  Evet, Sıfırla
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-[hsl(var(--secondary))] rounded-xl text-sm font-semibold"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Çıkış */}
      {/* Senkron & Baglanti */}
      <Section title="Bulut Senkron">
        <div className="p-4 space-y-3">
          {/* Supabase baglanti durumu */}
          <div className="flex items-center gap-3">
            {isSupabaseConfigured ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Wifi className="w-5 h-5" />
                <span className="text-sm font-medium">Supabase baglantisi aktif</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <WifiOff className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Supabase baglanamadi</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    Vercel'e NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ekle
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Manuel sync butonu */}
          {isSupabaseConfigured && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              {isSyncing ? "Senkron ediliyor..." : "Simdi Senkron Et"}
            </button>
          )}

          {syncMessage && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> {syncMessage}
            </p>
          )}
        </div>
      </Section>

      <Section title="Hesap">
        <div className="p-4">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </Section>

      {/* Hakkında */}
      <Section title="Hakkında">
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">W</span>
            </div>
            <div>
              <p className="font-bold">WordCraft</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">v0.1.0 — MVP</p>
            </div>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] pt-2">
            Powered by Claude AI (Anthropic). Kelimeleri yakala, öğren, oyunlarla pekiştir.
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title, children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
        <h2 className="font-semibold text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[hsl(var(--border))]" />;
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center py-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
    </div>
  );
}
