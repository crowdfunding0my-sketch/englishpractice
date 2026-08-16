import { useEffect, useState } from "react";
import { addCustomWord, deleteCustomWord, fetchCustomWords } from "../api.js";

const POS_OPTIONS = ["名詞", "動詞", "形容詞", "副詞", "熟語", "前置詞", "その他"];

const EMPTY_FORM = {
  word: "",
  pos: POS_OPTIONS[0],
  meaning: "",
  example: "",
  exampleJa: "",
  imageQuery: "",
};

export default function AddWordMode({ grade, onBack, onWordsChanged }) {
  const [customWords, setCustomWords] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadCustomWords() {
    const words = await fetchCustomWords(grade);
    setCustomWords(words);
  }

  useEffect(() => {
    loadCustomWords();
  }, [grade]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.word.trim() || !form.meaning.trim()) {
      setError("単語と意味は必須です。");
      return;
    }
    setSubmitting(true);
    try {
      await addCustomWord(grade, {
        ...form,
        imageQuery: form.imageQuery.trim() || form.word.trim(),
      });
      setForm(EMPTY_FORM);
      await loadCustomWords();
      onWordsChanged();
    } catch (err) {
      setError("単語の追加に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await deleteCustomWord(id);
    await loadCustomWords();
    onWordsChanged();
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <button className="back-link" onClick={onBack}>
        ← モード選択にもどる
      </button>
      <h2 className="center-text">単語を追加する</h2>

      <form className="word-form" onSubmit={handleSubmit}>
        <div className="row">
          <label>
            <div className="field-label">単語・熟語</div>
            <input
              className="auth-input"
              value={form.word}
              onChange={(e) => updateField("word", e.target.value)}
              placeholder="例: interesting"
              required
            />
          </label>
          <label>
            <div className="field-label">品詞</div>
            <select
              className="auth-input"
              value={form.pos}
              onChange={(e) => updateField("pos", e.target.value)}
            >
              {POS_OPTIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <div className="field-label">意味（日本語）</div>
          <input
            className="auth-input"
            value={form.meaning}
            onChange={(e) => updateField("meaning", e.target.value)}
            placeholder="例: 面白い"
            required
          />
        </label>

        <label>
          <div className="field-label">例文（英語）</div>
          <input
            className="auth-input"
            value={form.example}
            onChange={(e) => updateField("example", e.target.value)}
            placeholder="例: This book is interesting."
          />
        </label>

        <label>
          <div className="field-label">例文の日本語訳</div>
          <input
            className="auth-input"
            value={form.exampleJa}
            onChange={(e) => updateField("exampleJa", e.target.value)}
            placeholder="例: この本は面白いです。"
          />
        </label>

        <label>
          <div className="field-label">画像検索キーワード（空欄なら単語をそのまま使用）</div>
          <input
            className="auth-input"
            value={form.imageQuery}
            onChange={(e) => updateField("imageQuery", e.target.value)}
            placeholder="例: interesting book"
          />
        </label>

        {error && <div style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</div>}

        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "追加中..." : "この単語を追加する"}
        </button>
      </form>

      <h3 style={{ marginTop: 32 }}>追加した単語（{customWords.length}件）</h3>
      {customWords.length === 0 ? (
        <div className="mistake-note">まだ単語が追加されていません。</div>
      ) : (
        <div className="custom-word-list">
          {customWords.map((w) => (
            <div className="custom-word-item" key={w.id}>
              <div className="info">
                <span className="w">
                  {w.word}（{w.pos}）
                </span>
                <span className="m">{w.meaning}</span>
              </div>
              <button className="delete-button" onClick={() => handleDelete(w.id)}>
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
