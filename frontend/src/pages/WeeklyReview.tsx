import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { WeeklyReview as WeeklyReviewData } from '../lib/types';
import { TASK_TYPE_LABEL } from '../lib/types';

export function WeeklyReview() {
  const [data, setData] = useState<WeeklyReviewData | null>(null);

  useEffect(() => {
    api.getWeeklyReview().then(setData);
  }, []);

  if (!data) return <div className="mx-auto max-w-md px-4 pt-24 text-center text-ink/40">読み込み中...</div>;

  const rate = data.completion_rate;
  const ratePct = rate === null ? 0 : Math.round(rate * 100);

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">今週の振り返り</h1>
      <p className="mb-6 text-sm text-ink/40">過去7日間の記録</p>

      <div className="mb-4 rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm font-medium text-ink/50">達成率</p>
        <div className="flex items-end gap-3">
          <span className="font-mono text-4xl font-bold tabular text-focus">{ratePct}%</span>
          <span className="pb-1 text-sm text-ink/40">
            {data.completed_tasks} / {data.total_tasks} 件
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/5">
          <div className="h-full rounded-full bg-focus" style={{ width: `${ratePct}%` }} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium text-ink/50">平均 先延ばし回数</p>
          <p className="font-mono text-2xl font-bold tabular text-danger">{data.average_postponed_count}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium text-ink/50">現在のストリーク</p>
          <p className="font-mono text-2xl font-bold tabular text-streak">{data.streak.current_count}日</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-ink/50">種類別 完了数</p>
        <ul className="space-y-2">
          {Object.entries(data.completed_by_type).map(([type, count]) => (
            <li key={type} className="flex items-center justify-between text-sm">
              <span className="text-ink/70">{TASK_TYPE_LABEL[type as keyof typeof TASK_TYPE_LABEL]}</span>
              <span className="font-mono font-semibold tabular text-ink">{count}件</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-center text-xs text-ink/30">最長ストリーク: {data.streak.longest_count}日</p>
    </div>
  );
}
