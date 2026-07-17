export interface ParticipantColors {
  seal: string;
  border: string;
  gradientFrom: string;
  gradientTo: string;
}

// participant.colorSeed（生成順の連番文字列）でこの配列を巡回して色を割り当てる。
// 3人目以降を追加してもレイアウトが破綻しないよう、あらかじめ4色分用意している。
const PALETTE: ParticipantColors[] = [
  { seal: 'var(--indigo)', border: 'var(--indigo)', gradientFrom: '#eef2f6', gradientTo: '#e2e9ef' },
  { seal: 'var(--vermilion)', border: 'var(--vermilion)', gradientFrom: '#faf1ea', gradientTo: '#f4e3d6' },
  { seal: 'var(--gold)', border: 'var(--gold)', gradientFrom: '#f6f1e4', gradientTo: '#ede4cd' },
  { seal: 'var(--teal)', border: 'var(--teal)', gradientFrom: '#e9f1ee', gradientTo: '#d9e8e2' },
];

export function getParticipantColors(colorSeed: string): ParticipantColors {
  const index = Number.parseInt(colorSeed, 10);
  const safeIndex = Number.isFinite(index) ? Math.abs(index) : hashString(colorSeed);
  return PALETTE[safeIndex % PALETTE.length];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
