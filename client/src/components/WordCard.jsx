import { useEffect, useState } from "react";
import { fetchImage } from "../api.js";
import { playPronunciation, playSentence } from "../pronunciation.js";

export default function WordCard({ item }) {
  const [imageUrl, setImageUrl] = useState(undefined); // undefined=読込中, null=画像なし

  useEffect(() => {
    let cancelled = false;
    setImageUrl(undefined);
    fetchImage(item.imageQuery || item.word).then((url) => {
      if (!cancelled) setImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  return (
    <div className="word-card">
      {imageUrl === undefined && <div className="word-image-placeholder">画像を読み込み中...</div>}
      {imageUrl === null && <div className="word-image-placeholder">画像が見つかりません</div>}
      {imageUrl && <img className="word-image" src={imageUrl} alt={item.word} />}

      <span className="pos-badge">{item.pos}</span>
      <div className="word-title">
        <span>{item.word}</span>
        <button
          className="speak-button"
          onClick={() => playPronunciation(item.word)}
          title="発音を聞く"
          aria-label="発音を聞く"
        >
          🔊
        </button>
      </div>
      <div className="word-meaning">{item.meaning}</div>

      <div className="word-example">
        <div className="en-row">
          <div className="en">{item.example}</div>
          {item.example && (
            <button
              className="speak-button small"
              onClick={() => playSentence(item.example)}
              title="例文を読み上げる"
              aria-label="例文を読み上げる"
            >
              🔊
            </button>
          )}
        </div>
        <div className="ja">{item.exampleJa}</div>
      </div>
    </div>
  );
}
