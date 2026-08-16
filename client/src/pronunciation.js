// 単語カードの発音再生: dictionaryapi.dev の音声(アメリカ発音優先)を再生し、
// 取得できない場合はブラウザの音声合成(en-US)にフォールバックする。

const audioCache = new Map(); // word -> url | null

async function findAudioUrl(word) {
  if (audioCache.has(word)) return audioCache.get(word);

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) {
      audioCache.set(word, null);
      return null;
    }
    const data = await res.json();
    const phonetics = (data[0] && data[0].phonetics) || [];
    const withAudio = phonetics.filter((p) => p.audio);
    const usAudio =
      withAudio.find((p) => p.audio.includes("-us.mp3")) || withAudio[0];
    const url = usAudio ? usAudio.audio : null;
    audioCache.set(word, url);
    return url;
  } catch {
    audioCache.set(word, null);
    return null;
  }
}

function speakWithBrowser(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export async function playPronunciation(word) {
  // 熟語(スペースを含む)は音声辞書APIにヒットしないことが多いのでブラウザ音声合成へ
  if (word.includes(" ")) {
    speakWithBrowser(word);
    return;
  }

  const url = await findAudioUrl(word);
  if (url) {
    const audio = new Audio(url.startsWith("http") ? url : `https:${url}`);
    audio.play().catch(() => speakWithBrowser(word));
  } else {
    speakWithBrowser(word);
  }
}

// 例文を読み上げる(例文の音声ファイルは無いため、常にブラウザの音声合成を使う)
export function playSentence(sentence) {
  if (!sentence) return;
  speakWithBrowser(sentence);
}
