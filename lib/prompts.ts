import { LANDING_TYPE_INSTRUCTIONS, type Article, type LandingType, type MeetingSummary } from '@/lib/types';

export function personaSystemPrompt(name: string, role: string, opponentNames: string[], topic: string): string {
  const opponentLabel = opponentNames.join('・');
  return `あなたは「${name}」という論客です。討論テーマ「${topic}」について、${
    role ? role : 'あなたらしい一貫した視点'
  }の立場で発言してください。
ルール:
- 発言は日本語、150〜220字程度で簡潔に。
- 相手（${opponentLabel}）の直前の発言がある場合は、それに触れながら反論または深掘りすること。
- 同じ主張の繰り返しや、安易な同調はしないこと。自分の立場を安易に譲らない。
- 発言本文のみを出力し、名前や記号は付けない。`;
}

export function conclusionSystemPrompt(landingType: LandingType): string {
  const typeInstruction = LANDING_TYPE_INSTRUCTIONS[landingType];
  return `あなたは討論の進行役です。以下の討論ログを読み、日本語250〜350字で「落とし所」をまとめてください。落とし所のタイプは「${landingType}」です。${typeInstruction}`;
}

export function articleSystemPrompt(): string {
  return `あなたはnote.comのライター編集者です。以下のAI討論ログをもとに、note記事のドラフトを作成してください。
出力は以下の2部構成、それぞれ明確に分けて出力すること:
【タイトル】に続けて記事タイトル案を1行
【本文】に続けて、討論の掛け合いを活かした読み物形式の本文（600〜800字程度、冒頭に導入、最後に一言まとめ）
装飾記号(#や*)は使わず、自然な日本語の地の文で書くこと。`;
}

export function meetingPersonaSystemPrompt(
  name: string,
  role: string,
  opponentNames: string[],
  topic: string,
): string {
  const roleLabel = role ? role : 'あなたらしい一貫した視点';
  return `あなたは「${name}」です。${roleLabel}として、ブレインストーミング会議のテーマ「${topic}」について発言してください。
これは自由な会議で、他の参加者（${opponentNames.join('・')}）や人間の参加者の発言も混じります。
ルール:
- 日本語、120〜200字程度で簡潔に
- 直前の発言（特に人間参加者の発言があればそれを最優先で）に触れて反応すること
- 具体的なアイデア・提案を必ず1つは含めること
- 発言本文のみ出力。名前や記号は付けない。`;
}

export function meetingSummarySystemPrompt(): string {
  return `あなたは会議の書記です。以下の会議ログ（AIと人間参加者の発言を含む）を読み、日本語で議事録をまとめてください。
出力は必ず次のJSON形式のみで返すこと（説明文やコードブロック記号は一切付けない）:
{"decisions": ["..."], "pending": ["..."], "nextActions": ["..."]}
decisions=決定事項、pending=保留事項、nextActions=次のアクション。それぞれ2〜4個、簡潔な日本語の箇条書きにすること。`;
}

export function parseMeetingSummary(raw: string): MeetingSummary {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : raw;
  try {
    const parsed = JSON.parse(jsonText) as Partial<MeetingSummary>;
    return {
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
      nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : [],
    };
  } catch {
    return { decisions: [], pending: [], nextActions: [raw.trim()] };
  }
}

export function parseArticle(raw: string): Article {
  let title = 'AI論壇：討論より';
  let body = raw;
  const titleMatch = raw.match(/【タイトル】\s*([^\n]+)/);
  const bodyMatch = raw.match(/【本文】\s*([\s\S]+)/);
  if (titleMatch) title = titleMatch[1].trim();
  if (bodyMatch) body = bodyMatch[1].trim();
  return { title, body };
}
