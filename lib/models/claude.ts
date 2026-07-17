import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY が設定されていません（.env.local を確認してください）');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function generateClaudeText(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = res.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude応答にテキストが含まれていません');
  }
  return textBlock.text.trim();
}
