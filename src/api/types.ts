/**
 * Hand-written mirrors of the backend DTOs.
 *
 * These are the contract until `bun gen:api` can reach a running backend, at which point Orval
 * writes the same shapes into `src/api/generated/` and these become the fallback for anything the
 * spec doesn't cover.
 */

export type Priority = 'high' | 'normal' | 'noise';
export type ClassifiedBy = 'rule' | 'llm' | 'fallback';
export type RuleType = 'sender' | 'domain' | 'header';
export type RuleSource = 'manual' | 'feedback';
export type CategorySource = 'rule' | 'llm' | 'user' | 'none';
export type AlertSource = 'grafana' | 'signoz';
export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info' | 'resolved';
export type HealthStatus = 'ok' | 'degraded' | 'broken';
export type ServiceState = 'ok' | 'warn' | 'bad';

export interface Message {
  readonly id: string;
  readonly gmailId: string;
  readonly sender: string;
  readonly senderName: string;
  readonly subject: string;
  readonly snippet?: string;
  readonly receivedAt: string;
  readonly priority: Priority;
  readonly summary?: string;
  readonly reason?: string;
  readonly classifiedBy: ClassifiedBy;
  /** The one topic bucket this message is in. Absent only on rows that predate categories. */
  readonly category?: string;
  readonly categoryColor?: string;
  readonly categorySource?: CategorySource;
  readonly notifiedAt?: string;
  readonly dismissed: boolean;
  readonly gmailUrl: string;
  /** Short origin label from the server, or absent. Currently only `infra`. */
  readonly tag?: string;
}

export interface Rule {
  readonly id: string;
  readonly type: RuleType;
  readonly pattern: string;
  readonly priority: Priority;
  readonly enabled: boolean;
  readonly source: RuleSource;
  readonly hits: number;
  readonly createdAt: string;
}

export interface AlertEvent {
  readonly id: string;
  readonly source: AlertSource;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly app?: string;
  readonly receivedAt: string;
  readonly resolvedAt?: string;
  readonly notified: boolean;
  readonly acknowledgedAt?: string;
  readonly snoozedUntil?: string;
  /** Absent when no base URL is configured — no link beats a broken one. */
  readonly sourceUrl?: string;
}

export interface AlertRouting {
  readonly pushed: number;
  readonly held: number;
  readonly resolved: number;
}

export interface AlertSourceState {
  readonly source: AlertSource;
  readonly eventsInWindow: number;
  readonly lastEventAt?: string;
  readonly everReceived: boolean;
}

/** The whole alerts screen in one read, so its numbers cannot contradict its lists. */
export interface AlertOverview {
  readonly unresolved: readonly AlertEvent[];
  readonly resolved: readonly AlertEvent[];
  readonly routing: AlertRouting;
  readonly sources: readonly AlertSourceState[];
}

export interface DigestCounts {
  readonly high: number;
  readonly normal: number;
  readonly noise: number;
}

export interface NoiseCategory {
  readonly label: string;
  readonly count: number;
}

export interface NoiseSummary {
  readonly count: number;
  readonly categories: readonly NoiseCategory[];
}

export interface Digest {
  readonly date: string;
  readonly counts: DigestCounts;
  /**
   * A few sentences of prose about the day, written once when the digest is sent. Absent until
   * then, and whenever the narrator was unavailable — the lists below are always the truth.
   */
  readonly narrative?: string;
  readonly high: readonly Message[];
  readonly normal: readonly Message[];
  readonly noise: NoiseSummary;
  readonly alerts: readonly AlertEvent[];
  readonly unclassified: number;
  readonly degraded: boolean;
  readonly degradedReason?: string;
  readonly sentAt?: string;
}

/**
 * A digest over a chosen span, built on demand.
 *
 * Deliberately not a `Digest` with two dates: this one was never sent, so it has no `sentAt` and no
 * stored history behind it. Anything rendering a delivery state must not be handed one of these.
 */
export interface DigestRange {
  readonly from: string;
  readonly to: string;
  /** Days covered, both ends included. */
  readonly days: number;
  readonly counts: DigestCounts;
  readonly narrative?: string;
  readonly high: readonly Message[];
  readonly normal: readonly Message[];
  readonly noise: NoiseSummary;
  readonly alerts: readonly AlertEvent[];
  readonly unclassified: number;
  readonly degraded: boolean;
  readonly degradedReason?: string;
}

export interface DigestStatsDay {
  readonly date: string;
  readonly high: number;
  readonly normal: number;
  readonly noise: number;
  /** Messages that actually reached the phone — not the same as the high count. */
  readonly interruptions: number;
  readonly hasStoredDigest: boolean;
}

export interface DigestStats {
  readonly days: readonly DigestStatsDay[];
}

/** What a candidate rule would have done to the mail already on record. */
export interface RuleDryRun {
  readonly supported: boolean;
  readonly reason?: string;
  readonly sampleSize: number;
  readonly matched: number;
  readonly matchedHigh: number;
}

export interface HealthServiceState {
  readonly name: string;
  readonly state: ServiceState;
  readonly value: string;
  readonly note: string;
}

export interface ClassificationMix {
  readonly rule: number;
  readonly llm: number;
  readonly fallback: number;
}

export type CredentialStatus = 'ok' | 'warn' | 'bad' | 'unknown';

/** Presence and validity only — a credential value never crosses this boundary. */
export interface CredentialState {
  readonly name: string;
  readonly state: CredentialStatus;
  readonly detail: string;
}

export interface Health {
  readonly status: HealthStatus;
  readonly services: readonly HealthServiceState[];
  readonly lastSync?: string;
  readonly historyId?: string;
  readonly syncError?: string;
  readonly fallbackCount: number;
  readonly classificationMix: ClassificationMix;
  readonly credentials: readonly CredentialState[];
  readonly shadow: ShadowState;
}

/**
 * Shadow-mode progress.
 *
 * No countdown: shadow mode is a ConfigMap boolean with no end date, so the screen reports the
 * evidence gathered rather than inventing a deadline.
 */
export interface ShadowState {
  readonly enabled: boolean;
  readonly classified: number;
  readonly high: number;
  readonly corrections: number;
}

/**
 * The effective server configuration.
 *
 * Read-only on purpose: these are ConfigMap values, so the screen mirrors them rather than
 * pretending to own them.
 */
export interface Config {
  readonly timezone: string;
  readonly shadowMode: boolean;
  readonly digest: {
    readonly sendTime: string;
    readonly includeNoise: boolean;
    readonly skipWhenEmpty: boolean;
  };
  readonly quietHours: {
    readonly enabled: boolean;
    readonly start: string;
    readonly end: string;
    readonly allowSecurityAlerts: boolean;
  };
  readonly ntfy: {
    readonly topic: string;
    readonly highPriority: string;
    readonly tokenConfigured: boolean;
  };
  readonly data: {
    readonly gmailScope: string;
    readonly snippetLength: number;
    readonly retentionDays: number;
    readonly pollIntervalSeconds: number;
    readonly classifierEnabled: boolean;
  };
}

export interface TestPushResult {
  readonly delivered: boolean;
  readonly topic: string;
  readonly durationMs: number;
  readonly sentAt: string;
}

/**
 * The outcome of a manual sync.
 *
 * `failed` is separate from `ingested` because both zeroes read the same in a count but mean
 * opposite things — nothing new, versus nothing checked because the mailbox errored.
 */
export interface SyncResult {
  readonly alreadyRunning: boolean;
  readonly accounts: number;
  readonly ingested: number;
  readonly failed: number;
}

/** Never carries token material — only whether an account is attached, and which one. */
export interface GoogleAccount {
  readonly connected: boolean;
  readonly email?: string;
  readonly connectedAt?: string;
  readonly scope?: string;
  readonly clientConfigured: boolean;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  /** Seeded buckets; the classifier knows them by name, so they cannot be deleted. */
  readonly builtin: boolean;
  /** Where unresolved mail lands. Exactly one category has this. */
  readonly fallback: boolean;
  readonly count: number;
  /** 0..1 of the window's messages. */
  readonly share: number;
  /**
   * The priority this category's mail *actually* got, observed over the window. Not a setting —
   * categories never decide priority.
   */
  readonly typicalPriority?: Priority;
  readonly rules: readonly CategoryRule[];
  readonly corrected: number;
}

/** A pattern that files mail into a category. Carries no priority — that is the whole design. */
export interface CategoryRule {
  readonly id: string;
  readonly type: RuleType;
  readonly pattern: string;
  readonly source: RuleSource;
  readonly hits: number;
}

/** Counts, not percentages, so the screen's numbers and its lists cannot disagree. */
export interface CategoryMix {
  readonly byRule: number;
  readonly byModel: number;
  readonly lowConfidence: number;
  readonly byUser: number;
  readonly unresolved: number;
}

export interface CategoryRef {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

/** A message the classifier placed but was not confident about. */
export interface UnsureMessage {
  readonly messageId: string;
  readonly sender: string;
  readonly subject: string;
  readonly receivedAt: string;
  readonly confidence: number;
  readonly guess?: CategoryRef;
  readonly alternative?: CategoryRef;
}

export interface CategoryCorrection {
  readonly messageId: string;
  readonly subject: string;
  readonly category?: string;
  readonly previousCategory?: string;
  readonly correctedAt: string;
}

export interface CategoryOverview {
  readonly windowDays: number;
  readonly categories: readonly Category[];
  readonly mix: CategoryMix;
  readonly unsure: readonly UnsureMessage[];
  readonly recentCorrections: readonly CategoryCorrection[];
  readonly backfill: BackfillStatus;
}

/**
 * State of the backfill, not a result — the run is detached from the request that starts it, so
 * there is nothing to report at the moment of asking. The screen polls and watches `uncategorised`
 * fall.
 */
export interface BackfillStatus {
  readonly running: boolean;
  readonly processed: number;
  /** How many this run intends to reach; 0 until the free rule pass has finished. */
  readonly target: number;
  readonly uncategorised: number;
  readonly lastOutcome?: 'done' | 'more_remaining' | 'sidecar_unavailable' | 'failed';
}

export interface CreateCategoryRequest {
  readonly name: string;
  readonly color: string;
}

/** Both optional — send only what changes. */
export interface UpdateCategoryRequest {
  readonly name?: string;
  readonly color?: string;
}

/** Note the absence of a priority field — recategorising never changes what interrupts you. */
export interface AssignCategoryRequest {
  readonly messageId: string;
  readonly categoryId: string;
  readonly applyToDomain?: boolean;
  readonly learn?: boolean;
}

export interface CreateRuleRequest {
  readonly type: RuleType;
  readonly pattern: string;
  readonly priority: Priority;
}

export interface FeedbackRequest {
  readonly messageId: string;
  readonly shouldHaveBeen: Priority;
  readonly applyToDomain: boolean;
}

/**
 * What an automation pushes. `direct` is a push now, held during quiet hours; `important` is an
 * urgent push that overrides Do Not Disturb and pierces quiet hours. Neither touches priority.
 */
export type AutomationAlert = 'none' | 'direct' | 'important';

/** What one action of one run actually did. */
export type ActionOutcome = 'delivered' | 'failed' | 'suppressed' | 'none';

/** A natural-language trigger the classifier judges, and the actions it runs on a match. */
export interface Automation {
  readonly id: string;
  readonly name: string;
  readonly trigger: string;
  readonly alert: AutomationAlert;
  readonly webhookUrl?: string;
  readonly enabled: boolean;
  readonly fireCount: number;
  readonly lastFiredAt?: string;
  readonly createdAt: string;
}

/** One firing. A test run has no message. */
export interface AutomationRun {
  readonly id: string;
  readonly automationId: string;
  readonly automationName: string;
  readonly messageId?: string;
  readonly sender?: string;
  readonly subject?: string;
  readonly firedAt: string;
  readonly alert: ActionOutcome;
  readonly webhook: ActionOutcome;
  /** Why something failed or was held back, e.g. "webhook: HTTP 502; push held: quiet hours". */
  readonly detail?: string;
}

export interface AutomationOverview {
  readonly automations: readonly Automation[];
  readonly recentRuns: readonly AutomationRun[];
  /** Enabled automations allowed at once — every trigger is prompt text on every mail. */
  readonly limit: number;
}

export interface CreateAutomationRequest {
  readonly name: string;
  readonly trigger: string;
  readonly alert: AutomationAlert;
  /** Empty means no webhook. */
  readonly webhookUrl: string;
}

/** Omitted fields are left alone; an empty `webhookUrl` removes the webhook. */
export interface UpdateAutomationRequest {
  readonly name?: string;
  readonly trigger?: string;
  readonly alert?: AutomationAlert;
  readonly webhookUrl?: string;
  readonly enabled?: boolean;
}
