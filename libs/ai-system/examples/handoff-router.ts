import { createOrchestrator, defineAgent, composePolicies, composeValidators } from '../src';
import type { Message } from '../src/types';

const analyst = defineAgent({
  id: 'analyst',
  async respond(messages) {
    return { message: { role: 'assistant', content: 'analysis done' } };
  },
});
const implementer = defineAgent({
  id: 'implementer',
  async respond(messages) {
    return {
      message: {
        role: 'assistant',
        content: 'implementation done',
        metadata: { done: true } as any,
      } as any,
    } as any;
  },
});

async function main() {
  const orchestrator = createOrchestrator({
    pattern: 'handoff',
    agents: [analyst, implementer],
    config: {
      maxTurns: 4,
      router: (messages: Message[], agents: any[]) => {
        const last = messages[messages.length - 1];
        if (last?.role === 'assistant' && last.content.includes('analysis')) return 'implementer';
        return 'analyst';
      },
    },
    governance: composePolicies(),
    validators: composeValidators(),
  });

  const input: Message[] = [{ role: 'user', content: 'Please analyze and implement' }];
  const result = await orchestrator.run(input);
  // eslint-disable-next-line no-console
  console.log(
    'Handoff transcript:',
    result.transcript.map(m => `${m.role}:${m.content}`).join(' | ')
  );
  // eslint-disable-next-line no-console
  console.log('Output:', result.output?.content);
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
