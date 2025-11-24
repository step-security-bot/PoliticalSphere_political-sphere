export const redact = (o: unknown): unknown =>
  JSON.parse(
    JSON.stringify(o, (_, v) => {
      if (typeof v === 'string' && /^(?:\d{12,16}|sk-|ghp_)/.test(v)) return '[REDACTED]';
      return v;
    })
  );

export const log = (
  level: 'info' | 'warn' | 'error',
  event: string,
  ctx?: Record<string, unknown>
) => {
  const message = JSON.stringify({ level, event, ctx: redact(ctx), ts: new Date().toISOString() });
  const stream = level === 'info' ? process.stdout : process.stderr;
  stream.write(`${message}\n`);
};
