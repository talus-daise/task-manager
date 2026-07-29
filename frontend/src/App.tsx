import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Today } from './pages/Today';
import { Tasks } from './pages/Tasks';
import { Belongings } from './pages/Belongings';
import { StudyBlocksPage } from './pages/StudyBlocks';
import { Focus } from './pages/Focus';
import { WeeklyReview } from './pages/WeeklyReview';
import { Settings } from './pages/Settings';
import { BottomNav } from './components/BottomNav';
import { ImpulseCaptureButton } from './components/ImpulseCaptureButton';
import { ImpulseSurfaceModal } from './components/ImpulseSurfaceModal';
import { getApiBase, isExtensionRuntime } from './lib/config';
import type { Impulse } from './lib/types';

function extApi(): any {
  const g = globalThis as any;
  return g.browser ?? g.chrome ?? null;
}

export default function App() {
  const location = useLocation();
  const isFocusMode = location.pathname === '/focus';
  const [pendingImpulses, setPendingImpulses] = useState<Impulse[]>([]);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // 拡張機能実行時のみ、接続先(Worker URL)が未設定なら初回セットアップを要求する
  useEffect(() => {
    getApiBase().then((base) => {
      setNeedsSetup(isExtensionRuntime() && !base);
      setCheckingSetup(false);
    });
  }, [location.pathname]);

  // 学習ブロック終了時にバックグラウンドスクリプトが預けておいた衝動メモを表示する
  useEffect(() => {
    const ext = extApi();
    if (!ext?.storage?.local) return;

    const consume = async () => {
      const { pendingImpulsesToShow } = await ext.storage.local.get('pendingImpulsesToShow');
      if (pendingImpulsesToShow?.length) {
        setPendingImpulses(pendingImpulsesToShow);
        await ext.storage.local.remove('pendingImpulsesToShow');
      }
    };
    consume();

    const listener = (changes: Record<string, any>) => {
      if (changes.pendingImpulsesToShow?.newValue?.length) {
        consume();
      }
    };
    ext.storage.onChanged?.addListener(listener);
    return () => ext.storage.onChanged?.removeListener(listener);
  }, []);

  if (checkingSetup) return null;

  if (needsSetup) {
    return <Settings firstRun onSaved={() => setNeedsSetup(false)} />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/belongings" element={<Belongings />} />
        <Route path="/schedule" element={<StudyBlocksPage />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/review" element={<WeeklyReview />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>

      {!isFocusMode && (
        <>
          <ImpulseCaptureButton />
          <BottomNav />
        </>
      )}

      {pendingImpulses.length > 0 && (
        <ImpulseSurfaceModal impulses={pendingImpulses} onClose={() => setPendingImpulses([])} />
      )}
    </>
  );
}
