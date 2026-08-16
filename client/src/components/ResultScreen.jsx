export default function ResultScreen({ result, onRetry, onHome }) {
  const { score, total, mistakes } = result;

  return (
    <div className="card">
      <h2 className="center-text">結果発表</h2>
      <div className="result-score">
        {score} / {total} 問正解！
      </div>

      {mistakes.length > 0 ? (
        <>
          <div className="mistake-list">
            {mistakes.map((m) => (
              <div className="mistake-item" key={m.id}>
                <span className="w">{m.word}</span>
                <span className="m">{m.meaning}</span>
              </div>
            ))}
          </div>
          <div className="mistake-note">
            間違えた単語は自動的に library フォルダに保存されました。復習に役立てよう！
          </div>
        </>
      ) : (
        <div className="mistake-note">全問正解！すごい！🎉</div>
      )}

      <div className="button-row">
        <button className="button secondary" onClick={onHome}>
          学年選択にもどる
        </button>
        <button className="button" onClick={onRetry}>
          もう一度挑戦する
        </button>
      </div>
    </div>
  );
}
