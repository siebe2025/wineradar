-- ============================================================
-- Migration 002: extend api_usage for richer tracking
-- Safe to run on existing data (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================

ALTER TABLE public.api_usage
  ADD COLUMN IF NOT EXISTS metadata       jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS briefing_id    uuid REFERENCES public.briefings(id)     ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS briefing_job_id uuid REFERENCES public.briefing_jobs(id) ON DELETE SET NULL;
