'use client';

import { getParticipantColors } from '@/lib/palette';
import type { DebateTurn, Participant } from '@/lib/types';

interface Props {
  turns: DebateTurn[];
  participants: Participant[];
  thinkingSpeaker?: string | null;
}

export default function MeetingFeed({ turns, participants, thinkingSpeaker }: Props) {
  function participantFor(speaker: string) {
    return participants.find((p) => p.name === speaker);
  }

  return (
    <div id="feed">
      {turns.map((turn, i) => {
        const participant = participantFor(turn.speaker);
        if (participant?.model === 'human') {
          return (
            <div key={i} className="turn turn-human">
              <div className="turn-head">{turn.speaker}（あなた）</div>
              <div className="turn-body">{turn.text}</div>
            </div>
          );
        }
        const colors = getParticipantColors(participant?.colorSeed ?? '0');
        return (
          <div
            key={i}
            className="turn"
            style={{
              borderLeftColor: colors.border,
              background: `linear-gradient(180deg, ${colors.gradientFrom}, ${colors.gradientTo})`,
            }}
          >
            <div className="turn-head">
              <span
                className="seal"
                style={{ background: colors.seal, width: 18, height: 18, fontSize: 10 }}
              >
                {turn.speaker.slice(0, 1)}
              </span>
              {turn.speaker}
              {turn.replyTo && <span className="reply">→ {turn.replyTo}へ</span>}
            </div>
            <div className="turn-body">{turn.text}</div>
          </div>
        );
      })}
      {thinkingSpeaker && (
        <div className="thinking">
          {thinkingSpeaker}が考え中 <span className="dot">・</span>
          <span className="dot">・</span>
          <span className="dot">・</span>
        </div>
      )}
    </div>
  );
}
