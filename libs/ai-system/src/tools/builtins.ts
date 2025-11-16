/** Built-in tools for immediate usefulness without external deps. */
import type { ToolDefinition } from './index';

export const calculator: ToolDefinition<
  { op: 'add' | 'sub' | 'mul' | 'div'; a: number; b: number },
  number
> = {
  name: 'calculator',
  description: 'Performs basic arithmetic on two numbers.',
  handler: ({ op, a, b }) => {
    if (!['add', 'sub', 'mul', 'div'].includes(op)) throw new Error('Invalid op');
    if (typeof a !== 'number' || typeof b !== 'number') throw new Error('Invalid operands');
    if (op === 'add') return a + b;
    if (op === 'sub') return a - b;
    if (op === 'mul') return a * b;
    if (op === 'div') {
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    }
    return 0;
  },
};

export function kvStore(scope: 'global' | 'run' = 'run') {
  const map = new Map<string, unknown>();
  return {
    set: {
      name: scope === 'global' ? 'kv.set' : 'kv.set.run',
      description: 'Set a key to a JSON value',
      handler: ({ key, value }: { key: string; value: unknown }) => {
        map.set(String(key), value);
        return 'OK';
      },
    } as ToolDefinition,
    get: {
      name: scope === 'global' ? 'kv.get' : 'kv.get.run',
      description: 'Get a JSON value by key',
      handler: ({ key }: { key: string }) => map.get(String(key)) ?? null,
    } as ToolDefinition,
  };
}

export function createFetchMock(fixtures: Record<string, string | object>) {
  return {
    name: 'fetch',
    description: 'Returns deterministic content for registered URLs',
    handler: ({ url }: { url: string }) => {
      if (!(url in fixtures)) throw new Error(`No fixture for ${url}`);
      const v = fixtures[url];
      return typeof v === 'string' ? v : JSON.stringify(v);
    },
  } as ToolDefinition;
}

export const tools = { calculator, kvStore, createFetchMock };
