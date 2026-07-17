'use client';

import type { LandingType } from '@/lib/types';

interface Props {
  landingType: LandingType;
  conclusion: string;
}

export default function ConclusionCard({ landingType, conclusion }: Props) {
  return (
    <div>
      <div className="section-eyebrow">落とし所</div>
      <div className="paper conclusion-wrap">
        <div className="hanko">
          結
          <br />了
        </div>
        <div className="conclusion-label">落とし所タイプ：{landingType}</div>
        <div className="conclusion-body">{conclusion}</div>
      </div>
    </div>
  );
}
