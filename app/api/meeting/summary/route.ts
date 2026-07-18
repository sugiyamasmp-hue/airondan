import { NextRequest, NextResponse } from 'next/server';
import { getModelGenerator } from '@/lib/models';
import { meetingSummarySystemPrompt, parseMeetingSummary } from '@/lib/prompts';
import type { ModelId } from '@/lib/types';

interface MeetingSummaryRequestBody {
  transcript: { speaker: string; text: string }[];
  model?: ModelId;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MeetingSummaryRequestBody;
    const { transcript, model = 'claude' } = body;

    if (!transcript?.length) {
      return NextResponse.json({ error: 'transcript は必須です' }, { status: 400 });
    }

    const system = meetingSummarySystemPrompt();
    const userPrompt = transcript.map((t) => `${t.speaker}: ${t.text}`).join('\n');

    const generate = getModelGenerator(model);
    const raw = await generate(system, userPrompt);
    const summary = parseMeetingSummary(raw);

    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
