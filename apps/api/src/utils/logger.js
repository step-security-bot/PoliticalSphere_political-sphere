/* eslint-disable no-console */
// Lightweight test-safe logger stub.
// Avoid external dependencies in test environment.

const base = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  audit: (...args) => console.info('[AUDIT]', ...args),
};

const passthrough = (level, args) => {
  if (process.env.NODE_ENV === 'test') return; // silence during tests
  const fn = base[level] || base.info;
  fn(...args);
};

export const info = (...args) => passthrough('info', args);
export const error = (...args) => passthrough('error', args);
export const warn = (...args) => passthrough('warn', args);
export const audit = (...args) => passthrough('audit', args);

export default { info, error, warn, audit };
