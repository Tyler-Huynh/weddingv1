-- Run this once against your Postgres database (Vercel Postgres / Neon)
-- before your first RSVP comes in. See README.md for exactly how.

CREATE TABLE IF NOT EXISTS rsvps (
  id SERIAL PRIMARY KEY,
  guest_name TEXT NOT NULL,
  email TEXT NOT NULL,
  attending TEXT NOT NULL,          -- 'Joyfully accepts' or 'Regretfully declines'
  party_size INTEGER NOT NULL DEFAULT 1,
  additional_guest_names TEXT,      -- comma-separated names of extra guests in the party
  allergies TEXT,
  num_over_21 INTEGER NOT NULL DEFAULT 0,   -- number of guests 21 or older
  num_under_12 INTEGER NOT NULL DEFAULT 0,  -- number of children (12 or under)
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up the admin view's "most recent first" sort
CREATE INDEX IF NOT EXISTS rsvps_submitted_at_idx ON rsvps (submitted_at DESC);
