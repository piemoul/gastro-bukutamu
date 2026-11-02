CREATE TABLE IF NOT EXISTS managed_events (
  event_code TEXT PRIMARY KEY REFERENCES events(code) ON DELETE CASCADE,
  address TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  password_hash TEXT NOT NULL UNIQUE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_whitelist (
  event_code TEXT NOT NULL REFERENCES managed_events(event_code) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email = lower(trim(email))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_code, email)
);

-- Accounts provisioned by a whitelist may use only their whitelisted new events.
CREATE TABLE IF NOT EXISTS managed_event_users (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);
