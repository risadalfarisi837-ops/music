-- ====================================================================
-- DATABASE SCHEMA LENGKAP - APLIKASI MUSIK (MUSIKUZYY / STREAM BEATS)
-- VERSI FINAL (Mencakup Premium, Chat, Leaderboard, Stories, dll)
-- Salin semua isi file ini dan jalankan di SQL Editor Supabase.
-- URL: https://supabase.com/dashboard -> pilih project -> SQL Editor
-- ====================================================================

-- ============================================================
-- BAGIAN 1: TABEL PROFILES (Profil Pengguna)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              text,
  name               text,
  full_name          text,
  avatar_url         text,
  banner_url         text,
  is_premium         boolean DEFAULT false,
  premium_expires_at timestamp with time zone,
  is_admin           boolean DEFAULT false,
  updated_at         timestamp with time zone DEFAULT now(),
  created_at         timestamp with time zone DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, full_name, avatar_url, banner_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Pengguna'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Pengguna'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'banner_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- BAGIAN 2: TABEL MUSIK & SOSIAL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.playlists (
  id         text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  img        text,
  tracks     jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.liked_songs (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id   text NOT NULL,
  track_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.play_history (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id   text NOT NULL,
  track_data jsonb NOT NULL,
  played_at  timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscribed_artists (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id  text NOT NULL,
  name       text NOT NULL,
  thumbnails jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, artist_id)
);

CREATE TABLE IF NOT EXISTS public.saved_albums (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id   text NOT NULL,
  name       text NOT NULL,
  artist     text,
  thumbnails jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, album_id)
);

CREATE TABLE IF NOT EXISTS public.recent_searches (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query      text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, query)
);

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamp with time zone DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- LEADERBOARD VIEW
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  user_id,
  COUNT(*) as total_plays
FROM public.play_history
GROUP BY user_id;

-- ============================================================
-- BAGIAN 3: TABEL NOTIFIKASI
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  message    text,
  type       text,
  is_read    boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.global_notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text NOT NULL,
  message    text,
  image_url  text,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- BAGIAN 4: TABEL PESAN / CHAT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text,
  is_group   boolean DEFAULT false,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_members (
  room_id   uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id     uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text        text NOT NULL,
  created_at  timestamp with time zone DEFAULT now(),
  reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  is_edited   boolean DEFAULT false,
  is_deleted  boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.saved_stickers (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url        text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, url)
);

-- ============================================================
-- BAGIAN 5: TABEL PREMIUM & TRANSAKSI
-- ============================================================

CREATE TABLE IF NOT EXISTS public.premium_packages (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  price         integer NOT NULL,
  duration_days integer NOT NULL,
  benefits      text[] DEFAULT '{}'::text[],
  is_active     boolean DEFAULT true,
  created_at    timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id      uuid REFERENCES public.premium_packages(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'free_trial'
  proof_image_url text,
  created_at      timestamp with time zone DEFAULT now()
);

-- ============================================================
-- BAGIAN 6: TABEL STORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stories (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_data jsonb NOT NULL,
  caption    text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.story_views (
  story_id   uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  timestamp with time zone DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

-- ============================================================
-- BAGIAN 7: INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_playlists_user_id         ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_songs_user_id        ON public.liked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_play_history_user_id       ON public.play_history(user_id);
CREATE INDEX IF NOT EXISTS idx_play_history_played_at     ON public.play_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id       ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id           ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at        ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id       ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status        ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_stories_user_id            ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at         ON public.stories(created_at DESC);

-- ============================================================
-- BAGIAN 8: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_songs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribed_artists   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_albums         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_searches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_stickers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_packages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views          ENABLE ROW LEVEL SECURITY;

-- Buka Akses Membaca (Read) ke Tabel yang Diperlukan Semua Orang
CREATE POLICY "Public Read Access" ON public.profiles             FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.playlists            FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.follows              FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.blocks               FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.global_notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Public Read Access" ON public.premium_packages     FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.stories              FOR SELECT USING (true);

-- Aturan Khusus Tabel Transaksi
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Aturan Khusus Tabel Profil
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Aturan Chat & Messages
CREATE POLICY "Chat room members can view their rooms" ON public.chat_rooms FOR SELECT USING (id IN (SELECT room_id FROM public.chat_members WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create chat rooms" ON public.chat_rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members can view other members in same room" ON public.chat_members FOR SELECT USING (room_id IN (SELECT room_id FROM public.chat_members WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can join chat rooms" ON public.chat_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Members can view messages in their rooms" ON public.messages FOR SELECT USING (room_id IN (SELECT room_id FROM public.chat_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can send messages to their rooms" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND room_id IN (SELECT room_id FROM public.chat_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can view reactions" ON public.message_reactions FOR SELECT USING (message_id IN (SELECT id FROM public.messages WHERE room_id IN (SELECT room_id FROM public.chat_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can manage their own reactions" ON public.message_reactions FOR ALL USING (auth.uid() = user_id);

-- Default: Users Can Manage Their Own Data (CRUD)
CREATE POLICY "Manage own playlists"          ON public.playlists            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own liked_songs"        ON public.liked_songs          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own play_history"       ON public.play_history         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own subscribed_artists" ON public.subscribed_artists   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own saved_albums"       ON public.saved_albums         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own recent_searches"    ON public.recent_searches      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own follows"            ON public.follows              FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY "Manage own blocks"             ON public.blocks               FOR ALL USING (auth.uid() = blocker_id);
CREATE POLICY "Manage own notifications"      ON public.notifications        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own saved_stickers"     ON public.saved_stickers       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own stories"            ON public.stories              FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert story views"  ON public.story_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view story viewers"  ON public.story_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stories WHERE stories.id = story_views.story_id AND stories.user_id = auth.uid()) OR auth.uid() = user_id
);

-- ============================================================
-- BAGIAN 9: REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- ============================================================
-- BAGIAN 10: AUTO-CLEANUP STORIES (Cron Job)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'cleanup_old_stories', 
  '0 * * * *', 
  $$ DELETE FROM public.stories WHERE created_at < NOW() - INTERVAL '24 hours'; $$
);

-- ====================================================================
-- BAGIAN 11: STORAGE (Penyimpanan Berkas)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('stickers', 'stickers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payments', 'payments', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('qris', 'qris', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to stickers" ON storage.objects;
CREATE POLICY "Public access to stickers" ON storage.objects FOR SELECT USING (bucket_id = 'stickers');
CREATE POLICY "Users can upload their own stickers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stickers' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public access to payments" ON storage.objects;
CREATE POLICY "Public access to payments" ON storage.objects FOR SELECT USING (bucket_id = 'payments');
CREATE POLICY "Users can upload their own payments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payments' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public access to qris" ON storage.objects;
CREATE POLICY "Public access to qris" ON storage.objects FOR SELECT USING (bucket_id = 'qris');
CREATE POLICY "Users can manage qris" ON storage.objects FOR ALL USING (bucket_id = 'qris' AND auth.role() = 'authenticated');

-- ====================================================================
-- SELESAI! Database siap digunakan.
-- ====================================================================
