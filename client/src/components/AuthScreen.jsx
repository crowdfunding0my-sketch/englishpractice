import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function AuthScreen({ theme, onThemeChange }) {
  const { signIn, signUp, sendPasswordResetEmail } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgotPassword"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else if (mode === "signup") {
        const { needsEmailConfirmation } = await signUp(email, password);
        if (needsEmailConfirmation) {
          setMessage("確認メールを送信しました。メール内のリンクを開いてからログインしてください。");
        }
      } else if (mode === "forgotPassword") {
        await sendPasswordResetEmail(email);
        setMessage("パスワード再設定用のメールを送信しました。メール内のリンクを開いて新しいパスワードを設定してください。");
      }
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError(null);
    setMessage(null);
    setPassword("");
  }

  const titles = {
    login: "ログイン",
    signup: "会員登録",
    forgotPassword: "パスワード再設定",
  };
  const submitLabels = {
    login: "ログイン",
    signup: "会員登録",
    forgotPassword: "再設定メールを送る",
  };

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="app-title">単マス</div>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>

      <div className="card" style={{ maxWidth: 420 }}>
        <div className="mascot">
          <img src="/mascot-welcome.jpg" alt="単マスのマスコット" />
        </div>
        <h2 className="center-text">{titles[mode]}</h2>
        {mode === "forgotPassword" && (
          <p className="center-text" style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 8 }}>
            登録済みのメールアドレスに、パスワード再設定用のリンクを送ります。
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
          <label>
            <div style={{ marginBottom: 6, color: "var(--text-muted)", fontSize: "0.85rem" }}>メールアドレス</div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
            />
          </label>

          {mode !== "forgotPassword" && (
            <label>
              <div style={{ marginBottom: 6, color: "var(--text-muted)", fontSize: "0.85rem" }}>パスワード（6文字以上）</div>
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
          )}

          {mode === "login" && (
            <button
              type="button"
              className="link-button"
              style={{ alignSelf: "flex-end", fontSize: "0.85rem" }}
              onClick={() => switchMode("forgotPassword")}
            >
              パスワードをお忘れですか？
            </button>
          )}

          {error && <div style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</div>}
          {message && <div style={{ color: "var(--success)", fontSize: "0.9rem" }}>{message}</div>}

          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "処理中..." : submitLabels[mode]}
          </button>
        </form>

        <div className="center-text" style={{ marginTop: 18, fontSize: "0.9rem", color: "var(--text-muted)" }}>
          {mode === "login" && (
            <>
              アカウントをお持ちでないですか？{" "}
              <button className="link-button" onClick={() => switchMode("signup")}>
                会員登録
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              すでにアカウントをお持ちですか？{" "}
              <button className="link-button" onClick={() => switchMode("login")}>
                ログイン
              </button>
            </>
          )}
          {mode === "forgotPassword" && (
            <button className="link-button" onClick={() => switchMode("login")}>
              ← ログインにもどる
            </button>
          )}
        </div>
      </div>

      <div className="credit">画像取得:https://pixabay.com/</div>
    </div>
  );
}

function translateAuthError(message) {
  if (message.includes("Invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (message.includes("User already registered")) {
    return "このメールアドレスは既に登録されています。";
  }
  if (message.includes("Password should be at least")) {
    return "パスワードは6文字以上で入力してください。";
  }
  return message;
}
