import type { TaskType } from '../types';
import { diffDaysInJST, todayISOInJST } from './jst';

// 種別ごとの重要度係数（提出物 > 宿題 > 自由タスク）
const IMPORTANCE: Record<TaskType, number> = {
  submission: 3,
  homework: 2,
  free: 1,
};

/**
 * 優先度スコア = 重要度係数 ÷ 残り日数
 * 残り日数はJSTの暦日ベース（時刻を持たない純粋な日数差）で計算する。
 * 締切が当日〜超過の場合はスコアを最大化して最優先に浮上させる。
 * 締切なしタスクは常に低優先（重要度の半分固定）とする。
 */
export function calcPriorityScore(
  type: TaskType,
  dueDate: string | null,
  now: Date = new Date()
): number {
  const importance = IMPORTANCE[type];
  if (!dueDate) return importance * 0.5;

  const daysLeft = diffDaysInJST(dueDate, todayISOInJST(now));
  if (daysLeft <= 0) return importance * 100; // 当日・期限超過は最優先
  return importance / daysLeft;
}

/** 締切までの残り日数（JST暦日ベース）。0日なら今日が締切。 */
export function daysUntil(dueDate: string | null, now: Date = new Date()): number | null {
  if (!dueDate) return null;
  return diffDaysInJST(dueDate, todayISOInJST(now));
}

// 提出物リマインドの強度（当日 / 前日 / 3日前）を判定
export function submissionReminderStage(daysLeft: number | null): 'today' | 'tomorrow' | 'soon' | null {
  if (daysLeft === null) return null;
  if (daysLeft <= 0) return 'today';
  if (daysLeft === 1) return 'tomorrow';
  if (daysLeft <= 3) return 'soon';
  return null;
}
