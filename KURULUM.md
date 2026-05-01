# WordCraft — Kurulum Rehberi

## 1. Bağımlılıkları Yükle

```bash
npm install
```

## 2. Ortam Değişkenlerini Ayarla

```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenle:

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

> **Not:** Supabase olmadan uygulama çalışır — tüm veriler `localStorage`'a kaydedilir.
> Cihazlar arası senkron istiyorsan Supabase ekle.

## 3. Uygulamayı Çalıştır

```bash
npm run dev
```

Tarayıcıda: **http://localhost:3000**

---

## Supabase Kurulumu (Opsiyonel)

1. [supabase.com](https://supabase.com) → Yeni proje oluştur
2. **SQL Editor** → `supabase/schema.sql` dosyasını kopyalayıp çalıştır
3. Settings → API → URL ve anon key'i al
4. `.env.local` dosyasına ekle:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

---

## PWA Olarak Kurulum (Telefon)

1. Chrome ile **http://localhost:3000** aç
2. Adres çubuğunda "Yükle" veya "Ana Ekrana Ekle" butonuna tıkla
3. Uygulama artık telefon gibi çalışır!

---

## Özellikler (MVP)

- ✅ **Kelime Ekleme** — Manuel yazarak veya fotoğraf yükleyerek
- ✅ **AI Kart Üretimi** — Claude ile otomatik: çeviri, IPA, örnekler, eş/zıt anlamlı
- ✅ **Flashcard Oyunu** — Kart çevirme + SM-2 spaced repetition
- ✅ **Hızlı Eşleştirme** — Timed matching game + combo sistemi
- ✅ **Boşluk Doldurma** — Cümle tamamlama oyunu
- ✅ **Streak & XP** — Gamification sistemi
- ✅ **Dark Mode** — Otomatik veya manuel
- ✅ **PWA** — Ana ekrana eklenebilir, offline çalışır

---

## Teknoloji Yığını

| Teknoloji | Kullanım |
|-----------|----------|
| Next.js 15 | Framework (App Router) |
| TypeScript | Tip güvenliği |
| Tailwind CSS | Stillendirme |
| Zustand | State yönetimi |
| SM-2 | Spaced Repetition algoritması |
| Claude API | AI kart üretimi & OCR |
| Supabase | Veritabanı (opsiyonel) |
| Web Speech API | TTS & STT |
