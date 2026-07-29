export type TaskType = 'homework' | 'submission' | 'free';
export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  due_date: string | null;
  status: TaskStatus;
  postponed_count: number;
  priority_score: number;
  days_left: number | null;
}

export interface BelongingItem {
  id: string;
  date: string;
  item_name: string;
  checked: number;
}

export interface StudyBlock {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  label: string | null;
}

export interface Streak {
  current_count: number;
  longest_count: number;
  last_completed_date: string | null;
}

export interface Impulse {
  id: string;
  memo: string;
  created_at: string;
}

export interface WeeklyReview {
  since: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number | null;
  average_postponed_count: number;
  completed_by_type: Record<string, number>;
  streak: { current_count: number; longest_count: number };
}

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  homework: '宿題',
  submission: '提出物',
  free: '自由',
};

export const WEEKDAY_LABEL = ['日', '月', '火', '水', '木', '金', '土'];
