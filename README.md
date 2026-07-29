# タスク管理アプリ MVP実装

設計書（ペルソナ設計）に基づく実装。構成:

- `worker/` — Cloudflare Workers + Hono + D1 のバックエンドAPI
- `frontend/` — React + Vite + Tailwind のフロントエンド（モバイル優先）。通常のWebアプリとしても、
  **Chrome/Firefoxの「新しいタブ」を置き換える拡張機能としても**ビルドできます（後述）。

## 実装した機能

- Todayホーム（優先度上位3件のみ表示、ワンタップ着手）
- 締切逆算の優先度自動計算（提出物 > 宿題 > 自由タスク）
- 持ち物チェックリスト（**日にち指定の手動入力**方式）
- 提出物リマインド用の日数計算（3日前／前日／当日の段階判定）
- 固定学習ブロック（曜日×時間で設定、開始時にアプリ内通知）
- 集中モード（完了するたびに次のタスクを自動キューイング、3件ごとに小休憩）
- あとで通知（衝動退避メモ／学習ブロック終了後に提示）
- ストリーク（連続達成日数、ペナルティなし）
- 週次振り返り（達成率・平均先延ばし回数・種類別完了数）
- Geminiによる自然文クイック追加（例:「数学のワーク 金曜まで」）

未実装（要望により対象外）: 写真からの予定読み取り、ペナルティ設定、保護者・先生との共有。

## セットアップ

### 1. バックエンド（worker/）

```bash
cd worker
npm install

# D1データベースを作成し、表示された database_id を wrangler.toml に反映
npx wrangler d1 create task-manager-db

# スキーマ投入（ローカル）
npm run db:init
# 本番用データベースにも投入する場合
npm run db:init:remote

# Gemini APIキーを登録（未設定でもタイトルそのまま登録にフォールバックする）
npx wrangler secret put GEMINI_API_KEY

# ローカル起動
npm run dev   # http://localhost:8787

# デプロイ
npm run deploy
```

### 2. フロントエンド（frontend/）

```bash
cd frontend
npm install

# ローカル起動（/api は http://localhost:8787 にプロキシ）
npm run dev

# ビルド
npm run build

# Cloudflare Pagesへデプロイ
npm run deploy
```

Pages側の環境で本番のWorker URLを叩けるよう、デプロイ後は `vite.config.ts` のプロキシ設定ではなく
Pages Functions のルーティング、または `frontend` のfetch先を本番WorkerのURLに向ける設定を行ってください。

## 通知についての注意

現在の通知は `Notification` APIを使ったアプリ起動中（フォアグラウンド）限定の実装です。
アプリを閉じていても届く本来の意味での「定期通知」を実現するには、Service Workerの登録と
Web Push（VAPID鍵 + Workersからのプッシュ送信）の追加実装が必要です。今後の拡張候補として
検討してください。

## データモデル

`worker/schema.sql` を参照。tasks / study_blocks / belongings / streaks / impulses の5テーブル構成。

## Chrome / Firefox 拡張機能として使う（新しいタブを置き換え）

`frontend/` はビルドすると、新しいタブページを置き換えるブラウザ拡張機能になります。
「今日やること」が新しいタブを開くたびに必ず表示されるため、「アプリの存在を忘れる」対策になります。
さらに、拡張機能のバックグラウンドスクリプトが `chrome.alarms` を使って定期的に起動するので、
**新しいタブを開いていなくても**「固定学習ブロックの開始」「やることが残っている」をOS通知で知らせます。

### 前提

先に `worker/` をデプロイし、公開されたWorkerのURL（例: `https://task-manager-worker.xxxx.workers.dev`）を控えておいてください。

### ビルド

```bash
cd frontend
npm install

# Chrome用
npm run build:chrome

# Firefox用
npm run build:firefox
```

`dist-chrome/` または `dist-firefox/` に、対象ブラウザ用の `manifest.json` を含んだ拡張機能一式が生成されます
（出力先をブラウザごとに分けているので、Chrome用をFirefoxで読み込んでしまうといった事故が起きません。
`zip` コマンドが使える環境では `task-manager-extension-<chrome|firefox>.zip` も自動生成されます）。

### 読み込み方（開発・個人利用）

- **Chrome**: `chrome://extensions` → 右上「デベロッパーモード」をON → 「パッケージ化されていない拡張機能を読み込む」→ `dist-chrome` フォルダを選択
- **Firefox**: `about:debugging#/runtime/this-firefox` → 「一時的なアドオンを読み込む」→ `dist-firefox/manifest.json` を選択
  - Firefoxの一時アドオンはブラウザを再起動すると解除されます。恒久的に使うにはMozillaの署名（AMO提出、または企業内配布ならEnterprise Policy）が必要です。
  - `public/manifest.firefox.json` 内の `browser_specific_settings.gecko.id` は仮の値 (`task-manager@example.com`) です。自分用に変更してから配布・提出してください。
  - Firefoxは `background.service_worker` に未対応のため、`manifest.firefox.json` では `background.scripts` を使っています。Chrome用ビルド(`dist-chrome`)をFirefoxで読み込むと
    `background.service_worker is currently disabled. Add background.scripts.` というエラーになるので、必ず `dist-firefox` の方を選んでください。

### 初回セットアップ

拡張機能として新しいタブを開くと、初回だけ接続設定画面が表示されます。デプロイしたWorkerのURLを入力し、
表示される権限許可ダイアログを承認してください（拡張機能からそのドメインへの通信を許可するためのものです）。
接続先はあとから右上の「⚙」からいつでも変更できます。

### バックグラウンド通知の仕組みと制限

- `frontend/public/background.js` が `chrome.alarms`（5分おき）で固定学習ブロックの開始・終了を検知し、
  `chrome.notifications` でOS通知します。学習ブロック終了時に預かっていた「あとで通知」メモも、
  次に新しいタブを開いたときにアプリ内モーダルで表示されます。
- 2時間おきに、その時点で残っているタスクがあればリマインド通知します。
- ブラウザ自体を終了している間はアラームも動きません（OSのバックグラウンドアプリではないため）。
  ブラウザさえ起動していれば、新しいタブを開いていなくても通知は届きます。
