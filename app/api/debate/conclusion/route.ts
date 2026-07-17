import { NextRequest, NextResponse } from 'next/server';
import { getModelGenerator } from '@/lib/models';
import { conclusionSystemPrompt } from '@/lib/prompts';
import type { LandingType, ModelId } from '@/lib/types';

interface ConclusionRequestBody {
  landingType: LandingType;
  transcript: { speaker: string; text: string }[];
  model?: ModelId;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConclusionRequestBody;
    const { landingType, transcript, model = 'claude' } = body;

    if (!landingType || !transcript?.length) {
      return NextResponse.json({ error: 'landingType / transcript は必須です' }, { status: 400 });
    }

    const system = conclusionSystemPrompt(landingType);
    const userPrompt = transcript.map((t) => `${t.speaker}: ${t.text}`).join('\n');

    const generate = getModelGenerator(model);
    const conclusion = await generate(system, userPrompt);

    return NextResponse.json({ conclusion });
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
