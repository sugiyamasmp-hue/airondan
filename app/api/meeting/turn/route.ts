import { NextRequest, NextResponse } from 'next/server';
import { getModelGenerator } from '@/lib/models';
import { meetingPersonaSystemPrompt } from '@/lib/prompts';
import type { ModelId } from '@/lib/types';

interface MeetingTurnRequestBody {
  topic: string;
  participant: { name: string; model: ModelId; role: string };
  opponentNames: string[];
  transcript: { speaker: string; text: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MeetingTurnRequestBody;
    const { topic, participant, opponentNames, transcript } = body;

    if (!topic || !participant?.name || !participant?.model) {
      return NextResponse.json({ error: 'topic / participant は必須です' }, { status: 400 });
    }
    if (participant.model === 'human') {
      return NextResponse.json({ error: 'human参加者の発言はAPIを経由しません' }, { status: 400 });
    }

    const system = meetingPersonaSystemPrompt(participant.name, participant.role, opponentNames, topic);
    const userPrompt =
      !transcript || transcript.length === 0
        ? '会議の口火を切ってください。'
        : `ここまでの会議ログ:\n${transcript.map((t) => `${t.speaker}: ${t.text}`).join('\n')}\n\n直前の発言（特に人間参加者の発言があれば最優先で）に反応して発言してください。`;

    const generate = getModelGenerator(participant.model);
    const text = await generate(system, userPrompt);

    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
