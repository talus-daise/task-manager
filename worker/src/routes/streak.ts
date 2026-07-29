import { Hono } from 'hono';
import type { Env, StreakRow } from '../types';
import { DEFAULT_USER_ID } from '../types';

const streak = new Hono<{ Bindings: Env }>();

streak.get('/', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM streaks WHERE user_id = ?')
    .bind(DEFAULT_USER_ID)
    .first<StreakRow>();
  return c.json({
    streak: row ?? { user_id: DEFAULT_USER_ID, current_count: 0, longest_count: 0, last_completed_date: null },
  });
});

export default streak;
