/**
 * Mock LLM provider for free, deterministic responses.
 */
import type { Message } from '../types';

export interface ProviderResponse {
  content: string;
  toolCalls?: { id: string; name: string; arguments: unknown }[];
}

export interface ModelProvider {
  respond(
    messages: Message[],
    options?: { system?: string; temperature?: number }
  ): Promise<ProviderResponse>;
}

/**
 * Mock implementation of ModelProvider for testing and development.
 * Provides deterministic responses based on input patterns and supports
 * basic tool-call simulation for testing AI agent workflows.
 */
export class MockProvider implements ModelProvider {
  constructor(private opts: { name?: string } = {}) {}

  async respond(messages: Message[]): Promise<ProviderResponse> {
    const last = [...messages].reverse()[0];
    const name = this.opts.name ?? 'mock';
    const prefix = `[${name}]`;
    if (!last) return { content: `${prefix} (no input)` };

    // Simple tool-call protocol: if user writes tool:<name>(<json>)
    const toolMatch = /tool:([a-zA-Z0-9_-]+)\(([\s\S]*)\)\s*$/m.exec(last.content);
    if (toolMatch) {
      const [, toolName, rawArgs] = toolMatch;
      let args: unknown = rawArgs;
      try {
        args = JSON.parse(rawArgs ?? '');
      } catch {
        // Keep rawArgs if JSON parse fails
      }
      return {
        content: `${prefix} Calling tool ${toolName}`,
        toolCalls: [{ id: `${Date.now()}`, name: toolName ?? 'tool', arguments: args }],
      };
    }

    // Otherwise echo-transform
    const reversed = last.content.split('').reverse().join('');
    return { content: `${prefix} ${reversed}` };
  }
}
