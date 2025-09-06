# rss-to-discord
RSSで購読しているサイトの最新記事を好きなときに一気に取得することができるようにし、その結果をDiscordの特定のチャンネルに知らせるためのNode.jsプロジェクトです。

## 使い方
### 0. 必要なもの
- AWSアカウント

### 1. AWS Lambda に上げるためのバンドル済みスクリプトの作成

1. `pnpm` 経由にてパッケージをインストールする
```bash
pnpm install
```
2. `esbuild` を用いて `src/index.ts` ファイルとその関連のモジュールが含まれているファイルをバンドル化する
```bash
pnpm bundle
```
3. バンドル化したものを zip にする
```bash
pnpm zip:bundle
```
4. zipファイルがカレントディレクトリに作成されるので、これを AWS Lambda にアップロードする（次項を参考）

### 2. AWS Parameter Store にて必要なパラメータを保存する

1. AWS マネジメントコンソールにサインインをし、AWS Systems Manager の パラメータストアを開く
2. 以下の2種類のパラメータを作成する
  - `/rssBot/rssFeeds`
    - 名前：`/rssBot/rssFeeds`
    - 利用枠：標準
    - タイプ：文字列のリスト
    - データ型：text
    - 値：rssフィードへのURLを必要な分だけカンマ区切りで（例：`https://tech.nearme.jp/rss,https://www.uber.com/en-US/blog/engineering/rss/`）
  - `/rssBot/webhookUrl`
    - 名前：`/rssBot/webhookUrl`
    - 利用枠：標準
    - タイプ：安全な文字列
    - データ型：text
    - 値：投稿をしたいDiscordチャンネルの webhook url
   
### 3. AWS Lamnda にてバンドル化したスクリプトをアップロードする

1. AWS Lambda に移動し、「関数を作成」に進む
<img width="1667" height="136" alt="スクリーンショット 2025-09-06 9 16 16" src="https://github.com/user-attachments/assets/ef1644cb-ce73-4784-bf19-0b6cc764924a" />

2. 以下の画像のように関数を定義する
<img width="1668" height="871" alt="スクリーンショット 2025-09-06 9 17 03" src="https://github.com/user-attachments/assets/0595c3c0-6053-4456-b089-6689dbc04688" />

3. 以下の画像の「アップロード元」から「.zipファイル」を選択し、先ほど作成したバンドル済みスクリプトをアップロード
<img width="1668" height="869" alt="スクリーンショット 2025-09-06 9 18 09" src="https://github.com/user-attachments/assets/fcef4ff6-4007-4b5c-ab5e-3b8a3d1b7b43" />
<img width="1664" height="871" alt="スクリーンショット 2025-09-06 9 18 20" src="https://github.com/user-attachments/assets/f9c0a7fa-55a7-403d-9d80-7d77082be862" />

### 4. AWS DynamoDB にて購読したrssの最終購読日を保存するためのテーブル作成

1. DynamoDB のダッシュボードから「テーブルの作成」に進む
<img width="1666" height="869" alt="スクリーンショット 2025-09-06 9 34 55" src="https://github.com/user-attachments/assets/8376d78e-d464-4994-8d53-348375aef2cb" />

2. 以下のようなテーブルを作成する
  - テーブル名：`RssLastPublished`
  - パーティションキー：`FeedUrl`（String）
<img width="1666" height="871" alt="スクリーンショット 2025-09-06 9 41 02" src="https://github.com/user-attachments/assets/0a11ac0a-87d1-4345-ab5e-e3bd77c9b36b" />

### 5. Amazon EventBridge にて作成した Lambda 関数を自動的に発火させる

1. Amazon EventBridge に移動し、「スケジュール」から「スケジュールを作成」に進む
<img width="1666" height="688" alt="スクリーンショット 2025-09-06 9 45 57" src="https://github.com/user-attachments/assets/9de16b48-1a12-46fc-8896-80c9926611dc" />

2. 以下のスケジュールを作成する
  - スケジュール名と説明
    - スケジュール名：`rssLambdaSchedule`
    - スケジュールグループ：default
  - スケジュールのパターン
    - ここはお好みで
<img width="1664" height="873" alt="スクリーンショット 2025-09-06 9 47 33" src="https://github.com/user-attachments/assets/d1a4e98b-88a4-4e19-95b8-dd6d82c69b5f" />

3. 「ターゲットの選択」部分で、「テンプレート化されたターゲット」から「AWS Lambda」を選んで、「Invoke」から先ほど作成した Lambda 関数を選んで、最後まで進みスケジュールを作成する。
<img width="1664" height="866" alt="スクリーンショット 2025-09-06 9 48 19" src="https://github.com/user-attachments/assets/59eab42b-7ded-4827-9c9c-789ba7aee238" />
