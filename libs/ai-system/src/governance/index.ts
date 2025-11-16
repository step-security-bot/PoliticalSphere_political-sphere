/**
 * Governance utilities: define policies and enforce them at standard stages.
 */
import type { Policy, PolicyContext, PolicyResult, Governance, Message } from '../types';

/** Define a policy with a simple function signature. */
export function definePolicy(fn: Policy): Policy {
  return fn;
}

/** Compose multiple policies into a Governance object. */
export function composePolicies(...policies: Policy[]): Governance {
  return { policies };
}

/**
 * Enforce a set of policies. If any policy fails (ok=false), collect violations.
 */
export async function enforcePolicies(
  policies: Policy[] | undefined,
  ctx: PolicyContext
): Promise<PolicyResult> {
  const result: PolicyResult = { ok: true };
  if (!policies || policies.length === 0) return result;

  for (const policy of policies) {
    try {
      const r = await policy(ctx);
      if (!r.ok) {
        result.ok = false;
        result.violations = [...(result.violations ?? []), ...(r.violations ?? [])];
      }
    } catch (error) {
      result.ok = false;
      result.violations = [
        ...(result.violations ?? []),
        { code: 'POLICY_ERROR', message: 'Policy threw', details: { error } },
      ];
    }
  }
  return result;
}

/** Helper to build a standard PolicyContext. */
export function buildPolicyContext(
  runId: string,
  messages: Message[],
  stage: PolicyContext['stage'],
  bag?: Record<string, unknown>
): PolicyContext {
  return { runId, messages, stage, bag };
}
