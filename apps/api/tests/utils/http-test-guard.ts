import { spawnSync } from 'node:child_process';
import { describe } from 'vitest';

const bindingCheck = canBindToHost();

/**
 * Whether HTTP tests that require binding to a socket should be skipped.
 *
 * This flag is true when the environment variable `SKIP_API_SERVER_TESTS` is set
 * to `1` or when the test environment cannot bind an ephemeral port on the host
 * (useful for CI environments with restricted networking). Tests should use
 * `describeHttp` below to automatically skip when required.
 */
export const shouldSkipHttpTests =
  process.env.SKIP_API_SERVER_TESTS === '1' || !bindingCheck.canBind;

// Use this in test files instead of `describe` to automatically skip when sockets cannot bind.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
/**
 * Conditional `describe` for HTTP tests.
 *
 * Use `describeHttp(...)` in place of `describe(...)` inside test files that
 * require opening network sockets. When `shouldSkipHttpTests` is true the suite
 * will be skipped automatically; otherwise it behaves like a normal `describe`.
 */
export const describeHttp = shouldSkipHttpTests ? describe.skip : describe;

function canBindToHost() {
  const hosts = [
    process.env.API_TEST_BIND_HOST || '127.0.0.1',
    process.env.API_TEST_BIND_FALLBACK || '0.0.0.0',
  ];

  for (const host of hosts) {
    const probeScript = `
      const http = require('http');
      const server = http.createServer();
      const finish = code => server.close(() => process.exit(code));
      server.once('error', () => finish(2));
      server.listen(0, '${host.replaceAll("'", "\\\\'")}', () => finish(0));
      setTimeout(() => finish(3), 500);
    `;

    const result = spawnSync(process.execPath, ['-e', probeScript], { stdio: 'ignore' });
    if (result.status === 0) {
      return { canBind: true, host };
    }
  }

  return { canBind: false, host: hosts[0] };
}
