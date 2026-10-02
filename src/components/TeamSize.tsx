import { useEffect, useState } from 'react'
import { TEAM_MAX, TEAM_MIN } from '../lib/score.ts'
import { clampTeam } from '../lib/selection.ts'

/** Team size is the one quantity every buyer knows; all prices derive from it. */
export function TeamSize({ team, onTeam }: { team: number; onTeam: (n: number) => void }) {
  const [draft, setDraft] = useState(String(team))
  useEffect(() => setDraft(String(team)), [team])

  const commit = (raw: string) => {
    const n = clampTeam(Number(raw))
    setDraft(String(n))
    if (n !== team) onTeam(n)
  }

  return (
    <div className="team">
      <label htmlFor="team-size">Team size</label>
      <div className="team-field">
        <button type="button" className="team-step" onClick={() => commit(String(team - 1))} disabled={team <= TEAM_MIN} aria-label="One person fewer">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 6h8" stroke="currentColor" strokeWidth="2" /></svg>
        </button>
        <input
          id="team-size"
          type="number"
          inputMode="numeric"
          min={TEAM_MIN}
          max={TEAM_MAX}
          value={draft}
          aria-describedby="team-size-hint"
          onChange={(e) => {
            setDraft(e.target.value)
            const n = Number(e.target.value)
            if (e.target.value !== '' && n >= TEAM_MIN && n <= TEAM_MAX && Number.isInteger(n)) onTeam(n)
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(e.currentTarget.value) }}
        />
        <button type="button" className="team-step" onClick={() => commit(String(team + 1))} disabled={team >= TEAM_MAX} aria-label="One person more">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="2" /></svg>
        </button>
      </div>
      <span id="team-size-hint" className="team-hint">people, {TEAM_MIN} to {TEAM_MAX}</span>
    </div>
  )
}
