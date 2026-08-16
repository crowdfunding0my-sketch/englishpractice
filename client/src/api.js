import { supabase } from "./lib/supabaseClient.js";

export async function fetchWords(grade) {
  const res = await fetch(`/api/words?grade=${grade}`);
  if (!res.ok) throw new Error("単語データの取得に失敗しました");
  return res.json();
}

export async function fetchImage(query) {
  try {
    const res = await fetch(`/api/images?query=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  } catch {
    return null;
  }
}

// ユーザーが追加モードで登録した単語をSupabaseから取得し、
// アプリ内の単語オブジェクト形式(camelCase)に変換する
export async function fetchCustomWords(grade) {
  const { data, error } = await supabase
    .from("custom_words")
    .select("*")
    .eq("grade", grade)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    word: row.word,
    pos: row.pos,
    meaning: row.meaning,
    example: row.example,
    exampleJa: row.example_ja,
    imageQuery: row.image_query,
    isCustom: true,
  }));
}

export async function addCustomWord(grade, item) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("custom_words").insert({
    user_id: user.id,
    grade,
    word: item.word,
    pos: item.pos,
    meaning: item.meaning,
    example: item.example,
    example_ja: item.exampleJa,
    image_query: item.imageQuery,
  });
  if (error) throw error;
}

export async function deleteCustomWord(id) {
  const { error } = await supabase.from("custom_words").delete().eq("id", id);
  if (error) throw error;
}

// テストで間違えた単語の一覧(library)を、間違えた回数が多い順に取得する
export async function fetchMistakes(grade) {
  const { data, error } = await supabase
    .from("mistakes")
    .select("*")
    .eq("grade", grade)
    .order("mistake_count", { ascending: false })
    .order("last_mistake_at", { ascending: false });
  if (error) throw error;
  return data;
}

// 覚えた単語をlibraryから削除する(チェックして「削除」を押した分をまとめて削除)
export async function deleteMistakes(ids) {
  if (ids.length === 0) return;
  const { error } = await supabase.from("mistakes").delete().in("id", ids);
  if (error) throw error;
}

// テストで間違えた単語をSupabaseのmistakesテーブルに保存する(ユーザーごとの記録)
// 既に記録がある単語はmistake_countを+1して更新する
export async function reportMistakes(grade, items) {
  try {
    if (items.length === 0) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const itemIds = items.map((item) => item.id);
    const { data: existingRows } = await supabase
      .from("mistakes")
      .select("item_id, mistake_count")
      .eq("user_id", user.id)
      .in("item_id", itemIds);

    const existingCounts = new Map(
      (existingRows || []).map((row) => [row.item_id, row.mistake_count])
    );
    const now = new Date().toISOString();

    const rows = items.map((item) => ({
      user_id: user.id,
      grade,
      item_id: item.id,
      word: item.word,
      pos: item.pos,
      meaning: item.meaning,
      mistake_count: (existingCounts.get(item.id) || 0) + 1,
      last_mistake_at: now,
    }));

    await supabase.from("mistakes").upsert(rows, { onConflict: "user_id,item_id" });
  } catch {
    // 保存失敗はテスト結果表示自体をブロックしない
  }
}
