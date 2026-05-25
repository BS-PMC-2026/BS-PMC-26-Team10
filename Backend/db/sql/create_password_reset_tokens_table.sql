CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    admin_id    INTEGER      NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    used_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prt_token    ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS idx_prt_admin_id ON password_reset_tokens (admin_id);
