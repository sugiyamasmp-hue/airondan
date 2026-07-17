import { NextRequest, NextResponse } from 'next/server';
import { getModelGenerator } from '@/lib/models';
import { articleSystemPrompt, parseArticle } from '@/lib/prompts';
import type { ModelId } from '@/lib/types';

interface ArticleRequestBody {
  topic: string;
  transcript: { speaker: string; text: string }[];
  conclusion?: string;
  model?: ModelId;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ArticleRequestBody;
    const { topic, transcript, conclusion, model = 'claude' } = body;

    if (!topic || !transcript?.length) {
      return NextResponse.json({ error: 'topic / transcript は必須です' }, { status: 400 });
    }

    const log = transcript.map((t) => `${t.speaker}: ${t.text}`).join('\n');
    const userPrompt = `テーマ: ${topic}\n\n討論ログ:\n${log}${
      conclusion ? `\n\n落とし所:\n${conclusion}` : ''
    }`;

    const generate = getModelGenerator(model);
    const raw = await generate(articleSystemPrompt(), userPrompt);
    const article = parseArticle(raw);

    return NextResponse.json(article);
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
