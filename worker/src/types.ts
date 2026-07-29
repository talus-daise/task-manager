export type TaskType = 'homework' | 'submission' | 'free';
export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  type: TaskType;
  due_date: string | null;
  status: TaskStatus;
  postponed_count: number;
  last_seen_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface StudyBlockRow {
  id: string;
  user_id: string;
  weekday: number; // 0=日曜〜6=土曜
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  label: string | null;
}

export interface BelongingRow {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  item_name: string;
  checked: number; // 0 or 1
  created_at: string;
}

export interface StreakRow {
  user_id: string;
  current_count: number;
  longest_count: number;
  last_completed_date: string | null;
}

export interface ImpulseRow {
  id: string;
  user_id: string;
  memo: string;
  created_at: string;
  notified_at: string | null;
  resolved: number;
}

export interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
}

// MVPは単一ユーザー運用のため固定IDを使う（将来ログイン機能を足す際はここを差し替える）
export const DEFAULT_USER_ID = 'demo-user';
