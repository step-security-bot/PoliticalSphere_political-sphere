/**
 * Configuration management for AI Development System
 *
 * @module config
 */

import type { OrchestrationConfig, SLI, SLO, ValidationGateConfig } from '../types';

/**
 * Default orchestration configuration
 */
export const defaultOrchestrationConfig: OrchestrationConfig = {
  framework: 'semantic-kernel',
  pattern: 'sequential',
  checkpoint: {
    enabled: true,
    storage: 'memory',
    resumeOnFailure: true,
  },
};

/**
 * Validation gate configurations by tier
 */
export const validationGateConfigs: Record<number, ValidationGateConfig> = {
  0: {
    tier: 0,
    rules: ['political-neutrality', 'democratic-integrity', 'user-rights-protection'],
    bypassable: false,
    metadata: {
      name: 'Constitutional Gates',
      description: 'Never bypass - core principles',
      standards: ['Political Sphere Constitution'],
    },
  },
  1: {
    tier: 1,
    rules: [
      'input-validation',
      'authentication',
      'authorization',
      'cryptography',
      'error-handling',
      'logging',
    ],
    bypassable: false,
    metadata: {
      name: 'Mandatory Gates',
      description: 'OWASP ASVS Level 2 requirements',
      standards: ['OWASP ASVS 5.0.0'],
    },
  },
  2: {
    tier: 2,
    rules: ['code-quality', 'test-coverage', 'performance-benchmarks', 'documentation'],
    bypassable: true,
    metadata: {
      name: 'Best-practice Gates',
      description: 'Quality and efficiency standards',
      standards: ['ESLint', 'Biome', 'Vitest'],
    },
  },
};

/**
 * Service Level Indicators (SLIs)
 */
export const defaultSLIs: SLI[] = [
  {
    name: 'availability',
    description: 'System availability percentage',
    query: 'sum(up) / count(up)',
    target: 0.999, // 99.9%
  },
  {
    name: 'latency_p50',
    description: '50th percentile latency',
    query: 'histogram_quantile(0.5, rate(http_request_duration_seconds_bucket[5m]))',
    target: 100, // 100ms
  },
  {
    name: 'latency_p95',
    description: '95th percentile latency',
    query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
    target: 200, // 200ms
  },
  {
    name: 'latency_p99',
    description: '99th percentile latency',
    query: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))',
    target: 500, // 500ms
  },
  {
    name: 'error_rate',
    description: 'Error rate percentage',
    query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))',
    target: 0.001, // 0.1%
  },
];

/**
 * Service Level Objectives (SLOs)
 */
export const defaultSLOs: SLO[] = [
  {
    name: 'Monthly Availability',
    sli: defaultSLIs[0],
    target: 0.999,
    window: '30d',
    errorBudget: {
      total: 43.2, // minutes per 30 days
      consumed: 0,
      remaining: 43.2,
    },
  },
  {
    name: 'Weekly Latency P95',
    sli: defaultSLIs[2],
    target: 0.95,
    window: '7d',
    errorBudget: {
      total: 504, // minutes per 7 days (5% of time)
      consumed: 0,
      remaining: 504,
    },
  },
];

/**
 * AI governance configuration
 */
export const governanceConfig = {
  /** Bias threshold (0-1, lower is stricter) */
  biasThreshold: 0.1,
  /** Political neutrality required */
  neutralityRequired: true,
  /** Audit frequency */
  auditFrequency: 'quarterly' as const,
  /** Model card required for all AI systems */
  modelCardRequired: true,
  /** Human oversight required for political content */
  humanOversightRequired: true,
};

/**
 * Observability configuration
 */
export const observabilityConfig = {
  traces: {
    enabled: true,
    endpoint: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] || 'http://localhost:4318',
    serviceName: process.env['OTEL_SERVICE_NAME'] || 'ai-system',
  },
  metrics: {
    enabled: true,
    endpoint: process.env['PROMETHEUS_ENDPOINT'] || 'http://localhost:9090',
  },
  logs: {
    enabled: true,
    level: (process.env['LOG_LEVEL'] || 'info') as 'debug' | 'info' | 'warn' | 'error',
    format: 'json' as const,
  },
};

/**
 * Accessibility configuration (WCAG 2.2 AA)
 */
export const accessibilityConfig = {
  /** WCAG version */
  wcagVersion: '2.2',
  /** Compliance level */
  level: 'AA' as const,
  /** axe-core configuration */
  axe: {
    enabled: true,
    rules: {
      // Enable all Level A and AA rules
      'color-contrast': { enabled: true },
      label: { enabled: true },
      'button-name': { enabled: true },
      'image-alt': { enabled: true },
      // New WCAG 2.2 rules
      'focus-not-obscured': { enabled: true },
      'target-size': { enabled: true },
    },
  },
  /** Manual testing required */
  manualTesting: {
    required: true,
    protocols: ['keyboard-navigation', 'screen-reader', 'contrast-validation'],
  },
};

/**
 * Privacy configuration (GDPR)
 */
export const privacyConfig = {
  /** DSAR response SLA (days) */
  dsarSLA: 30,
  /** Breach notification SLA (hours) */
  breachNotificationSLA: 72,
  /** Data retention periods by type */
  retentionPolicies: {
    userData: '7y', // 7 years
    auditLogs: '6y', // 6 years
    analyticsData: '2y', // 2 years
    temporaryData: '30d', // 30 days
  },
  /** Consent management */
  consent: {
    required: true,
    granular: true, // Per-purpose consent
    withdrawable: true,
  },
};

/**
 * Get environment-specific configuration
 */
function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const v = value.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function parseNumber(value: string | undefined, fallback: number): number {
  const n = value != null ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function getConfig() {
  const env = process.env['NODE_ENV'] || 'development';

  // Overlay defaults with environment variables (safe parsing)
  const orchestration = {
    ...defaultOrchestrationConfig,
    framework: (process.env['AI_FRAMEWORK'] as any) || defaultOrchestrationConfig.framework,
    pattern: (process.env['AI_PATTERN'] as any) || defaultOrchestrationConfig.pattern,
    checkpoint: {
      ...defaultOrchestrationConfig.checkpoint,
      enabled: parseBoolean(
        process.env['AI_CHECKPOINT_ENABLED'],
        defaultOrchestrationConfig.checkpoint.enabled
      ),
      storage:
        (process.env['AI_CHECKPOINT_STORAGE'] as any) ||
        defaultOrchestrationConfig.checkpoint.storage,
      resumeOnFailure: parseBoolean(
        process.env['AI_CHECKPOINT_RESUME'],
        defaultOrchestrationConfig.checkpoint.resumeOnFailure ?? true
      ),
    },
  } as typeof defaultOrchestrationConfig;

  const governance = {
    ...governanceConfig,
    biasThreshold: parseNumber(process.env['AI_BIAS_THRESHOLD'], governanceConfig.biasThreshold),
    neutralityRequired: parseBoolean(
      process.env['AI_NEUTRALITY_REQUIRED'],
      governanceConfig.neutralityRequired
    ),
  };

  const observability = { ...observabilityConfig };

  return {
    env,
    orchestration,
    validation: validationGateConfigs,
    governance,
    observability,
    accessibility: accessibilityConfig,
    privacy: privacyConfig,
    slis: defaultSLIs,
    slos: defaultSLOs,
  };
}

/**
 * Export all configurations
 */
export const config = getConfig();
