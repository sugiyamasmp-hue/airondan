'use client';

import { useState } from 'react';
import type { Participant } from '@/lib/types';

interface Props {
  aiParticipants: Participant[];
  onContinue: (participant: Participant) => void;
  onSay: (text: string) => void;
  onEnd: () => void;
  busy: boolean;
  isSummarizing: boolean;
  hasTranscript: boolean;
}

export default function MeetingControls({
  aiParticipants,
  onContinue,
  onSay,
  onEnd,
  busy,
  isSummarizing,
  hasTranscript,
}: Props) {
  const [input, setInput] = useState('');

  function handleSay() {
    const val = input.trim();
    if (!val) return;
    onSay(val);
    setInput('');
  }

  return (
    <div className="controls">
      <div className="prompt-row">
        {aiParticipants.map((p) => (
          <button key={p.name} type="button" disabled={busy || isSummarizing} onClick={() => onContinue(p)}>
            {p.name}に続けてもらう
          </button>
        ))}
      </div>
      <div className="say-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="自分の意見を入力…（いつでもどうぞ）"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSay();
            }
          }}
        />
        <button type="button" onClick={handleSay}>
          発言する
        </button>
      </div>
      <button type="button" className="end-btn" disabled={busy || isSummarizing || !hasTranscript} onClick={onEnd}>
        {isSummarizing ? '議事録をまとめています…' : '◆ 会議を終了して議事録にまとめる'}
      </button>
    </div>
  );
}
