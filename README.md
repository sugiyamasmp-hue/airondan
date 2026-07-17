# AI論壇

複数のAI（クロちゃん=Claude / チャーリー=GPT）に議題を討論させ、討論ログをnote.com記事のドラフトに変換するWebアプリ。

仕様は [`ai-rondan-spec.md`](./ai-rondan-spec.md)、デザイン・討論ロジックの参考プロトタイプは [`ai-rondan.html`](./ai-rondan.html) を参照。

## セットアップ

```bash
npm install
cp .env.local.example .env.local  # 値を埋める（下記参照）
npm run dev
```

http://localhost:3000 で起動します。

## 環境変数（`.env.local`）

`.env.local.example` をコピーして以下を設定してください（`.env.local` はコミットされません）。

| 変数名 | 用途 | 取得方法 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | クロちゃん（Claude）の発言・落とし所・記事ドラフト生成 | https://console.anthropic.com/ の API Keys から発行 |
| `OPENAI_API_KEY` | チャーリー（GPT）の発言生成 | https://platform.openai.com/api-keys から発行 |
| `DEEPSEEK_API_KEY` | 将来3人目（ディープシーク）参加時用。MVPでは未使用なので空欄でOK | （未接続） |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firestoreへの討論ログ保存・履歴表示 | Firebaseコンソール → プロジェクトの設定 → 全般 → マイアプリ（Webアプリ）の設定値 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | 同上 | 同上 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | 同上 | 同上 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 同上 | 同上 |

`NEXT_PUBLIC_` プレフィックスの値はブラウザに露出しますが、Firebase Web SDKの設定値は元々公開情報として扱う前提のものです（実際のアクセス制御はFirestoreセキュリティルールで行います）。

### Firebaseプロジェクト側の準備

1. Firebaseコンソールで新規プロジェクトを作成し、Webアプリを追加して上記の設定値を取得する。
2. **Authentication** → Sign-in method で「匿名（Anonymous）」を有効化する（個人利用前提の簡易認証）。
3. **Firestore Database** を作成し、以下のようなセキュリティルールを設定する（本人のみ読み書き可）。

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /debates/{debateId} {
         allow read: if request.auth != null && request.auth.uid == resource.data.ownerUid;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerUid;
         allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerUid;
       }
     }
   }
   ```

## ディレクトリ構成

`ai-rondan-spec.md` の指示どおり `/app`, `/lib`, `/components` に分割しています。詳細は仕様書を参照してください。

## MVP完成の定義（実装済み）

1. 議題入力→クロちゃん(Claude)×チャーリー(GPT)の討論が最後まで実行される
2. 落とし所タイプ3種が選択・反映される
3. 討論後に記事ドラフト（タイトル＋本文）が生成され、コピーできる
4. Firestoreに保存され、履歴一覧（`/history`）から再表示できる
5. 参加者を1人追加（3人構成）してもUIが破綻しない

## 未実装（V2以降・仕様書どおり）

- DeepSeek接続の実配線（`lib/models/deepseek.ts` は雛形のみ）
- 的中率トラッキング
- note.comへの直接投稿連携
- 課金・アプリ販売化のための認証・利用制限
