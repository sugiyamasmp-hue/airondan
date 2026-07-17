import { NextRequest, NextResponse } from 'next/server';
import { getModelGenerator } from '@/lib/models';
import {
  articleIntroOutroSystemPrompt,
  articleSystemPrompt,
  buildFullArticleBody,
  parseArticle,
  parseIntroOutro,
} from '@/lib/prompts';
import type { ArticleStyle, DebateTurn, LandingType, ModelId } from '@/lib/types';

interface ArticleRequestBody {
  topic: string;
  transcript: DebateTurn[];
  conclusion?: string;
  landingType?: LandingType;
  articleStyle?: ArticleStyle;
  model?: ModelId;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ArticleRequestBody;
    const { topic, transcript, conclusion, landingType, articleStyle = '要約', model = 'claude' } = body;

    if (!topic || !transcript?.length) {
      return NextResponse.json({ error: 'topic / transcript は必須です' }, { status: 400 });
    }

    const generate = getModelGenerator(model);

    if (articleStyle === '完全収録') {
      const log = transcript.map((t) => `${t.speaker}: ${t.text}`).join('\n');
      const userPrompt = `テーマ: ${topic}\n\n討論ログ:\n${log}${
        conclusion ? `\n\n落とし所:\n${conclusion}` : ''
      }`;
      const raw = await generate(articleIntroOutroSystemPrompt(), userPrompt);
      const { title, intro, closing } = parseIntroOutro(raw);
      const body = buildFullArticleBody(intro, transcript, landingType ?? '両論併記型', conclusion ?? '', closing);
      return NextResponse.json({ title, body });
    }

    const log = transcript.map((t) => `${t.speaker}: ${t.text}`).join('\n');
    const userPrompt = `テーマ: ${topic}\n\n討論ログ:\n${log}${
      conclusion ? `\n\n落とし所:\n${conclusion}` : ''
    }`;

    const raw = await generate(articleSystemPrompt(), userPrompt);
    const article = parseArticle(raw);

    return NextResponse.json(article);
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
