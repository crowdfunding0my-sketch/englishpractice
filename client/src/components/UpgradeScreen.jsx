import { useState } from "react";
import { openBillingPortal, startCheckout } from "../api.js";

export default function UpgradeScreen({ isPremium, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick(action) {
    setError(null);
    setLoading(true);
    try {
      await action();
    } catch (err) {
      setError("処理に失敗しました。時間をおいて再度お試しください。");
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <button className="back-link" onClick={onBack}>
        ← モード選択にもどる
      </button>
      <h2 className="center-text">プレミアムプラン</h2>

      {isPremium ? (
        <>
          <p className="center-text" style={{ color: "var(--success)", fontWeight: 700 }}>
            現在プレミアム会員です
          </p>
          <p className="center-text" style={{ color: "var(--text-muted)" }}>
            拡張単語パック(各学年+400語)を利用できます。
          </p>
          <div className="button-row">
            <button className="button" disabled={loading} onClick={() => handleClick(openBillingPortal)}>
              {loading ? "処理中..." : "プラン管理・解約はこちら"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="center-text" style={{ color: "var(--text-muted)" }}>
            拡張単語パック(各学年+400語)が学び放題になります。
          </p>
          <div className="word-example" style={{ marginTop: 20 }}>
            <div className="en" style={{ fontWeight: 700 }}>
              プレミアムプランでできること
            </div>
            <div className="ja" style={{ marginTop: 8 }}>
              ・各学年 追加400語の練習モード・テストモードが解放されます
              <br />
              ・月額または年額で、いつでも解約できます
            </div>
          </div>
          {error && (
            <div className="center-text" style={{ color: "var(--danger)", marginTop: 12 }}>
              {error}
            </div>
          )}
          <div className="button-row">
            <button className="button" disabled={loading} onClick={() => handleClick(startCheckout)}>
              {loading ? "処理中..." : "アップグレードする"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
