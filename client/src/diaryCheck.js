// 英語日記の簡易チェック(AIによる添削ではない、表層的なルールチェックのみ)
export function checkDiaryText(text) {
  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const startsWithCapital = /^[A-Za-z]/.test(trimmed) ? /^[A-Z]/.test(trimmed) : true;
  const endsWithPunct = trimmed.length === 0 ? false : /[.!?]$/.test(trimmed);

  const messages = [];
  if (trimmed.length === 0) {
    messages.push({ ok: false, text: "英文を書いてみよう！" });
    return { wordCount, messages };
  }
  messages.push({
    ok: startsWithCapital,
    text: startsWithCapital ? "文の最初が大文字になっているね" : "文の最初は大文字で始めよう",
  });
  messages.push({
    ok: endsWithPunct,
    text: endsWithPunct ? "文の最後に. ! ?がついているね" : "文の最後に．(ピリオド)や！などをつけよう",
  });
  messages.push({ ok: true, text: `単語数: ${wordCount}語` });

  return { wordCount, messages };
}
