import { useEffect, useState } from "react";
import WordCard from "./WordCard.jsx";

export default function PracticeMode({ words, initialIndex = 0, onBack, onProgress }) {
  const [index, setIndex] = useState(
    initialIndex < words.length ? initialIndex : 0
  );
  const item = words[index];
  const progress = ((index + 1) / words.length) * 100;

  useEffect(() => {
    onProgress?.(index);
  }, [index]);

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      <button className="back-link" onClick={onBack}>
        ← モード選択にもどる
      </button>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="quiz-sub center-text" style={{ marginBottom: 8 }}>
        {index + 1} / {words.length}
      </div>
      <div className="card">
        <WordCard item={item} />
        <div className="button-row">
          <button
            className="button secondary"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            ← 前の単語
          </button>
          <button
            className="button"
            disabled={index === words.length - 1}
            onClick={() => setIndex((i) => Math.min(words.length - 1, i + 1))}
          >
            次の単語 →
          </button>
        </div>
      </div>
    </div>
  );
}
