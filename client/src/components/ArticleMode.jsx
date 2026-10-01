import { useEffect, useState } from "react";
import { fetchArticles } from "../api.js";
import { playSentence } from "../pronunciation.js";

const ROLE_LABELS = {
  S: "主語",
  V: "動詞",
  O: "目的語",
  C: "補語",
  M: "修飾語",
};

// 日付から「今日の記事」を決定論的に選ぶ(その日の通算日数を記事数で割った余り)
function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// 句読点だけのスパンは前に空白を入れずに詰めて表示する
function isPunctSpan(text) {
  return /^[,.!?;:]+$/.test(text.trim());
}

function SentenceSpans({ spans, showGrammar }) {
  if (!showGrammar) {
    return null;
  }
  return (
    <span className="article-sentence-en">
      {spans.map((span, i) => (
        <span key={i}>
          {i > 0 && !isPunctSpan(span.text) ? " " : ""}
          {span.role ? (
            <span className={`grammar-role role-${span.role}`}>{span.text}</span>
          ) : (
            span.text
          )}
        </span>
      ))}
    </span>
  );
}

export default function ArticleMode({ grade, onBack }) {
  const [articles, setArticles] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showJa, setShowJa] = useState(true);
  const [showGrammar, setShowGrammar] = useState(false);

  useEffect(() => {
    setArticles(null);
    setSelected(null);
    fetchArticles(grade)
      .then(setArticles)
      .catch(() => setError("記事データの取得に失敗しました。"));
  }, [grade]);

  const todayIndex = articles && articles.length > 0 ? dayOfYear(new Date()) % articles.length : -1;

  function playWholeArticle(article) {
    playSentence(article.sentences.map((s) => s.text).join(" "));
  }

  if (selected) {
    return (
      <div className="card">
        <button className="back-link" onClick={() => setSelected(null)}>
          ← 記事一覧にもどる
        </button>
        <h2 className="center-text">{selected.title}</h2>
        <div className="article-title-ja center-text">{selected.titleJa}</div>

        <div className="article-toggle-row">
          <button
            className={`pill-toggle ${showJa ? "active" : ""}`}
            onClick={() => setShowJa((v) => !v)}
          >
            日本語訳を表示
          </button>
          <button
            className={`pill-toggle ${showGrammar ? "active" : ""}`}
            onClick={() => setShowGrammar((v) => !v)}
          >
            文法をハイライト
          </button>
          <button className="speak-button" title="全文を聞く" aria-label="全文を聞く" onClick={() => playWholeArticle(selected)}>
            🔊
          </button>
        </div>

        {showGrammar && (
          <div className="grammar-legend">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <span key={role} className={`grammar-role role-${role}`}>
                {role}={label}
              </span>
            ))}
          </div>
        )}

        <div className="article-sentence-list">
          {selected.sentences.map((s, i) => (
            <div className="article-sentence-row" key={i}>
              <div className="en-row">
                {showGrammar ? (
                  <SentenceSpans spans={s.spans} showGrammar={showGrammar} />
                ) : (
                  <span className="article-sentence-en">{s.text}</span>
                )}
                <button
                  className="speak-button small"
                  onClick={() => playSentence(s.text)}
                  title="読み上げる"
                  aria-label="読み上げる"
                >
                  🔊
                </button>
              </div>
              {showJa && <div className="ja">{s.ja}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <button className="back-link" onClick={onBack}>
        ← モード選択にもどる
      </button>
      <h2 className="center-text">中学{grade}年 - 英語記事</h2>

      {error && <div className="mistake-note" style={{ color: "var(--danger)" }}>{error}</div>}

      {!error && articles === null && <div className="loading">読み込み中...</div>}

      {articles && (
        <div className="article-list">
          {articles.map((article, i) => (
            <div className="article-item" key={article.id} onClick={() => setSelected(article)}>
              {i === todayIndex && <span className="article-badge">📅 今日のオススメ</span>}
              <span className="w">{article.title}</span>
              <span className="m">{article.titleJa}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
