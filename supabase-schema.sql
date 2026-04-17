-- ============================================
-- Symptom Tracker — Supabase Schema
-- ============================================
-- Run this in your Supabase SQL Editor to set
-- up tables, RLS policies, triggers, and functions.
-- ============================================

-- ---------- Tables ----------

CREATE TABLE default_symptoms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  emoji VARCHAR(10) NOT NULL,
  display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE symptoms (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_symptoms_user ON symptoms (user_id);

CREATE TABLE symptom_logs (
  id SERIAL PRIMARY KEY,
  symptom_id INT NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activity TEXT,
  notes TEXT,
  severity INT CHECK (severity BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_symptom_logs_occurred ON symptom_logs (occurred_at DESC);
CREATE INDEX idx_symptom_logs_symptom ON symptom_logs (symptom_id);
CREATE INDEX idx_symptom_logs_user ON symptom_logs (user_id);

-- ---------- Row Level Security ----------

ALTER TABLE default_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;

-- default_symptoms: readable by any authenticated user
CREATE POLICY "Authenticated users can read defaults"
  ON default_symptoms FOR SELECT TO authenticated USING (true);

-- symptoms
CREATE POLICY "Users can read own symptoms"
  ON symptoms FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptoms"
  ON symptoms FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symptoms"
  ON symptoms FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symptoms"
  ON symptoms FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- symptom_logs
CREATE POLICY "Users can read own logs"
  ON symptom_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON symptom_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON symptom_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- Seed Data ----------

INSERT INTO default_symptoms (name, emoji, display_order) VALUES
  ('Tired',              '😴', 1),
  ('Light Headed',       '💫', 2),
  ('Nauseous',           '🤢', 3),
  ('Vomiting',           '🤮', 4),
  ('Dizzy',              '😵‍💫', 5),
  ('Poor Sleep',         '😩', 6),
  ('Chest Pain',         '💔', 7),
  ('Heart Palpitations', '💓', 8),
  ('Racing Heartbeat',   '🏃‍♂️', 9),
  ('Shortness of Breath','😮‍💨', 10),
  ('Headache',           '🤕', 11),
  ('Fever',              '🤒', 12),
  ('Muscle Pain',        '💪', 13),
  ('Anxiety',            '😰', 14),
  ('Brain Fog',          '🌫️', 15),
  ('Stomach Pain',       '🤰', 16),
  ('Sore Throat',        '🗣️', 17),
  ('Congestion',         '🤧', 18)
ON CONFLICT (name) DO NOTHING;

-- ---------- Triggers ----------

-- Auto-assign display_order when not specified (i.e. default 0)
CREATE OR REPLACE FUNCTION set_symptom_display_order()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.display_order = 0 THEN
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO NEW.display_order
    FROM symptoms
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_symptom_display_order
  BEFORE INSERT ON symptoms
  FOR EACH ROW EXECUTE FUNCTION set_symptom_display_order();

-- Prevent deleting symptoms that have logs (force archive instead)
CREATE OR REPLACE FUNCTION prevent_symptom_delete_with_logs()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM symptom_logs WHERE symptom_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete symptom with existing logs. Archive it instead.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER check_symptom_logs_before_delete
  BEFORE DELETE ON symptoms
  FOR EACH ROW EXECUTE FUNCTION prevent_symptom_delete_with_logs();

-- Seed default symptoms for newly registered users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO symptoms (user_id, name, emoji, display_order)
  SELECT NEW.id, name, emoji, display_order FROM default_symptoms;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------- Report Functions (called via supabase.rpc) ----------

CREATE OR REPLACE FUNCTION report_frequency(p_days INT DEFAULT 30)
RETURNS TABLE(id INT, name VARCHAR(100), emoji VARCHAR(10), count BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT s.id, s.name, s.emoji, COUNT(sl.id) AS count
  FROM symptoms s
  LEFT JOIN symptom_logs sl
    ON sl.symptom_id = s.id
    AND sl.occurred_at >= NOW() - make_interval(days => p_days)
  WHERE s.user_id = auth.uid()
  GROUP BY s.id, s.name, s.emoji
  HAVING COUNT(sl.id) > 0
  ORDER BY count DESC;
$$;

CREATE OR REPLACE FUNCTION report_timeline(p_days INT DEFAULT 30)
RETURNS TABLE(date DATE, name VARCHAR(100), emoji VARCHAR(10), count BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT
    DATE(sl.occurred_at AT TIME ZONE 'UTC') AS date,
    s.name,
    s.emoji,
    COUNT(*) AS count
  FROM symptom_logs sl
  JOIN symptoms s ON s.id = sl.symptom_id
  WHERE sl.user_id = auth.uid()
    AND sl.occurred_at >= NOW() - make_interval(days => p_days)
  GROUP BY date, s.name, s.emoji
  ORDER BY date;
$$;

CREATE OR REPLACE FUNCTION report_severity(p_days INT DEFAULT 30)
RETURNS TABLE(date DATE, name VARCHAR(100), emoji VARCHAR(10), avg_severity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT
    DATE(sl.occurred_at AT TIME ZONE 'UTC') AS date,
    s.name,
    s.emoji,
    ROUND(AVG(sl.severity), 1)::float AS avg_severity
  FROM symptom_logs sl
  JOIN symptoms s ON s.id = sl.symptom_id
  WHERE sl.user_id = auth.uid()
    AND sl.severity IS NOT NULL
    AND sl.occurred_at >= NOW() - make_interval(days => p_days)
  GROUP BY date, s.name, s.emoji
  ORDER BY date;
$$;

CREATE OR REPLACE FUNCTION report_hourly(p_days INT DEFAULT 30)
RETURNS TABLE(hour INT, count BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT
    EXTRACT(HOUR FROM sl.occurred_at)::int AS hour,
    COUNT(*) AS count
  FROM symptom_logs sl
  WHERE sl.user_id = auth.uid()
    AND sl.occurred_at >= NOW() - make_interval(days => p_days)
  GROUP BY hour
  ORDER BY hour;
$$;

CREATE OR REPLACE FUNCTION report_daily_total(p_days INT DEFAULT 30)
RETURNS TABLE(date DATE, count BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT
    DATE(sl.occurred_at AT TIME ZONE 'UTC') AS date,
    COUNT(*) AS count
  FROM symptom_logs sl
  WHERE sl.user_id = auth.uid()
    AND sl.occurred_at >= NOW() - make_interval(days => p_days)
  GROUP BY date
  ORDER BY date;
$$;

-- Revoke anonymous access to report functions
REVOKE EXECUTE ON FUNCTION report_frequency FROM anon;
REVOKE EXECUTE ON FUNCTION report_timeline FROM anon;
REVOKE EXECUTE ON FUNCTION report_severity FROM anon;
REVOKE EXECUTE ON FUNCTION report_hourly FROM anon;
REVOKE EXECUTE ON FUNCTION report_daily_total FROM anon;
