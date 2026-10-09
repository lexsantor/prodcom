import { useState, type FormEvent } from 'react'
import { PRODUCT_BY_ID } from '../data/products.ts'
import { track } from '../lib/track.ts'

interface Props {
  ids: string[]
  team: number
}

export function EmailList({ ids, team }: Props) {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const names = ids.map((id) => PRODUCT_BY_ID.get(id)?.name ?? id)
  const what = names.length
    ? `your shortlist (${names.join(', ')}) and the full ten`
    : 'all ten tools'

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get('email')
    const input = e.currentTarget.elements.namedItem('email') as HTMLInputElement
    const value = typeof email === 'string' ? email.trim() : ''
    if (!value) {
      setError('Enter your work email.')
      input.focus()
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Enter an email address like name@company.com.')
      input.focus()
      return
    }
    setError(null)
    // the address itself never enters analytics
    track({ event: 'email_capture_submitted', alerts_opt_in: new FormData(e.currentTarget).get('alerts') === 'on' })
    // ponytail: no backend in this demo; POST { email, ids, team, alerts } to the ESP here.
    setSentTo(value)
  }

  return (
    <section className="emailme" aria-labelledby="emailme-title">
      <div className="wrap">
        <div className="emailme-box">
          <div>
            <h2 id="emailme-title">Get this list in your inbox</h2>
            <p className="section-sub">
              We'll email {what}, priced for a team of {team}, with a link back to this comparison.
            </p>
          </div>
          {sentTo ? (
            <p className="emailme-done" role="status">
              Demo: nothing was sent. On the live site, the list would go to <strong>{sentTo}</strong>.
            </p>
          ) : (
            <form className="emailme-form" onSubmit={onSubmit} noValidate>
              <label className="emailme-field">
                <span>Work email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? 'emailme-error' : undefined}
                  onChange={() => setError(null)}
                />
              </label>
              {error && <p id="emailme-error" className="emailme-error">{error}</p>}
              <button type="submit" className="btn btn-primary">Email me the list</button>
              <label className="emailme-opt">
                <input type="checkbox" name="alerts" />
                <span>Also tell me when prices change for these tools</span>
              </label>
              <p className="muted small emailme-note">We send this list once. Price alerts only if you tick the box. No sharing with vendors.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
