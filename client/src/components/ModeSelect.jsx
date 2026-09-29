const MODES = [
  {
    key: "practice",
    icon: "/icon-practice.jpg",
    label: "練習モード",
    sub: "イラスト・例文・発音つきで学習",
  },
  {
    key: "test",
    icon: "/icon-test.jpg",
    label: "テストモード",
    sub: "4択クイズにチャレンジ",
  },
  {
    key: "add",
    icon: "/icon-add.jpg",
    label: "単語を追加",
    sub: "自分だけの単語を登録",
  },
  {
    key: "library",
    icon: "/icon-library.jpg",
    label: "苦手単語",
    sub: "間違えた単語を復習する",
  },
];

export default function ModeSelect({ grade, isPremium, onSelect, onBack }) {
  return (
    <div className="card">
      <button className="back-link" onClick={onBack}>
        ← 学年選択にもどる
      </button>
      <div className="mascot small">
        <img src="/mascot-welcome.jpg" alt="単マスのマスコット" />
      </div>
      <h2 className="center-text">中学{grade}年 - モードを選んでね</h2>
      <div className="mode-grid">
        {MODES.map((mode) => (
          <div key={mode.key} className="select-card" onClick={() => onSelect(mode.key)}>
            <div className="icon-image">
              <img src={mode.icon} alt="" />
            </div>
            <span className="label">{mode.label}</span>
            <span className="sub">{mode.sub}</span>
          </div>
        ))}
        <div className="select-card" onClick={() => onSelect("upgrade")}>
          <div className="icon-image">
            <img src="/icon-upgrade.jpg" alt="" />
          </div>
          <span className="label">{isPremium ? "プレミアム会員" : "プレミアムにアップグレード"}</span>
          <span className="sub">{isPremium ? "プラン管理はこちら" : "拡張単語パック(各学年+400語)が使い放題"}</span>
        </div>
      </div>
    </div>
  );
}
