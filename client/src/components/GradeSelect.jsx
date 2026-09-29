const GRADES = [
  { grade: 1, label: "中学1年", emoji: "🌱" },
  { grade: 2, label: "中学2年", emoji: "🌿" },
  { grade: 3, label: "中学3年", emoji: "🌳" },
];

export default function GradeSelect({ onSelect }) {
  return (
    <div className="card">
      <div className="mascot small">
        <img src="/mascot-welcome.jpg" alt="単マスのマスコット" />
      </div>
      <h2 className="center-text">学年を選んでね</h2>
      <div className="grade-grid">
        {GRADES.map((g) => (
          <div
            key={g.grade}
            className="select-card"
            onClick={() => onSelect(g.grade)}
          >
            <span className="emoji">{g.emoji}</span>
            <span className="label">{g.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
