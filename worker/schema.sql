-- タスク管理アプリ D1 スキーマ
-- MVPは単一ユーザー想定だが、将来の拡張に備えて user_id を持たせておく

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 宿題・提出物・自由タスクをまとめて管理
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('homework', 'submission', 'free')),
  due_date TEXT,                     -- YYYY-MM-DD、締切なしタスクはNULL可
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  postponed_count INTEGER NOT NULL DEFAULT 0,
  last_seen_date TEXT,               -- Todayに最後に表示された日付（先延ばし回数の計測用）
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 固定学習ブロック（曜日×時間帯）
CREATE TABLE IF NOT EXISTS study_blocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=日曜
  start_time TEXT NOT NULL,          -- HH:MM
  end_time TEXT NOT NULL,            -- HH:MM
  label TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 持ち物チェックリスト（日にち指定で手動入力）
CREATE TABLE IF NOT EXISTS belongings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,                -- YYYY-MM-DD 持っていく日
  item_name TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ストリーク（連続達成日数）
CREATE TABLE IF NOT EXISTS streaks (
  user_id TEXT PRIMARY KEY,
  current_count INTEGER NOT NULL DEFAULT 0,
  longest_count INTEGER NOT NULL DEFAULT 0,
  last_completed_date TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 「あとで通知」= 衝動退避メモ
CREATE TABLE IF NOT EXISTS impulses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  memo TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  notified_at TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_belongings_user_date ON belongings(user_id, date);
CREATE INDEX IF NOT EXISTS idx_impulses_user_resolved ON impulses(user_id, resolved);

-- MVP用のデフォルトユーザーとストリーク行を用意
INSERT OR IGNORE INTO users (id, name) VALUES ('demo-user', 'demo');
INSERT OR IGNORE INTO streaks (user_id, current_count, longest_count) VALUES ('demo-user', 0, 0);
