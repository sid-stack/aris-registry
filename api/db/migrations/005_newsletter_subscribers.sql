-- Newsletter / Bid Brief email capture (also auto-created by api/services/newsletterSubscribers.js on first write).
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  source     TEXT DEFAULT 'newsletter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_idx
  ON newsletter_subscribers (email);
