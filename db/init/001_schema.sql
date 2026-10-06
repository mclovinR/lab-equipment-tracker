-- Runs automatically the first time the Postgres container starts (empty volume).

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(120) NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,
  role        VARCHAR(20)  NOT NULL DEFAULT 'student'
              CHECK (role IN ('student', 'researcher', 'admin')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(50)  NOT NULL,
  location    VARCHAR(100),
  status      VARCHAR(20)  NOT NULL DEFAULT 'available'
              CHECK (status IN ('available', 'maintenance', 'retired')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Day 4: you will implement the overlap rules for this table in the service layer.
CREATE TABLE IF NOT EXISTS reservations (
  id            SERIAL PRIMARY KEY,
  equipment_id  INT         NOT NULL REFERENCES equipment(id),
  user_id       INT         NOT NULL REFERENCES users(id),
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_reservations_equipment_time
  ON reservations (equipment_id, starts_at, ends_at);
