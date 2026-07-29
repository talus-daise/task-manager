import type { Env, StreakRow } from '../types';
import { DEFAULT_USER_ID } from '../types';
import { todayISOInJST, yesterdayISOInJST } from './jst';

/**
 * その日最初の「達成アクション」（タスク完了 or 持ち物全チェック）が起きたときに呼ぶ。
 * 「その日」の判定はJST基準。同日2回目以降の呼び出しは何もしない（1日1カウント）。
 */
export async function recordDailyActivity(env: Env, today: string = todayISOInJST()): Promise<StreakRow> {
  const row = await env.DB.prepare('SELECT * FROM streaks WHERE user_id = ?')
    .bind(DEFAULT_USER_ID)
    .first<StreakRow>();

  const current: StreakRow = row ?? {
    user_id: DEFAULT_USER_ID,
    current_count: 0,
    longest_count: 0,
    last_completed_date: null,
  };

  if (current.last_completed_date === today) {
    return current; // 今日はすでに記録済み
  }

  const isConsecutive = current.last_completed_date === yesterdayISOInJST(today);
  const newCurrent = isConsecutive ? current.current_count + 1 : 1;
  const newLongest = Math.max(current.longest_count, newCurrent);

  await env.DB.prepare(
    `INSERT INTO streaks (user_id, current_count, longest_count, last_completed_date)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       current_count = excluded.current_count,
       longest_count = excluded.longest_count,
       last_completed_date = excluded.last_completed_date`
  )
    .bind(DEFAULT_USER_ID, newCurrent, newLongest, today)
    .run();

  return { user_id: DEFAULT_USER_ID, current_count: newCurrent, longest_count: newLongest, last_completed_date: today };
}
