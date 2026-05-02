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
-- Multi-user için: id → UUID, user_id sütunu ekle, RLS'i aç
CREATE TABLE IF NOT EXISTS user_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  streak_count INTEGER DEFAULT 0,
  last_active_date TEXT DEFAULT '',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_words_added INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  daily_goal INTEGER DEFAULT 10,
  -- Gramer alanları
  grammar_level TEXT DEFAULT NULL,       -- 'intermediate' | 'upper-intermediate' | 'advanced' | 'advanced-plus'
  grammar_xp INTEGER DEFAULT 0,         -- Gramer seviyesi ilerleme puanı
  grammar_placement_done BOOLEAN DEFAULT FALSE
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

-- Gramer konu ilerlemesi
-- Multi-user için: user_id sütunu ekle (TEXT, Supabase auth UID), PRIMARY KEY'i (user_id, topic_id) yap
CREATE TABLE IF NOT EXISTS grammar_progress (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  studied BOOLEAN DEFAULT FALSE,
  quiz_completed BOOLEAN DEFAULT FALSE,
  quiz_score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Başarımlar
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  badge_id TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS'i kapat (kişisel kullanım, tek kullanıcı)
-- Multi-user için: ENABLE ROW LEVEL SECURITY yap, policy ekle
ALTER TABLE words DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_progress DISABLE ROW LEVEL SECURITY;
