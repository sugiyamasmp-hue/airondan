export type ModelId = 'claude' | 'gpt' | 'deepseek';

export interface Participant {
  name: string; // 表示名（クロちゃん/チャーリー/ディープ 等、自由入力可）
  model: ModelId;
  role: string; // 立場（空なら自動設定）
  colorSeed: string; // UI色分け用（nameから自動生成でも可）
}

export interface DebateTurn {
  speaker: string; // participant.name
  replyTo: string | null;
  text: string;
  round: number;
}

export type LandingType = '属性分岐型' | '明確結論型' | '両論併記型';

export type ArticleStyle = '要約' | '完全収録';

export interface Article {
  title: string;
  body: string;
}

export interface DebateSession {
  id: string;
  topic: string;
  category?: '分析系' | '意見系' | '金融系'; // 手動タグ、任意
  landingType: LandingType;
  participants: Participant[];
  turnCount: number;
  transcript: DebateTurn[];
  conclusion: string;
  article: Article;
  result?: '的中' | '外れ' | '該当なし'; // 後日追記用（競馬・予測系のみ）
  createdAt: string;
}

export const LANDING_TYPES: LandingType[] = ['属性分岐型', '明確結論型', '両論併記型'];

export const ARTICLE_STYLES: ArticleStyle[] = ['要約', '完全収録'];

export const LANDING_TYPE_INSTRUCTIONS: Record<LandingType, string> = {
  属性分岐型:
    '結論は一つに決めつけず、「どういう条件・属性の人にはどちらが向くか」を整理してまとめること。',
  明確結論型:
    '討論の内容を踏まえて、どちらの論がより説得力があったか明確にジャッジし、理由とともに結論を出すこと。',
  両論併記型:
    '無理に結論を出さず、両者の論点を公平に整理し、読者に判断を委ねる形でまとめること。',
};

export const MODEL_LABELS: Record<ModelId, string> = {
  claude: 'Claude',
  gpt: 'GPT',
  deepseek: 'DeepSeek',
};
