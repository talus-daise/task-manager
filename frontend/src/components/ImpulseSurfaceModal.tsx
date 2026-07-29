import type { Impulse } from '../lib/types';
import { api } from '../lib/api';

interface Props {
  impulses: Impulse[];
  onClose: () => void;
}

// 学習ブロック終了を検知したタイミングで表示。預かっていた「やりたいこと」を返す。
export function ImpulseSurfaceModal({ impulses, onClose }: Props) {
  if (impulses.length === 0) return null;

  const resolve = async (id: string) => {
    await api.resolveImpulse(id);
    if (impulses.length <= 1) onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 px-4 pb-24 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <p className="mb-1 font-display text-lg font-semibold text-focus">学習おつかれさま</p>
        <p className="mb-4 text-sm text-ink/50">預かっていたメモはこちら</p>
        <ul className="space-y-2">
          {impulses.map((imp) => (
            <li key={imp.id} className="flex items-center justify-between gap-2 rounded-lg bg-focus/5 p-3">
              <span className="text-sm text-ink">{imp.memo}</span>
              <button
                onClick={() => resolve(imp.id)}
                className="flex-shrink-0 rounded-lg border border-focus/30 px-2.5 py-1 text-xs font-semibold text-focus"
              >
                OK
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="mt-4 w-full rounded-lg bg-ink py-2 text-sm font-semibold text-paper">
          閉じる
        </button>
      </div>
    </div>
  );
}
