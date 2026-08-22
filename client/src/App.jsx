import { useEffect, useState } from "react";
import GradeSelect from "./components/GradeSelect.jsx";
import ModeSelect from "./components/ModeSelect.jsx";
import QuestionCountSelect from "./components/QuestionCountSelect.jsx";
import PracticeMode from "./components/PracticeMode.jsx";
import TestMode from "./components/TestMode.jsx";
import ResultScreen from "./components/ResultScreen.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import AddWordMode from "./components/AddWordMode.jsx";
import LibraryMode from "./components/LibraryMode.jsx";
import PracticeResumeChoice from "./components/PracticeResumeChoice.jsx";
import UpgradeScreen from "./components/UpgradeScreen.jsx";
import { fetchWords, fetchCustomWords, reportMistakes, fetchSubscriptionStatus } from "./api.js";
import { useAuth } from "./context/AuthContext.jsx";
import { getPracticeProgress, savePracticeProgress } from "./progress.js";
import { shuffle } from "./utils.js";

// 保存されている出題順(idの配列)を元に、現在の単語リストを並び替える。
// 追加/削除で単語構成が変わっていても、保存済みの並びを維持しつつ新規分は末尾に補う。
function buildOrderedWords(words, order) {
  const byId = new Map(words.map((w) => [w.id, w]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean);
  const orderedIds = new Set(order);
  const missing = words.filter((w) => !orderedIds.has(w.id));
  return [...ordered, ...missing];
}

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

const SCREENS = {
  GRADE: "grade",
  MODE: "mode",
  COUNT: "count",
  PRACTICE_CHOICE: "practiceChoice",
  PRACTICE: "practice",
  TEST: "test",
  ADD: "add",
  LIBRARY: "library",
  UPGRADE: "upgrade",
  RESULT: "result",
};

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("englishword-theme") || "stylish"
  );
  const [screen, setScreen] = useState(SCREENS.GRADE);
  const [grade, setGrade] = useState(null);
  const [words, setWords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [result, setResult] = useState(null);
  const [practiceWords, setPracticeWords] = useState(null);
  const [practiceStartIndex, setPracticeStartIndex] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("englishword-theme", theme);
  }, [theme]);

  async function refreshSubscription() {
    try {
      const sub = await fetchSubscriptionStatus();
      setIsPremium(!!sub && ACTIVE_SUBSCRIPTION_STATUSES.includes(sub.status));
    } catch {
      setIsPremium(false);
    }
  }

  // ログイン後に購読状態を取得。Stripe Checkoutから戻ってきた場合は
  // Webhook反映のタイムラグを考慮して少し待ってから再取得する。
  useEffect(() => {
    if (!user) return;
    refreshSubscription();

    const params = new URLSearchParams(window.location.search);
    if (params.has("checkout")) {
      window.history.replaceState({}, "", window.location.pathname);
      if (params.get("checkout") === "success") {
        setTimeout(refreshSubscription, 1500);
      }
    }
  }, [user]);

  // プレミアム未加入の場合、プレミアム限定単語を出題対象から除外する
  const availableWords = words
    ? words.filter((w) => isPremium || w.tier !== "premium")
    : null;

  // 学年の静的単語データ＋ユーザーが追加した単語をマージして取得する
  async function loadWords(g) {
    const [baseWords, customWords] = await Promise.all([
      fetchWords(g),
      fetchCustomWords(g),
    ]);
    setWords([...baseWords, ...customWords]);
  }

  async function handleSelectGrade(g) {
    setGrade(g);
    setLoading(true);
    setError(null);
    try {
      await loadWords(g);
      setScreen(SCREENS.MODE);
    } catch (e) {
      setError(
        "単語データの取得に失敗しました。サーバーが起動しているか、Supabaseのテーブル(supabase/schema.sql)が作成済みか確認してください。"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectMode(mode) {
    if (mode === "practice") {
      const saved = getPracticeProgress(user.id, grade);
      if (saved && saved.index > 0) {
        setScreen(SCREENS.PRACTICE_CHOICE);
      } else {
        startFreshPractice();
      }
    } else if (mode === "test") {
      setScreen(SCREENS.COUNT);
    } else if (mode === "add") {
      setScreen(SCREENS.ADD);
    } else if (mode === "library") {
      setScreen(SCREENS.LIBRARY);
    } else if (mode === "upgrade") {
      setScreen(SCREENS.UPGRADE);
    }
  }

  // 「最初から始める」: 出題順をシャッフルして0問目から開始する
  function startFreshPractice() {
    const order = shuffle(availableWords.map((w) => w.id));
    setPracticeWords(buildOrderedWords(availableWords, order));
    setPracticeStartIndex(0);
    savePracticeProgress(user.id, grade, order, 0);
    setScreen(SCREENS.PRACTICE);
  }

  // 「続きから始める」: 前回保存した出題順のまま、保存済みの位置から再開する
  function resumePractice() {
    const saved = getPracticeProgress(user.id, grade);
    const order = saved ? saved.order : availableWords.map((w) => w.id);
    setPracticeWords(buildOrderedWords(availableWords, order));
    setPracticeStartIndex(saved ? saved.index : 0);
    setScreen(SCREENS.PRACTICE);
  }

  function handleSelectCount(count) {
    setQuestionCount(count);
    setScreen(SCREENS.TEST);
  }

  function handleFinishTest(testResult) {
    setResult(testResult);
    if (testResult.mistakes.length > 0) {
      reportMistakes(
        grade,
        testResult.mistakes.map((m) => ({
          id: m.id,
          word: m.word,
          pos: m.pos,
          meaning: m.meaning,
        }))
      );
    }
    setScreen(SCREENS.RESULT);
  }

  function goHome() {
    setScreen(SCREENS.GRADE);
    setGrade(null);
    setWords(null);
    setResult(null);
  }

  if (authLoading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!user) {
    return <AuthScreen theme={theme} onThemeChange={setTheme} />;
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="app-title">単マス</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <ThemeToggle theme={theme} onChange={setTheme} />
          <button className="button secondary" onClick={signOut}>
            ログアウト
          </button>
        </div>
      </div>

      {loading && <div className="loading">読み込み中...</div>}
      {error && (
        <div className="card center-text" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {!loading && !error && screen === SCREENS.GRADE && (
        <GradeSelect onSelect={handleSelectGrade} />
      )}

      {!loading && screen === SCREENS.MODE && words && (
        <ModeSelect grade={grade} isPremium={isPremium} onSelect={handleSelectMode} onBack={goHome} />
      )}

      {screen === SCREENS.COUNT && availableWords && (
        <QuestionCountSelect
          maxAvailable={availableWords.length}
          onSelect={handleSelectCount}
          onBack={() => setScreen(SCREENS.MODE)}
        />
      )}

      {screen === SCREENS.PRACTICE_CHOICE && availableWords && (
        <PracticeResumeChoice
          savedIndex={getPracticeProgress(user.id, grade)?.index || 0}
          total={availableWords.length}
          onResume={resumePractice}
          onRestart={startFreshPractice}
          onBack={() => setScreen(SCREENS.MODE)}
        />
      )}

      {screen === SCREENS.PRACTICE && practiceWords && (
        <PracticeMode
          words={practiceWords}
          initialIndex={practiceStartIndex}
          onProgress={(index) =>
            savePracticeProgress(user.id, grade, practiceWords.map((w) => w.id), index)
          }
          onBack={() => setScreen(SCREENS.MODE)}
        />
      )}

      {screen === SCREENS.TEST && availableWords && (
        <TestMode
          words={availableWords}
          count={questionCount}
          onFinish={handleFinishTest}
          onBack={() => setScreen(SCREENS.COUNT)}
        />
      )}

      {screen === SCREENS.ADD && (
        <AddWordMode
          grade={grade}
          onBack={() => setScreen(SCREENS.MODE)}
          onWordsChanged={() => loadWords(grade)}
        />
      )}

      {screen === SCREENS.LIBRARY && (
        <LibraryMode grade={grade} words={words} onBack={() => setScreen(SCREENS.MODE)} />
      )}

      {screen === SCREENS.UPGRADE && (
        <UpgradeScreen isPremium={isPremium} onBack={() => setScreen(SCREENS.MODE)} />
      )}

      {screen === SCREENS.RESULT && result && (
        <ResultScreen
          result={result}
          onRetry={() => setScreen(SCREENS.COUNT)}
          onHome={goHome}
        />
      )}

      <div className="credit">画像取得:https://pixabay.com/</div>
    </div>
  );
}
