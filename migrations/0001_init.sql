-- Same shape as the Mongoose models on main (db.js), as SQL tables.
-- The CHECK and FOREIGN KEY constraints do the safety work: a transfer that would
-- overdraw an account or point at a missing account fails inside the transaction,
-- so the whole transfer rolls back.

CREATE TABLE users (
  id         TEXT PRIMARY KEY,                      -- crypto.randomUUID()
  username   TEXT NOT NULL UNIQUE COLLATE NOCASE,   -- the email; one account per address
  password   TEXT NOT NULL,                         -- PBKDF2 hash, never the plain password
  firstname  TEXT NOT NULL CHECK (length(firstname) <= 50),
  lastname   TEXT NOT NULL CHECK (length(lastname) <= 50),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL CHECK (balance >= 0)     -- whole rupees, never negative
);

-- One row per successful transfer: written in the same transaction as the two balance updates.
CREATE TABLE transfers (
  id         TEXT PRIMARY KEY,
  from_user  TEXT NOT NULL REFERENCES accounts(user_id),
  to_user    TEXT NOT NULL REFERENCES accounts(user_id),
  amount     INTEGER NOT NULL CHECK (amount > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (from_user <> to_user)
);

CREATE INDEX transfers_from_user ON transfers(from_user, created_at);
CREATE INDEX transfers_to_user   ON transfers(to_user, created_at);
