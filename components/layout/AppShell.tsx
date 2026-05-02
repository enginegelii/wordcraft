"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, Plus, Gamepad2, Settings, Flame,
  Star, Zap, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { getXPForNextLevel, LEVEL_THRESHOLDS } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";
import { LoginScreen } from "@/components/LoginScreen";

const NAV_ITEMS = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/words", label: "Kelimelerim", icon: BookOpen },
  { href: "/add", label: "Ekle", icon: Plus },
  { href: "/play", label: "Oyna", icon: Gamepad2 },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const logout = useAppStore((s) => s.logout);
  const stats = useAppStore((s) => s.stats);
  const words = useAppStore((s) => s.words);
  const getDueWords = useAppStore((s) => s.getDueWords);

  // localStorage henüz yüklenmediyse bekle
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white font-black text-2xl">W</span>
          </div>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  // Giriş yapılmamışsa login ekranı göster
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const dueCount = getDueWords().length;
  const currentLevelXP = LEVEL_THRESHOLDS[stats.level - 1] ?? 0;
  const nextLevelXP = getXPForNextLevel(stats.level);
  const progressPct = Math.min(
    100,
    ((stats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  );

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[hsl(var(--border))]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="font-bold text-xl gradient-text">WordCraft</span>
        </div>

        {/* User Stats */}
        <div className="px-4 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3 mb-3">
            {/* Streak */}
            <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 rounded-lg px-3 py-1.5">
              <Flame className="w-4 h-4 text-orange-500 animate-streak-flame" />
              <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                {stats.streakCount}
              </span>
            </div>
            {/* XP */}
            <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-3 py-1.5">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">
                {stats.xp} XP
              </span>
            </div>
          </div>
          {/* Level Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-brand-500" />
                <span>Seviye {stats.level}</span>
              </div>
              <span>{stats.xp} / {nextLevelXP} XP</span>
            </div>
            <div className="h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {item.href === "/play" && dueCount > 0 && (
                  <span className={cn(
                    "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                  )}>
                    {dueCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-[hsl(var(--border))] space-y-2">
          <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
            <span>{words.length} kelime</span>
            <ThemeToggle />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors w-full px-1 py-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[hsl(var(--background))]/80 backdrop-blur-md border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-bold">W</span>
              </div>
              <span className="font-bold gradient-text">WordCraft</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/30 rounded-lg px-2 py-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-orange-600 dark:text-orange-400 text-xs">{stats.streakCount}</span>
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-2 py-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-yellow-600 dark:text-yellow-400 text-xs">{stats.xp}</span>
              </div>
              <ThemeToggle />
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="min-h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[hsl(var(--card))]/95 backdrop-blur-md border-t border-[hsl(var(--border))] pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            if (item.href === "/add") {
              return (
                <Link key={item.href} href={item.href} className="relative -mt-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 transition-transform active:scale-95",
                    "bg-gradient-to-br from-brand-400 to-brand-600"
                  )}>
                    <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all relative",
                  isActive
                    ? "text-brand-500"
                    : "text-[hsl(var(--muted-foreground))]"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.href === "/play" && dueCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {dueCount > 9 ? "9+" : dueCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
