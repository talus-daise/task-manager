import { Hono } from 'hono';
import type { BelongingRow, Env } from '../types';
import { DEFAULT_USER_ID } from '../types';
import { recordDailyActivity } from '../lib/streak';
import { todayISOInJST } from '../lib/jst';

const belongings = new Hono<{ Bindings: Env }>();

function todayISO(): string {
  return todayISOInJST();
}

// 指定日の持ち物一覧（省略時は今日）
belongings.get('/', async (c) => {
  const date = c.req.query('date') ?? todayISO();
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM belongings WHERE user_id = ? AND date = ? ORDER BY created_at ASC'
  )
    .bind(DEFAULT_USER_ID, date)
    .all<BelongingRow>();
  return c.json({ date, items: results ?? [] });
});

// 持ち物追加（日にちを指定して手動入力）
belongings.post('/', async (c) => {
  const body = await c.req.json<{ date: string; item_name: string }>();
  if (!body.date || !body.item_name) {
    return c.json({ error: 'date と item_name は必須です' }, 400);
  }
  const id = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO belongings (id, user_id, date, item_name) VALUES (?, ?, ?, ?)')
    .bind(id, DEFAULT_USER_ID, body.date, body.item_name)
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM belongings WHERE id = ?').bind(id).first<BelongingRow>();
  return c.json({ item: row }, 201);
});

// チェックのON/OFF切り替え。その日の全項目がチェック済みになったらストリームを1日分記録
belongings.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ checked: boolean }>();

  const existing = await c.env.DB.prepare('SELECT * FROM belongings WHERE id = ? AND user_id = ?')
    .bind(id, DEFAULT_USER_ID)
    .first<BelongingRow>();
  if (!existing) return c.json({ error: '項目が見つかりません' }, 404);

  await c.env.DB.prepare('UPDATE belongings SET checked = ? WHERE id = ?')
    .bind(body.checked ? 1 : 0, id)
    .run();

  if (body.checked && existing.date === todayISO()) {
    const { results } = await c.env.DB.prepare(
      'SELECT checked FROM belongings WHERE user_id = ? AND date = ?'
    )
      .bind(DEFAULT_USER_ID, existing.date)
      .all<{ checked: number }>();
    const items = results ?? [];
    if (items.length > 0 && items.every((i) => i.checked === 1)) {
      await recordDailyActivity(c.env);
    }
  }

  const row = await c.env.DB.prepare('SELECT * FROM belongings WHERE id = ?').bind(id).first<BelongingRow>();
  return c.json({ item: row });
});

belongings.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM belongings WHERE id = ? AND user_id = ?').bind(id, DEFAULT_USER_ID).run();
  return c.json({ ok: true });
});

export default belongings;
