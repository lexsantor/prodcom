// DEMO DATA. Every product, price, rating, review count and feature below is
// fictional and invented for this demonstration. None of it describes real
// software or comes from real customers.

/** 0 = not offered, 1 = limited, 2 = included. A tuple adds a short note. */
export type Level = 0 | 1 | 2
export type Avail = Level | readonly [Level, string]

export type Curve = 'gentle' | 'moderate' | 'steep'
export type SupportTier = 'basic' | 'standard' | 'priority' | 'premium'
export type MarkShape =
  | 'circle' | 'square' | 'triangle' | 'diamond' | 'ring'
  | 'bars' | 'half' | 'plus' | 'chevron' | 'hex'

export const CORE_FEATURES = [
  { id: 'boards', label: 'Kanban boards', group: 'planning' },
  { id: 'timeline', label: 'Timeline / Gantt', group: 'planning' },
  { id: 'dependencies', label: 'Task dependencies', group: 'planning' },
  { id: 'recurring', label: 'Recurring tasks', group: 'planning' },
  { id: 'workload', label: 'Workload and capacity', group: 'planning' },
  { id: 'portfolios', label: 'Portfolios', group: 'planning' },
  { id: 'comments', label: 'Comments and @mentions', group: 'collaboration' },
  { id: 'guests', label: 'Guest access', group: 'collaboration' },
  { id: 'docs', label: 'Docs and wiki', group: 'collaboration' },
  { id: 'proofing', label: 'File proofing', group: 'collaboration' },
  { id: 'automations', label: 'Automation rules', group: 'automation' },
  { id: 'forms', label: 'Intake forms', group: 'automation' },
  { id: 'api', label: 'Public API', group: 'automation' },
  { id: 'dashboards', label: 'Custom dashboards', group: 'reporting' },
  { id: 'timeTracking', label: 'Time tracking', group: 'reporting' },
] as const

export const ADMIN_FEATURES = [
  { id: 'sso', label: 'SSO / SAML' },
  { id: 'scim', label: 'SCIM provisioning' },
  { id: 'audit', label: 'Audit log' },
  { id: 'permissions', label: 'Granular permissions' },
  { id: 'residency', label: 'Data residency choice' },
  { id: 'soc2', label: 'SOC 2 Type II report' },
] as const

export type CoreId = (typeof CORE_FEATURES)[number]['id']
export type AdminId = (typeof ADMIN_FEATURES)[number]['id']

export interface Pricing {
  model: 'per-seat' | 'flat'
  /** per seat per month (per-seat) or whole plan per month (flat), billed yearly */
  annual: number
  /** same, billed monthly */
  monthly: number
  /** flat plans: seats included in the base price */
  includedSeats?: number
  /** flat plans: price per seat above includedSeats, billed yearly / monthly */
  extraSeat?: readonly [number, number]
  minSeats?: number
  maxSeats?: number
  freePlan: string | null
  trialDays: number | null
}

export interface Product {
  id: string
  name: string
  mark: { shape: MarkShape; hue: number }
  tagline: string
  bestFor: string
  pricing: Pricing
  rating: number
  reviews: number
  core: Record<CoreId, Avail>
  admin: Record<AdminId, Avail>
  integrations: number
  /** AI features included in the paid plan; empty = none */
  ai: readonly string[]
  automationRuns: string
  storage: string
  support: { tier: SupportTier; channels: string; response: string; responseHours: number; sla: string | null }
  migration: Avail
  onboarding: { curve: Curve; setup: string; setupDays: number; templates: number }
  platforms: { desktop: string | null; mobile: string; offline: Avail }
  strengths: readonly string[]
  limitations: readonly string[]
}

export const PRODUCTS: readonly Product[] = [
  {
    id: 'quillo',
    name: 'Quillo',
    mark: { shape: 'circle', hue: 150 },
    tagline: 'A calm personal planner that stretches to a very small team.',
    bestFor: 'Individuals and freelancers',
    pricing: { model: 'per-seat', annual: 5, monthly: 7, maxSeats: 5, freePlan: '1 user, 3 projects', trialDays: null },
    rating: 4.7,
    reviews: 2140,
    core: {
      boards: 2, timeline: 0, dependencies: 0, recurring: 2, workload: 0, portfolios: 0,
      comments: [1, 'Comments, no @mentions'], guests: 0, docs: 2, proofing: 0,
      automations: [1, '5 rules'], forms: 0, api: 0, dashboards: 0, timeTracking: [2, 'Billable hours'],
    },
    admin: { sso: 0, scim: 0, audit: 0, permissions: 0, residency: 0, soc2: 0 },
    integrations: 12,
    ai: [],
    automationRuns: '100 runs a month',
    storage: '10 GB per user',
    support: { tier: 'basic', channels: 'Email', response: 'Within 2 business days', responseHours: 48, sla: null },
    migration: 0,
    onboarding: { curve: 'gentle', setup: '15 minutes', setupDays: 0.01, templates: 40 },
    platforms: { desktop: 'Windows, macOS', mobile: 'iOS, Android', offline: [2, 'Full offline on every device'] },
    strengths: ['Quickest to learn', 'Full offline mode on every device', 'Built-in billable time tracking'],
    limitations: ['Hard cap of 5 seats', 'No timeline, dependencies or dashboards', 'Email-only support'],
  },
  {
    id: 'taskara',
    name: 'Taskara',
    mark: { shape: 'square', hue: 60 },
    tagline: 'One flat monthly price for up to 15 people.',
    bestFor: 'Small teams on a tight budget',
    pricing: {
      model: 'flat', annual: 49, monthly: 59, includedSeats: 15, extraSeat: [4, 5],
      freePlan: '3 users, 2 boards', trialDays: 14,
    },
    rating: 4.2,
    reviews: 980,
    core: {
      boards: 2, timeline: [1, 'Read-only timeline'], dependencies: 2, recurring: 2, workload: 0, portfolios: 0,
      comments: 2, guests: [1, 'Up to 5 guests'], docs: [1, 'Notes, no wiki'], proofing: 0,
      automations: [1, '250 runs a month'], forms: 2, api: 2, dashboards: [1, 'Up to 3 dashboards'], timeTracking: 0,
    },
    admin: { sso: 0, scim: 0, audit: 0, permissions: [1, 'Admin and member roles only'], residency: 0, soc2: 0 },
    integrations: 40,
    ai: ['Task summaries'],
    automationRuns: '250 runs a month',
    storage: '100 GB shared',
    support: { tier: 'standard', channels: 'Email, chat (business hours)', response: 'Within 24 hours', responseHours: 24, sla: null },
    migration: [1, 'CSV import only'],
    onboarding: { curve: 'gentle', setup: '1 hour', setupDays: 0.04, templates: 25 },
    platforms: { desktop: 'Windows, macOS', mobile: 'iOS, Android', offline: 0 },
    strengths: ['Cheapest for teams of 5 to 15', 'Adding people up to 15 costs nothing', 'Dependencies and intake forms included'],
    limitations: ['No SSO, audit log or compliance report', 'Timeline is read-only', 'Automation runs run out quickly'],
  },
  {
    id: 'northlane',
    name: 'Northlane',
    mark: { shape: 'triangle', hue: 230 },
    tagline: 'Plans, docs and reporting in one well-balanced workspace.',
    bestFor: 'Growing cross-functional teams',
    pricing: { model: 'per-seat', annual: 14, monthly: 17, minSeats: 3, freePlan: null, trialDays: 14 },
    rating: 4.5,
    reviews: 6320,
    core: {
      boards: 2, timeline: 2, dependencies: 2, recurring: 2, workload: [1, 'Workload view, no capacity planning'],
      portfolios: [1, 'Up to 5 portfolios'], comments: 2, guests: [2, 'Unlimited, view and comment'], docs: 2,
      proofing: [1, 'Image comments only'], automations: [2, '5,000 runs a month'], forms: 2, api: 2,
      dashboards: 2, timeTracking: [1, 'Through an integration'],
    },
    admin: { sso: [1, 'Paid add-on, $4 per seat'], scim: 0, audit: 2, permissions: 2, residency: [2, 'EU or US'], soc2: 2 },
    integrations: 75,
    ai: ['Status summaries', 'Smart scheduling'],
    automationRuns: '5,000 runs a month',
    storage: '250 GB shared',
    support: { tier: 'standard', channels: 'Email, chat (24/5)', response: 'Within 8 hours', responseHours: 8, sla: '99.9%' },
    migration: [1, 'Guided spreadsheet import'],
    onboarding: { curve: 'moderate', setup: '1 day', setupDays: 1, templates: 120 },
    platforms: { desktop: 'Windows, macOS', mobile: 'iOS, Android', offline: [1, 'Read-only offline'] },
    strengths: ['Broadest feature set below enterprise pricing', 'Strong dashboards and reporting', 'EU or US data residency'],
    limitations: ['SSO costs extra', 'Minimum of 3 seats', 'No capacity planning'],
  },
  {
    id: 'mondray',
    name: 'Mondray',
    mark: { shape: 'hex', hue: 280 },
    tagline: 'Governed work management for large organisations.',
    bestFor: 'Enterprises with strict governance',
    pricing: { model: 'per-seat', annual: 29, monthly: 35, minSeats: 10, freePlan: null, trialDays: 30 },
    rating: 4.1,
    reviews: 3410,
    core: {
      boards: 2, timeline: [2, 'Gantt with baselines'], dependencies: 2, recurring: 2, workload: [2, 'Capacity planning'],
      portfolios: 2, comments: 2, guests: [2, 'Unlimited, with expiring access'], docs: 2, proofing: 2,
      automations: [2, 'Unlimited runs'], forms: 2, api: 2, dashboards: 2, timeTracking: 2,
    },
    admin: { sso: 2, scim: 2, audit: 2, permissions: 2, residency: [2, 'EU, US, UK or Australia'], soc2: 2 },
    integrations: 150,
    ai: ['Intake triage agent', 'Status summaries', 'Risk detection', 'Plain-English reports'],
    automationRuns: 'Unlimited',
    storage: 'Unlimited',
    support: { tier: 'premium', channels: 'Phone, chat, email (24/7) and a named success manager', response: 'Within 1 hour', responseHours: 1, sla: '99.95%' },
    migration: [2, 'Dedicated migration team'],
    onboarding: { curve: 'steep', setup: '2 to 4 weeks', setupDays: 21, templates: 300 },
    platforms: { desktop: 'Windows, macOS', mobile: 'iOS, Android', offline: [1, 'Read-only offline'] },
    strengths: ['Every capability and control in this comparison', '24/7 phone support and a named success manager', 'Strongest security and compliance coverage'],
    limitations: ['Highest price, with a 10-seat minimum', 'Steep learning curve and weeks of setup', 'Rated lower than most for day-to-day use'],
  },
  {
    id: 'fernwork',
    name: 'Fernwork',
    mark: { shape: 'half', hue: 130 },
    tagline: 'Projects your clients can follow, approve and get billed for.',
    bestFor: 'Agencies and client work',
    pricing: { model: 'per-seat', annual: 18, monthly: 22, freePlan: null, trialDays: 21 },
    rating: 4.6,
    reviews: 1870,
    core: {
      boards: 2, timeline: 2, dependencies: [1, 'Finish-to-start only'], recurring: 2, workload: 2,
      portfolios: [1, 'Client folders, no rollup'], comments: 2, guests: [2, 'Unlimited free client guests'],
      docs: [1, 'Briefs and notes'], proofing: [2, 'Image, PDF and video proofing'], automations: [1, '1,000 runs a month'],
      forms: 2, api: [1, 'Read-only API'], dashboards: [1, 'Client and billing dashboards'],
      timeTracking: [2, 'Billable rates and invoicing'],
    },
    admin: { sso: [1, 'Enterprise plan only'], scim: 0, audit: [1, '90 days of history'], permissions: 2, residency: 0, soc2: 2 },
    integrations: 60,
    ai: ['Writing assistant in docs', 'Status summaries'],
    automationRuns: '1,000 runs a month',
    storage: '1 TB shared',
    support: { tier: 'priority', channels: 'Email, chat, phone (business hours)', response: 'Within 4 hours', responseHours: 4, sla: '99.9%' },
    migration: [2, 'Free assisted import'],
    onboarding: { curve: 'moderate', setup: '2 days', setupDays: 2, templates: 80 },
    platforms: { desktop: 'macOS only', mobile: 'iOS, Android', offline: 0 },
    strengths: ['Best proofing and client approval tools', 'Billable time tracking with invoicing', 'Unlimited free client guests'],
    limitations: ['Read-only API limits custom integrations', 'No Windows desktop app', 'No choice of data residency'],
  },
  {
    id: 'stackhaven',
    name: 'Stackhaven',
    mark: { shape: 'bars', hue: 20 },
    tagline: 'A work tracker you can shape like code.',
    bestFor: 'Software teams who configure everything',
    pricing: { model: 'per-seat', annual: 11, monthly: 13, freePlan: '10 users, 250 runs a month', trialDays: 14 },
    rating: 4.4,
    reviews: 4050,
    core: {
      boards: 2, timeline: 2, dependencies: [2, 'Blocking, related and custom links'], recurring: 2,
      workload: [1, 'Story-point capacity only'], portfolios: 2, comments: 2, guests: [1, 'Paid seats only'],
      docs: 2, proofing: 0, automations: [2, 'Unlimited, scriptable'], forms: 2, api: [2, 'API, webhooks and CLI'],
      dashboards: 2, timeTracking: [1, 'Estimates only'],
    },
    admin: { sso: 2, scim: 2, audit: 2, permissions: [2, 'Custom roles per project'], residency: [1, 'EU on Enterprise only'], soc2: 2 },
    integrations: 200,
    ai: ['Automations from plain English', 'Task summaries'],
    automationRuns: 'Unlimited',
    storage: '500 GB shared',
    support: { tier: 'basic', channels: 'Email and community forum', response: 'Within 2 business days', responseHours: 48, sla: '99.9%' },
    migration: [1, 'Self-serve importers'],
    onboarding: { curve: 'steep', setup: '1 week', setupDays: 7, templates: 60 },
    platforms: { desktop: 'Windows, macOS, Linux', mobile: 'iOS, Android', offline: 0 },
    strengths: ['Most configurable: custom fields, workflows and scripts', 'SSO and SCIM on the main plan', 'Unlimited automation runs'],
    limitations: ['Hard going for non-technical teammates', 'Email and forum support only', 'No proofing or client-facing tools'],
  },
  {
    id: 'orbitask',
    name: 'Orbitask',
    mark: { shape: 'ring', hue: 195 },
    tagline: 'Simple enough that the whole team uses it on day one.',
    bestFor: 'Teams that want zero training',
    pricing: { model: 'per-seat', annual: 9, monthly: 11, freePlan: '5 users, 3 projects', trialDays: 14 },
    rating: 4.8,
    reviews: 8900,
    core: {
      boards: 2, timeline: 2, dependencies: [1, 'Visual only, no auto-scheduling'], recurring: 2, workload: 0,
      portfolios: 0, comments: 2, guests: [1, 'Up to 10 guests'], docs: 2, proofing: [1, 'Image comments only'],
      automations: [1, '100 runs a month'], forms: 2, api: [1, 'Read-only API'], dashboards: [1, 'One team dashboard'],
      timeTracking: 0,
    },
    admin: { sso: 0, scim: 0, audit: 0, permissions: [1, 'Three fixed roles'], residency: 0, soc2: [1, 'SOC 2 Type I only'] },
    integrations: 50,
    ai: [],
    automationRuns: '100 runs a month',
    storage: '100 GB shared',
    support: { tier: 'standard', channels: 'Email, chat (24/7)', response: 'Within 12 hours', responseHours: 12, sla: null },
    migration: [1, 'One-click spreadsheet import'],
    onboarding: { curve: 'gentle', setup: '30 minutes', setupDays: 0.02, templates: 200 },
    platforms: { desktop: 'Windows, macOS', mobile: 'iOS, Android', offline: [1, 'Mobile only'] },
    strengths: ['Highest rated and easiest to adopt', '24/7 chat on every plan', 'Free plan for up to 5 people'],
    limitations: ['Thin reporting, no workload view', 'Very limited automation', 'No SSO or audit log'],
  },
  {
    id: 'plotwise',
    name: 'Plotwise',
    mark: { shape: 'chevron', hue: 340 },
    tagline: 'Critical paths, baselines and capacity, done properly.',
    bestFor: 'Project managers with complex schedules',
    pricing: { model: 'per-seat', annual: 22, monthly: 27, freePlan: null, trialDays: 30 },
    rating: 4.3,
    reviews: 1240,
    core: {
      boards: [1, 'Basic boards'], timeline: [2, 'Gantt, baselines, critical path'],
      dependencies: [2, 'All four link types, auto-scheduling'], recurring: 2, workload: [2, 'Capacity planning by role'],
      portfolios: [2, 'Rollups and scenarios'], comments: 2, guests: [1, 'Paid seats only'], docs: [1, 'Attachments, no wiki'],
      proofing: 0, automations: [1, '2,000 runs a month'], forms: [1, 'Business plan only'], api: 2, dashboards: 2,
      timeTracking: [2, 'Timesheets with approvals'],
    },
    admin: { sso: 2, scim: [1, 'Enterprise plan only'], audit: 2, permissions: 2, residency: [2, 'EU or US'], soc2: 2 },
    integrations: 45,
    ai: ['Workload forecasting', 'Risk detection', 'Status summaries'],
    automationRuns: '2,000 runs a month',
    storage: '1 TB shared',
    support: { tier: 'priority', channels: 'Email, chat, phone (business hours)', response: 'Within 4 hours', responseHours: 4, sla: '99.9%' },
    migration: [2, 'Assisted import from schedules'],
    onboarding: { curve: 'steep', setup: '1 to 2 weeks', setupDays: 10, templates: 90 },
    platforms: { desktop: 'Windows only', mobile: 'iOS (view only)', offline: 0 },
    strengths: ['Deepest scheduling: baselines, critical path, auto-scheduling', 'Capacity planning and timesheet approvals', 'Phone support with 4-hour response'],
    limitations: ['Second highest price per seat', 'Boards and docs are an afterthought', 'Mobile app is view-only'],
  },
  {
    id: 'veloxa',
    name: 'Veloxa',
    mark: { shape: 'plus', hue: 100 },
    tagline: 'Turn recurring requests into workflows that run themselves.',
    bestFor: 'Ops teams automating repeat work',
    pricing: { model: 'per-seat', annual: 16, monthly: 19, freePlan: '3 users, 500 runs a month', trialDays: 14 },
    rating: 4.0,
    reviews: 760,
    core: {
      boards: 2, timeline: [1, 'Basic timeline'], dependencies: 2, recurring: 2, workload: 0, portfolios: 0,
      comments: 2, guests: [2, 'Unlimited form-only guests'], docs: 0, proofing: 0,
      automations: [2, '25,000 runs a month, multi-step'], forms: [2, 'Conditional logic'], api: [2, 'API and webhooks'],
      dashboards: 2, timeTracking: 0,
    },
    admin: { sso: 2, scim: 0, audit: 2, permissions: 2, residency: 0, soc2: 2 },
    integrations: 220,
    ai: ['Automations from plain English', 'Writing assistant', 'Meeting notes to tasks'],
    automationRuns: '25,000 runs a month',
    storage: '200 GB shared',
    support: { tier: 'standard', channels: 'Email, chat (business hours)', response: 'Within 24 hours', responseHours: 24, sla: '99.9%' },
    migration: [1, 'Self-serve importers'],
    onboarding: { curve: 'moderate', setup: '2 days', setupDays: 2, templates: 150 },
    platforms: { desktop: null, mobile: 'iOS, Android', offline: 0 },
    strengths: ['Most powerful automation and intake forms', 'Largest integration catalogue', 'SSO and audit log on the main plan'],
    limitations: ['No docs, workload view or time tracking', 'No desktop apps', 'Fewest demo reviews of the ten'],
  },
  {
    id: 'cairnpoint',
    name: 'Cairnpoint',
    mark: { shape: 'diamond', hue: 255 },
    tagline: 'Run it on your own servers, or in our EU cloud.',
    bestFor: 'Regulated teams that must self-host',
    pricing: {
      model: 'flat', annual: 390, monthly: 450, includedSeats: 50, extraSeat: [6, 7],
      freePlan: null, trialDays: 30,
    },
    rating: 3.9,
    reviews: 410,
    core: {
      boards: 2, timeline: 2, dependencies: 2, recurring: 2, workload: [1, 'Workload view, no capacity planning'],
      portfolios: [1, 'Program grouping only'], comments: 2, guests: [1, 'Up to 25 guests'], docs: 2, proofing: 0,
      automations: [1, '1,000 runs a month'], forms: [1, 'Basic forms'], api: 2, dashboards: [1, 'Fixed report set'],
      timeTracking: 2,
    },
    admin: { sso: 2, scim: 2, audit: 2, permissions: 2, residency: [2, 'Self-hosted or EU cloud'], soc2: 2 },
    integrations: 25,
    ai: ['Portfolio risk detection', 'Plain-English reports'],
    automationRuns: '1,000 runs a month',
    storage: 'Unlimited when self-hosted',
    support: { tier: 'priority', channels: 'Email, phone (EU business hours)', response: 'Within 8 hours', responseHours: 8, sla: '99.9%' },
    migration: [2, 'Assisted migration included'],
    onboarding: { curve: 'moderate', setup: '1 to 2 weeks if self-hosted', setupDays: 10, templates: 30 },
    platforms: { desktop: 'Windows, macOS, Linux', mobile: 'iOS, Android', offline: [2, 'Full offline sync'] },
    strengths: ['The only option you can self-host', 'Full admin and compliance controls', 'Flat price is very affordable for 30 to 50 people'],
    limitations: ['Dated interface, lowest rating of the ten', 'Small integration catalogue', 'Expensive for teams under 25'],
  },
]

export const PRODUCT_BY_ID: ReadonlyMap<string, Product> = new Map(PRODUCTS.map((p) => [p.id, p]))
