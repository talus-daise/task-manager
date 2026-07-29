import { Hono } from 'hono';
import type { Env, TaskRow } from '../types';
import { DEFAULT_USER_ID } from '../types';
import { daysAgoISOInJST } from '../lib/jst';

const weeklyReview = new Hono<{ Bindings: Env }>();

function daysAgoISO(n: number): string {
  return daysAgoISOInJST(n);
}

weeklyReview.get('/', async (c) => {
  const since = daysAgoISO(7);

  const { results: created } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? AND created_at >= ?"
  )
    .bind(DEFAULT_USER_ID, since)
    .all<TaskRow>();

  const { results: completed } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? AND status = 'done' AND completed_at >= ?"
  )
    .bind(DEFAULT_USER_ID, since)
    .all<TaskRow>();

  const allInWindow = created ?? [];
  const doneInWindow = completed ?? [];

  const completionRate = allInWindow.length > 0 ? doneInWindow.length / allInWindow.length : null;
  const avgPostponed =
    allInWindow.length > 0
      ? allInWindow.reduce((sum, t) => sum + t.postponed_count, 0) / allInWindow.length
      : 0;

  const byType = { homework: 0, submission: 0, free: 0 } as Record<string, number>;
  for (const t of doneInWindow) byType[t.type] = (byType[t.type] ?? 0) + 1;

  const streakRow = await c.env.DB.prepare('SELECT * FROM streaks WHERE user_id = ?')
    .bind(DEFAULT_USER_ID)
    .first<{ current_count: number; longest_count: number }>();

  return c.json({
    since,
    total_tasks: allInWindow.length,
    completed_tasks: doneInWindow.length,
    completion_rate: completionRate,
    average_postponed_count: Number(avgPostponed.toFixed(2)),
    completed_by_type: byType,
    streak: streakRow ?? { current_count: 0, longest_count: 0 },
  });
});

export default weeklyReview;
