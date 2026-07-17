'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DebateFeed from '@/components/DebateFeed';
import ConclusionCard from '@/components/ConclusionCard';
import ArticlePreview from '@/components/ArticlePreview';
import Toast from '@/components/Toast';
import { getDebateSession } from '@/lib/firebase';
import type { DebateSession } from '@/lib/types';

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<DebateSession | null | undefined>(undefined);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    getDebateSession(params.id).then(setSession);
  }, [params.id]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  }

  return (
    <div className="wrap">
      <header>
        <div className="eyebrow">Amado Papa Lab</div>
        <h1>討論ログ</h1>
        <div className="sub">
          <Link href="/history" style={{ color: '#c9b98a' }}>
            ← 履歴一覧へ戻る
          </Link>
        </div>
      </header>

      {session === undefined && (
        <div style={{ textAlign: 'center', color: '#9aa1b4', fontSize: 13 }}>読み込み中…</div>
      )}
      {session === null && (
        <div style={{ textAlign: 'center', color: '#9aa1b4', fontSize: 13 }}>
          この討論ログは見つかりませんでした
        </div>
      )}

      {session && (
        <>
          <div className="paper setup" style={{ padding: '20px 24px' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>議題</label>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{session.topic}</div>
            </div>
          </div>

          <div className="section-eyebrow">討論</div>
          <DebateFeed turns={session.transcript} participants={session.participants} />

          {session.conclusion && <ConclusionCard landingType={session.landingType} conclusion={session.conclusion} />}

          {session.article && (
            <ArticlePreview article={session.article} onCopied={() => showToast('コピーしました')} />
          )}
        </>
      )}

      <footer className="app-footer">AI論壇 — note.com ネタ出しツール</footer>
      <Toast message={toastMsg} />
    </div>
  );
}
