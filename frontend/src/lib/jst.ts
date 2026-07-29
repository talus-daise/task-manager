// ブラウザのDate().toISOString()はUTCを返すため、JST(UTC+9)の日付とズレることがある
// （日本時間の深夜0時〜9時は、UTC変換すると前日の日付になってしまう）。
// 持ち物チェックリストの「今日」の初期値など、日付の既定値は必ずこちらを使う。
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function todayISOInJST(now: Date = new Date()): string {
  return new Date(now.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}
