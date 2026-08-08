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
  readonly notifiedAt?: string;
  readonly dismissed: boolean;
  readonly gmailUrl: string;
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
  readonly high: readonly Message[];
  readonly normal: readonly Message[];
  readonly noise: NoiseSummary;
  readonly alerts: readonly AlertEvent[];
  readonly unclassified: number;
  readonly degraded: boolean;
  readonly degradedReason?: string;
  readonly sentAt?: string;
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

export interface Health {
  readonly status: HealthStatus;
  readonly services: readonly HealthServiceState[];
  readonly lastSync?: string;
  readonly historyId?: string;
  readonly syncError?: string;
  readonly fallbackCount: number;
  readonly classificationMix: ClassificationMix;
}

/** Never carries token material — only whether an account is attached, and which one. */
export interface GoogleAccount {
  readonly connected: boolean;
  readonly email?: string;
  readonly connectedAt?: string;
  readonly scope?: string;
  readonly clientConfigured: boolean;
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
