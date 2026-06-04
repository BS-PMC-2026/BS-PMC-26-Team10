CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  events_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  discounts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  new_products_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribe_token TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_subscriptions
ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS notification_subscriptions_active_idx
ON notification_subscriptions (is_active);

CREATE UNIQUE INDEX IF NOT EXISTS notification_subscriptions_unsubscribe_token_idx
ON notification_subscriptions (unsubscribe_token);

ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE notification_subscriptions IS
'Stores visitor consent and preferences for ChiliLand email updates. Access is handled by the backend.';
