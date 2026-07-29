// Cloudflare Workersのランタイムにはローカルタイムゾーンの概念が無く、
// Date の getDate()/getDay()/toTimeString() 等はUTC相当の値になる。
// このアプリは日本の生活リズム（学校・下校時間など）を前提にしたUIなので、
// 「今日」「曜日」「時刻」の判定はすべてJST(UTC+9)基準に揃える。
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function shiftToJST(date: Date): Date {
  return new Date(date.getTime() + JST_OFFSET_MS);
}

/** JSTでの日付(YYYY-MM-DD)を返す */
export function todayISOInJST(now: Date = new Date()): string {
  return shiftToJST(now).toISOString().slice(0, 10);
}

/** JSTでの曜日(0=日曜〜6=土曜)を返す */
export function jstWeekday(now: Date = new Date()): number {
  return shiftToJST(now).getUTCDay();
}

/** JSTでの時刻(HH:MM)を返す */
export function jstHHMM(now: Date = new Date()): string {
  return shiftToJST(now).toISOString().slice(11, 16);
}

/** n日前のJST日付(YYYY-MM-DD)を返す */
export function daysAgoISOInJST(n: number, now: Date = new Date()): string {
  const shifted = shiftToJST(now);
  shifted.setUTCDate(shifted.getUTCDate() - n);
  return shifted.toISOString().slice(0, 10);
}

/** JST日付文字列(YYYY-MM-DD)の前日を返す */
export function yesterdayISOInJST(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** 2つのJST日付文字列(YYYY-MM-DD)の日数差 (dueISO - baseISO) を返す。時刻を持たない純粋な暦日の差。 */
export function diffDaysInJST(dueISO: string, baseISO: string = todayISOInJST()): number {
  const due = new Date(`${dueISO}T00:00:00Z`);
  const base = new Date(`${baseISO}T00:00:00Z`);
  return Math.round((due.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}
