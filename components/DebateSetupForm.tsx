'use client';

import { LANDING_TYPES, MODEL_LABELS, type LandingType, type ModelId, type Participant } from '@/lib/types';
import { getParticipantColors } from '@/lib/palette';

const TURN_OPTIONS = [3, 4, 5];
const MAX_PARTICIPANTS = 4;

const LANDING_HINTS: Record<LandingType, string> = {
  属性分岐型: '条件で結論が変わる',
  明確結論型: '最後にジャッジをつける',
  両論併記型: '結論は出さず論点整理',
};

interface Props {
  topic: string;
  onTopicChange: (v: string) => void;
  landingType: LandingType;
  onLandingTypeChange: (v: LandingType) => void;
  turnCount: number;
  onTurnCountChange: (v: number) => void;
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  onStart: () => void;
  isRunning: boolean;
}

export default function DebateSetupForm({
  topic,
  onTopicChange,
  landingType,
  onLandingTypeChange,
  turnCount,
  onTurnCountChange,
  participants,
  onParticipantsChange,
  onStart,
  isRunning,
}: Props) {
  function updateParticipant(index: number, patch: Partial<Participant>) {
    const next = participants.slice();
    next[index] = { ...next[index], ...patch };
    onParticipantsChange(next);
  }

  function addParticipant() {
    if (participants.length >= MAX_PARTICIPANTS) return;
    const nextIndex = participants.length;
    onParticipantsChange([
      ...participants,
      { name: `参加者${nextIndex + 1}`, model: 'claude', role: '', colorSeed: String(nextIndex) },
    ]);
  }

  function removeParticipant(index: number) {
    if (participants.length <= 2) return;
    onParticipantsChange(participants.filter((_, i) => i !== index));
  }

  return (
    <div className="paper setup" id="setupCard">
      <div className="field">
        <label>議題</label>
        <textarea
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="例）NISAとiDeCo、今から始めるならどっちが得か"
        />
      </div>

      <div className="field">
        <label>落とし所タイプ</label>
        <div className="chiplist">
          {LANDING_TYPES.map((type) => (
            <div
              key={type}
              className={`chip ${landingType === type ? 'active' : ''}`}
              onClick={() => onLandingTypeChange(type)}
            >
              {type}
              <small>{LANDING_HINTS[type]}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>討論ターン数</label>
          <div className="chiplist">
            {TURN_OPTIONS.map((n) => (
              <div
                key={n}
                className={`chip ${turnCount === n ? 'active' : ''}`}
                onClick={() => onTurnCountChange(n)}
              >
                {n}往復
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <label>参加者の立場（空欄なら自動設定）</label>
        <div className="persona-grid">
          {participants.map((p, i) => {
            const colors = getParticipantColors(p.colorSeed);
            return (
              <div className="persona-box" key={i}>
                <div className="persona-name">
                  <div className="seal" style={{ background: colors.seal }}>
                    {p.name.slice(0, 1) || '?'}
                  </div>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updateParticipant(i, { name: e.target.value })}
                    style={{ fontWeight: 700, border: 'none', background: 'transparent', padding: 0, flex: 1 }}
                  />
                  {participants.length > 2 && (
                    <button type="button" className="tiny" onClick={() => removeParticipant(i)}>
                      削除
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={p.role}
                  onChange={(e) => updateParticipant(i, { role: e.target.value })}
                  placeholder="例）堅実・データ重視派"
                  style={{ marginBottom: 8 }}
                />
                <select
                  value={p.model}
                  onChange={(e) => updateParticipant(i, { model: e.target.value as ModelId })}
                  style={{
                    width: '100%',
                    border: '1px solid var(--washi-line)',
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: 2,
                    padding: '8px 10px',
                    fontSize: 13,
                    color: 'var(--text)',
                  }}
                >
                  <option value="claude">{MODEL_LABELS.claude}</option>
                  <option value="gpt">{MODEL_LABELS.gpt}</option>
                  <option value="deepseek" disabled>
                    {MODEL_LABELS.deepseek}（未接続）
                  </option>
                </select>
              </div>
            );
          })}
        </div>
        {participants.length < MAX_PARTICIPANTS && (
          <button type="button" className="ghost" style={{ marginTop: 12 }} onClick={addParticipant}>
            + 参加者を追加
          </button>
        )}
      </div>

      <button className="primary" disabled={isRunning} onClick={onStart}>
        {isRunning ? '討論を進めています…' : '討論をはじめる'}
      </button>
    </div>
  );
}
