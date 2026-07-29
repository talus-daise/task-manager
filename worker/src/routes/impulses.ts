import { Hono } from 'hono';
import type { Env, ImpulseRow } from '../types';
import { DEFAULT_USER_ID } from '../types';

const impulses = new Hono<{ Bindings: Env }>();

// メモを預かる（学習ブロック中に「今これやりたい」を退避）
impulses.post('/', async (c) => {
  const { memo } = await c.req.json<{ memo: string }>();
  if (!memo) return c.json({ error: 'memo は必須です' }, 400);
  const id = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO impulses (id, user_id, memo) VALUES (?, ?, ?)')
    .bind(id, DEFAULT_USER_ID, memo)
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM impulses WHERE id = ?').bind(id).first<ImpulseRow>();
  return c.json({ impulse: row }, 201);
});

// まだ本人に見せていない（学習ブロック終了後にフロントから呼ばれる想定）メモ一覧
impulses.get('/pending', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM impulses WHERE user_id = ? AND resolved = 0 AND notified_at IS NULL ORDER BY created_at ASC'
  )
    .bind(DEFAULT_USER_ID)
    .all<ImpulseRow>();
  return c.json({ impulses: results ?? [] });
});

// 通知済みにする（表示したタイミングでフロントが呼ぶ）
impulses.post('/:id/notify', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE impulses SET notified_at = ? WHERE id = ? AND user_id = ?')
    .bind(new Date().toISOString(), id, DEFAULT_USER_ID)
    .run();
  return c.json({ ok: true });
});

// 「もうやった／やらない」で解決済みにする
impulses.patch('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE impulses SET resolved = 1 WHERE id = ? AND user_id = ?')
    .bind(id, DEFAULT_USER_ID)
    .run();
  return c.json({ ok: true });
});

export default impulses;
