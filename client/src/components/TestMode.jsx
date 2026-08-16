import { useMemo, useState } from "react";
import { shuffle } from "../utils.js";

function buildQuestions(words, count) {
  const pool = shuffle(words).slice(0, count);
  return pool.map((item) => {
    const otherMeanings = words
      .filter((w) => w.id !== item.id && w.meaning !== item.meaning)
      .map((w) => w.meaning);
    const distractors = shuffle([...new Set(otherMeanings)]).slice(0, 3);
    const choices = shuffle([item.meaning, ...distractors]);
    return { item, choices };
  });
}

export default function TestMode({ words, count, onFinish, onBack }) {
  const questions = useMemo(() => buildQuestions(words, count), [words, count]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState([]);

  const question = questions[qIndex];
  const progress = ((qIndex + (selected ? 1 : 0)) / questions.length) * 100;

  function handleSelect(choice) {
    if (selected) return;
    setSelected(choice);
    const isCorrect = choice === question.item.meaning;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setMistakes((m) => [...m, question.item]);
    }
  }

  function handleNext() {
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
    } else {
      onFinish({ score: correctCount, total: questions.length, mistakes });
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      <button className="back-link" onClick={onBack}>
        ← 問題数選択にもどる
      </button>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="quiz-sub center-text" style={{ marginBottom: 8 }}>
        第{qIndex + 1}問 / {questions.length}問
      </div>
      <div className="card">
        <div className="quiz-question">{question.item.word}</div>
        <div className="quiz-sub">の意味はどれ？</div>
        <div className="choice-grid">
          {question.choices.map((choice) => {
            let cls = "choice-button";
            if (selected) {
              if (choice === question.item.meaning) cls += " correct";
              else if (choice === selected) cls += " wrong";
            }
            return (
              <button
                key={choice}
                className={cls}
                disabled={!!selected}
                onClick={() => handleSelect(choice)}
              >
                {choice}
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="button-row">
            <button className="button" onClick={handleNext}>
              {qIndex + 1 < questions.length ? "次の問題へ" : "結果を見る"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
