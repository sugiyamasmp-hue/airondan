'use client';

import type { MeetingSummary } from '@/lib/types';

interface Props {
  summary: MeetingSummary;
}

export default function MeetingSummaryCard({ summary }: Props) {
  return (
    <div>
      <div className="section-eyebrow">議事録</div>
      <div className="paper conclusion-wrap">
        <div className="hanko">
          議
          <br />了
        </div>
        <div className="summary-block">
          <h3>決定事項</h3>
          <ul>
            {summary.decisions.length ? summary.decisions.map((d, i) => <li key={i}>{d}</li>) : <li>（なし）</li>}
          </ul>
          <h3>保留事項</h3>
          <ul>
            {summary.pending.length ? summary.pending.map((d, i) => <li key={i}>{d}</li>) : <li>（なし）</li>}
          </ul>
          <h3>次のアクション</h3>
          <ul>
            {summary.nextActions.length
              ? summary.nextActions.map((d, i) => <li key={i}>{d}</li>)
              : <li>（なし）</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
