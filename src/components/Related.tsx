/** Neighbouring comparisons. Demo: these category pages are not built yet, so they are plain text, not links. */
const CATEGORIES = [
  { slug: 'time-tracking', name: 'Time tracking', note: 'Billable hours, timesheets, invoicing' },
  { slug: 'resource-management', name: 'Resource management', note: 'Capacity, workload, staffing' },
  { slug: 'team-collaboration', name: 'Team collaboration', note: 'Docs, wikis, chat' },
  { slug: 'agency-management', name: 'Agency management', note: 'Clients, proofing, retainers' },
  { slug: 'portfolio-management', name: 'Portfolio management', note: 'Programs, roll-ups, risk' },
  { slug: 'kanban-boards', name: 'Kanban boards', note: 'Lightweight boards for small teams' },
] as const

export function Related() {
  return (
    <section className="related" aria-labelledby="related-title">
      <div className="wrap">
        <h2 id="related-title">Related categories</h2>
        <p className="section-sub">Neighbouring categories we plan to compare. Not available yet.</p>
        <ul className="related-list">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="related-item">
              <span className="related-name">{c.name}</span>
              <span className="related-note">{c.note}</span>
              <span className="related-soon">Coming soon</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
