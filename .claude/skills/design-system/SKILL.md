---
name: design-system
description: 「単マス」のブランド・デザイン規則。画面の新規追加やスタイル変更を行う際は必ず参照し、一貫した温かみのある見た目を保つこと。
---

# 単マス デザインシステム

このアプリは中学生向けの英単語学習アプリ「単マス」。参考にしたのは [motitown.com](https://motitown.com/)
（温かみがあり親しみやすい、マスコットキャラクターを活用した語学学習サービス）。
「AIが生成したような単調なグラデーション」を避け、**温かみ・親しみやすさ・丸みのある柔らかい質感**を優先する。

## マスコットキャラクター
- フクロウの3Dレンダリング調キャラクター(クリーム〜honey-orange色、頭に葉っぱの芽)。motitownのクマとは別の、オリジナルデザイン。
- 画像ファイル: `client/public/mascot-welcome.jpg`(ようこそ・本を持つポーズ)、`client/public/mascot-celebrate.jpg`(お祝い・万歳ポーズ)
- 使い方: `.mascot`(通常サイズ128px)または`.mascot.small`(88px)のdiv内に`<img>`を入れる。背景色に馴染むよう`--mascot-halo`(円形の淡いハロー)を自動で敷いている(index.cssで定義済み)。
  ```jsx
  <div className="mascot">
    <img src="/mascot-welcome.jpg" alt="単マスのマスコット" />
  </div>
  ```
- 配置ガイドライン: ログイン/会員登録画面・学年選択画面には「ようこそ」ポーズ、テスト結果画面で**正答率70%以上**の時だけ「お祝い」ポーズを表示する(`ResultScreen.jsx`の`isGreatScore`判定を参照)。乱用せず、ユーザーの気持ちが動く場面(初回接触・成功体験)に絞って使うこと。
- ポーズを増やす場合は、同じキャラクターデザイン(体色・頭の葉っぱ)を保ったまま生成すること。

## 配色トークン(`client/src/styles/index.css`)
2つのテーマ(`data-theme="stylish"` / `data-theme="cute"`)があり、CSS変数で切り替える。新しい色を直書きせず、既存の変数(`--bg`, `--surface`, `--primary`, `--primary-2`, `--accent`, `--text`, `--text-muted`, `--border`)を使うこと。

| 用途 | スタイリッシュ(ダーク) | かわいい(ライト) |
|---|---|---|
| 背景 | 深みのあるネイビー `#10182b` | 温かいクリーム `#fdf6ea` |
| カード面 | `#182035` | 白 `#ffffff` |
| メインアクセント(primary) | 澄んだブルー `#4f8dfd` | コーラル/珊瑚色 `#ff9a6b` |
| サブアクセント(primary-2) | アンバー(琥珀) `#f5b942` | 温かい黄色 `#ffc95c` |
| ポイントカラー(accent) | ティール `#3fd0b4` | ミントグリーン `#4fc9a8` |

ボタンやスコア表示のグラデーションは `linear-gradient(90deg, var(--primary), var(--primary-2))` のように**青→琥珀**または**コーラル→黄色**の組み合わせにする。紫〜青の単調なグラデーション(旧デザイン)には戻さないこと。

## タイポグラフィ
- 見出し・ロゴ・単語カードの単語表示など「目立たせたい」テキストには `var(--font-heading)`(Google Fontsの**Zen Maru Gothic**、丸ゴシック体)を使う。`client/index.html`で読み込み済み。
- 本文・説明文は `var(--font)`(既存のシステムフォント)のままでよい。読みやすさを優先。

## コンポーネントパターン
- カード: `.card`クラス、角丸は`--radius-lg`(スタイリッシュ24px/かわいい30px)、柔らかい影(`--shadow`)
- ボタン: `.button`(プライマリ、グラデーション)、`.button.secondary`(控えめ)
- 選択カード(学年・モード選択など): `.select-card`、ホバーで軽く浮き上がる。角丸は四隅バラバラの値(`border-radius: 60px 34px 54px 40px / 40px 54px 34px 60px;`)にして、雲のようなふわふわした輪郭にしている。単調な均一角丸には戻さないこと
- 選択カード内のアイコン: 絵文字ではなく、`.icon-image`クラス(円形ハロー、56px)に高級感のある3Dレンダリング調アイコン画像(`client/public/icon-*.jpg`)を入れる。新しいモード/カードを追加する際も、同じ画風(グロッシーな3Dレンダリング、暖色系)でアイコンを生成すること
  ```jsx
  <div className="icon-image">
    <img src="/icon-practice.jpg" alt="" />
  </div>
  ```
- 新しい画面を作る際は、既存のクラス(`.card`, `.button`, `.select-card`, `.auth-input`など)を再利用し、独自のインラインスタイルで配色を直書きしないこと

## 文法ハイライト配色(英語記事モード)
`ArticleMode.jsx`の文法ハイライト機能では、S(主語)/V(動詞)/O(目的語)/C(補語)/M(修飾語)を以下の配色で色分けする(`index.css`の`.grammar-role.role-*`)。新しい文法要素の色を追加する場合もこのトークンの組み合わせから選ぶこと。

| 役割 | 色 |
|---|---|
| S 主語 | `var(--primary)` |
| V 動詞 | `var(--accent)` |
| O 目的語 | `var(--primary-2)` |
| C 補語 | `var(--primary)`と`var(--accent)`のcolor-mix |
| M 修飾語 | `var(--text-muted)`(点線下線) |

## コピーのトーン
- 中学生に語りかける、温かく励ますような日本語(例: 「学年を選んでね」「全問正解！すごい！🎉」)
- 過度に堅い敬語や事務的な文言は避ける
