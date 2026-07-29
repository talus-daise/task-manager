import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBase, setApiBase, requestHostPermission, isExtensionRuntime } from '../lib/config';
import { checkHealth } from '../lib/api';

interface Props {
  onSaved?: () => void;
  firstRun?: boolean;
}

export function Settings({ onSaved, firstRun }: Props) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getApiBase().then((base) => base && setUrl(base));
  }, []);

  const save = async () => {
    setError('');
    const trimmed = url.trim();
    if (!trimmed || !/^https?:\/\//.test(trimmed)) {
      setError('https:// から始まるWorkerのURLを入力してください');
      return;
    }

    setStatus('checking');
    const granted = await requestHostPermission(trimmed);
    if (!granted) {
      setStatus('error');
      setError('このURLへのアクセス許可が得られませんでした');
      return;
    }

    const ok = await checkHealth(trimmed);
    if (!ok) {
      setStatus('error');
      setError('接続できませんでした。URLとWorkerのデプロイ状況を確認してください');
      return;
    }

    await setApiBase(trimmed);
    setStatus('ok');
    onSaved?.();
    if (!firstRun) navigate('/');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 pb-10">
      <p className="mb-1 font-display text-2xl font-bold text-ink">
        {firstRun ? 'ようこそ' : '接続設定'}
      </p>
      <p className="mb-6 text-sm text-ink/50">
        {firstRun
          ? 'デプロイ済みのバックエンド(Worker)のURLを入力してください。新しいタブを開くたびにここから読み込みます。'
          : 'バックエンド(Worker)の接続先URLを変更します。'}
      </p>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://task-manager-worker.xxxx.workers.dev"
        className="mb-2 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus-visible:border-focus"
      />
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      {status === 'ok' && <p className="mb-2 text-sm text-streak">接続を確認しました</p>}

      <button
        onClick={save}
        disabled={status === 'checking'}
        className="w-full rounded-lg bg-focus py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {status === 'checking' ? '確認中...' : '接続する'}
      </button>

      {!firstRun && (
        <button onClick={() => navigate('/')} className="mt-3 text-sm text-ink/40">
          戻る
        </button>
      )}

      {!isExtensionRuntime() && (
        <p className="mt-6 text-center text-xs text-ink/30">
          （通常のブラウザで開いています。拡張機能としてインストールした場合のみこの設定が必要です）
        </p>
      )}
    </div>
  );
}
