# AI論壇 追加仕様 — 会議モード（Meeting Mode）

## 目的
既存の「討論モード」（AI同士がラウンドロビンで自動討論→note記事化）に加えて、
浩之さん自身が参加者としてリアルタイムに割り込み発言できる「会議モード」を追加する。
用途例：新規/既存アプリ（wagaya-recipe等）の拡散戦略ブレスト、事業アイデア壁打ち。

既存の `ai-rondan` プロジェクトへの**追加機能**として実装する（新規プロジェクトではない）。

## モード切り替え
議題入力画面の最上部にタブを追加する。

```
[討論モード] [会議モード]
```

- 討論モード：既存仕様のまま（ラウンドロビン自動進行、落とし所タイプ、note記事化）
- 会議モード：本仕様で追加する新モード

## 会議モードの進行ルール（討論モードとの違い）

| | 討論モード | 会議モード |
|---|---|---|
| 進行 | 全ターン自動でループ | **手動**：ボタンを押した参加者だけが発言する |
| 参加者 | AIのみ（配列） | AI＋人間（`model: 'human'`）を配列に含む |
| 人間の発言 | なし | **常時開いた入力欄からいつでも発言可能** |
| 締め方 | 落とし所タイプで自動結論 | 「会議を終了する」ボタンで議事録生成 |
| 出力 | note記事ドラフト | 議事録（決定事項／保留事項／次のアクション） |

**画面イメージ**
```
[議事フィード（討論モードと同じ吹き出し表示。人間の発言は緑色・中央寄せで区別）]

[クロちゃんに続けてもらう]  [チャーリーに続けてもらう]
[___________________________]  [発言する]
◆ 会議を終了して議事録にまとめる
```

## データ型の追加（/lib/types.ts に追加）

```ts
// 既存のModelIdに 'human' を追加
export type ModelId = 'claude' | 'gpt' | 'deepseek' | 'human';

export type SessionMode = 'debate' | 'meeting';

export interface MeetingSummary {
  decisions: string[];      // 決定事項
  pending: string[];        // 保留事項
  nextActions: string[];    // 次のアクション
}

// DebateSession に以下を追加
// mode: SessionMode
// meetingSummary?: MeetingSummary  (meetingモードのみ)
```

`participants` に `{ name: '浩之さん', model: 'human', role: '', colorSeed: 'you' }` を含めることで、
既存のturn/reply_to構造をそのまま流用できる。

## APIルート追加

### POST /api/meeting/turn
討論モードの `/api/debate/turn` とほぼ同じだが、以下を変更:
- リクエストに `speakerName`（"クロちゃん" or "チャーリー"、ボタンで指定された方）を含める
- システムプロンプトは「ブレインストーミング会議」用に変更し、人間参加者の直近発言があれば最優先で反応するよう指示する（`ai-kaigi-prototype.html` の `personaPrompt()` を移植）
- `model: 'human'` の発言はAPIを呼ばず、クライアント側でそのままFirestoreに保存するのみ

### POST /api/meeting/summary
- 会議ログ全体を渡し、`MeetingSummary`（決定事項／保留事項／次のアクション）をJSON形式で生成
- プロンプトは `ai-kaigi-prototype.html` の議事録生成部分を移植し、出力をパースしやすいJSON形式に変更する:
```
{
  "decisions": ["..."],
  "pending": ["..."],
  "nextActions": ["..."]
}
```

## UIコンポーネント追加

- `ModeTabs.tsx` — 討論／会議のタブ切り替え
- `MeetingFeed.tsx` — DebateFeedを流用しつつ、`model:'human'` の発言だけ中央寄せ・緑色で表示
- `MeetingControls.tsx` — 「クロちゃんに続けてもらう」「チャーリーに続けてもらう」ボタン＋常時入力欄＋「会議を終了する」ボタン
- `MeetingSummaryCard.tsx` — ConclusionCardと同じハンコ演出だが、3見出し（決定事項／保留事項／次のアクション）のリスト表示に変更

デザイントークン（和紙・朱色・ハンコ演出）は討論モードと共通のまま流用する。

## Firestore構造の変更
`debates/{debateId}` の `mode` フィールドで討論/会議を区別する。会議ログも同じ `debates` コレクションに保存し、履歴一覧では `mode` に応じてアイコン・ラベルを出し分ける（討論＝赤、会議＝緑など）。

```
debates/{debateId}
  mode: 'debate' | 'meeting'
  ...(既存フィールド)
  meetingSummary?: { decisions[], pending[], nextActions[] }
```

## 会議モード完成の定義（Definition of Done）
1. 議題入力画面で「会議モード」に切り替えられる
2. 「クロちゃんに続けてもらう」「チャーリーに続けてもらう」ボタンでそれぞれ個別に発言を生成できる（自動ループしない）
3. 常時開いた入力欄から浩之さんがいつでも発言でき、その発言が会話ログに反映され、AIの次の発言が直近の人間発言を踏まえた内容になる
4. 「会議を終了する」ボタンで、決定事項／保留事項／次のアクションの3項目にまとめた議事録が生成・表示される
5. Firestoreに保存され、履歴一覧から討論モードの記録と区別して再表示できる

## 参考
UI・進行フローの見本は添付の `ai-kaigi-prototype.html` を参照（デザイン・ボタン構成・議事録の見出し構成をそのまま踏襲すること）。
