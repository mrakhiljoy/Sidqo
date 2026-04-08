-- Sidqo Translation Service Schema
-- Run this in Supabase SQL Editor on a fresh project.

-- ─── Vendors ────────────────────────────────────────────────
create table if not exists vendors (
  id               text primary key,
  name             text not null,
  email            text not null unique,
  whatsapp_number  text,
  language_pairs   text[] not null default '{}',
  moj_cert_number  text not null,
  active           boolean not null default true,
  avg_delivery_hours numeric,
  jobs_completed   integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ─── Translation Jobs ───────────────────────────────────────
create table if not exists translation_jobs (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   text not null,
  user_email                text not null,
  user_name                 text,
  vendor_id                 text references vendors(id),
  document_type             text not null,
  source_language           text not null default 'en',
  target_language           text not null default 'ar',
  total_pages               integer not null,
  status                    text not null,
  price_aed                 numeric not null,
  vendor_payout_aed         numeric not null,
  stripe_payment_intent_id  text,
  stripe_checkout_session_id text,
  dispatch_channel          text not null default 'email',
  dispatch_message_id       text,
  certified_pdf_url         text,
  word_doc_url              text,
  source_storage_path       text,
  deliverable_storage_path  text,
  created_at                timestamptz not null default now(),
  paid_at                   timestamptz,
  dispatched_at             timestamptz,
  completed_at              timestamptz,
  sla_breach_at             timestamptz not null,
  refund_triggered_at       timestamptz
);

create index if not exists translation_jobs_user_email_idx on translation_jobs(user_email);
create index if not exists translation_jobs_checkout_idx on translation_jobs(stripe_checkout_session_id);
create index if not exists translation_jobs_status_idx on translation_jobs(status);

-- ─── Translation Documents (1:many on jobs) ─────────────────
create table if not exists translation_documents (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid not null references translation_jobs(id) on delete cascade,
  doc_type            text not null,
  original_filename   text not null,
  source_url          text not null,
  translated_pdf_url  text,
  translated_word_url text,
  page_count          integer not null,
  uploaded_at         timestamptz not null default now()
);

create index if not exists translation_documents_job_idx on translation_documents(job_id);

-- ─── Seed first vendor: Dar Al Marjaan ──────────────────────
insert into vendors (id, name, email, language_pairs, moj_cert_number, active)
values ('vendor-dar-al-marjaan', 'Dar Al Marjaan', 'info@daralmarjaan.com', '{en-ar}', 'MOJ-DAM-001', true)
on conflict (id) do nothing;

-- ─── Storage Buckets ────────────────────────────────────────
-- Run these in Supabase dashboard (Storage → New bucket) or via the JS admin API:
--   translation-sources       (private)
--   translation-deliverables  (private)
