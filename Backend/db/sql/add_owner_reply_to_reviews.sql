-- Run this in the Supabase SQL Editor to add owner reply support to tour_reviews.
ALTER TABLE tour_reviews
    ADD COLUMN IF NOT EXISTS owner_reply  TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS replied_at   TIMESTAMPTZ DEFAULT NULL;
