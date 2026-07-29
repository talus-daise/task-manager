import { Hono } from 'hono';
import type { Env, TaskRow, TaskType } from '../types';
import { DEFAULT_USER_ID } from '../types';
import { calcPriorityScore, daysUntil } from '../lib/priority';
import { recordDailyActivity } from '../lib/streak';
import { parseTaskWithGemini } from '../lib/gemini';
import { todayISOInJST } from '../lib/jst';

const tasks = new Hono<{ Bindings: Env }>();

function todayISO(): string {
  return todayISOInJST();
}

function withScore(row: TaskRow) {
  return {
    ...row,
    priority_score: calcPriorityScore(row.type, row.due_date),
    days_left: daysUntil(row.due_date),
  };
}

// 一覧取得（?status=pending などで絞り込み可）
tasks.get('/', async (c) => {
  const status = c.req.query('status');
  const query = status
    ? c.env.DB.prepare('SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY created_at DESC').bind(
        DEFAULT_USER_ID,
        status
      )
    : c.env.DB.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC').bind(DEFAULT_USER_ID);

  const { results } = await query.all<TaskRow>();
  const withScores = (results ?? []).map(withScore).sort((a, b) => b.priority_score - a.priority_score);
  return c.json({ tasks: withScores });
});

// Todayホーム: 未完了タスクの中から優先度上位3件のみを返す
// 併せて「前回表示日から日をまたいでいるのに未完了」のタスクの先延ばし回数を加算する
tasks.get('/today', async (c) => {
  const today = todayISO();
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? AND status != 'done' ORDER BY created_at DESC"
  )
    .bind(DEFAULT_USER_ID)
    .all<TaskRow>();

  const pending = results ?? [];

  for (const t of pending) {
    if (t.last_seen_date && t.last_seen_date !== today) {
      await c.env.DB.prepare(
        'UPDATE tasks SET postponed_count = postponed_count + 1, last_seen_date = ? WHERE id = ?'
      )
        .bind(today, t.id)
        .run();
      t.postponed_count += 1;
    } else if (!t.last_seen_date) {
      await c.env.DB.prepare('UPDATE tasks SET last_seen_date = ? WHERE id = ?').bind(today, t.id).run();
    }
    t.last_seen_date = today;
  }

  const top3 = pending.map(withScore).sort((a, b) => b.priority_score - a.priority_score).slice(0, 3);

  return c.json({ tasks: top3 });
});

// タスク作成
tasks.post('/', async (c) => {
  const body = await c.req.json<{ title: string; type: TaskType; due_date?: string | null }>();
  if (!body.title || !body.type) {
    return c.json({ error: 'title と type は必須です' }, 400);
  }
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO tasks (id, user_id, title, type, due_date, status) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(id, DEFAULT_USER_ID, body.title, body.type, body.due_date ?? null, 'pending')
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first<TaskRow>();
  return c.json({ task: withScore(row!) }, 201);
});

// 自然文からのクイック追加（Gemini解析）
tasks.post('/parse', async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!text) return c.json({ error: 'text は必須です' }, 400);

  const parsed = await parseTaskWithGemini(c.env, text);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO tasks (id, user_id, title, type, due_date, status) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(id, DEFAULT_USER_ID, parsed.title, parsed.type, parsed.due_date, 'pending')
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first<TaskRow>();
  return c.json({ task: withScore(row!) }, 201);
});

// 更新（着手・完了・編集）
tasks.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<Partial<Pick<TaskRow, 'title' | 'due_date' | 'status'>>>();

  const existing = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .bind(id, DEFAULT_USER_ID)
    .first<TaskRow>();
  if (!existing) return c.json({ error: 'タスクが見つかりません' }, 404);

  const nextTitle = body.title ?? existing.title;
  const nextDue = body.due_date !== undefined ? body.due_date : existing.due_date;
  const nextStatus = body.status ?? existing.status;
  const completedAt = nextStatus === 'done' ? new Date().toISOString() : existing.completed_at;

  await c.env.DB.prepare(
    'UPDATE tasks SET title = ?, due_date = ?, status = ?, completed_at = ? WHERE id = ?'
  )
    .bind(nextTitle, nextDue, nextStatus, completedAt, id)
    .run();

  if (nextStatus === 'done' && existing.status !== 'done') {
    await recordDailyActivity(c.env);
  }

  const row = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first<TaskRow>();
  return c.json({ task: withScore(row!) });
});

// 削除
tasks.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').bind(id, DEFAULT_USER_ID).run();
  return c.json({ ok: true });
});

// 集中モード: 起点タスク完了後に次に消化すべきタスクを1件返す
tasks.get('/focus-queue', async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? AND status != 'done' ORDER BY created_at DESC"
  )
    .bind(DEFAULT_USER_ID)
    .all<TaskRow>();

  const next = (results ?? []).map(withScore).sort((a, b) => b.priority_score - a.priority_score)[0] ?? null;
  return c.json({ next });
});

export default tasks;
