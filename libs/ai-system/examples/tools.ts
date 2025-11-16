import { createOrchestrator, composePolicies, composeValidators, defineAgent } from '../src';
import type { Message } from '../src/types';
import { MockProvider } from '../src/providers/mock';
import { ToolRegistry } from '../src/tools';

// Local tool registry usage example
const tools = new ToolRegistry();

// Register a calculator tool
tools.register({
  name: 'calc',
  description: 'Simple calculator that adds two numbers.',
  handler: (args: any) => {
    const { a, b } = args || {};
    return Number(a) + Number(b);
  },
});

// Agent that uses mock provider and prompts tool calls when asked
const provider = new MockProvider({ name: 'demo' });
const toolAgent = defineAgent({
  id: 'tool-agent',
  async respond(messages) {
    // If last input asks to add numbers, trigger a tool call using the mock provider protocol
    const last = messages[messages.length - 1];
    if (last?.role === 'user' && /add\s+\d+\s+and\s+\d+/i.test(last.content)) {
      const m = /add\s+(\d+)\s+and\s+(\d+)/i.exec(last.content);
      const a = Number(m?.[1] ?? 0);
      const b = Number(m?.[2] ?? 0);
      const prompt: Message = { role: 'user', content: `tool:calc(${JSON.stringify({ a, b })})` };
      const r = await provider.respond([prompt]);
      return {
        message: { role: 'assistant', content: r.content },
        toolCalls: r.toolCalls,
      };
    }

    const r = await provider.respond(messages);
    return { message: { role: 'assistant', content: r.content }, toolCalls: r.toolCalls };
  },
});

async function main() {
  const orchestrator = createOrchestrator({
    pattern: 'concurrent',
    agents: [toolAgent],
    governance: composePolicies(),
    validators: composeValidators(),
    config: { selection: 'first' },
  });

  const input: Message[] = [{ role: 'user', content: 'Please add 3 and 5' }];

  const result = await orchestrator.run(input);
  // eslint-disable-next-line no-console
  console.log(
    'Transcript:',
    result.transcript.map(m => `${m.role}:${m.name ?? ''}:${m.content}`).join('\n')
  );
  // eslint-disable-next-line no-console
  console.log('Output:', result.output?.content);
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
