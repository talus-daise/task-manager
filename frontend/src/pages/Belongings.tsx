import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { BelongingItem } from '../lib/types';
import { todayISOInJST } from '../lib/jst';

function todayISO() {
  return todayISOInJST();
}

export function Belongings() {
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState<BelongingItem[]>([]);
  const [itemName, setItemName] = useState('');

  const load = async (d: string) => {
    const { items } = await api.getBelongings(d);
    setItems(items);
  };

  useEffect(() => {
    load(date);
  }, [date]);

  const add = async () => {
    if (!itemName.trim()) return;
    await api.addBelonging({ date, item_name: itemName.trim() });
    setItemName('');
    load(date);
  };

  const toggle = async (item: BelongingItem) => {
    await api.toggleBelonging(item.id, item.checked === 0);
    load(date);
  };

  const remove = async (item: BelongingItem) => {
    await api.deleteBelonging(item.id);
    load(date);
  };

  const checkedCount = items.filter((i) => i.checked === 1).length;

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">持ち物チェック</h1>
      <p className="mb-6 text-sm text-ink/40">日にちを指定して、必要な持ち物を登録しよう</p>

      <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus-visible:border-focus"
        />
        {items.length > 0 && (
          <span className="font-mono text-sm font-semibold tabular text-streak">
            {checkedCount}/{items.length}
          </span>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        <input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="持ち物の名前（例: 体操着）"
          className="flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus-visible:border-focus"
        />
        <button onClick={add} className="rounded-lg bg-focus px-4 py-2.5 text-sm font-semibold text-white">
          追加
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">この日の持ち物はまだ登録されていません</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-white p-3.5 shadow-sm"
            >
              <button onClick={() => toggle(item)} className="flex flex-1 items-center gap-3 text-left">
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                    item.checked ? 'border-streak bg-streak text-white' : 'border-ink/20 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className={`text-sm ${item.checked ? 'text-ink/30 line-through' : 'text-ink'}`}>
                  {item.item_name}
                </span>
              </button>
              <button onClick={() => remove(item)} className="text-xs text-ink/30">
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
