import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Streak, Task } from '../lib/types';
import { TaskCard } from '../components/TaskCard';
import { StreakBadge } from '../components/StreakBadge';

export function Today() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [quickText, setQuickText] = useState('');
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    const [t, s] = await Promise.all([api.getToday(), api.getStreak()]);
    setTasks(t.tasks);
    setStreak(s.streak);
  };

  useEffect(() => {
    load();
  }, []);

  const start = async (task: Task) => {
    await api.updateTask(task.id, { status: 'in_progress' });
    navigate('/focus', { state: { taskId: task.id } });
  };

  const complete = async (task: Task) => {
    await api.updateTask(task.id, { status: 'done' });
    load();
  };

  const quickAdd = async () => {
    if (!quickText.trim()) return;
    setAdding(true);
    try {
      await api.quickAddTask(quickText.trim());
      setQuickText('');
      await load();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">今日やること</h1>
        <div className="flex items-center gap-3">
          <StreakBadge streak={streak} />
          <Link to="/settings" className="text-ink/30" aria-label="設定">
            ⚙
          </Link>
        </div>
      </header>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/15 p-8 text-center">
          <p className="font-display text-lg font-medium text-ink/70">今日のタスクはありません</p>
          <p className="mt-1 text-sm text-ink/40">下から新しいタスクを追加してみよう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t, i) => (
            <TaskCard key={t.id} task={t} onStart={start} onComplete={complete} large={i === 0} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <p className="mb-2 text-sm font-medium text-ink/50">サクッと追加</p>
        <div className="flex gap-2">
          <input
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
            placeholder="例: 数学のワーク 金曜まで"
            className="flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus-visible:border-focus"
          />
          <button
            onClick={quickAdd}
            disabled={adding}
            className="rounded-lg bg-focus px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
