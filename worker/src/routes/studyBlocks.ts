import { Hono } from 'hono';
import type { Env, StudyBlockRow } from '../types';
import { DEFAULT_USER_ID } from '../types';
import { jstWeekday, jstHHMM } from '../lib/jst';

const studyBlocks = new Hono<{ Bindings: Env }>();

studyBlocks.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM study_blocks WHERE user_id = ? ORDER BY weekday ASC, start_time ASC'
  )
    .bind(DEFAULT_USER_ID)
    .all<StudyBlockRow>();
  return c.json({ blocks: results ?? [] });
});

studyBlocks.post('/', async (c) => {
  const body = await c.req.json<{ weekday: number; start_time: string; end_time: string; label?: string }>();
  if (body.weekday === undefined || !body.start_time || !body.end_time) {
    return c.json({ error: 'weekday, start_time, end_time は必須です' }, 400);
  }
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO study_blocks (id, user_id, weekday, start_time, end_time, label) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(id, DEFAULT_USER_ID, body.weekday, body.start_time, body.end_time, body.label ?? null)
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM study_blocks WHERE id = ?').bind(id).first<StudyBlockRow>();
  return c.json({ block: row }, 201);
});

studyBlocks.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM study_blocks WHERE id = ? AND user_id = ?').bind(id, DEFAULT_USER_ID).run();
  return c.json({ ok: true });
});

// 今この瞬間アクティブな学習ブロックを返す（フロント側の固定学習ブロック通知トリガー用）
studyBlocks.get('/current', async (c) => {
  const now = new Date();
  const weekday = jstWeekday(now);
  const hhmm = jstHHMM(now);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM study_blocks WHERE user_id = ? AND weekday = ? ORDER BY start_time ASC'
  )
    .bind(DEFAULT_USER_ID, weekday)
    .all<StudyBlockRow>();

  const active = (results ?? []).find((b) => b.start_time <= hhmm && hhmm < b.end_time) ?? null;
  return c.json({ active });
});

export default studyBlocks;
