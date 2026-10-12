import { useEffect, useMemo, useRef, useState } from "react";
import { addDiaryEntry, deleteDiaryEntry, fetchDiaryEntries } from "../api.js";
import { checkDiaryText } from "../diaryCheck.js";
import { splitSentences, tagSentenceApprox } from "../grammarTag.js";

const SpeechRecognitionApi =
  typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

const ROLE_LABELS = { S: "主語", V: "動詞", O: "目的語", C: "補語", M: "修飾語" };

function isPunctSpan(text) {
  return /^[,.!?;:]+$/.test(text.trim());
}

function GrammarSentence({ spans }) {
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

export default function DiaryMode({ grade, onBack }) {
  const [entries, setEntries] = useState(null);
  const [text, setText] = useState("");
  const [textJa, setTextJa] = useState("");
  const [recordingTarget, setRecordingTarget] = useState(null); // null | "en" | "ja"
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [micError, setMicError] = useState(null);
  const [showGrammar, setShowGrammar] = useState(false);
  const recognitionRef = useRef(null);

  async function loadEntries() {
    try {
      const data = await fetchDiaryEntries(grade);
      setEntries(data);
    } catch {
      setError("日記の取得に失敗しました。");
      setEntries([]);
    }
  }

  useEffect(() => {
    setEntries(null);
    loadEntries();
  }, [grade]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const feedback = useMemo(() => checkDiaryText(text), [text]);
  const grammarSentences = useMemo(() => {
    if (!showGrammar) return [];
    return splitSentences(text).map((s) => ({ text: s, spans: tagSentenceApprox(s) }));
  }, [text, showGrammar]);

  // target: "en" (英語入力欄) または "ja" (日本語入力欄) — 同じブラウザ機能の言語コードを
  // 切り替えるだけで日本語の音声入力にも使える(追加のAPIや費用は不要)
  function startRecording(target) {
    if (!SpeechRecognitionApi) return;
    const setTarget = target === "ja" ? setTextJa : setText;
    const recognition = new SpeechRecognitionApi();
    recognition.lang = target === "ja" ? "ja-JP" : "en-US";
    // continuous:falseだと短い無音を検知した瞬間に終了してしまうため、trueにして
    // 話し続けている間はセッションを維持する(一区切りごとにonresultが発火する)
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    const endPunct = target === "ja" ? "。" : ".";
    const endPunctRe = target === "ja" ? /[。！？]$/ : /[.!?]$/;
    recognition.onresult = (e) => {
      // 話し終えて一区切りつくたびにonresultが発火するが、認識結果には句読点が
      // 付かないため、ここで文末のピリオド(日本語は「。」)を自動で補う
      const newPhrases = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const t = e.results[i][0].transcript.trim();
          if (t) {
            const capitalized = target === "ja" ? t : t.charAt(0).toUpperCase() + t.slice(1);
            newPhrases.push(endPunctRe.test(capitalized) ? capitalized : `${capitalized}${endPunct}`);
          }
        }
      }
      if (newPhrases.length === 0) return;
      const newChunk = newPhrases.join(" ");
      setTarget((prev) => {
        const trimmedPrev = prev.trim();
        if (!trimmedPrev) return newChunk;
        const sep = endPunctRe.test(trimmedPrev) ? " " : `${endPunct} `;
        return `${trimmedPrev}${sep}${newChunk}`;
      });
    };
    recognition.onend = () => setRecordingTarget(null);
    recognition.onerror = (e) => {
      setRecordingTarget(null);
      if (e.error === "aborted") {
        // ユーザー自身が停止ボタンを押した場合は正常な停止なのでエラー表示しない
        return;
      }
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicError("マイクの使用が許可されていません。ブラウザのアドレスバー付近のマイクアイコンから許可してください。");
      } else if (e.error === "no-speech") {
        setMicError("音声が検出されませんでした。マイクに向かってはっきり話してみてね。(マイクが正しく選択されているかも確認してください)");
      } else if (e.error === "audio-capture") {
        setMicError("マイクが見つかりません。マイクが接続されているか確認してください。");
      } else if (e.error === "network") {
        setMicError(
          "ネットワークエラーが発生しました。音声認識はGoogleのサーバーと通信するため、学校や会社のネットワークではブロックされていることがあります。自宅のWi-Fiなど別のネットワークで試してみてください。"
        );
      } else {
        setMicError(`音声認識でエラーが発生しました(${e.error})。もう一度お試しください。`);
      }
    };
    recognitionRef.current = recognition;
    try {
      setMicError(null);
      recognition.start();
      setRecordingTarget(target);
    } catch {
      setRecordingTarget(null);
      setMicError("音声入力を開始できませんでした。もう一度ボタンを押してみてください。");
    }
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecordingTarget(null);
  }

  async function handleSave() {
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addDiaryEntry(grade, text.trim(), textJa.trim());
      setText("");
      setTextJa("");
      await loadEntries();
    } catch {
      setError("日記の保存に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await deleteDiaryEntry(id);
    await loadEntries();
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <button className="back-link" onClick={onBack}>
        ← モード選択にもどる
      </button>
      <h2 className="center-text">中学{grade}年 - 英語日記</h2>
      <div className="diary-note center-text">
        今日あったことを英語で書いてみよう。音声で話した内容を文字にすることもできるよ。
      </div>

      <textarea
        className="auth-input diary-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck="true"
        lang="en"
        placeholder="例: I went to school by bike today."
      />

      <div className="diary-toolbar">
        {SpeechRecognitionApi ? (
          <button
            type="button"
            className={`mic-button ${recordingTarget === "en" ? "recording" : ""}`}
            disabled={recordingTarget !== null && recordingTarget !== "en"}
            onClick={recordingTarget === "en" ? stopRecording : () => startRecording("en")}
          >
            {recordingTarget === "en" ? "⏹ 録音中... (押して停止)" : "🎤 英語を話して入力する"}
          </button>
        ) : (
          <div className="mistake-note">このブラウザは音声入力に対応していません。</div>
        )}
      </div>
      {micError && (
        <div className="mistake-note" style={{ color: "var(--danger)" }}>
          {micError}
        </div>
      )}

      <div className="diary-feedback">
        {feedback.messages.map((m, i) => (
          <span key={i} className={`diary-feedback-item ${m.ok ? "ok" : "warn"}`}>
            {m.ok ? "✓" : "！"} {m.text}
          </span>
        ))}
        <span className="diary-feedback-hint">
          ※文法の正誤を自動で判定するものではありません。気になる単語には下線(スペルチェック)が表示されます。
        </span>
      </div>

      <label>
        <div className="field-label">伝えたかった日本語（任意・書き終えたら自分で訳してみよう）</div>
        <textarea
          className="auth-input diary-textarea-ja"
          value={textJa}
          onChange={(e) => setTextJa(e.target.value)}
          placeholder="例: 今日は自転車で学校に行きました。"
        />
      </label>
      {SpeechRecognitionApi && (
        <div className="diary-toolbar">
          <button
            type="button"
            className={`mic-button ${recordingTarget === "ja" ? "recording" : ""}`}
            disabled={recordingTarget !== null && recordingTarget !== "ja"}
            onClick={recordingTarget === "ja" ? stopRecording : () => startRecording("ja")}
          >
            {recordingTarget === "ja" ? "⏹ 録音中... (押して停止)" : "🎤 日本語を話して入力する"}
          </button>
        </div>
      )}

      <div className="article-toggle-row">
        <button
          type="button"
          className={`pill-toggle ${showGrammar ? "active" : ""}`}
          onClick={() => setShowGrammar((v) => !v)}
        >
          文法を確認する(自動解析・目安)
        </button>
      </div>

      {showGrammar && grammarSentences.length > 0 && (
        <>
          <div className="grammar-legend">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <span key={role} className={`grammar-role role-${role}`}>
                {role}={label}
              </span>
            ))}
          </div>
          <div className="article-sentence-list" style={{ marginBottom: 20 }}>
            {grammarSentences.map((s, i) => (
              <GrammarSentence key={i} spans={s.spans} />
            ))}
          </div>
        </>
      )}

      {error && <div className="mistake-note" style={{ color: "var(--danger)" }}>{error}</div>}

      <button className="button" onClick={handleSave} disabled={submitting || !text.trim()}>
        {submitting ? "保存中..." : "保存する"}
      </button>

      <h3 style={{ marginTop: 32 }}>これまでの日記（{entries ? entries.length : 0}件）</h3>
      {entries === null && <div className="loading">読み込み中...</div>}
      {entries && entries.length === 0 && (
        <div className="mistake-note">まだ日記が書かれていません。</div>
      )}
      {entries && entries.length > 0 && (
        <div className="custom-word-list">
          {entries.map((entry) => (
            <div className="custom-word-item" key={entry.id}>
              <div className="info">
                <span className="w">
                  {new Date(entry.created_at).toLocaleDateString("ja-JP")}（{entry.word_count}語）
                </span>
                <span className="m">{entry.text}</span>
                {entry.text_ja && <span className="m">{entry.text_ja}</span>}
              </div>
              <button className="delete-button" onClick={() => handleDelete(entry.id)}>
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
