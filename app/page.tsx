'use client';

import { useState } from 'react';
import DebateSetupForm from '@/components/DebateSetupForm';
import DebateFeed from '@/components/DebateFeed';
import ConclusionCard from '@/components/ConclusionCard';
import ArticlePreview from '@/components/ArticlePreview';
import ModeTabs from '@/components/ModeTabs';
import MeetingFeed from '@/components/MeetingFeed';
import MeetingControls from '@/components/MeetingControls';
import MeetingSummaryCard from '@/components/MeetingSummaryCard';
import HistoryList from '@/components/HistoryList';
import Toast from '@/components/Toast';
import { saveDebateSession } from '@/lib/firebase';
import type {
  Article,
  DebateSession,
  DebateTurn,
  LandingType,
  MeetingSummary,
  Participant,
  SessionMode,
} from '@/lib/types';

const DEFAULT_PARTICIPANTS: Participant[] = [
  { name: 'クロちゃん', model: 'claude', role: '', colorSeed: '0' },
  { name: 'チャーリー', model: 'gpt', role: '', colorSeed: '1' },
];

const MEETING_PARTICIPANTS: Participant[] = [
  {
    name: 'クロちゃん',
    model: 'claude',
    role: '堅実・データ重視でマーケティング的な視点から意見を言う',
    colorSeed: '0',
  },
  {
    name: 'チャーリー',
    model: 'gpt',
    role: '直感・スピード重視でグロースハック的な視点から意見を言う',
    colorSeed: '1',
  },
  { name: '浩之さん', model: 'human', role: '', colorSeed: 'you' },
];

export default function Home() {
  const [mode, setMode] = useState<SessionMode>('debate');
  const [topic, setTopic] = useState('');

  // 討論モード
  const [landingType, setLandingType] = useState<LandingType>('属性分岐型');
  const [turnCount, setTurnCount] = useState(4);
  const [participants, setParticipants] = useState<Participant[]>(DEFAULT_PARTICIPANTS);

  const [transcript, setTranscript] = useState<DebateTurn[]>([]);
  const [showDebate, setShowDebate] = useState(false);
  const [thinkingSpeaker, setThinkingSpeaker] = useState<string | null>(null);
  const [debateError, setDebateError] = useState<string | null>(null);

  const [conclusion, setConclusion] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);

  const [isRunning, setIsRunning] = useState(false);

  // 会議モード
  const [meetingTranscript, setMeetingTranscript] = useState<DebateTurn[]>([]);
  const [showMeeting, setShowMeeting] = useState(false);
  const [meetingThinking, setMeetingThinking] = useState<string | null>(null);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [meetingSummary, setMeetingSummary] = useState<MeetingSummary | null>(null);
  const [isMeetingBusy, setIsMeetingBusy] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

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
        mode: 'debate',
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
        transcript: log.map((t) => ({ speaker: t.speaker, text: t.text })),
        conclusion: conclusionText,
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

  function startMeeting() {
    if (!topic.trim()) {
      showToast('議題を入力してください');
      return;
    }
    setMeetingTranscript([]);
    setMeetingSummary(null);
    setMeetingError(null);
    setShowMeeting(true);
  }

  async function continueMeeting(participant: Participant) {
    if (isMeetingBusy || isSummarizing) return;
    setIsMeetingBusy(true);
    setMeetingThinking(participant.name);
    setMeetingError(null);
    try {
      const opponentNames = MEETING_PARTICIPANTS.filter((p) => p.name !== participant.name).map((p) => p.name);
      const res = await fetch('/api/meeting/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          participant,
          opponentNames,
          transcript: meetingTranscript.map((t) => ({ speaker: t.speaker, text: t.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTPエラー ${res.status}`);

      const replyTo = meetingTranscript.length === 0 ? null : meetingTranscript[meetingTranscript.length - 1].speaker;
      const turn: DebateTurn = {
        speaker: participant.name,
        replyTo,
        text: data.text,
        round: meetingTranscript.length + 1,
      };
      setMeetingTranscript((prev) => [...prev, turn]);
    } catch (e) {
      setMeetingError(e instanceof Error ? e.message : '不明なエラー');
      showToast('エラーが発生しました');
    } finally {
      setMeetingThinking(null);
      setIsMeetingBusy(false);
    }
  }

  function sayAsHuman(text: string) {
    const human = MEETING_PARTICIPANTS.find((p) => p.model === 'human');
    if (!human) return;
    const replyTo = meetingTranscript.length === 0 ? null : meetingTranscript[meetingTranscript.length - 1].speaker;
    const turn: DebateTurn = { speaker: human.name, replyTo, text, round: meetingTranscript.length + 1 };
    setMeetingTranscript((prev) => [...prev, turn]);
  }

  async function endMeeting() {
    if (meetingTranscript.length === 0) {
      showToast('会議ログがありません');
      return;
    }
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/meeting/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: meetingTranscript.map((t) => ({ speaker: t.speaker, text: t.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTPエラー ${res.status}`);

      const summary: MeetingSummary = {
        decisions: data.decisions ?? [],
        pending: data.pending ?? [],
        nextActions: data.nextActions ?? [],
      };
      setMeetingSummary(summary);

      const session: DebateSession = {
        id: `meeting_${Date.now()}`,
        topic,
        mode: 'meeting',
        participants: MEETING_PARTICIPANTS,
        transcript: meetingTranscript,
        meetingSummary: summary,
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
      showToast('議事録生成でエラーが発生しました: ' + (e instanceof Error ? e.message : '不明なエラー'));
    } finally {
      setIsSummarizing(false);
    }
  }

  return (
    <div className="wrap">
      <header>
        <div className="eyebrow">Amado Papa Lab</div>
        <h1>AI論壇</h1>
        <div className="sub">
          議題をひとつ投げ込み、複数のAIに討論・ブレストさせて <b>note</b> のネタを作る。
        </div>
      </header>

      <ModeTabs mode={mode} onChange={setMode} />

      {mode === 'debate' && (
        <>
          <DebateSetupForm
            topic={topic}
            onTopicChange={setTopic}
            landingType={landingType}
            onLandingTypeChange={setLandingType}
            turnCount={turnCount}
            onTurnCountChange={setTurnCount}
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
        </>
      )}

      {mode === 'meeting' && (
        <>
          <div className="paper setup" id="meetingSetupCard">
            <div className="field">
              <label>議題</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例）wagaya-recipeを広めるための戦略アイデアを出し合おう"
              />
            </div>
            <div className="field">
              <label>参加メンバー</label>
              <div className="members">
                {MEETING_PARTICIPANTS.map((p) => (
                  <div className="badge" key={p.name}>
                    <span className={`dot ${p.model === 'human' ? 'you' : p.colorSeed === '0' ? 'kuro' : 'cha'}`} />
                    {p.name}
                    {p.model === 'human' ? '（あなた）' : ''}
                  </div>
                ))}
              </div>
            </div>
            <button className="primary" onClick={startMeeting} disabled={isMeetingBusy || isSummarizing}>
              {showMeeting ? '新しい議題で会議をはじめる' : '会議をはじめる'}
            </button>
          </div>

          {showMeeting && (
            <div>
              <div className="section-eyebrow">会議</div>
              <MeetingFeed
                turns={meetingTranscript}
                participants={MEETING_PARTICIPANTS}
                thinkingSpeaker={meetingThinking}
              />
              {meetingError && (
                <div className="turn" style={{ borderLeftColor: 'var(--vermilion)', marginBottom: 13 }}>
                  <div className="turn-head" style={{ color: 'var(--vermilion)' }}>
                    エラー
                  </div>
                  <div className="turn-body">
                    通信でエラーが発生しました： {meetingError}
                    {'\n\n'}もう一度ボタンを押して再試行してください。
                  </div>
                </div>
              )}
              <MeetingControls
                aiParticipants={MEETING_PARTICIPANTS.filter((p) => p.model !== 'human')}
                onContinue={continueMeeting}
                onSay={sayAsHuman}
                onEnd={endMeeting}
                busy={isMeetingBusy}
                isSummarizing={isSummarizing}
                hasTranscript={meetingTranscript.length > 0}
              />
            </div>
          )}

          {meetingSummary && <MeetingSummaryCard summary={meetingSummary} />}
        </>
      )}

      <div>
        <div className="section-eyebrow">ログ一覧</div>
        <HistoryList key={historyKey} />
      </div>

      <footer className="app-footer">AI論壇 — note.com ネタ出しツール</footer>

      <Toast message={toastMsg} />
    </div>
  );
}
