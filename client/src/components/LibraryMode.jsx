import { useEffect, useState } from "react";
import { deleteMistakes, fetchMistakes } from "../api.js";
import WordCard from "./WordCard.jsx";

export default function LibraryMode({ grade, words, onBack }) {
  const [mistakes, setMistakes] = useState(null);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => {
    fetchMistakes(grade)
      .then(setMistakes)
      .catch(() => setError("苦手単語の取得に失敗しました。"));
  }, [grade]);

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleDeleteSelected() {
    const ids = [...selectedIds];
    await deleteMistakes(ids);
    setMistakes((prev) => prev.filter((m) => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
  }

  // 練習モードと同じ単語カード(画像・例文・発音)を表示するため、
  // 学年の単語リストから該当する単語の詳細情報を探す
  function openDetail(m) {
    const full = words?.find((w) => w.id === m.item_id);
    setDetailItem(
      full || {
        id: m.id,
        word: m.word,
        pos: m.pos,
        meaning: m.meaning,
        example: "",
        exampleJa: "",
        imageQuery: m.word,
      }
    );
  }

  if (detailItem) {
    return (
      <div className="card">
        <button className="back-link" onClick={() => setDetailItem(null)}>
          ← 苦手単語一覧にもどる
        </button>
        <WordCard item={detailItem} />
      </div>
    );
  }

  return (
    <div className="card">
      <button className="back-link" onClick={onBack}>
        ← モード選択にもどる
      </button>
      <h2 className="center-text">苦手単語（中学{grade}年）</h2>

      {error && <div className="mistake-note" style={{ color: "var(--danger)" }}>{error}</div>}

      {!error && mistakes === null && <div className="loading">読み込み中...</div>}

      {mistakes !== null && mistakes.length === 0 && (
        <div className="mistake-note">まだ間違えた単語はありません。テストモードに挑戦してみよう！</div>
      )}

      {mistakes && mistakes.length > 0 && (
        <>
          <div className="button-row" style={{ marginTop: 0, marginBottom: 8, justifyContent: "flex-end" }}>
            <button
              className="delete-button"
              disabled={selectedIds.size === 0}
              onClick={handleDeleteSelected}
            >
              選択した単語を削除（{selectedIds.size}件）
            </button>
          </div>
          <div className="mistake-list">
            {mistakes.map((m) => (
              <div className="mistake-item" key={m.id}>
                <input
                  type="checkbox"
                  className="mistake-checkbox"
                  checked={selectedIds.has(m.id)}
                  onChange={() => toggleSelected(m.id)}
                />
                <div className="mistake-info" onClick={() => openDetail(m)}>
                  <span className="w">
                    {m.word}（{m.pos}）
                  </span>
                  <span className="m">
                    {m.meaning} ・ 間違えた回数: {m.mistake_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
