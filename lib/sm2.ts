/**
 * SM-2 Spaced Repetition Algorithm
 * Referans: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 *
 * Kalite değerlendirmesi:
 * 0 = Hiç hatırlamadım (blackout)
 * 1 = Yanlış, ama doğruyu görünce tanıdım (yanlış ama aşina)
 * 2 = Yanlış ama hatırlamak kolaydı (bilmiyorum)
 * 3 = Doğru ama çok zor (zor)
 * 4 = Doğru, küçük tereddütle (iyi)
 * 5 = Mükemmel hatırlama (kolay)
 */

import type { Review } from "./types";

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export function calculateSM2(
  review: Pick<Review, "easeFactor" | "interval" | "repetitions">,
  quality: ReviewQuality
): SM2Result {
  let { easeFactor, interval, repetitions } = review;

  if (quality >= 3) {
    // Doğru cevap
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Yanlış cevap - baştan başla
    repetitions = 0;
    interval = 1;
  }

  // Ease factor güncelle
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  if (easeFactor > 2.5) easeFactor = 2.5;

  // Sonraki tekrar tarihi
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    repetitions,
    nextReviewDate: nextReviewDate.toISOString().split("T")[0],
  };
}

export function createInitialReview(wordId: string): Omit<Review, "id"> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    wordId,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: tomorrow.toISOString().split("T")[0],
  };
}

export function isDueForReview(review: Review): boolean {
  const today = new Date().toISOString().split("T")[0];
  return review.nextReviewDate <= today;
}

/** Bir kelimenin öğrenme durumunu interval'e göre belirle */
export function getWordStatusFromInterval(interval: number): "new" | "learning" | "review" | "mastered" {
  if (interval === 0) return "new";
  if (interval <= 3) return "learning";
  if (interval <= 21) return "review";
  return "mastered";
}

/** Kalite → XP dönüşümü */
export function qualityToXP(quality: ReviewQuality): number {
  const map: Record<ReviewQuality, number> = { 0: 0, 1: 1, 2: 2, 3: 5, 4: 8, 5: 10 };
  return map[quality];
}
