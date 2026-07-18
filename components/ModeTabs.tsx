'use client';

import type { SessionMode } from '@/lib/types';

interface Props {
  mode: SessionMode;
  onChange: (mode: SessionMode) => void;
}

export default function ModeTabs({ mode, onChange }: Props) {
  return (
    <div className="mode-tabs">
      <button
        type="button"
        className={mode === 'debate' ? 'active' : ''}
        onClick={() => onChange('debate')}
      >
        討論モード
      </button>
      <button
        type="button"
        className={mode === 'meeting' ? 'active' : ''}
        onClick={() => onChange('meeting')}
      >
        会議モード
      </button>
    </div>
  );
}
