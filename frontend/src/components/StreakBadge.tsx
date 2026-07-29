import type { Streak } from '../lib/types';

export function StreakBadge({ streak }: { streak: Streak | null }) {
  const count = streak?.current_count ?? 0;
  return (
    <div className="flex items-center gap-2 rounded-full bg-streak/10 px-3 py-1.5">
      <span className="h-2 w-2 rounded-full bg-streak" />
      <span className="font-mono text-sm font-bold tabular text-streak">{count}</span>
      <span className="text-xs font-medium text-streak/80">日連続</span>
    </div>
  );
}
