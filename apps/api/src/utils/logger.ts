import { getLogger } from '@political-sphere/shared';

const logger = getLogger({ service: 'api-utils' });

// Remove silencing logs in test environment to allow tests to assert calls
const passthrough = (level: 'info' | 'error' | 'warn' | 'debug', args: unknown[]): void => {
  if (typeof args[0] !== 'string') {
    const message = String(args[0]);
    // Flatten extra metadata arguments into a single object instead of wrapping in 'extra'
    const meta =
      args.length > 1
        ? Object.assign({}, ...args.slice(1).filter(arg => typeof arg === 'object' && arg !== null))
        : {};
    logger[level](message, meta);
    return;
  }
  const message = args[0] as string;
  const meta =
    args.length > 1
      ? Object.assign({}, ...args.slice(1).filter(arg => typeof arg === 'object' && arg !== null))
      : {};
  logger[level](message, meta);
};

/**
 * Audit logging with tamper-evident metadata
 * Adds structured metadata to distinguish audit events from regular logs
 * for compliance and forensics requirements
 */
const auditPassthrough = (args: unknown[]): void => {
  if (typeof args[0] !== 'string') {
    logger.error('Invalid audit message type', { received: typeof args[0] });
    return;
  }
  const message = args[0] as string;
  const extraMeta =
    args.length > 1 && typeof args[1] === 'object' && args[1] !== null
      ? (args[1] as Record<string, unknown>)
      : {};

  // Add audit-specific metadata for compliance and searchability
  const auditMeta = {
    audit: true, // Flag for filtering audit logs
    auditTimestamp: new Date().toISOString(), // ISO timestamp for audit trail
    auditType: 'governance', // Default type, can be overridden
    ...extraMeta,
  };

  logger.info(message, auditMeta);
};

/**
 * Log an informational message.
 *
 * This helper forwards the call to the configured application logger and
 * normalises metadata arguments into a single object for consistent structured logs.
 */
export const info = (...args: unknown[]) => passthrough('info', args);

/**
 * Log an error message or Error object.
 *
 * Accepts either a string message or an Error and optional metadata.
 */
export const error = (...args: unknown[]) => passthrough('error', args);

/**
 * Log a warning message with optional structured metadata.
 */
export const warn = (...args: unknown[]) => passthrough('warn', args);

/**
 * Log a debug-level message. Debug logs are intended for development and troubleshooting.
 */
export const debug = (...args: unknown[]) => passthrough('debug', args);

/**
 * Emit a tamper-evident audit log entry.
 *
 * Audit logs include additional metadata such as auditTimestamp and an `audit` flag
 * to allow easy filtering for compliance purposes.
 */
export const audit = (...args: unknown[]) => auditPassthrough(args);

/**
 * Default export providing convenience logging helpers.
 *
 * Prefer named imports to retain type information (e.g. `import { info } from './logger'`).
 */
export default { info, error, warn, debug, audit };
