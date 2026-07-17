# AI論壇 — 実装指示書（Claude Code用）

## 概要
複数のAI（クロちゃん=Claude / チャーリー=GPT / 将来ディープシーク）に議題を討論させ、
討論ログをnote.com記事のドラフトに変換するWebアプリ。個人利用・将来的な販売を想定。

参考プロトタイプ: 添付の `ai-rondan.html`（デザイントークン・討論ロジック・ハンコ演出はここから流用すること）

## スタック
- Next.js 14 (App Router) / TypeScript
- Firebase Firestore（討論ログ・記事の保存）
- Vercel（デプロイ）
- Anthropic API（クロちゃん担当）
- OpenAI API（チャーリー担当）
- 将来: DeepSeek API（3人目参加時に追加）

## 環境変数（.env.local）
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DEEPSEEK_API_KEY=          # 未使用でも空で用意
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## ディレクトリ構成
```
/app
  /page.tsx                     議題入力〜討論〜記事プレビューを1画面で完結（プロトタイプと同じ構成）
  /history/page.tsx             過去の討論一覧（Firestore一覧取得）
  /history/[id]/page.tsx        過去の討論の再表示
  /api/debate/turn/route.ts     1発言を生成するAPI
  /api/debate/conclusion/route.ts  落とし所を生成するAPI
  /api/debate/article/route.ts     note記事ドラフトを生成するAPI
/lib
  /models/claude.ts             Anthropic API呼び出し
  /models/openai.ts             OpenAI API呼び出し
  /models/deepseek.ts           DeepSeek API呼び出し（雛形のみ用意、未接続でOK）
  /models/index.ts              modelId -> 呼び出し関数のマッピング（ここに追加するだけで参加者を増やせる）
  /firebase.ts                  Firebase初期化
  /types.ts                     型定義（下記参照）
/components
  DebateSetupForm.tsx           議題・落とし所タイプ・ターン数・参加者役割の入力
  DebateFeed.tsx                討論表示（吹き出し、reply_toラベル、ラウンドロビン表示）
  ConclusionCard.tsx            ハンコ演出付きの落とし所カード
  ArticlePreview.tsx            記事タイトル・本文・コピー機能
  HistoryList.tsx               過去ログ一覧
```

## データ型（/lib/types.ts）
```ts
export type ModelId = 'claude' | 'gpt' | 'deepseek';

export interface Participant {
  name: string;         // 表示名（クロちゃん/チャーリー/ディープ 等、自由入力可）
  model: ModelId;
  role: string;          // 立場（空なら自動設定）
  colorSeed: string;     // UI色分け用（nameから自動生成でも可）
}

export interface DebateTurn {
  speaker: string;       // participant.name
  replyTo: string | null;
  text: string;
  round: number;
}

export type LandingType = '属性分岐型' | '明確結論型' | '両論併記型';

export interface DebateSession {
  id: string;
  topic: string;
  category?: '分析系' | '意見系' | '金融系';  // 手動タグ、任意
  landingType: LandingType;
  participants: Participant[];
  turnCount: number;
  transcript: DebateTurn[];
  conclusion: string;
  article: { title: string; body: string };
  result?: '的中' | '外れ' | '該当なし';  // 後日追記用（競馬・予測系のみ）
  createdAt: string;
}
```

## 参加者は可変・拡張前提
- `participants` は配列。UIの「参加者を追加」ボタンで3人目（ディープシーク等）を足せるようにする。
- 発言順は **ラウンドロビン制**（participants配列の順序どおりに固定。ランダムにしない）。
- 各発言には必ず `replyTo`（直前の発言者名）を持たせ、UIで「→◯◯へ」ラベル表示する。
- モデル追加時は `/lib/models/index.ts` に1エントリ追加するだけで対応できる設計にすること（コア討論ロジックはmodel非依存）。

## APIルート仕様

### POST /api/debate/turn
リクエスト:
```json
{
  "topic": "string",
  "participant": { "name": "クロちゃん", "model": "claude", "role": "堅実派" },
  "opponentNames": ["チャーリー"],
  "transcript": [{ "speaker": "...", "text": "..." }]
}
```
- `/lib/models/index.ts` で `participant.model` に応じた関数を呼び出し、次の発言を生成して返す。
- システムプロンプトはプロトタイプの `personaSystemPrompt()` をベースに移植。

### POST /api/debate/conclusion
- `landingType` に応じて指示文を切り替える（プロトタイプの `runConclusion()` のロジックをそのまま移植）。

### POST /api/debate/article
- note.com向けにタイトル案＋本文を生成。出力パース処理もプロトタイプから移植。

## UIデザイン（プロトタイプから継承）
- カラートークン・フォント（Shippori Mincho / Noto Sans JP / Space Mono）・ハンコ演出アニメーションは `ai-rondan.html` の `<style>` をそのままTailwind化 or CSS Modulesに移植。
- 討論表示は参加者が2人でも3人でも破綻しないレイアウト（全員左寄せ縦一列＋名前バッジ＋色分け）に変更しておく（3人対応を見据えて）。

## Firestore構造
```
debates/{debateId}
  topic, category, landingType, participants[], turnCount,
  transcript[], conclusion, article, result, createdAt
```
- 個人利用前提でセキュリティルールは自分のUIDのみ読み書き可（Firebase Authは簡易のメール認証 or 匿名認証でOK、まず一人用）。

## MVP完成の定義（Definition of Done）
1. 議題入力→クロちゃん(Claude)×チャーリー(GPT)の討論が最後まで実行される
2. 落とし所タイプ3種が選択・反映される
3. 討論後に記事ドラフト（タイトル＋本文）が生成され、コピーできる
4. Firestoreに保存され、履歴一覧から再表示できる
5. 参加者を1人追加（3人構成）してもUIが破綻しない

## 後回しでよいもの（V2以降）
- DeepSeek接続の実配線
- 的中率トラッキング（result欄の集計・グラフ化）
- note.comへの直接投稿連携（API非対応のためコピペ運用のまま）
- 課金・アプリ販売化のための認証・利用制限
