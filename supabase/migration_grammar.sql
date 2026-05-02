-- WordCraft Gramer Modülü Migrasyonu
-- Mevcut veritabanına grammar alanlarını eklemek için bu dosyayı
-- Supabase SQL Editor'da çalıştır

-- 1. user_stats tablosuna gramer sütunları ekle
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS grammar_level TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS grammar_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grammar_placement_done BOOLEAN DEFAULT FALSE;

-- 2. Gramer konu ilerlemesi tablosu
CREATE TABLE IF NOT EXISTS grammar_progress (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  studied BOOLEAN DEFAULT FALSE,
  quiz_completed BOOLEAN DEFAULT FALSE,
  quiz_score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grammar_progress DISABLE ROW LEVEL SECURITY;

-- ─── Multi-User Hazırlık Notları ────────────────────────────────────────────
-- İleride çok kullanıcılı hale getirmek için:
--
-- 1. user_stats tablosunu kişisel hale getir:
--    ALTER TABLE user_stats ADD COLUMN user_id UUID REFERENCES auth.users(id);
--    -- id=1 olan tek satır yerine her kullanıcı kendi satırına sahip olur
--
-- 2. grammar_progress'e user_id ekle:
--    ALTER TABLE grammar_progress ADD COLUMN user_id UUID REFERENCES auth.users(id);
--    ALTER TABLE grammar_progress DROP CONSTRAINT grammar_progress_pkey;
--    ALTER TABLE grammar_progress ADD PRIMARY KEY (user_id, topic_id);
--
-- 3. RLS politikaları ekle:
--    ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
--    CREATE POLICY "Users own stats" ON user_stats FOR ALL USING (auth.uid() = user_id);
--
--    ALTER TABLE grammar_progress ENABLE ROW LEVEL SECURITY;
--    CREATE POLICY "Users own grammar" ON grammar_progress FOR ALL USING (auth.uid() = user_id);
-- ────────────────────────────────────────────────────────────────────────────
