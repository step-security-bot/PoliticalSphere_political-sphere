import type { Policy } from '../types';

/** A simple, configurable safety policy using regex checks. */
export function defaultSafetyPolicy(options?: { blocked?: (string | RegExp)[] }): Policy {
  const blocked = options?.blocked ?? [/\bkill\b/i, /\bhack\b/i, /\bexploit\b/i];
  return ({ messages, stage }) => {
    if (stage !== 'pre-output') return { ok: true };
    const last = messages[messages.length - 1];
    const text = last?.content ?? '';
    for (const pat of blocked) {
      if (typeof pat === 'string') {
        if (text.includes(pat))
          return {
            ok: false,
            violations: [{ code: 'UNSAFE_OUTPUT', message: `Contains blocked phrase: ${pat}` }],
          };
      } else if (pat.test(text)) {
        return {
          ok: false,
          violations: [{ code: 'UNSAFE_OUTPUT', message: `Matches blocked pattern: ${pat}` }],
        };
      }
    }
    return { ok: true };
  };
}
