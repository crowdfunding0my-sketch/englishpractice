// 自分で書いた英文(日記)のS/V/O/C/M分解を、無料のオープンソース英文解析ライブラリ
// compromise(サーバー通信なし、ブラウザ内のみで完結)を使って自動判定する。
// 記事モード(ArticleMode)の手書きタグ付けと違い自動解析のため、あくまで目安。
import nlp from "compromise";

// compromise の Copula タグは be動詞のみを対象にしているため、
// look/seem/feel のような連結動詞(第2文型を作る動詞)を補助的に判定する
const LINKING_VERBS = new Set([
  "look", "looks", "looked", "seem", "seems", "seemed", "feel", "feels", "felt",
  "become", "becomes", "became", "get", "gets", "got", "sound", "sounds", "sounded",
  "smell", "smells", "smelled", "taste", "tastes", "tasted", "appear", "appears",
  "appeared", "remain", "remains", "remained", "stay", "stays", "stayed",
  "grow", "grows", "grew",
]);

function isVerbish(tags) {
  return tags.has("Verb") || tags.has("Copula") || tags.has("Auxiliary") || tags.has("Modal");
}

function isLinkingVerb(term) {
  return new Set(term.tags).has("Copula") || LINKING_VERBS.has(term.text.toLowerCase());
}

export function tagSentenceApprox(sentence) {
  const trimmed = sentence.trim();
  if (!trimmed) return [];

  const doc = nlp(trimmed);
  const json = doc.json({ terms: { text: true, pre: true, post: true, tags: true } });
  const terms = (json[0] && json[0].terms) || [];
  if (terms.length === 0) return [{ text: trimmed, role: null }];

  // 動詞(助動詞・be動詞含む)が連続する最初のまとまりを見つける
  let verbStart = terms.findIndex((t) => isVerbish(new Set(t.tags)));
  if (verbStart === -1) {
    // 動詞が見つからない場合は解析を諦め、そのまま1つのMとして返す
    return [{ text: trimmed, role: "M" }];
  }
  let verbEnd = verbStart;
  while (verbEnd + 1 < terms.length && isVerbish(new Set(terms[verbEnd + 1].tags))) {
    verbEnd++;
  }
  const verbIsCopula = terms.slice(verbStart, verbEnd + 1).some((t) => isLinkingVerb(t));

  // 動詞より前: 先頭の副詞はM、それ以外はS
  let sStart = 0;
  while (sStart < verbStart && new Set(terms[sStart].tags).has("Adverb")) {
    sStart++;
  }

  // 主語と動詞の間にある副詞(always/usuallyなど)はSに含めず、別のM扱いにする
  let sEnd = verbStart;
  while (sEnd - 1 > sStart && new Set(terms[sEnd - 1].tags).has("Adverb")) {
    sEnd--;
  }

  // 動詞より後: 最初に現れる前置詞から文末まではMとして切り出す(複数可)
  let afterEnd = terms.length;
  let prepStart = -1;
  for (let i = verbEnd + 1; i < terms.length; i++) {
    if (new Set(terms[i].tags).has("Preposition")) {
      prepStart = i;
      break;
    }
  }
  const objEnd = prepStart === -1 ? afterEnd : prepStart;

  const spans = [];
  function pushRange(start, end, role) {
    if (start >= end) return;
    // pre/post には語間の空白や句読点(.や,)が入っており、連結すると元の文が復元できる
    const text = terms
      .slice(start, end)
      .map((t) => `${t.pre || ""}${t.text}${t.post || ""}`)
      .join("")
      .trim();
    if (text) spans.push({ text, role });
  }

  if (sStart > 0) pushRange(0, sStart, "M");
  pushRange(sStart, sEnd, "S");
  if (sEnd < verbStart) pushRange(sEnd, verbStart, "M");
  pushRange(verbStart, verbEnd + 1, "V");
  pushRange(verbEnd + 1, objEnd, verbIsCopula ? "C" : "O");
  if (prepStart !== -1) pushRange(prepStart, terms.length, "M");

  // 末尾の句読点(.!?)は単独のスパンとして分離する
  const last = spans[spans.length - 1];
  if (last) {
    const m = last.text.match(/^(.*?)([.!?]+)$/);
    if (m && m[1].trim()) {
      last.text = m[1].trim();
      spans.push({ text: m[2], role: null });
    }
  }

  return spans.filter((s) => s.text);
}

// 文章を文単位に分割する(日記は複数文になることが多いため)
export function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
