import { NextRequest, NextResponse } from 'next/server';
import { getModelGenerator } from '@/lib/models';
import { personaSystemPrompt } from '@/lib/prompts';
import type { ModelId } from '@/lib/types';

interface TurnRequestBody {
  topic: string;
  participant: { name: string; model: ModelId; role: string };
  opponentNames: string[];
  transcript: { speaker: string; text: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TurnRequestBody;
    const { topic, participant, opponentNames, transcript } = body;

    if (!topic || !participant?.name || !participant?.model) {
      return NextResponse.json({ error: 'topic / participant は必須です' }, { status: 400 });
    }

    const system = personaSystemPrompt(participant.name, participant.role, opponentNames, topic);
    const userPrompt =
      !transcript || transcript.length === 0
        ? '討論の口火を切ってください。'
        : `ここまでの討論ログ:\n${transcript.map((t) => `${t.speaker}: ${t.text}`).join('\n')}\n\n直前の発言に対して、あなたの立場から発言してください。`;

    const generate = getModelGenerator(participant.model);
    const text = await generate(system, userPrompt);

    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
