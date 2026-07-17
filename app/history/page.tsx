import Link from 'next/link';
import HistoryList from '@/components/HistoryList';

export default function HistoryPage() {
  return (
    <div className="wrap">
      <header>
        <div className="eyebrow">Amado Papa Lab</div>
        <h1>討論ログ</h1>
        <div className="sub">
          過去の討論を再表示できます。
          <br />
          <Link href="/" style={{ color: '#c9b98a' }}>
            ← 新しい討論をはじめる
          </Link>
        </div>
      </header>

      <div>
        <div className="section-eyebrow">履歴一覧</div>
        <HistoryList />
      </div>

      <footer className="app-footer">AI論壇 — note.com ネタ出しツール</footer>
    </div>
  );
}
