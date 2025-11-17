/**
 * Validation utilities and some basic built-ins (simple validator API).
 *
 * These validators align with ai-system/src/types.ts `Validator` signature
 * so they can be consumed by the orchestrator via `runValidators`.
 */
import type { Validator, ValidatorContext, ValidatorResult } from '../types';

/**
 * Run an array of simple validators and aggregate results.
 */
export async function runValidators(
  value: unknown,
  phase: ValidatorContext['phase'],
  validators: Validator[] = []
): Promise<ValidatorResult> {
  const errors: NonNullable<ValidatorResult['errors']> = [];

  for (const v of validators) {
    try {
      const res = await v(value, { runId: 'n/a', phase });
      if (!res.ok) {
        for (const err of res.errors ?? []) errors.push(err);
      }
    } catch (error) {
      errors.push({ message: error instanceof Error ? error.message : String(error) });
    }
  }

  return { ok: errors.length === 0, errors: errors.length ? errors : undefined };
}

/** Built-in: length validator (string/content length) */
export function lengthValidator(max: number): Validator {
  return async (value: unknown): Promise<ValidatorResult> => {
    const candidate =
      typeof value === 'string' ? value : ((value as { content?: unknown })?.content ?? '');
    const text = typeof candidate === 'string' ? candidate : String(candidate ?? '');
    return String(text).length <= max
      ? { ok: true }
      : { ok: false, errors: [{ path: 'content', message: `Length exceeds ${max}` }] };
  };
}

/** Built-in: JSON schema validator placeholder (AJV could be wired here). */
export function jsonSchemaValidator(_schema: unknown): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

/** Placeholder validators for tiers - to be implemented */
export function biasDetection(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function sentimentBalance(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function votingManipulation(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function powerDistribution(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function inputSanitization(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function authenticationCheck(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function authorizationCheck(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function wcagCompliance(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function gdprCompliance(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function dataMinimization(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function codeComplexity(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function documentationCoverage(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function responseTime(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}

export function resourceUsage(): Validator {
  return async (): Promise<ValidatorResult> => ({ ok: true });
}
