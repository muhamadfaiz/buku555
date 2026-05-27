-- ============================================================
-- Migration: label, is_pending, tags, receipt_url
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

alter table expenses
  add column if not exists label       text,
  add column if not exists is_pending  boolean      not null default false,
  add column if not exists tags        text[]       not null default '{}',
  add column if not exists receipt_url text;

-- ── Storage bucket for receipt photos ─────────────────────
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- ── Storage policies ───────────────────────────────────────
-- DROP first so re-running this script is safe
-- (CREATE POLICY does not support IF NOT EXISTS in PostgreSQL)
drop policy if exists "receipts_upload" on storage.objects;
drop policy if exists "receipts_read"   on storage.objects;

-- Authenticated users may only upload inside their own UID folder
create policy "receipts_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (bucket is public)
create policy "receipts_read" on storage.objects
  for select using (bucket_id = 'receipts');
