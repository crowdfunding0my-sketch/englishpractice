-- Englishword: Supabaseスキーマ定義
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してください。
-- このファイルは再実行しても安全です(既存のテーブル・ポリシーはスキップ/再作成されます)。

-- ユーザーが「追加モード」で追加した単語（学年の練習・テストの出題対象にも含める）
create table if not exists public.custom_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grade smallint not null check (grade in (1, 2, 3)),
  word text not null,
  pos text not null,
  meaning text not null,
  example text not null default '',
  example_ja text not null default '',
  image_query text not null default '',
  created_at timestamptz not null default now()
);

alter table public.custom_words enable row level security;

drop policy if exists "own custom words" on public.custom_words;
create policy "own custom words" on public.custom_words
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLSポリシーだけでなく、ログインユーザーのロール(authenticated)自体にも
-- テーブル操作の権限(GRANT)を与える必要がある(SQL EditorでCREATE TABLEした場合、自動付与されない)
grant select, insert, update, delete on public.custom_words to authenticated;

-- テストモードで間違えた単語（ユーザーごとのlibrary）
create table if not exists public.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grade smallint not null check (grade in (1, 2, 3)),
  item_id text not null,
  word text not null,
  pos text not null,
  meaning text not null,
  mistake_count integer not null default 1,
  last_mistake_at timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table public.mistakes enable row level security;

drop policy if exists "own mistakes" on public.mistakes;
create policy "own mistakes" on public.mistakes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.mistakes to authenticated;
