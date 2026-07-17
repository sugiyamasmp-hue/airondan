'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listDebateSessions } from '@/lib/firebase';
import type { DebateSession } from '@/lib/types';

export default function HistoryList() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DebateSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDebateSessions()
      .then(setSessions)
      .catch((e) => setError(e instanceof Error ? e.message : '履歴の取得に失敗しました'));
  }, []);

  if (error) {
    return (
      <div style={{ color: '#e0a1a1', fontSize: 12.5, fontFamily: 'var(--font-space-mono)' }}>{error}</div>
    );
  }

  if (!sessions) {
    return (
      <div style={{ color: '#7a8199', fontSize: 12.5, fontFamily: 'var(--font-space-mono)' }}>
        読み込み中…
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{ color: '#7a8199', fontSize: 12.5, fontFamily: 'var(--font-space-mono)' }}>
        まだ討論ログはありません
      </div>
    );
  }

  return (
    <div id="historyList">
      {sessions.map((s) => {
        const date = new Date(s.createdAt);
        return (
          <div className="history-item" key={s.id} onClick={() => router.push(`/history/${s.id}`)}>
            <span>{s.topic}</span>
            <span className="meta">
              {date.getMonth() + 1}/{date.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
