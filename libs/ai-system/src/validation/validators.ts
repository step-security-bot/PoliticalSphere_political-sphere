/**
 * Validation utilities and some basic built-ins.
 */
import type { Validator, ValidatorContext, ValidatorResult } from '../types';

export function defineValidator(fn: Validator): Validator {
  return fn;
}

export async function runValidators(
  value: unknown,
  phase: ValidatorContext['phase'],
  validators?: Validator[]
): Promise<ValidatorResult> {
  const runId = 'validation';
  const ctx: ValidatorContext = { runId, phase };
  if (!validators || validators.length === 0) return { ok: true };
  const errors: NonNullable<ValidatorResult['errors']> = [];
  for (const v of validators) {
    try {
      const r = await v(value, ctx);
      if (!r.ok) {
        if (r.errors) errors.push(...r.errors);
      }
    } catch (error) {
      errors.push({ message: `Validator threw: ${(error as Error).message}` });
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

/** Built-in: length validator */
export function lengthValidator(max: number): Validator {
  return defineValidator(async value => {
    const text = typeof value === 'string' ? value : ((value as any)?.content ?? '');
    return String(text).length <= max
      ? { ok: true }
      : { ok: false, errors: [{ message: `Length exceeds ${max}` }] };
  });
}

/** Built-in: JSON schema validator placeholder (AJV could be wired here). */
export function jsonSchemaValidator(_schema: unknown): Validator {
  return defineValidator(async () => ({ ok: true }));
}
