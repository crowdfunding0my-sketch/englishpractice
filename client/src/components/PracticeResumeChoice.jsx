export default function PracticeResumeChoice({ savedIndex, total, onResume, onRestart, onBack }) {
  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <button className="back-link" onClick={onBack}>
        ← モード選択にもどる
      </button>
      <h2 className="center-text">前回の続きから始めますか？</h2>
      <p className="center-text" style={{ color: "var(--text-muted)" }}>
        前回は {savedIndex + 1} / {total} 問目まで進んでいました。
      </p>
      <p className="center-text" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        「最初から始める」を選ぶと、単語の出題順がシャッフルされます。
      </p>
      <div className="button-row">
        <button className="button secondary" onClick={onRestart}>
          最初から始める
        </button>
        <button className="button" onClick={onResume}>
          続きから始める
        </button>
      </div>
    </div>
  );
}
