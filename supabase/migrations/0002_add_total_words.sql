-- Add word-count column to support word-based pricing
alter table translation_jobs add column if not exists total_words integer;

-- Update metadata column in Stripe webhook records (existing jobs)
-- (No data migration needed; existing jobs without word count will use null)
