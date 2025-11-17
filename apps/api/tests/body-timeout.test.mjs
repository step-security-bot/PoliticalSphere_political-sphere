import { describe, it, expect } from 'vitest';
import { readJsonBody } from '../src/utils/http-utils.mjs';
import { EventEmitter } from 'node:events';

// Minimal mock IncomingMessage supporting async iteration and event emission
class SlowMockRequest extends EventEmitter {
  constructor(delayMs) {
    super();
    this.headers = { 'content-type': 'application/json' };
    this._delayMs = delayMs;
    this._sent = false;
  }
  [Symbol.asyncIterator]() {
    return {
      next: () => {
        return new Promise(resolve => {
          setTimeout(() => {
            if (this._sent) {
              this.emit('end');
              resolve({ done: true });
              return;
            }
            this._sent = true;
            // Push a trivial JSON body after the artificial delay
            resolve({ value: Buffer.from('{"ok":true}'), done: false });
          }, this._delayMs);
        });
      },
    };
  }
}

describe('readJsonBody timeout behavior', () => {
  it('should throw BODY_TIMEOUT when body streaming exceeds timeoutMs', async () => {
    const req = new SlowMockRequest(200); // delay longer than timeout
    await expect(
      readJsonBody(req, { timeoutMs: 50 }) // very short timeout
    ).rejects.toMatchObject({ code: 'BODY_TIMEOUT' });
  });

  it('should parse successfully when data arrives before timeout', async () => {
    const req = new SlowMockRequest(10); // arrives quickly
    const result = await readJsonBody(req, { timeoutMs: 200 });
    expect(result).toEqual({ ok: true });
  });
});
