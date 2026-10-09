/** Neighbouring comparisons. Demo: these category pages are not built yet. */
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
        <p className="section-sub">Not quite the right kind of tool? Compare the neighbours.</p>
        <ul className="related-list">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <a href={`/compare/${c.slug}/`}>
                <span className="related-name">{c.name}</span>
                <span className="related-note">{c.note}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
