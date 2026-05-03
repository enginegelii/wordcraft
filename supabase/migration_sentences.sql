-- WordCraft Cumle Yazma Modulu Migrasyonu
-- Supabase SQL Editor'da calistir

CREATE TABLE IF NOT EXISTS sentence_entries (
  id TEXT PRIMARY KEY,
  word_id TEXT,
  word TEXT NOT NULL,
  translation TEXT,
  directive TEXT,
  grammar_topic TEXT,
  user_sentence TEXT NOT NULL,
  evaluation JSONB,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sentence_entries DISABLE ROW LEVEL SECURITY;
