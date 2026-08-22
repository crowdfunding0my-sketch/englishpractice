# CLAUDE.md
# プロジェクト概要
このプロジェクトは中学生が英単語や英熟語を勉強するためのWebアプリです。
中学1年、中学2年、中学3年と最初に選択したあと、「練習モード」と「テストモード」を選択することができます。
練習モードは、イラスト付き、例文付き、本場アメリカの発音付き、品詞付きで英単語を学べるようにお願いします。各学年150単語ほど。
イラストは、https://pixabay.com/　から持ってこれるようにAPI接続します。キーは、env.ファイルに格納します。
テストモードでは、4択で日本語の意味を回答するクイズになります。
10問、20問、30問から選ぶことができ、間違った単語は、libraryフォルダに自動的に保管される仕組みにしてください。
データベースが必要な場合は言ってください。


各学年で学ぶ単語や熟語をイラスト付きで学ぶことができます。

## 認証機能
- メールアドレス＋パスワードで会員登録・ログインができます（Supabase Authを使用）。
- 未ログインの場合はアプリ全体がログイン画面にリダイレクトされます（学年選択・練習・テスト・追加モードすべてログイン必須）。
- ログイン後は学年選択画面に遷移します。
- ログアウトボタンを設けます。
- ログイン画面・会員登録画面もスタイリッシュ/かわいいのテーマ切替に対応します。

## 追加モード
- 練習モード・テストモードに加えて「追加モード」を設け、ユーザーが自分で単語（単語・品詞・意味・例文など）を追加できます。
- 追加した単語はその学年の練習モード・テストモードの出題対象にも含まれます。
- テストで間違えた単語（library相当のデータ）はSupabaseのデータベースに保存され、ユーザーごとに記録されます。

## 有料ゾーン(プレミアムプラン)
- Stripeを使った月額/年額サブスクリプションで、拡張単語パック(各学年+400語予定)を有料会員限定にする。
- 決済はWeb版のみStripe Checkoutを使用(App Store/Google Play配信時のIn-App Purchase対応は別タスク)。
- 購読状態はSupabaseの `subscriptions` テーブルで管理し、StripeのWebhookが `service_role` キーで更新する
  （クライアントからは読み取り専用）。
- 単語データの `tier` フィールド(`"premium"`)で、未購読ユーザーには練習・テストの出題対象から除外する。
- 現状は動作確認用に各学年5語のみサンプルとして `tier:"premium"` を付与済み。本番の+400語コンテンツ追加は別タスク。

## 技術スタック
- HTML / CSS / JavaScript　/　React
- Supabase（認証・データベース）
- Stripe（有料プランの決済・サブスクリプション管理）
もし、他に必要な技術が発生したら聞いてください。

## 画面上ルール
「画像取得:https://pixabay.com/」の文言は画面の右下に小さく表示しておいてください。
画面のUIはかっこいい（スタイリッシュ）画面かかわいい画面に設定できるようにしてください。

## 開発ルール
機密情報や情報漏洩に繋がる作業は避けたいので、開発はローカルで最初に確認して問題なければGithub上にアップします。
そのため、機密情報にあたる内容は、env.ファイルを作成しそこに格納し、プログラム本体には呼び出しコマンドのみ記載してください。
SupabaseのProject URLとPublishable keyは client/.env で管理し、.gitignore で除外します。

## リポジトリ
GitHub: https://github.com/crowdfunding0my-sketch/englishpractice.git

## デプロイ構成
- 本番はVercelに一本化する。Vercelプロジェクトの Root Directory は `client` を指定する。
- `client/api/` 配下に、単語データ配信・Pixabay画像プロキシ用のVercel Serverless Functionsを用意している
  （ローカル開発用の `server/`（Express）とは別実装。ローカルは今まで通り `npm run dev` でExpressサーバーを使う）。
- 環境変数（`PIXABAY_API_KEY` / `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID` /
  `CLIENT_URL`）はVercelダッシュボードで設定し、`vercel.json` には含めない。
  `SUPABASE_SERVICE_ROLE_KEY` はRLSを越える強い権限を持つため、クライアント(VITE_接頭辞)には絶対に含めない。