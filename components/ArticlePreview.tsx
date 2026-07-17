'use client';

import type { Article } from '@/lib/types';

interface Props {
  article: Article;
  onCopied: () => void;
  onNew?: () => void;
}

export default function ArticlePreview({ article, onCopied, onNew }: Props) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${article.title}\n\n${article.body}`);
      onCopied();
    } catch {
      onCopied();
    }
  }

  return (
    <div>
      <div className="section-eyebrow">note記事プレビュー</div>
      <div className="paper article-wrap">
        <div className="article-title">{article.title}</div>
        <div className="article-body">{article.body}</div>
        <div className="article-actions">
          <button className="ghost" onClick={handleCopy}>
            記事本文をコピー
          </button>
          {onNew && (
            <button className="ghost" onClick={onNew}>
              新しい議題で討論する
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
