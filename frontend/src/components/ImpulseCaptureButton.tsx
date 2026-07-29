import { useState } from 'react';
import { api } from '../lib/api';

// 「今これがやりたい」を一時的に預かるフローティングボタン。
// 学習ブロック中の集中を妨げずに、衝動を消さずに退避させる。
export function ImpulseCaptureButton() {
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    if (!memo.trim()) return;
    await api.addImpulse(memo.trim());
    setMemo('');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 900);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-20 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-paper shadow-lg transition active:scale-95"
      >
        あとで
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 px-4 pb-24 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            {saved ? (
              <p className="py-6 text-center font-display text-lg font-medium text-streak">預かりました</p>
            ) : (
              <>
                <p className="mb-1 font-display text-lg font-semibold text-ink">今やりたいことをメモ</p>
                <p className="mb-3 text-sm text-ink/50">学習ブロックが終わったら通知するよ</p>
                <textarea
                  autoFocus
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="例: ゲームの続きをやりたい"
                  className="h-20 w-full resize-none rounded-lg border border-ink/15 p-3 text-sm outline-none focus-visible:border-focus"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-ink/15 py-2 text-sm font-medium text-ink/60"
                  >
                    やめる
                  </button>
                  <button
                    onClick={submit}
                    className="flex-1 rounded-lg bg-ink py-2 text-sm font-semibold text-paper"
                  >
                    預ける
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
