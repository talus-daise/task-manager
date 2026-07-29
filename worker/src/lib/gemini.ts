import type { Env, TaskType } from '../types';
import { todayISOInJST, jstWeekday } from './jst';

interface ParsedTask {
  title: string;
  type: TaskType;
  due_date: string | null; // YYYY-MM-DD
}

const MODEL = 'gemini-2.0-flash';

/**
 * 「数学のワーク 金曜まで」のような自然文入力を title / type / due_date に変換する。
 * Todayホームのクイック追加から呼び出す想定。
 */
export async function parseTaskWithGemini(env: Env, text: string, now: Date = new Date()): Promise<ParsedTask> {
  if (!env.GEMINI_API_KEY) {
    // APIキー未設定時はそのままタイトルとして登録できるようフォールバック
    return { title: text, type: 'homework', due_date: null };
  }

  const today = todayISOInJST(now);
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][jstWeekday(now)];

  const prompt = `あなたは中学生向けタスク管理アプリの入力解析エンジンです。
今日の日付は ${today}（${weekday}曜日）です。
次のユーザー入力を解析し、JSONのみを出力してください（説明文やコードブロック記号は禁止）。

入力: "${text}"

出力フォーマット:
{"title": "タスクの短い名前", "type": "homework または submission または free", "due_date": "YYYY-MM-DD または null"}

判定ルール:
- 提出物・レポート・ワーク提出など先生に出す物は submission
- 宿題・勉強・課題は homework
- それ以外の自由なやることは free
- 「金曜まで」「明日」「来週月曜」など相対的な日付表現は今日の日付から計算して絶対日付にすること
- 締切の記述が無ければ due_date は null`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) {
    return { title: text, type: 'homework', due_date: null };
  }

  const data = await res.json<any>();
  const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return { title: text, type: 'homework', due_date: null };

  try {
    const parsed = JSON.parse(raw);
    const type: TaskType = ['homework', 'submission', 'free'].includes(parsed.type) ? parsed.type : 'homework';
    return {
      title: String(parsed.title ?? text),
      type,
      due_date: parsed.due_date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.due_date) ? parsed.due_date : null,
    };
  } catch {
    return { title: text, type: 'homework', due_date: null };
  }
}
