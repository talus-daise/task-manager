import type {
  BelongingItem,
  Impulse,
  StudyBlock,
  Streak,
  Task,
  TaskType,
  WeeklyReview,
} from './types';
import { getApiBase } from './config';

// 拡張機能の新しいタブページには開発サーバーのプロキシが無いため、
// 保存済みのWorker URLを毎回解決してから叩く。未設定時は相対パス（開発時のvite proxy用）。
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `リクエストに失敗しました (${res.status})`);
  }
  return res.json();
}

export async function checkHealth(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  // タスク
  getToday: () => request<{ tasks: Task[] }>('/tasks/today'),
  getTasks: (status?: string) => request<{ tasks: Task[] }>(`/tasks${status ? `?status=${status}` : ''}`),
  createTask: (input: { title: string; type: TaskType; due_date: string | null }) =>
    request<{ task: Task }>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
  quickAddTask: (text: string) =>
    request<{ task: Task }>('/tasks/parse', { method: 'POST', body: JSON.stringify({ text }) }),
  updateTask: (id: string, input: Partial<{ title: string; due_date: string | null; status: string }>) =>
    request<{ task: Task }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteTask: (id: string) => request<{ ok: true }>(`/tasks/${id}`, { method: 'DELETE' }),
  getFocusQueue: () => request<{ next: Task | null }>('/tasks/focus-queue'),

  // 持ち物
  getBelongings: (date: string) => request<{ date: string; items: BelongingItem[] }>(`/belongings?date=${date}`),
  addBelonging: (input: { date: string; item_name: string }) =>
    request<{ item: BelongingItem }>('/belongings', { method: 'POST', body: JSON.stringify(input) }),
  toggleBelonging: (id: string, checked: boolean) =>
    request<{ item: BelongingItem }>(`/belongings/${id}`, { method: 'PATCH', body: JSON.stringify({ checked }) }),
  deleteBelonging: (id: string) => request<{ ok: true }>(`/belongings/${id}`, { method: 'DELETE' }),

  // 固定学習ブロック
  getStudyBlocks: () => request<{ blocks: StudyBlock[] }>('/study-blocks'),
  addStudyBlock: (input: { weekday: number; start_time: string; end_time: string; label?: string }) =>
    request<{ block: StudyBlock }>('/study-blocks', { method: 'POST', body: JSON.stringify(input) }),
  deleteStudyBlock: (id: string) => request<{ ok: true }>(`/study-blocks/${id}`, { method: 'DELETE' }),
  getCurrentStudyBlock: () => request<{ active: StudyBlock | null }>('/study-blocks/current'),

  // ストリーク
  getStreak: () => request<{ streak: Streak }>('/streak'),

  // あとで通知
  addImpulse: (memo: string) => request<{ impulse: Impulse }>('/impulses', { method: 'POST', body: JSON.stringify({ memo }) }),
  getPendingImpulses: () => request<{ impulses: Impulse[] }>('/impulses/pending'),
  notifyImpulse: (id: string) => request<{ ok: true }>(`/impulses/${id}/notify`, { method: 'POST' }),
  resolveImpulse: (id: string) => request<{ ok: true }>(`/impulses/${id}`, { method: 'PATCH' }),

  // 週次振り返り
  getWeeklyReview: () => request<WeeklyReview>('/weekly-review'),
};
