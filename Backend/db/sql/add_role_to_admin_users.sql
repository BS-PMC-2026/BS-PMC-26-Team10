-- Add role column to admin_users.
-- Existing rows default to 'owner' so the current owner account is unaffected.
-- Run this once in the Supabase SQL editor.

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'owner';
