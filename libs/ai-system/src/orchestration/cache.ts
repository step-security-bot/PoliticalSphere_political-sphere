/**
 * Response cache utilities for orchestration.
 *
 * Provides a lightweight, in-memory LRU cache with TTL and a deterministic
 * cache-key generator so repeated agent runs can be short-circuited.
 */

import type { Agent } from '../types/index';
import type { ExecutionResult } from './engine';

/**
 * Cache interface so alternative backends (Redis, file, etc.) can be swapped in.
 */
export interface ResponseCache<T = ExecutionResult> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs?: number): void;
  delete?(key: string): void;
}

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

/**
 * Simple in-memory LRU cache with TTL.
 */
export class InMemoryResponseCache<T = ExecutionResult> implements ResponseCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private order: string[] = [];
  private maxEntries: number;
  private defaultTtl: number;

  constructor(options?: { maxEntries?: number; defaultTtlMs?: number }) {
    this.maxEntries = options?.maxEntries ?? 256;
    this.defaultTtl = options?.defaultTtlMs ?? 5 * 60 * 1000; // 5 minutes
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.order = this.order.filter(k => k !== key);
      return undefined;
    }

    // Move to MRU position
    this.touch(key);
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = ttlMs !== undefined ? Date.now() + ttlMs : Date.now() + this.defaultTtl;
    this.store.set(key, { value, expiresAt });
    this.touch(key);

    if (this.store.size > this.maxEntries) {
      const lruKey = this.order.shift();
      if (lruKey) {
        this.store.delete(lruKey);
      }
    }
  }

  delete(key: string): void {
    this.store.delete(key);
    this.order = this.order.filter(k => k !== key);
  }

  private touch(key: string): void {
    this.order = this.order.filter(k => k !== key);
    this.order.push(key);
  }
}

/**
 * Deterministically generate a cache key from orchestration inputs.
 * Sorting object keys avoids false misses caused by key ordering differences.
 */
export function createCacheKey(input: {
  pattern: string;
  prompt: string;
  context?: Record<string, unknown>;
  agents: Agent[];
}): string {
  const stableStringify = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (value instanceof Date) return JSON.stringify(value.toISOString());
    if (Array.isArray(value)) {
      return `[${value.map(v => stableStringify(v)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([k, v]) => `"${k}":${stableStringify(v)}`);
      return `{${entries.join(',')}}`;
    }
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return 'null';
  };

  const keyData = {
    pattern: input.pattern,
    prompt: input.prompt,
    agents: input.agents.map(a => a.id),
    context: input.context ?? {},
  };

  return `orchestrate:${stableStringify(keyData)}`;
}
