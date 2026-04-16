const pool = require('../config/db');

const migration = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS default_symptoms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    emoji VARCHAR(10) NOT NULL,
    display_order INT NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS symptoms (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
  );

  CREATE INDEX IF NOT EXISTS idx_symptoms_user
    ON symptoms (user_id);

  CREATE TABLE IF NOT EXISTS symptom_logs (
    id SERIAL PRIMARY KEY,
    symptom_id INT NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activity TEXT,
    notes TEXT,
    severity INT CHECK (severity BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_symptom_logs_occurred
    ON symptom_logs (occurred_at DESC);

  CREATE INDEX IF NOT EXISTS idx_symptom_logs_symptom
    ON symptom_logs (symptom_id);

  CREATE INDEX IF NOT EXISTS idx_symptom_logs_user
    ON symptom_logs (user_id);

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
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(migration);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
