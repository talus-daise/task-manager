import type { Task } from '../lib/types';
import { TASK_TYPE_LABEL } from '../lib/types';
import { CountdownTicker } from './CountdownTicker';

interface Props {
  task: Task;
  onStart?: (task: Task) => void;
  onComplete: (task: Task) => void;
  large?: boolean;
}

const TYPE_BORDER: Record<Task['type'], string> = {
  submission: 'border-l-danger',
  homework: 'border-l-focus',
  free: 'border-l-ink/30',
};

export function TaskCard({ task, onStart, onComplete, large }: Props) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border-l-4 bg-white shadow-sm ${TYPE_BORDER[task.type]} ${
        large ? 'p-5' : 'p-3.5'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[11px] font-medium text-ink/60">
            {TASK_TYPE_LABEL[task.type]}
          </span>
          {task.postponed_count > 0 && (
            <span className="text-[11px] font-medium text-danger">先延ばし {task.postponed_count}回</span>
          )}
        </div>
        <p className={`truncate font-display font-medium text-ink ${large ? 'text-xl' : 'text-base'}`}>
          {task.title}
        </p>
      </div>

      <CountdownTicker daysLeft={task.days_left} size={large ? 'lg' : 'sm'} />

      <div className="flex flex-shrink-0 flex-col gap-1.5">
        {onStart && (
          <button
            onClick={() => onStart(task)}
            className="rounded-lg bg-focus px-3 py-1.5 text-sm font-semibold text-white transition active:scale-95"
          >
            はじめる
          </button>
        )}
        <button
          onClick={() => onComplete(task)}
          className="rounded-lg border border-streak/40 px-3 py-1.5 text-sm font-semibold text-streak transition active:scale-95"
        >
          完了
        </button>
      </div>
    </div>
  );
}
