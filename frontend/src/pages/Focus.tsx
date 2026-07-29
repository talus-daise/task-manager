import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Task } from '../lib/types';
import { TASK_TYPE_LABEL } from '../lib/types';
import { CountdownTicker } from '../components/CountdownTicker';

export function Focus() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [doneCount, setDoneCount] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const navigate = useNavigate();

  const loadNext = async () => {
    setLoading(true);
    const { next } = await api.getFocusQueue();
    if (next) {
      await api.updateTask(next.id, { status: 'in_progress' });
    }
    setTask(next);
    setLoading(false);
  };

  useEffect(() => {
    loadNext();
  }, []);

  const complete = async () => {
    if (!task) return;
    await api.updateTask(task.id, { status: 'done' });
    const nextCount = doneCount + 1;
    setDoneCount(nextCount);

    if (nextCount % 3 === 0) {
      setOnBreak(true);
    } else {
      loadNext();
    }
  };

  const continueAfterBreak = () => {
    setOnBreak(false);
    loadNext();
  };

  if (onBreak) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-6xl font-bold text-signal">5分</p>
        <p className="mt-4 font-display text-xl font-semibold text-ink">ここまでで {doneCount} コ完了！ひと息つこう</p>
        <button
          onClick={continueAfterBreak}
          className="mt-8 rounded-full bg-focus px-8 py-3 font-semibold text-white active:scale-95"
        >
          つづける
        </button>
        <button onClick={() => navigate('/')} className="mt-4 text-sm text-ink/40">
          今日の画面に戻る
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="mx-auto max-w-md px-4 pt-24 text-center text-ink/40">読み込み中...</div>;
  }

  if (!task) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl font-bold text-streak">やることが空っぽ！</p>
        <p className="mt-2 text-sm text-ink/50">{doneCount}コ終わらせた。お疲れさま。</p>
        <button
          onClick={() => navigate('/')}
          className="mt-8 rounded-full bg-ink px-8 py-3 font-semibold text-paper active:scale-95"
        >
          今日の画面に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 pb-10 pt-8">
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-medium tabular text-ink/40">今 {doneCount + 1} コ目</span>
          <button onClick={() => navigate('/')} className="text-sm text-ink/40">
            中断
          </button>
        </div>

        <div className="mt-16 text-center">
          <span className="rounded bg-focus/10 px-2 py-1 text-xs font-medium text-focus">
            {TASK_TYPE_LABEL[task.type]}
          </span>
          <p className="mt-4 font-display text-3xl font-bold text-ink">{task.title}</p>
          <div className="mt-6 flex justify-center">
            <CountdownTicker daysLeft={task.days_left} size="lg" />
          </div>
        </div>
      </div>

      <button
        onClick={complete}
        className="w-full rounded-2xl bg-streak py-5 font-display text-lg font-bold text-white shadow-lg active:scale-95"
      >
        完了して次へ
      </button>
    </div>
  );
}
