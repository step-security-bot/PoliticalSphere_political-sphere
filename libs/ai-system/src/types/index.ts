/**
 * Core type definitions for AI Development System
 *
 * @module types
 */

/**
 * AI agent interface
 */
export interface Agent {
  /** Unique agent identifier */
  id: string;
  /** Human-readable agent name */
  name: string;
  /** Agent description and capabilities */
  description: string;
  /** Agent execution function */
  execute: (input: AgentInput) => Promise<AgentOutput>;
  /** Agent configuration */
  config?: AgentConfig;
}

/**
 * Agent input data structure
 */
export interface AgentInput {
  /** Input prompt or query */
  prompt: string;
  /** Execution context */
  context: Record<string, unknown>;
  /** Previous agent outputs (for sequential patterns) */
  previousOutputs?: AgentOutput[];
  /** Trace ID for observability */
  traceId?: string;
}

/**
 * Agent output data structure
 */
export interface AgentOutput {
  /** Agent ID that produced output */
  agentId: string;
  /** Output content */
  content: string;
  /** Execution metadata */
  metadata: {
    /** Execution time in milliseconds */
    executionTime: number;
    /** Model used (if applicable) */
    model?: string;
    /** Token usage (if applicable) */
    tokenUsage?: {
      prompt: number;
      completion: number;
      total: number;
    };
    /** Timestamp */
    timestamp: Date;
  };
  /** Error information (if failed) */
  error?: {
    message: string;
    code: string;
    stack?: string;
  };
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Model provider (openai, anthropic, local) */
  provider?: string;
  /** Model name */
  model?: string;
  /** Temperature (0-1) */
  temperature?: number;
  /** Max tokens */
  maxTokens?: number;
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

/**
 * Orchestration pattern types
 */
export type OrchestrationPattern =
  | 'sequential'
  | 'concurrent'
  | 'handoff'
  | 'group-chat'
  | 'magentic';

/**
 * Orchestration engine configuration
 */
export interface OrchestrationConfig {
  /** Framework to use */
  framework: 'semantic-kernel' | 'langgraph';
  /** Pattern to apply */
  pattern: OrchestrationPattern;
  /** Checkpoint configuration */
  checkpoint?: {
    enabled: boolean;
    storage: 'memory' | 'sqlite' | 'postgresql';
    resumeOnFailure?: boolean;
  };
}

/**
 * Validation gate tier levels
 */
export type ValidationTier = 0 | 1 | 2;

/**
 * Validation gate configuration
 */
export interface ValidationGateConfig {
  /** Gate tier (0=Constitutional, 1=Mandatory, 2=Best-practice) */
  tier: ValidationTier;
  /** Validation rules to apply */
  rules: string[];
  /** Whether gate is bypassable */
  bypassable?: boolean;
  /** Gate metadata */
  metadata?: {
    name: string;
    description: string;
    standards?: string[]; // e.g., ['OWASP ASVS 5.0.0-1.2.5']
  };
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  passed: boolean;
  /** Gate tier that was validated */
  tier: ValidationTier;
  /** Results per rule */
  ruleResults: Array<{
    rule: string;
    passed: boolean;
    message?: string;
    severity?: 'error' | 'warning' | 'info';
  }>;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Governance function types (NIST AI RMF)
 */
export type GovernanceFunction = 'govern' | 'map' | 'measure' | 'manage';

/**
 * Model card structure (NIST requirement)
 */
export interface ModelCard {
  /** Model identifier */
  modelId: string;
  /** Model name */
  modelName: string;
  /** Model version */
  version: string;
  /** Model description */
  description: string;
  /** Intended use */
  intendedUse: string;
  /** Known limitations */
  limitations: string[];
  /** Training data */
  trainingData: {
    source: string;
    size: number;
    timeframe: string;
  };
  /** Performance metrics */
  performance: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
  /** Fairness metrics */
  fairness: {
    demographicParity?: number;
    equalOpportunity?: number;
    biasScore?: number;
  };
  /** Ethical considerations */
  ethics: {
    biasAssessment: string;
    privacyImpact: string;
    politicalNeutrality: boolean;
  };
  /** Owner and contact */
  owner: {
    name: string;
    email: string;
    team: string;
  };
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Observability trace span
 */
export interface TraceSpan {
  /** Span ID */
  spanId: string;
  /** Trace ID */
  traceId: string;
  /** Parent span ID */
  parentSpanId?: string;
  /** Operation name */
  name: string;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime?: Date;
  /** Span attributes */
  attributes: Record<string, string | number | boolean>;
  /** Span events */
  events?: Array<{
    timestamp: Date;
    name: string;
    attributes?: Record<string, unknown>;
  }>;
}

/**
 * Service Level Indicator (SLI)
 */
export interface SLI {
  /** SLI name */
  name: string;
  /** SLI description */
  description: string;
  /** Measurement query */
  query: string;
  /** Target value */
  target: number;
  /** Current value */
  currentValue?: number;
}

/**
 * Service Level Objective (SLO)
 */
export interface SLO {
  /** SLO name */
  name: string;
  /** Associated SLI */
  sli: SLI;
  /** Target percentage (0-1) */
  target: number;
  /** Time window */
  window: string; // e.g., '30d', '7d'
  /** Error budget */
  errorBudget: {
    total: number;
    consumed: number;
    remaining: number;
  };
}

/**
 * SLO metrics and status
 */
export interface SLOMetrics {
  /** SLO name */
  slo: SLO;
  /** Current compliance percentage */
  compliance: number;
  /** Error budget status */
  errorBudget: {
    total: number;
    consumed: number;
    remaining: number;
    percentage: number;
  };
  /** Timestamp */
  timestamp: Date;
}

/**
 * DSAR (Data Subject Access Request) types
 */
export type DSARType = 'access' | 'erasure' | 'portability' | 'rectification';

/**
 * DSAR request structure
 */
export interface DSARRequest {
  /** Request ID */
  requestId: string;
  /** Request type */
  type: DSARType;
  /** User ID */
  userId: string;
  /** User email */
  email: string;
  /** Request timestamp */
  requestedAt: Date;
  /** Due date (30 days from request) */
  dueDate: Date;
  /** Request status */
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  /** Completion timestamp */
  completedAt?: Date;
  /** Rejection reason */
  rejectionReason?: string;
}

/** Alias for backward compatibility */
export type DataSubjectRequest = DSARRequest;

/**
 * Consent record for GDPR compliance
 */
export interface ConsentRecord {
  /** Consent ID */
  consentId: string;
  /** User ID */
  userId: string;
  /** Purpose of data processing */
  purpose: string;
  /** Granted timestamp */
  grantedAt: Date;
  /** Withdrawn timestamp */
  withdrawnAt?: Date;
  /** Consent status */
  status: 'active' | 'withdrawn' | 'expired';
}

/**
 * Accessibility violation detail
 */
export interface AccessibilityViolation {
  node: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  message: string;
  help: string;
  helpUrl: string;
}

/**
 * Accessibility test result (WCAG 2.2 AA)
 */
export interface AccessibilityResult {
  /** Test ID */
  testId: string;
  /** WCAG criterion */
  criterion: string; // e.g., '1.4.3' (contrast)
  /** Level (A, AA, AAA) */
  level: 'A' | 'AA' | 'AAA';
  /** Pass/fail status */
  passed: boolean;
  /** Violation details */
  violations?: AccessibilityViolation[];
  /** Timestamp */
  timestamp: Date;
}

/**
 * Error types
 */
export class AISystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AISystemError';
  }
}

export class ValidationError extends AISystemError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', metadata);
    this.name = 'ValidationError';
  }
}

export class GovernanceError extends AISystemError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'GOVERNANCE_ERROR', metadata);
    this.name = 'GovernanceError';
  }
}

export class PrivacyError extends AISystemError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'PRIVACY_ERROR', metadata);
    this.name = 'PrivacyError';
  }
}
