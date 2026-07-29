// Chrome/Firefox拡張機能どちらでも動くよう、グローバルAPIをフォールバックで解決する軽量シム。
// webextension-polyfillを増やさず、storage/permissions/runtimeの範囲だけ吸収する。
function extApi(): any {
  const g = globalThis as any;
  return g.browser ?? g.chrome ?? null;
}

export function isExtensionRuntime(): boolean {
  return Boolean(extApi()?.storage?.local);
}

/**
 * 保存済みのバックエンド(Worker)のベースURLを取得する。
 * 拡張機能内では chrome.storage.local、通常のブラウザ実行(開発時)では localStorage を使う。
 * 未設定の場合は空文字を返す（呼び出し側で拡張機能実行時のみセットアップ必須として扱う）。
 */
export async function getApiBase(): Promise<string> {
  const ext = extApi();
  if (ext?.storage?.local) {
    const { apiBase } = await ext.storage.local.get('apiBase');
    return apiBase ?? '';
  }
  return localStorage.getItem('apiBase') ?? '';
}

export async function setApiBase(url: string): Promise<void> {
  const normalized = url.trim().replace(/\/+$/, '');
  const ext = extApi();
  if (ext?.storage?.local) {
    await ext.storage.local.set({ apiBase: normalized });
    return;
  }
  localStorage.setItem('apiBase', normalized);
}

/**
 * 拡張機能のホスト権限をランタイムでリクエストする。通常のブラウザ実行時は常にtrue。
 */
export async function requestHostPermission(url: string): Promise<boolean> {
  const ext = extApi();
  if (!ext?.permissions) return true;
  const origin = `${new URL(url).origin}/*`;
  try {
    return await ext.permissions.request({ origins: [origin] });
  } catch {
    return false;
  }
}
