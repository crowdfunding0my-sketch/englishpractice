// 練習モードの進捗(出題順と最後に見ていた単語のインデックス)を
// ユーザー・学年ごとにlocalStorageへ保存する

const KEY_PREFIX = "eitan-practice-progress";

function keyFor(userId, grade) {
  return `${KEY_PREFIX}:${userId}:${grade}`;
}

// { order: [単語id, ...], index: number } を返す。保存が無ければnull
export function getPracticeProgress(userId, grade) {
  const raw = localStorage.getItem(keyFor(userId, grade));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.order) && Number.isFinite(parsed.index)) {
      return parsed;
    }
  } catch {
    // 壊れたデータは無視する
  }
  return null;
}

export function savePracticeProgress(userId, grade, order, index) {
  localStorage.setItem(keyFor(userId, grade), JSON.stringify({ order, index }));
}

export function clearPracticeProgress(userId, grade) {
  localStorage.removeItem(keyFor(userId, grade));
}
