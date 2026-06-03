-- prisma/migrations/add_worker_heartbeat.sql
-- Run once to add the worker heartbeat table
-- npx prisma db execute --file prisma/migrations/add_worker_heartbeat.sql

CREATE TABLE IF NOT EXISTS worker_heartbeat (
  id        INTEGER PRIMARY KEY DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial row
INSERT INTO worker_heartbeat (id, last_seen)
VALUES (1, NOW())
ON CONFLICT (id) DO NOTHING;
