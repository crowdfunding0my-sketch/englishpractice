import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function ResetPasswordScreen({ theme, onThemeChange }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError("パスワードの更新に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="app-title">単マス</div>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>

      <div className="card" style={{ maxWidth: 420 }}>
        <h2 className="center-text">新しいパスワードを設定</h2>

        {done ? (
          <p className="center-text" style={{ color: "var(--success)", marginTop: 20 }}>
            パスワードを更新しました。このままアプリをご利用いただけます。
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
            <label>
              <div style={{ marginBottom: 6, color: "var(--text-muted)", fontSize: "0.85rem" }}>新しいパスワード（6文字以上）</div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
              />
            </label>
            <label>
              <div style={{ marginBottom: 6, color: "var(--text-muted)", fontSize: "0.85rem" }}>確認のため再入力</div>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
              />
            </label>

            {error && <div style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</div>}

            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "処理中..." : "パスワードを更新する"}
            </button>
          </form>
        )}
      </div>

      <div className="credit">画像取得:https://pixabay.com/</div>
    </div>
  );
}
