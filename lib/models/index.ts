import type { ModelId } from '@/lib/types';
import { generateClaudeText } from './claude';
import { generateOpenAiText } from './openai';
import { generateDeepSeekText } from './deepseek';

type Generator = (systemPrompt: string, userPrompt: string) => Promise<string>;

// モデルを追加する場合はここに1エントリ追加するだけでよい。
export const MODEL_GENERATORS: Record<ModelId, Generator> = {
  claude: generateClaudeText,
  gpt: generateOpenAiText,
  deepseek: generateDeepSeekText,
  // human はAPIを呼ばず、クライアント側でそのままFirestoreに保存するのみ（呼ばれたら実装ミス）。
  human: async () => {
    throw new Error('human参加者の発言はAPIを経由しません');
  },
};

export function getModelGenerator(model: ModelId): Generator {
  const generator = MODEL_GENERATORS[model];
  if (!generator) {
    throw new Error(`未対応のモデルです: ${model}`);
  }
  return generator;
}
