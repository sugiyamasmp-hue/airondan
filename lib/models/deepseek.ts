// DeepSeek API接続の雛形（V2で実配線予定）。
// DeepSeek REST APIはOpenAI互換のchat completions形式のため、
// 接続時は lib/models/openai.ts と同様の実装を baseURL: "https://api.deepseek.com" で追加する想定。

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateDeepSeekText(systemPrompt: string, userPrompt: string): Promise<string> {
  throw new Error('DeepSeekはまだ接続されていません（V2で対応予定）');
}
