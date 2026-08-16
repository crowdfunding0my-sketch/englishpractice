const COUNTS = [10, 20, 30];

export default function QuestionCountSelect({ onSelect, onBack, maxAvailable }) {
  return (
    <div className="card">
      <button className="back-link" onClick={onBack}>
        ← モード選択にもどる
      </button>
      <h2 className="center-text">問題数を選んでね</h2>
      <div className="count-grid">
        {COUNTS.map((count) => {
          const disabled = count > maxAvailable;
          return (
            <div
              key={count}
              className="select-card"
              style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
              onClick={() => !disabled && onSelect(count)}
            >
              <span className="emoji">🎯</span>
              <span className="label">{count}問</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
