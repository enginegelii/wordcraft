-- WordCraft Veritabanı Şeması
-- Supabase Dashboard > SQL Editor'da çalıştırın

-- Kullanıcı istatistikleri
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_count INTEGER DEFAULT 0,
  last_active_date DATE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_words_added INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  daily_goal INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Kelimeler
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  part_of_speech TEXT,
  ipa TEXT,
  examples JSONB DEFAULT '[]',
  synonyms TEXT[] DEFAULT '{}',
  antonyms TEXT[] DEFAULT '{}',
  context_tag TEXT DEFAULT 'genel',
  original_context TEXT,
  image_url TEXT,
  grammar_note TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tekrar kayıtları (SM-2)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  ease_factor FLOAT DEFAULT 2.5,
  interval INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE NOT NULL,
  last_review_date DATE,
  UNIQUE(word_id)
);

-- Oyun oturumları
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  words_practiced UUID[] DEFAULT '{}',
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER DEFAULT 0
);

-- Başarımlar
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- RLS (Row Level Security) politikaları
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi verilerini görebilir
CREATE POLICY "Kullanıcı kendi istatistiklerini yönetebilir" ON user_stats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi kelimelerini yönetebilir" ON words
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi tekrarlarını yönetebilir" ON reviews
  FOR ALL USING (
    word_id IN (SELECT id FROM words WHERE user_id = auth.uid())
  );

CREATE POLICY "Kullanıcı kendi oyunlarını yönetebilir" ON game_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi başarımlarını yönetebilir" ON achievements
  FOR ALL USING (auth.uid() = user_id);

-- Güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
