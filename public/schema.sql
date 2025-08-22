CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  vision TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  goal_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  completed INTEGER DEFAULT 0,
  order_num INTEGER,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (goal_id) REFERENCES goals(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  milestone_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date TEXT,
  completed_at TEXT,
  dependencies TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id)
);

CREATE TABLE IF NOT EXISTS emotion_logs (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE,
  mood INTEGER,
  energy INTEGER,
  note TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS ai_proposals (
  id TEXT PRIMARY KEY,
  type TEXT,
  input TEXT,
  output TEXT,
  applied INTEGER DEFAULT 0,
  created_at TEXT
);