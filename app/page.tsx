'use client';

import { useState } from 'react';
import DebateSetupForm from '@/components/DebateSetupForm';
import DebateFeed from '@/components/DebateFeed';
import ConclusionCard from '@/components/ConclusionCard';
import ArticlePreview from '@/components/ArticlePreview';
import HistoryList from '@/components/HistoryList';
import Toast from '@/components/Toast';
import { saveDebateSession } from '@/lib/firebase';
import type { Article, ArticleStyle, DebateSession, DebateTurn, LandingType, Participant } from '@/lib/types';

const DEFAULT_PARTICIPANTS: Participant[] = [
  { name: 'クロちゃん', model: 'claude', role: '', colorSeed: '0' },
  { name: 'チャーリー', model: 'gpt', role: '', colorSeed: '1' },
];

export default function Home() {
  const [topic, setTopic] = useState('');
  const [landingType, setLandingType] = useState<LandingType>('属性分岐型');
  const [turnCount, setTurnCount] = useState(4);
  const [articleStyle, setArticleStyle] = useState<ArticleStyle>('要約');
  const [participants, setParticipants] = useState<Participant[]>(DEFAULT_PARTICIPANTS);

  const [transcript, setTranscript] = useState<DebateTurn[]>([]);
  const [showDebate, setShowDebate] = useState(false);
  const [thinkingSpeaker, setThinkingSpeaker] = useState<string | null>(null);
  const [debateError, setDebateError] = useState<string | null>(null);

  const [conclusion, setConclusion] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  }

  async function callTurn(participant: Participant, opponentNames: string[], log: DebateTurn[]) {
    const res = await fetch('/api/debate/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        participant,
        opponentNames,
        transcript: log.map((t) => ({ speaker: t.speaker, text: t.text })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTPエラー ${res.status}`);
    return data.text as string;
  }

  async function runDebate() {
    if (!topic.trim()) {
      showToast('議題を入力してください');
      return;
    }

    const log: DebateTurn[] = [];
    setTranscript([]);
    setShowDebate(true);
    setConclusion(null);
    setArticle(null);
    setDebateError(null);
    setIsRunning(true);

    try {
      for (let round = 1; round <= turnCount; round++) {
        for (const participant of participants) {
          const opponentNames = participants.filter((p) => p.name !== participant.name).map((p) => p.name);
          setThinkingSpeaker(participant.name);
          const text = await callTurn(participant, opponentNames, log);
          setThinkingSpeaker(null);

          const replyTo = log.length === 0 ? null : log[log.length - 1].speaker;
          const turn: DebateTurn = { speaker: participant.name, replyTo, text, round };
          log.push(turn);
          setTranscript(log.slice());
        }
      }

      const conclusionText = await runConclusion(log);
      const articleResult = await runArticle(log, conclusionText);

      const session: DebateSession = {
        id: `debate_${Date.now()}`,
        topic,
        landingType,
        participants,
        turnCount,
        transcript: log,
        conclusion: conclusionText,
        article: articleResult,
        createdAt: new Date().toISOString(),
      };
      try {
        await saveDebateSession(session);
        setHistoryKey((k) => k + 1);
      } catch (e) {
        console.error('history save failed', e);
        showToast('Firestoreへの保存に失敗しました');
      }
    } catch (e) {
      setThinkingSpeaker(null);
      setDebateError(e instanceof Error ? e.message : '不明なエラー');
      showToast('エラーが発生しました');
    } finally {
      setIsRunning(false);
    }
  }

  async function runConclusion(log: DebateTurn[]): Promise<string> {
    const res = await fetch('/api/debate/conclusion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        landingType,
        transcript: log.map((t) => ({ speaker: t.speaker, text: t.text })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTPエラー ${res.status}`);
    setConclusion(data.conclusion);
    return data.conclusion as string;
  }

  async function runArticle(log: DebateTurn[], conclusionText: string): Promise<Article> {
    const res = await fetch('/api/debate/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        transcript: log,
        conclusion: conclusionText,
        landingType,
        articleStyle,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTPエラー ${res.status}`);
    const result: Article = { title: data.title, body: data.body };
    setArticle(result);
    return result;
  }

  function resetForNewTopic() {
    setTopic('');
    setParticipants(DEFAULT_PARTICIPANTS);
    setShowDebate(false);
    setConclusion(null);
    setArticle(null);
    setDebateError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="wrap">
      <header>
        <div className="eyebrow">Amado Papa Lab</div>
        <h1>AI論壇</h1>
        <div className="sub">
          議題をひとつ投げ込み、複数のAIに討論させて <b>note</b> のネタを作る。
        </div>
      </header>

      <DebateSetupForm
        topic={topic}
        onTopicChange={setTopic}
        landingType={landingType}
        onLandingTypeChange={setLandingType}
        turnCount={turnCount}
        onTurnCountChange={setTurnCount}
        articleStyle={articleStyle}
        onArticleStyleChange={setArticleStyle}
        participants={participants}
        onParticipantsChange={setParticipants}
        onStart={runDebate}
        isRunning={isRunning}
      />

      {showDebate && (
        <div>
          <div className="section-eyebrow">討論</div>
          <DebateFeed turns={transcript} participants={participants} thinkingSpeaker={thinkingSpeaker} />
          {debateError && (
            <div className="turn" style={{ borderLeftColor: 'var(--vermilion)' }}>
              <div className="turn-head" style={{ color: 'var(--vermilion)' }}>
                エラー
              </div>
              <div className="turn-body">
                通信でエラーが発生しました： {debateError}
                {'\n\n'}もう一度「討論をはじめる」を押して再試行してください。
              </div>
            </div>
          )}
        </div>
      )}

      {conclusion && <ConclusionCard key={conclusion} landingType={landingType} conclusion={conclusion} />}

      {article && (
        <ArticlePreview article={article} onCopied={() => showToast('コピーしました')} onNew={resetForNewTopic} />
      )}

      <div>
        <div className="section-eyebrow">討論ログ</div>
        <HistoryList key={historyKey} />
      </div>

      <footer className="app-footer">AI論壇 — note.com ネタ出しツール</footer>

      <Toast message={toastMsg} />
    </div>
  );
}
