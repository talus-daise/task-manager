import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Task, TaskType } from '../lib/types';
import { TASK_TYPE_LABEL } from '../lib/types';
import { TaskCard } from '../components/TaskCard';

const TYPE_OPTIONS: TaskType[] = ['homework', 'submission', 'free'];

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('homework');
  const [dueDate, setDueDate] = useState('');
  const [showDone, setShowDone] = useState(false);

  const load = async () => {
    const { tasks } = await api.getTasks();
    setTasks(tasks);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!title.trim()) return;
    await api.createTask({ title: title.trim(), type, due_date: dueDate || null });
    setTitle('');
    setDueDate('');
    load();
  };

  const complete = async (task: Task) => {
    await api.updateTask(task.id, { status: 'done' });
    load();
  };

  const remove = async (task: Task) => {
    await api.deleteTask(task.id);
    load();
  };

  const visible = tasks.filter((t) => (showDone ? t.status === 'done' : t.status !== 'done'));

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">やること一覧</h1>

      <div className="mb-6 space-y-2 rounded-xl bg-white p-4 shadow-sm">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タスク名"
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus-visible:border-focus"
        />
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
            className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus-visible:border-focus"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus-visible:border-focus"
          />
        </div>
        <button onClick={add} className="w-full rounded-lg bg-focus py-2.5 text-sm font-semibold text-white">
          タスクを追加
        </button>
      </div>

      <div className="mb-3 flex gap-2 text-sm font-medium">
        <button
          onClick={() => setShowDone(false)}
          className={`rounded-full px-3 py-1 ${!showDone ? 'bg-ink text-paper' : 'bg-ink/5 text-ink/50'}`}
        >
          未完了
        </button>
        <button
          onClick={() => setShowDone(true)}
          className={`rounded-full px-3 py-1 ${showDone ? 'bg-ink text-paper' : 'bg-ink/5 text-ink/50'}`}
        >
          完了済み
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">タスクがありません</p>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <div key={t.id} className="group relative">
              <TaskCard task={t} onComplete={complete} />
              {t.status !== 'done' && (
                <button
                  onClick={() => remove(t)}
                  className="absolute -top-2 -right-2 rounded-full bg-white px-2 py-0.5 text-xs text-ink/30 shadow"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
