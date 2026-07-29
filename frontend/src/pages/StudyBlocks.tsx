import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { StudyBlock } from '../lib/types';
import { WEEKDAY_LABEL } from '../lib/types';

export function StudyBlocksPage() {
  const [blocks, setBlocks] = useState<StudyBlock[]>([]);
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [label, setLabel] = useState('');

  const load = async () => {
    const { blocks } = await api.getStudyBlocks();
    setBlocks(blocks);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (startTime >= endTime) return;
    await api.addStudyBlock({ weekday, start_time: startTime, end_time: endTime, label: label || undefined });
    setLabel('');
    load();
  };

  const remove = async (id: string) => {
    await api.deleteStudyBlock(id);
    load();
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">学習時間を固定する</h1>
      <p className="mb-6 text-sm text-ink/40">曜日ごとに勉強する時間を決めておくと、その時間になったらTodayに反映されます</p>

      <div className="mb-6 space-y-2 rounded-xl bg-white p-4 shadow-sm">
        <select
          value={weekday}
          onChange={(e) => setWeekday(Number(e.target.value))}
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus-visible:border-focus"
        >
          {WEEKDAY_LABEL.map((label, i) => (
            <option key={i} value={i}>
              {label}曜日
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus-visible:border-focus"
          />
          <span className="self-center text-ink/40">〜</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus-visible:border-focus"
          />
        </div>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="メモ（任意・例: 数学中心）"
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus-visible:border-focus"
        />
        <button onClick={add} className="w-full rounded-lg bg-focus py-2.5 text-sm font-semibold text-white">
          この時間を固定する
        </button>
      </div>

      {blocks.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">まだ学習ブロックがありません</p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-xl bg-white p-3.5 shadow-sm">
              <div>
                <span className="font-display font-semibold text-ink">{WEEKDAY_LABEL[b.weekday]}曜日</span>
                <span className="ml-2 font-mono text-sm tabular text-ink/60">
                  {b.start_time}〜{b.end_time}
                </span>
                {b.label && <p className="text-xs text-ink/40">{b.label}</p>}
              </div>
              <button onClick={() => remove(b.id)} className="text-xs text-ink/30">
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
