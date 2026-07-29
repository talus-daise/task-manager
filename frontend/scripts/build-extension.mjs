// vite buildの後に、対象ブラウザ用のmanifest.jsonを配置してzip化する。
// Chrome/Firefoxで出力先ディレクトリを分けているため、
// 「Chrome用をFirefoxで読み込んでしまう」といった取り違えが起きない。
// 使い方: node scripts/build-extension.mjs chrome | firefox
import { copyFileSync, existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

const target = process.argv[2];
if (target !== 'chrome' && target !== 'firefox') {
  console.error('使い方: node scripts/build-extension.mjs <chrome|firefox>');
  process.exit(1);
}

const distDir = `dist-${target}`;

copyFileSync(`public/manifest.${target}.json`, `${distDir}/manifest.json`);

for (const leftover of ['manifest.chrome.json', 'manifest.firefox.json']) {
  const p = `${distDir}/${leftover}`;
  if (existsSync(p)) rmSync(p);
}

console.log(`✅ ${distDir}/ に ${target} 用の manifest.json を配置しました`);
if (target === 'chrome') {
  console.log(`   chrome://extensions → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」→ ${distDir} を選択`);
} else {
  console.log(`   about:debugging#/runtime/this-firefox → 「一時的なアドオンを読み込む」→ ${distDir}/manifest.json を選択`);
}

try {
  execSync(`cd ${distDir} && zip -r ../task-manager-extension-${target}.zip .`, { stdio: 'inherit' });
  console.log(`✅ task-manager-extension-${target}.zip も作成しました（ストア提出・配布用）`);
} catch {
  console.log(`（zipコマンドが見つからなかったため、zip化はスキップしました。${distDir} フォルダはそのまま使えます）`);
}
