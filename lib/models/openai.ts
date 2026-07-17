import OpenAI from 'openai';

const MODEL = 'gpt-4o-mini';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY が設定されていません（.env.local を確認してください）');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function generateOpenAiText(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = res.choices[0]?.message?.content;
  if (!text) {
    throw new Error('GPT応答にテキストが含まれていません');
  }
  return text.trim();
}
