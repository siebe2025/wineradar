-- ============================================================
-- WineRadar Database Setup
-- Run this in the Supabase SQL Editor (once, in order)
-- ============================================================

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  created_at timestamptz DEFAULT now()
);

-- 2. brands
CREATE TABLE IF NOT EXISTS public.brands (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  region     text,
  country    text,
  notes      text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

-- 3. topics
CREATE TABLE IF NOT EXISTS public.topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  is_default  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

-- 4. email_settings
CREATE TABLE IF NOT EXISTS public.email_settings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  recipient_email  text NOT NULL,
  send_day         text DEFAULT 'monday',
  is_enabled       boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 5. briefing_jobs
CREATE TABLE IF NOT EXISTS public.briefing_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text NOT NULL CHECK (status IN ('pending', 'running', 'done', 'failed')),
  scheduled_for date NOT NULL,
  started_at    timestamptz,
  finished_at   timestamptz,
  error_message text,
  created_at    timestamptz DEFAULT now()
);

-- 6. briefings
CREATE TABLE IF NOT EXISTS public.briefings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  briefing_job_id uuid REFERENCES briefing_jobs(id) ON DELETE SET NULL,
  title           text NOT NULL,
  summary         text,
  email_sent_at   timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- 7. briefing_items
CREATE TABLE IF NOT EXISTS public.briefing_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id uuid NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  brand_id    uuid REFERENCES brands(id) ON DELETE SET NULL,
  brand_name  text NOT NULL,
  content     text NOT NULL,
  sources     jsonb DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now()
);

-- 8. api_usage
CREATE TABLE IF NOT EXISTS public.api_usage (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      text NOT NULL,
  request_type  text NOT NULL,
  request_count int  NOT NULL DEFAULT 1,
  period_month  text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage      ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- brands
CREATE POLICY "Users can view own brands"
  ON public.brands FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brands"
  ON public.brands FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brands"
  ON public.brands FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brands"
  ON public.brands FOR DELETE USING (auth.uid() = user_id);

-- topics
CREATE POLICY "Users can view own topics"
  ON public.topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topics"
  ON public.topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics"
  ON public.topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own topics"
  ON public.topics FOR DELETE USING (auth.uid() = user_id);

-- email_settings
CREATE POLICY "Users can view own email settings"
  ON public.email_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email settings"
  ON public.email_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email settings"
  ON public.email_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email settings"
  ON public.email_settings FOR DELETE USING (auth.uid() = user_id);

-- briefing_jobs (read-only for users; service role writes)
CREATE POLICY "Users can view own briefing jobs"
  ON public.briefing_jobs FOR SELECT USING (auth.uid() = user_id);

-- briefings (read-only for users; service role writes)
CREATE POLICY "Users can view own briefings"
  ON public.briefings FOR SELECT USING (auth.uid() = user_id);

-- briefing_items (read through parent briefing ownership)
CREATE POLICY "Users can view own briefing items"
  ON public.briefing_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.briefings
      WHERE briefings.id = briefing_items.briefing_id
        AND briefings.user_id = auth.uid()
    )
  );

-- api_usage (users can read; service role inserts)
CREATE POLICY "Users can view own api usage"
  ON public.api_usage FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: seed profile + default topics on new user
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.topics (user_id, name, description, is_default)
  VALUES
    (new.id, 'Market developments',  'Industry trends and market movements',       true),
    (new.id, 'Climate and harvest',  'Weather conditions and harvest reports',     true),
    (new.id, 'New releases',         'New wine releases and products',             true),
    (new.id, 'Scores and reviews',   'Wine scores and critic reviews',             true)
  ON CONFLICT (user_id, name) DO NOTHING;

  RETURN new;
END;
$$;

-- Drop trigger if it already exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
