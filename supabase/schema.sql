-- WordCraft Supabase Şeması
-- Bu dosyayı Supabase SQL Editor'da çalıştır

-- Kelimeler tablosu
CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  part_of_speech TEXT,
  ipa TEXT,
  examples JSONB DEFAULT '[]',
  synonyms JSONB DEFAULT '[]',
  antonyms JSONB DEFAULT '[]',
  context_tag TEXT,
  original_context TEXT,
  image_url TEXT,
  grammar_note TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tekrar (SRS) tablosu
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  word_id TEXT REFERENCES words(id) ON DELETE CASCADE,
  ease_factor FLOAT DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_date TEXT,
  last_review_date TEXT
);

-- Kullanıcı istatistikleri (tek satır: id = 1)
CREATE TABLE IF NOT EXISTS user_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  streak_count INTEGER DEFAULT 0,
  last_active_date TEXT DEFAULT '',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_words_added INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  daily_goal INTEGER DEFAULT 10
);

-- Oyun seansları
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  game_type TEXT,
  score INTEGER DEFAULT 0,
  words_practiced JSONB DEFAULT '[]',
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER DEFAULT 0
);

-- Başarımlar
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  badge_id TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS'i kapat (kişisel kullanım, tek kullanıcı)
ALTER TABLE words DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
