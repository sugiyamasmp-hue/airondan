import { LANDING_TYPE_INSTRUCTIONS, type Article, type DebateTurn, type LandingType } from '@/lib/types';

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

export function parseArticle(raw: string): Article {
  let title = 'AI論壇：討論より';
  let body = raw;
  const titleMatch = raw.match(/【タイトル】\s*([^\n]+)/);
  const bodyMatch = raw.match(/【本文】\s*([\s\S]+)/);
  if (titleMatch) title = titleMatch[1].trim();
  if (bodyMatch) body = bodyMatch[1].trim();
  return { title, body };
}

// 「完全収録」用：本文は討論ログをそのまま使うため、AIには
// タイトル・導入・まとめの3パーツだけを生成させる（要約による欠落を避ける）。
export function articleIntroOutroSystemPrompt(): string {
  return `あなたはnote.comのライター編集者です。以下のAI討論ログを読み、記事の前後を書くパーツだけを作成してください。本文の討論部分は別途そのまま掲載するので、ここでは書かないこと。
出力は以下の3部構成、それぞれ明確に分けて出力すること:
【タイトル】に続けて記事タイトル案を1行
【導入】に続けて、読者を討論に引き込む導入文（100〜150字程度）
【まとめ】に続けて、討論全体を踏まえた一言まとめ（80〜120字程度）
装飾記号(#や*)は使わず、自然な日本語の地の文で書くこと。`;
}

interface IntroOutro {
  title: string;
  intro: string;
  closing: string;
}

export function parseIntroOutro(raw: string): IntroOutro {
  let title = 'AI論壇：討論より';
  let intro = '';
  let closing = '';
  const titleMatch = raw.match(/【タイトル】\s*([^\n]+)/);
  const introMatch = raw.match(/【導入】\s*([\s\S]*?)(?=【まとめ】|$)/);
  const closingMatch = raw.match(/【まとめ】\s*([\s\S]+)/);
  if (titleMatch) title = titleMatch[1].trim();
  if (introMatch) intro = introMatch[1].trim();
  if (closingMatch) closing = closingMatch[1].trim();
  return { title, intro, closing };
}

// 討論ログを話者・発言そのままの形で記事本文に整形する（要約せず全文掲載）。
export function formatFullTranscript(transcript: DebateTurn[]): string {
  const lines: string[] = [];
  let currentRound = 0;
  for (const turn of transcript) {
    if (turn.round !== currentRound) {
      currentRound = turn.round;
      lines.push(`―― ${currentRound}巡目 ――`);
    }
    lines.push(`${turn.speaker}「${turn.text}」`);
  }
  return lines.join('\n\n');
}

export function buildFullArticleBody(
  intro: string,
  transcript: DebateTurn[],
  landingType: LandingType,
  conclusion: string,
  closing: string,
): string {
  const parts = [
    intro,
    formatFullTranscript(transcript),
    `■ 落とし所（${landingType}）\n${conclusion}`,
    closing,
  ].filter((part) => part && part.trim().length > 0);
  return parts.join('\n\n');
}
