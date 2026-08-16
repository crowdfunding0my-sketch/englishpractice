export default function ModeSelect({ grade, onSelect, onBack }) {
  return (
    <div className="card">
      <button className="back-link" onClick={onBack}>
        ← 学年選択にもどる
      </button>
      <h2 className="center-text">中学{grade}年 - モードを選んでね</h2>
      <div className="mode-grid">
        <div className="select-card" onClick={() => onSelect("practice")}>
          <span className="emoji">📖</span>
          <span className="label">練習モード</span>
          <span className="sub">イラスト・例文・発音つきで学習</span>
        </div>
        <div className="select-card" onClick={() => onSelect("test")}>
          <span className="emoji">📝</span>
          <span className="label">テストモード</span>
          <span className="sub">4択クイズにチャレンジ</span>
        </div>
        <div className="select-card" onClick={() => onSelect("add")}>
          <span className="emoji">➕</span>
          <span className="label">単語を追加</span>
          <span className="sub">自分だけの単語を登録</span>
        </div>
        <div className="select-card" onClick={() => onSelect("library")}>
          <span className="emoji">📚</span>
          <span className="label">苦手単語</span>
          <span className="sub">間違えた単語を復習する</span>
        </div>
      </div>
    </div>
  );
}
