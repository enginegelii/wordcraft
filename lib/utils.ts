import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Yarın";
  if (diffDays === -1) return "Dün";
  if (diffDays > 0) return `${diffDays} gün sonra`;
  return `${Math.abs(diffDays)} gün önce`;
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function playSound(type: "correct" | "wrong" | "complete" | "flip"): void {
  if (typeof window === "undefined") return;
  // Web Audio API ile basit ses efektleri
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const config = {
      correct: { freq: [523, 659, 784], duration: 0.3, type: "sine" as OscillatorType },
      wrong: { freq: [200, 150], duration: 0.3, type: "sawtooth" as OscillatorType },
      complete: { freq: [523, 659, 784, 1047], duration: 0.5, type: "sine" as OscillatorType },
      flip: { freq: [440], duration: 0.1, type: "triangle" as OscillatorType },
    };

    const c = config[type];
    oscillator.type = c.type;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + c.duration);

    c.freq.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + (i * c.duration) / c.freq.length);
    });

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + c.duration);
  } catch {
    // Sessiz mod
  }
}

export function triggerHaptic(type: "light" | "medium" | "heavy" = "light"): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] };
    navigator.vibrate(patterns[type]);
  }
}
