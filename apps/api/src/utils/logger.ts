// Lightweight test-safe logger stub using Pino logger.
import { getLogger } from '@political-sphere/shared/logger-pino';

const logger = getLogger({ service: 'api-utils' });

const passthrough = (level, args) => {
  if (process.env.NODE_ENV === 'test') return; // silence during tests
  if (args.length === 1) {
    logger[level](args[0]);
  } else {
    logger[level](args[0], args.slice(1));
  }
};

export const info = (...args) => passthrough('info', args);
export const error = (...args) => passthrough('error', args);
export const warn = (...args) => passthrough('warn', args);
export const debug = (...args) => passthrough('debug', args);
export const audit = (...args) => passthrough('audit', args);

export default { info, error, warn, debug, audit };
