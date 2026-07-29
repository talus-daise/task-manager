import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';

import tasks from './routes/tasks';
import belongings from './routes/belongings';
import studyBlocks from './routes/studyBlocks';
import streak from './routes/streak';
import impulses from './routes/impulses';
import weeklyReview from './routes/weeklyReview';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/api/health', (c) => c.json({ ok: true }));

app.route('/api/tasks', tasks);
app.route('/api/belongings', belongings);
app.route('/api/study-blocks', studyBlocks);
app.route('/api/streak', streak);
app.route('/api/impulses', impulses);
app.route('/api/weekly-review', weeklyReview);

export default app;
