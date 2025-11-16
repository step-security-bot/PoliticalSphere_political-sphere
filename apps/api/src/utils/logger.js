// Lightweight test-safe logger stub. In production replace with structured logger.
const passthrough = (level, args) => {
  if (process.env.NODE_ENV === 'test') return; // silence during tests
  // eslint-disable-next-line no-console
  console.log(`[${level}]`, ...args);
};

export const info = (...args) => passthrough('info', args);
export const error = (...args) => passthrough('error', args);
export const warn = (...args) => passthrough('warn', args);
export const audit = (...args) => passthrough('audit', args);

export default { info, error, warn, audit };
