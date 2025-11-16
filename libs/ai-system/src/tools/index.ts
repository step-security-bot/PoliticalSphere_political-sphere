/** Tool registry and execution helpers. */
import type { Message } from '../types';

export interface ToolDefinition<TArgs = any, TResult = any> {
  name: string;
  description?: string;
  schema?: unknown;
  handler: (args: TArgs) => Promise<TResult> | TResult;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }
}

export async function executeToolCall(
  registry: ToolRegistry,
  call: { name: string; arguments: unknown }
): Promise<Message> {
  const def = registry.get(call.name);
  if (!def) return { role: 'tool', content: `Tool not found: ${call.name}`, name: call.name };
  try {
    const result = await def.handler(call.arguments as any);
    return {
      role: 'tool',
      content: typeof result === 'string' ? result : JSON.stringify(result),
      name: call.name,
    };
  } catch (error) {
    return { role: 'tool', content: `Tool error: ${(error as Error).message}`, name: call.name };
  }
}
