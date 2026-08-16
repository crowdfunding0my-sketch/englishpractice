export default function ThemeToggle({ theme, onChange }) {
  return (
    <div className="theme-toggle">
      <button
        className={theme === "stylish" ? "active" : ""}
        onClick={() => onChange("stylish")}
      >
        スタイリッシュ
      </button>
      <button
        className={theme === "cute" ? "active" : ""}
        onClick={() => onChange("cute")}
      >
        かわいい
      </button>
    </div>
  );
}
