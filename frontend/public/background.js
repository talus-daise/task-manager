// Chrome(MV3 service worker) / Firefox(MV3 background script) 共通のバックグラウンド処理。
// newtabページが開いていなくても chrome.alarms で定期的に起動し、
// 固定学習ブロックの開始・終了と、やることが残っている旨をOS通知で知らせる。

const ext = typeof browser !== 'undefined' ? browser : chrome;

const STUDY_BLOCK_ALARM = 'task-manager-check-study-block';
const REMINDER_ALARM = 'task-manager-periodic-reminder';

function ensureAlarms() {
  ext.alarms.create(STUDY_BLOCK_ALARM, { periodInMinutes: 5 });
  ext.alarms.create(REMINDER_ALARM, { periodInMinutes: 120 });
}

ext.runtime.onInstalled.addListener(ensureAlarms);
if (ext.runtime.onStartup) {
  ext.runtime.onStartup.addListener(ensureAlarms);
}

async function getApiBase() {
  const { apiBase } = await ext.storage.local.get('apiBase');
  return apiBase || null;
}

async function notifyOS(title, message) {
  try {
    await ext.notifications.create({
      type: 'basic',
      iconUrl: ext.runtime.getURL('icons/icon128.png'),
      title,
      message,
    });
  } catch {
    // 通知APIが使えない環境では無視する
  }
}

async function checkStudyBlock() {
  const base = await getApiBase();
  if (!base) return;

  try {
    const res = await fetch(`${base}/api/study-blocks/current`);
    if (!res.ok) return;
    const { active } = await res.json();

    const { lastActiveBlockId } = await ext.storage.local.get('lastActiveBlockId');
    const nowId = active ? active.id : null;

    if (!lastActiveBlockId && nowId) {
      await notifyOS('学習の時間だよ', active.label || '固定学習ブロックが始まりました');
    }

    if (lastActiveBlockId && !nowId) {
      const pendingRes = await fetch(`${base}/api/impulses/pending`);
      if (pendingRes.ok) {
        const { impulses } = await pendingRes.json();
        if (impulses.length > 0) {
          await notifyOS('学習おつかれさま', impulses.map((i) => i.memo).join(' / '));
          await Promise.all(
            impulses.map((imp) => fetch(`${base}/api/impulses/${imp.id}/notify`, { method: 'POST' }))
          );
          // newtabページを次に開いたときにモーダルで見せられるよう保存しておく
          await ext.storage.local.set({ pendingImpulsesToShow: impulses });
        }
      }
    }

    await ext.storage.local.set({ lastActiveBlockId: nowId });
  } catch {
    // ネットワークエラー等は次のアラームで再試行する
  }
}

async function checkReminder() {
  const base = await getApiBase();
  if (!base) return;

  try {
    const res = await fetch(`${base}/api/tasks/today`);
    if (!res.ok) return;
    const { tasks } = await res.json();
    if (tasks.length > 0) {
      await notifyOS('やることが残ってるよ', `${tasks[0].title} など ${tasks.length}件`);
    }
  } catch {
    // 無視
  }
}

ext.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === STUDY_BLOCK_ALARM) checkStudyBlock();
  if (alarm.name === REMINDER_ALARM) checkReminder();
});
